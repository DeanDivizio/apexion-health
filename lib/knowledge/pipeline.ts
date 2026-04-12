import { prisma } from "@/lib/db/prisma";
import type { KnowledgeIngestionStep, Prisma } from "@prisma/client";
import {
  fetchTranscript,
  fetchVideoMetadata,
  extractVideoId,
  TranscriptUnavailableError,
} from "./sources/youtubeService";
import { chunkPodcastTranscript } from "./chunking/podcastChunker";
import { chunkPaper } from "./chunking/paperChunker";
import { fetchPaperFullText } from "./sources/paperFetcher";
import { embedAndStoreChunks } from "./embedding";
import { extractEntitiesFromChunks } from "./extraction/entityExtractor";
import { extractClaimsFromChunks } from "./extraction/claimExtractor";
import {
  resolveEntities,
  applyResolutionToResult,
} from "./extraction/entityResolver";
import { synthesizeRelationships } from "./extraction/relationshipSynthesizer";
import { deduplicateRelationships } from "./extraction/deduplicateRelationships";
import {
  writeExtractionToGraph,
  writeClaimsToGraph,
  clearSourceFromGraph,
  writeStudySupportsClaim,
} from "./graph/neo4jWriter";
import { verifyClaims } from "./verification/claimVerifier";
import { verifyClaimsBatch } from "./verification/batchClaimVerifier";
import type { VerificationOutput } from "./verification/types";
import { deleteChunksBySourceId, getChunksBySourceId } from "./vectorStore";
import { getPostHogClient } from "@/lib/posthog-server";
import type {
  Chunk,
  ExtractionResult,
  PipelineOptions,
  PipelineProgress,
  RawTranscript,
} from "./types";

type ProgressCallback = (progress: PipelineProgress) => void;

const ALL_STEPS: KnowledgeIngestionStep[] = [
  "FETCH",
  "CHUNK",
  "EMBED",
  "EXTRACT_ENTITIES",
  "RESOLVE_ENTITIES",
  "SYNTHESIZE_RELATIONSHIPS",
  "EXTRACT_CLAIMS",
  "VERIFY_CLAIMS",
];

function capturePipelineEvent(
  event: string,
  properties: Record<string, unknown>,
) {
  try {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: "knowledge-pipeline",
      event,
      properties,
    });
  } catch {
    // PostHog failures should never block the pipeline
  }
}

