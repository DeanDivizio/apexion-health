import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const { verifyClaims } = await import(
    "../lib/knowledge/verification/claimVerifier"
  );
  const { writeStudySupportsClaim } = await import(
    "../lib/knowledge/graph/neo4jWriter"
  );
  const { runIngestionPipeline } = await import("../lib/knowledge/pipeline");

  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  const sourceIdx = args.indexOf("--source");

  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;
  const sourceId = sourceIdx !== -1 ? args[sourceIdx + 1] : undefined;

  console.log("=== Claim Evidence Verification ===");
  if (limit) console.log(`Limit: ${limit} claims`);
  if (sourceId) console.log(`Source: ${sourceId}`);
  console.log();

  const where: Record<string, unknown> = { verificationStatus: "UNVERIFIED" };
  if (sourceId) where.sourceId = sourceId;

  const claims = await prisma.knowledgeClaim.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  if (claims.length === 0) {
    console.log("No unverified claims found.");
    return;
  }

  console.log(`Found ${claims.length} unverified claims\n`);

  const verifiableClaims = claims.map((c) => ({
    claimId: c.id,
    claimText: c.claimText,
    confidence: c.confidence,
    entities:
      ((c.metadata as Record<string, unknown>)?.entities as string[]) ?? [],
    sourceId: c.sourceId,
  }));

  const t0 = Date.now();
  const { results, metrics, papersToIngest: discoveredPapers } = await verifyClaims(verifiableClaims);

  const statusCounts: Record<string, number> = {
    SUPPORTED: 0,
    CONTESTED: 0,
    REFUTED: 0,
    UNVERIFIED: 0,
  };

  for (const result of results) {
    statusCounts[result.verificationStatus]++;

    const paperIds = result.evidence
      .map((e: { doi?: string; pmid?: string }) => e.doi ?? e.pmid)
      .filter(Boolean) as string[];

    const existingClaim = await prisma.knowledgeClaim.findUnique({
      where: { id: result.claimId },
      select: { metadata: true },
    });
    const existingMeta = existingClaim?.metadata ?? {};

    await prisma.knowledgeClaim.update({
      where: { id: result.claimId },
      data: {
        verificationStatus: result.verificationStatus,
        supportingPaperIds: paperIds,
        metadata: {
          ...((existingMeta as Record<string, unknown>) ?? {}),
          evidence: result.evidence.map((e: { title: string; doi?: string; pmid?: string; verdict: string; confidence: number; passages: { text: string; section: string }[]; fetchTier: string }) => ({
            title: e.title,
            doi: e.doi ?? null,
            pmid: e.pmid ?? null,
            verdict: e.verdict,
            confidence: e.confidence,
            passages: e.passages,
            fetchTier: e.fetchTier,
          })),
        },
      },
    });
  }

  const paperMap = new Map<string, { title: string; doi?: string; pmid?: string }>();
  for (const paper of discoveredPapers) {
    const key = paper.doi?.toLowerCase() ?? paper.pmid ?? paper.title;
    if (!paperMap.has(key)) {
      paperMap.set(key, { title: paper.title, doi: paper.doi, pmid: paper.pmid });
    }
  }

  console.log("\n=== Persisted verification results ===");
  console.log(`SUPPORTED: ${statusCounts.SUPPORTED}`);
  console.log(`CONTESTED: ${statusCounts.CONTESTED}`);
  console.log(`REFUTED: ${statusCounts.REFUTED}`);
  console.log(`UNVERIFIED: ${statusCounts.UNVERIFIED}`);

  const papersToIngest = Array.from(paperMap.values());
  console.log(`\nPapers found: ${papersToIngest.length} unique`);

  const PAPER_STEPS = [
    "FETCH",
    "CHUNK",
    "EMBED",
    "EXTRACT_ENTITIES",
    "RESOLVE_ENTITIES",
    "SYNTHESIZE_RELATIONSHIPS",
    "EXTRACT_CLAIMS",
  ] as const;

  let ingested = 0;
  for (const paper of papersToIngest) {
    const externalId = paper.doi ?? paper.pmid;
    if (!externalId) continue;

    const paperSource = await prisma.knowledgeSource.upsert({
      where: {
        sourceType_externalId: { sourceType: "PAPER", externalId },
      },
      create: {
        sourceType: "PAPER",
        title: paper.title,
        externalId,
        authors: [],
        status: "PENDING",
        metadata: { doi: paper.doi, pmid: paper.pmid },
      },
      update: {},
    });

    if (paperSource.status === "COMPLETED") {
      console.log(`  [skip] "${paper.title.slice(0, 60)}" already ingested`);
      continue;
    }

    console.log(`  [ingest] "${paper.title.slice(0, 60)}"`);
    try {
      await runIngestionPipeline({
        sourceType: "PAPER",
        sourceId: paperSource.id,
        steps: [...PAPER_STEPS],
      });
      ingested++;
    } catch (err) {
      console.warn(
        `  [fail] ${err instanceof Error ? err.message : err}`,
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
    } catch {
      // graph edges are non-fatal
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n=== Summary ===`);
  console.log(
    `SUPPORTED: ${statusCounts.SUPPORTED} | CONTESTED: ${statusCounts.CONTESTED} | REFUTED: ${statusCounts.REFUTED} | UNVERIFIED: ${statusCounts.UNVERIFIED}`,
  );
  console.log(`Papers found: ${papersToIngest.length} unique`);
  console.log(`Papers ingested: ${ingested} new`);
  console.log(`Total time: ${elapsed}s`);
  console.log(`\n=== Cost & Metrics ===`);
  console.log(`Tokens: ${metrics.totalInputTokens} in / ${metrics.totalOutputTokens} out (${metrics.llmCallCount} calls)`);
  console.log(`Estimated cost: $${metrics.estimatedCostUsd.toFixed(4)}`);
  console.log(`Search hit rate: ${(metrics.searchHitRate * 100).toFixed(0)}%`);
  console.log(`Avg evidence depth: ${metrics.avgEvidenceDepth.toFixed(1)} papers/claim`);
  console.log(`Full-text rate: ${(metrics.fullTextRate * 100).toFixed(0)}%`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