export async function runIngestionPipeline(
  options: PipelineOptions,
  onProgress?: ProgressCallback,
): Promise<void> {
  const { sourceId } = options;
  const source = await prisma.knowledgeSource.findUniqueOrThrow({
    where: { id: sourceId },
  });

  const steps: KnowledgeIngestionStep[] = options.steps ?? ALL_STEPS;

  const tag = `[pipeline] ${source.sourceType} "${source.title}"`;
  const t0 = Date.now();
  const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

  console.log(`${tag} Starting pipeline (steps: ${steps.join(" → ")})`);

  capturePipelineEvent("knowledge_run_started", {
    sourceId,
    sourceType: source.sourceType,
    sourceTitle: source.title,
    steps,
    batchMode: options.useBatchApi ?? false,
  });

  await prisma.knowledgeSource.update({
    where: { id: sourceId },
    data: { status: "PROCESSING" },
  });

  let currentStep: KnowledgeIngestionStep = steps[0] ?? "FETCH";
  let currentRunId: string | undefined;

  try {
    let chunks: Chunk[] = [];

    // ── FETCH ────────────────────────────────────────────────────────
    if (steps.includes("FETCH")) {
      currentStep = "FETCH";
      console.log(`${tag} [FETCH] Starting...`);
      currentRunId = await recordRunStart(sourceId, "FETCH");

      switch (source.sourceType) {
        case "PODCAST": {
          const videoId = extractVideoId(
            source.externalId ?? source.url ?? "",
          );
          const transcript = await fetchTranscript(videoId);
          console.log(
            `${tag} [FETCH] Got ${transcript.segments.length} transcript segments (${elapsed()})`,
          );

          const metadata = await fetchVideoMetadata(videoId);
          console.log(
            `${tag} [FETCH] Metadata: "${metadata.title}" by ${metadata.channelTitle}, duration ${metadata.duration}`,
          );

          await prisma.knowledgeSource.update({
            where: { id: sourceId },
            data: {
              title: metadata.title,
              publishedAt: new Date(metadata.publishedAt),
              metadata: {
                ...((source.metadata as Record<string, unknown>) ?? {}),
                channelTitle: metadata.channelTitle,
                duration: metadata.duration,
                description: metadata.description,
                segmentCount: transcript.segments.length,
                rawTranscript: JSON.parse(JSON.stringify(transcript)),
              } as Prisma.InputJsonValue,
            },
          });

          chunks = chunkPodcastTranscript(transcript);
          console.log(
            `${tag} [FETCH] Chunked into ${chunks.length} chunks (${elapsed()})`,
          );
          break;
        }
        case "PAPER": {
          const externalId = source.externalId ?? "";
          const isDoi = externalId.startsWith("10.");
          const paper = await fetchPaperFullText({
            doi: isDoi ? externalId : undefined,
            pmid: !isDoi && externalId ? externalId : undefined,
            title: source.title,
          });

          if (paper) {
            await prisma.knowledgeSource.update({
              where: { id: sourceId },
              data: {
                title: paper.title || source.title,
                authors: paper.authors,
                publishedAt: paper.publishedAt
                  ? new Date(paper.publishedAt)
                  : undefined,
                metadata: {
                  ...((source.metadata as Record<string, unknown>) ?? {}),
                  journal: paper.journal,
                  doi: paper.doi,
                  pmid: paper.pmid,
                  fetchTier: paper.fetchTier,
                  sectionCount: paper.sections.length,
                  fullTextCache: JSON.parse(JSON.stringify({
                    title: paper.title,
                    authors: paper.authors,
                    abstract: paper.abstract,
                    sections: paper.sections,
                    doi: paper.doi,
                    pmid: paper.pmid,
                    journal: paper.journal,
                    publishedAt: paper.publishedAt,
                    fetchTier: paper.fetchTier,
                    cachedAt: new Date().toISOString(),
                  })),
                } as Prisma.InputJsonValue,
              },
            });
            chunks = chunkPaper(paper);
            console.log(
              `${tag} [FETCH] Paper via ${paper.fetchTier}, ${paper.sections.length} sections, ${chunks.length} chunks (${elapsed()})`,
            );
          } else {
            console.warn(
              `${tag} [FETCH] Could not fetch paper full text`,
            );
          }
          break;
        }
        case "MANUAL": {
          throw new Error(
            "MANUAL sources are not supported by the automated pipeline. Use the direct chunk import API instead.",
          );
        }
        default: {
          const _exhaustive: never = source.sourceType;
          throw new Error(`Unhandled source type: ${_exhaustive}`);
        }
      }

      if (chunks.length === 0) {
        console.warn(`${tag} [FETCH] No content retrieved — marking source as FAILED`);
        await recordRunFailed(currentRunId, "No content retrieved");
        await prisma.knowledgeSource.update({
          where: { id: sourceId },
          data: {
            status: "FAILED",
            metadata: {
              ...((source.metadata as Record<string, unknown>) ?? {}),
              failureReason: "no_content",
              failureMessage: "FETCH completed but produced zero chunks",
            },
          },
        });
        onProgress?.({ step: "FETCH", status: "FAILED", error: "No content retrieved" });
        return;
      }

      await recordRunComplete(currentRunId, {
        segmentCount: chunks.length,
      });
      currentRunId = undefined;
      onProgress?.({
        step: "FETCH",
        status: "PROCESSING",
        stats: { segmentCount: chunks.length },
      });
    }

    // ── CHUNK ────────────────────────────────────────────────────────
    if (steps.includes("CHUNK")) {
      currentStep = "CHUNK";
      currentRunId = await recordRunStart(sourceId, "CHUNK");

      if (chunks.length === 0) {
        const freshSource = await prisma.knowledgeSource.findUniqueOrThrow({
          where: { id: sourceId },
          select: { sourceType: true, metadata: true },
        });
        const meta = (freshSource.metadata as Record<string, unknown>) ?? {};

        if (freshSource.sourceType === "PODCAST" && meta.rawTranscript) {
          console.log(`${tag} [CHUNK] Re-chunking podcast from cached transcript`);
          chunks = chunkPodcastTranscript(meta.rawTranscript as RawTranscript);
        } else if (freshSource.sourceType === "PAPER" && meta.fullTextCache) {
          console.log(`${tag} [CHUNK] Re-chunking paper from cached full text`);
          chunks = chunkPaper(meta.fullTextCache as Parameters<typeof chunkPaper>[0]);
        }
      }

      console.log(`${tag} [CHUNK] ${chunks.length} chunks (${elapsed()})`);
      await recordRunComplete(currentRunId, { chunkCount: chunks.length });
      currentRunId = undefined;
      onProgress?.({
        step: "CHUNK",
        status: "PROCESSING",
        stats: { chunkCount: chunks.length },
      });
    }

    // ── EMBED ────────────────────────────────────────────────────────
    if (steps.includes("EMBED") && chunks.length > 0) {
      currentStep = "EMBED";
      console.log(
        `${tag} [EMBED] Embedding ${chunks.length} chunks... (${elapsed()})`,
      );
      currentRunId = await recordRunStart(sourceId, "EMBED");
      await deleteChunksBySourceId(sourceId);
      const sourceTypeStr = source.sourceType.toLowerCase();
      const result = await embedAndStoreChunks(
        sourceId,
        sourceTypeStr,
        chunks,
        (done, total) => {
          console.log(
            `${tag} [EMBED] ${done}/${total} chunks embedded (${elapsed()})`,
          );
        },
      );
      console.log(
        `${tag} [EMBED] Done — stored ${result.chunkCount} vectors (${elapsed()})`,
      );
      await recordRunComplete(currentRunId, {
        chunkCount: result.chunkCount,
      });
      currentRunId = undefined;
      onProgress?.({
        step: "EMBED",
        status: "PROCESSING",
        stats: { chunkCount: result.chunkCount },
      });
    }

    // If we're picking up from extraction without prior steps, load chunks from vector store
    if (
      chunks.length === 0 &&
      (steps.includes("EXTRACT_ENTITIES") ||
        steps.includes("RESOLVE_ENTITIES") ||
        steps.includes("SYNTHESIZE_RELATIONSHIPS") ||
        steps.includes("EXTRACT_CLAIMS"))
    ) {
      console.log(
        `${tag} Loading chunks from vector store for extraction...`,
      );
      const stored = await getChunksBySourceId(sourceId);
      chunks = stored.map((vc) => ({
        content: vc.content,
        index: vc.chunkIndex,
        metadata: vc.metadata as unknown as Chunk["metadata"],
      }));
      console.log(`${tag} Loaded ${chunks.length} chunks from vector store`);

      if (chunks.length === 0) {
        console.warn(`${tag} No chunks in vector store — marking source as FAILED`);
        await prisma.knowledgeSource.update({
          where: { id: sourceId },
          data: {
            status: "FAILED",
            metadata: {
              ...((source.metadata as Record<string, unknown>) ?? {}),
              failureReason: "no_content",
              failureMessage: "No chunks found in vector store for extraction",
            },
          },
        });
        onProgress?.({ step: "EXTRACT_ENTITIES", status: "FAILED", error: "No chunks in vector store" });
        return;
      }
    }

    // ── EXTRACT_ENTITIES (Pass 1) ────────────────────────────────────
    let extraction: ExtractionResult = {
      entities: [],
      relationships: [],
      claims: [],
    };

    if (steps.includes("EXTRACT_ENTITIES") && chunks.length > 0) {
      currentStep = "EXTRACT_ENTITIES";
      console.log(
        `${tag} [ENTITIES] Extracting from ${chunks.length} chunks... (${elapsed()})`,
      );
      currentRunId = await recordRunStart(sourceId, "EXTRACT_ENTITIES");
      extraction = await extractEntitiesFromChunks(chunks);
      console.log(
        `${tag} [ENTITIES] Found ${extraction.entities.length} entities, ${extraction.relationships.length} relationships (${elapsed()})`,
      );
      await recordRunComplete(currentRunId, {
        entityCount: extraction.entities.length,
        relationshipCount: extraction.relationships.length,
      });
      currentRunId = undefined;
      onProgress?.({
        step: "EXTRACT_ENTITIES",
        status: "PROCESSING",
        stats: {
          entityCount: extraction.entities.length,
          relationshipCount: extraction.relationships.length,
        },
      });
    }

    // ── RESOLVE_ENTITIES (Consolidation) ─────────────────────────────
    let entityNameMap: Map<string, string> | undefined;

    if (steps.includes("RESOLVE_ENTITIES") && extraction.entities.length > 0) {
      currentStep = "RESOLVE_ENTITIES";
      console.log(
        `${tag} [RESOLVE] Resolving ${extraction.entities.length} entities... (${elapsed()})`,
      );
      currentRunId = await recordRunStart(sourceId, "RESOLVE_ENTITIES");
      const resolution = await resolveEntities(extraction.entities);
      extraction = applyResolutionToResult(extraction, resolution);
      entityNameMap = resolution.nameMap;
      console.log(
        `${tag} [RESOLVE] Resolved to ${extraction.entities.length} canonical entities (${elapsed()})`,
      );
      await recordRunComplete(currentRunId, {
        canonicalCount: extraction.entities.length,
        mappingCount: resolution.nameMap.size,
      });
      currentRunId = undefined;
      onProgress?.({
        step: "RESOLVE_ENTITIES",
        status: "PROCESSING",
        stats: { canonicalCount: extraction.entities.length },
      });
    }

    // ── SYNTHESIZE_RELATIONSHIPS (Pass 2) ────────────────────────────
    if (
      steps.includes("SYNTHESIZE_RELATIONSHIPS") &&
      chunks.length > 1 &&
      extraction.entities.length > 0
    ) {
      currentStep = "SYNTHESIZE_RELATIONSHIPS";
      console.log(
        `${tag} [SYNTHESIZE] Cross-chunk relationship synthesis... (${elapsed()})`,
      );
      currentRunId = await recordRunStart(sourceId, "SYNTHESIZE_RELATIONSHIPS");
      const newRels = await synthesizeRelationships(
        extraction.entities,
        chunks,
        extraction.relationships,
      );
      extraction.relationships.push(...newRels);
      console.log(
        `${tag} [SYNTHESIZE] +${newRels.length} cross-chunk rels, total ${extraction.relationships.length} (${elapsed()})`,
      );
      await recordRunComplete(currentRunId, {
        synthesizedCount: newRels.length,
        totalRelationshipCount: extraction.relationships.length,
      });
      currentRunId = undefined;
      onProgress?.({
        step: "SYNTHESIZE_RELATIONSHIPS",
        status: "PROCESSING",
        stats: {
          synthesizedCount: newRels.length,
          totalRelationshipCount: extraction.relationships.length,
        },
      });
    }

    // ── Deduplicate & write graph ────────────────────────────────────
    if (extraction.entities.length > 0) {
      const merged = deduplicateRelationships(extraction.relationships);
      console.log(
        `${tag} [GRAPH] Deduped ${extraction.relationships.length} → ${merged.length} relationships`,
      );

      try {
        console.log(`${tag} [GRAPH] Clearing old graph data for source...`);
        await clearSourceFromGraph(sourceId);
        console.log(`${tag} [GRAPH] Writing to graph... (${elapsed()})`);
        await writeExtractionToGraph(
          sourceId,
          source.title,
          extraction,
          merged,
        );
        console.log(`${tag} [GRAPH] Graph write complete (${elapsed()})`);
      } catch (graphError) {
        const graphMsg =
          graphError instanceof Error
            ? graphError.message
            : String(graphError);
        console.warn(
          `${tag} [GRAPH] Graph write failed (non-fatal): ${graphMsg}`,
        );
      }
    }

    // ── EXTRACT_CLAIMS ───────────────────────────────────────────────
    if (steps.includes("EXTRACT_CLAIMS") && chunks.length > 0) {
      currentStep = "EXTRACT_CLAIMS";
      console.log(
        `${tag} [CLAIMS] Extracting from ${chunks.length} chunks... (${elapsed()})`,
      );
      currentRunId = await recordRunStart(sourceId, "EXTRACT_CLAIMS");
      const claims = await extractClaimsFromChunks(chunks);
      console.log(
        `${tag} [CLAIMS] Found ${claims.length} claims, writing to DB... (${elapsed()})`,
      );

      const claimData = claims.map((claim) => ({
        sourceId,
        claimText: claim.claimText,
        confidence: claim.confidence,
        metadata: { entities: claim.entities } as Prisma.InputJsonValue,
      }));

      const claimRecords = await prisma.$transaction(async (tx) => {
        await tx.knowledgeClaim.deleteMany({ where: { sourceId } });
        await tx.knowledgeClaim.createMany({ data: claimData });
        return tx.knowledgeClaim.findMany({
          where: { sourceId },
          orderBy: { createdAt: "asc" },
          select: { id: true, claimText: true, metadata: true },
        });
      });

      const claimRecordsWithEntities = claimRecords.map((r) => ({
        claimId: r.id,
        claimText: r.claimText,
        entities:
          ((r.metadata as Record<string, unknown>)?.entities as string[]) ?? [],
      }));

      console.log(
        `${tag} [CLAIMS] Stored ${claims.length} claims (${elapsed()})`,
      );

      const entityAliasMap = new Map<string, string>();
      for (const entity of extraction.entities) {
        entityAliasMap.set(entity.name.toLowerCase(), entity.name);
        for (const alias of entity.aliases) {
          entityAliasMap.set(alias.toLowerCase(), entity.name);
        }
      }

      function resolveClaimEntityName(name: string): string | null {
        return (
          entityNameMap?.get(name) ??
          entityNameMap?.get(name.toLowerCase()) ??
          entityAliasMap.get(name.toLowerCase()) ??
          null
        );
      }

      const remappedClaimRecords = claimRecordsWithEntities.map((cr) => ({
        ...cr,
        entities: cr.entities
          .map(resolveClaimEntityName)
          .filter((e): e is string => e !== null),
      }));

      try {
        console.log(`${tag} [CLAIMS] Writing claims to graph...`);
        await writeClaimsToGraph(remappedClaimRecords, sourceId);
        console.log(
          `${tag} [CLAIMS] Graph claim write complete (${elapsed()})`,
        );
      } catch (graphError) {
        const graphMsg =
          graphError instanceof Error
            ? graphError.message
            : String(graphError);
        console.warn(
          `${tag} [CLAIMS] Claim graph write failed (non-fatal): ${graphMsg}`,
        );
      }

      await recordRunComplete(currentRunId, {
        claimCount: claims.length,
      });
      currentRunId = undefined;
      onProgress?.({
        step: "EXTRACT_CLAIMS",
        status: "PROCESSING",
        stats: { claimCount: claims.length },
      });
    }

    // ── VERIFY_CLAIMS ──────────────────────────────────────────────
    if (steps.includes("VERIFY_CLAIMS")) {
      currentStep = "VERIFY_CLAIMS";
      const claimsToVerify = await prisma.knowledgeClaim.findMany({
        where: { sourceId, verificationStatus: "UNVERIFIED" },
      });

      if (claimsToVerify.length > 0) {
        const verifiableClaims = claimsToVerify.map((c) => ({
          claimId: c.id,
          claimText: c.claimText,
          confidence: c.confidence,
          entities:
            ((c.metadata as Record<string, unknown>)?.entities as string[]) ??
            [],
          sourceId: c.sourceId,
        }));

        const shouldBatch =
          options.useBatchApi ?? verifiableClaims.length > 10;
        console.log(
          `${tag} [VERIFY] Verifying ${claimsToVerify.length} claims (${shouldBatch ? "batch" : "sync"})... (${elapsed()})`,
        );
        currentRunId = await recordRunStart(sourceId, "VERIFY_CLAIMS");
        const verifyRunId = currentRunId;

        let verificationOutput: VerificationOutput;
        if (shouldBatch) {
          verificationOutput = await verifyClaimsBatch(verifiableClaims, {
            maxPollMs: 1_500_000,
            onBatchSubmitted: async (phase, batchId) => {
              try {
                const run = await prisma.knowledgeIngestionRun.findUnique({
                  where: { id: verifyRunId },
                });
                if (run) {
                  const existingStats =
                    (run.stats as Record<string, unknown>) ?? {};
                  const batchPhases =
                    (existingStats.batchPhases as Record<string, unknown>) ??
                    {};
                  batchPhases[phase] = {
                    batchId,
                    submittedAt: new Date().toISOString(),
                  };
                  await prisma.knowledgeIngestionRun.update({
                    where: { id: verifyRunId },
                    data: {
                      stats: {
                        ...existingStats,
                        batchPhases,
                      } as Prisma.InputJsonValue,
                    },
                  });
                }
              } catch (err) {
                console.warn(
                  `${tag} [VERIFY] Failed to persist batch ID for ${phase}: ${err instanceof Error ? err.message : err}`,
                );
              }
            },
          });
        } else {
          verificationOutput = await verifyClaims(verifiableClaims);
        }

        const { results, metrics, papersToIngest } = verificationOutput;

        for (const result of results) {
          const paperIds = result.evidence
            .map((e) => e.doi ?? e.pmid)
            .filter(Boolean) as string[];

          const existingMeta =
            (
              await prisma.knowledgeClaim.findUnique({
                where: { id: result.claimId },
                select: { metadata: true },
              })
            )?.metadata ?? {};

          await prisma.knowledgeClaim.update({
            where: { id: result.claimId },
            data: {
              verificationStatus: result.verificationStatus,
              supportingPaperIds: paperIds,
              metadata: {
                ...((existingMeta as Record<string, unknown>) ?? {}),
                evidence: result.evidence.map((e) => ({
                  title: e.title,
                  doi: e.doi ?? null,
                  pmid: e.pmid ?? null,
                  verdict: e.verdict,
                  confidence: e.confidence,
                  passages: e.passages.map((p) => ({ text: p.text, section: p.section })),
                  fetchTier: e.fetchTier,
                })),
              } as Prisma.InputJsonValue,
            },
          });
        }
        console.log(
          `${tag} [VERIFY] ${papersToIngest.length} unique papers to ingest (${elapsed()})`,
        );

        for (const paper of papersToIngest) {
          const externalId = paper.doi ?? paper.pmid;
          if (!externalId) continue;

          const existing = await prisma.knowledgeSource.findUnique({
            where: {
              sourceType_externalId: {
                sourceType: "PAPER",
                externalId,
              },
            },
            select: { id: true, status: true },
          });

          const paperSource = await prisma.knowledgeSource.upsert({
            where: {
              sourceType_externalId: {
                sourceType: "PAPER",
                externalId,
              },
            },
            create: {
              sourceType: "PAPER",
              title: paper.title,
              externalId,
              authors: paper.authors,
              status: "PENDING",
              publishedAt: paper.year
                ? new Date(`${paper.year}-01-01`)
                : undefined,
              metadata: {
                journal: paper.journal,
                doi: paper.doi,
                pmid: paper.pmid,
                discoveredFrom: sourceId,
              },
            },
            update: existing?.status === "FAILED"
              ? { status: "PENDING" }
              : {},
          });

          if (paperSource.status === "COMPLETED") {
            console.log(
              `${tag} [VERIFY] Paper "${paper.title.slice(0, 60)}" already ingested`,
            );
          } else {
            console.log(
              `${tag} [VERIFY] Queued paper as PENDING: "${paper.title.slice(0, 60)}"`,
            );
          }

          try {
            for (const result of results) {
              for (const ev of result.evidence) {
                if ((ev.doi ?? ev.pmid) === externalId) {
                  await writeStudySupportsClaim(
                    paperSource.id,
                    result.claimId,
                    ev.verdict === "SUPPORTS",
                    ev.confidence,
                  );
                }
              }
            }
          } catch (graphErr) {
            console.warn(
              `${tag} [VERIFY] Graph edge write failed: ${graphErr instanceof Error ? graphErr.message : graphErr}`,
            );
          }
        }

        console.log(
          `${tag} [VERIFY] Results: ${JSON.stringify(metrics.verdictDistribution)} (${elapsed()})`,
        );

        capturePipelineEvent("knowledge_verification_metrics", {
          sourceId,
          sourceType: source.sourceType,
          claimCount: results.length,
          ...metrics,
        });

        await recordRunComplete(verifyRunId, {
          claimsVerified: results.length,
          papersQueued: papersToIngest.length,
          totalInputTokens: metrics.totalInputTokens,
          totalOutputTokens: metrics.totalOutputTokens,
          llmCallCount: metrics.llmCallCount,
          estimatedCostUsd: metrics.estimatedCostUsd,
          avgEvidenceDepth: metrics.avgEvidenceDepth,
          fullTextRate: metrics.fullTextRate,
          abstractOnlyRate: metrics.abstractOnlyRate,
          searchHitRate: metrics.searchHitRate,
          avgConfidence: metrics.avgConfidence,
          verdictDistribution: metrics.verdictDistribution,
          fetchTierDistribution: metrics.fetchTierDistribution,
          tokensByPhase: metrics.tokensByPhase,
        });
        currentRunId = undefined;
        onProgress?.({
          step: "VERIFY_CLAIMS",
          status: "PROCESSING",
          stats: {
            claimsVerified: results.length,
            papersQueued: papersToIngest.length,
          },
        });
      } else {
        console.log(`${tag} [VERIFY] No unverified claims to process`);
      }
    }

    const durationMs = Date.now() - t0;
    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { status: "COMPLETED" },
    });
    console.log(`${tag} Pipeline complete (${elapsed()})`);

    capturePipelineEvent("knowledge_run_completed", {
      sourceId,
      sourceType: source.sourceType,
      sourceTitle: source.title,
      steps,
      durationMs,
      durationSec: Math.round(durationMs / 1000),
    });

    onProgress?.({ step: "VERIFY_CLAIMS", status: "COMPLETED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${tag} Pipeline failed at ${elapsed()}: ${message}`);

    capturePipelineEvent("knowledge_run_failed", {
      sourceId,
      sourceType: source.sourceType,
      sourceTitle: source.title,
      steps,
      error: message,
      durationMs: Date.now() - t0,
    });

    if (currentRunId) {
      await recordRunFailed(currentRunId, message);
    }

    if (error instanceof TranscriptUnavailableError) {
      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: {
          status: "FAILED",
          metadata: {
            ...((source.metadata as Record<string, unknown>) ?? {}),
            failureReason: "transcript_unavailable",
            failureMessage: message,
          },
        },
      });
      onProgress?.({ step: currentStep, status: "FAILED", error: message });
      return;
    }

    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: {
        status: "FAILED",
        metadata: {
          ...((source.metadata as Record<string, unknown>) ?? {}),
          failedAtStep: currentStep,
          failureMessage: message,
        },
      },
    });
    onProgress?.({ step: currentStep, status: "FAILED", error: message });
    throw error;
  }
}

async function recordRunStart(
  sourceId: string,
  step: KnowledgeIngestionStep,
): Promise<string> {
  const run = await prisma.knowledgeIngestionRun.create({
    data: { sourceId, step, status: "RUNNING" },
  });
  return run.id;
}

async function recordRunComplete(
  runId: string,
  stats: Record<string, unknown>,
): Promise<void> {
  await prisma.knowledgeIngestionRun.update({
    where: { id: runId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      stats: stats as Prisma.InputJsonValue,
    },
  });
}

async function recordRunFailed(
  runId: string,
  error: string,
): Promise<void> {
  await prisma.knowledgeIngestionRun.update({
    where: { id: runId },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      error,
    },
  });
}
