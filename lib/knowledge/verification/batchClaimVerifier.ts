import {
  buildBatchJsonl,
  submitBatch,
  pollBatchUntilComplete,
} from "../batchProcessor";
import type { BatchResultEntry } from "../batchProcessor";
import { searchLiterature } from "./literatureSearcher";
import { resolveMissingDois } from "./doiResolver";
import { fetchPaperFullTextCached } from "../sources/paperFetcher";
import { TokenAccumulator } from "./tokenTracker";
import {
  aggregateVerdict,
  buildMetrics,
  buildAbstractOnlyResult,
} from "./verificationUtils";
import { paperCacheKey } from "./evidenceExtractor";
import {
  QUERY_BUILDING_SYSTEM_PROMPT,
  ABSTRACT_SCORING_SYSTEM_PROMPT,
  EVIDENCE_EXTRACTION_SYSTEM_PROMPT,
  queryResponseSchema,
  scorerResponseSchema,
  evidenceResponseSchema,
  buildQueryUserMessage,
  buildScoringUserMessage,
  buildEvidenceUserMessage,
  preparePaperText,
  hasFullTextAccess,
} from "./prompts";
import type {
  VerifiableClaim,
  VerificationResult,
  VerificationOutput,
  CandidateAbstract,
  ScoredAbstract,
  EvidenceResult,
  PaperToIngest,
} from "./types";
import type { PaperFullText } from "../types";
import { EXTRACTION_MODEL } from "../config";

const MODEL = EXTRACTION_MODEL;
const TOP_N = 3;

export interface BatchVerifyOptions {
  maxPollMs?: number;
  onBatchSubmitted?: (phase: string, batchId: string) => Promise<void>;
}

export async function verifyClaimsBatch(
  claims: VerifiableClaim[],
  options?: BatchVerifyOptions,
): Promise<VerificationOutput> {
  const maxPollMs = options?.maxPollMs ?? 1_500_000;
  const tokens = new TokenAccumulator();
  let searchHits = 0;

  console.log(
    `[batch-verify] Starting batch verification for ${claims.length} claims`,
  );

  // ── Phase 1: Query Building ───────────────────────────────────────
  console.log("[batch-verify] Phase 1: Building search queries...");
  const queriesByClaim = await runPhase1QueryBuilding(
    claims,
    tokens,
    maxPollMs,
    options?.onBatchSubmitted,
  );

  // ── Literature Search (no LLM) ────────────────────────────────────
  console.log("[batch-verify] Literature search...");
  const candidatesByClaim: CandidateAbstract[][] = [];
  for (let i = 0; i < claims.length; i++) {
    const queries = queriesByClaim[i];
    try {
      const candidates = await searchLiterature(queries);
      candidatesByClaim.push(candidates);
      if (candidates.length > 0) searchHits++;
    } catch (err) {
      console.warn(
        `[batch-verify] Literature search failed for claim ${i}: ${err instanceof Error ? err.message : err}`,
      );
      candidatesByClaim.push([]);
    }
  }

  // ── Phase 2: Abstract Scoring ─────────────────────────────────────
  console.log("[batch-verify] Phase 2: Scoring abstracts...");
  const scoredByClaim = await runPhase2AbstractScoring(
    claims,
    candidatesByClaim,
    tokens,
    maxPollMs,
    options?.onBatchSubmitted,
  );

  // ── Paper Fetch (deduplicated) ────────────────────────────────────
  console.log("[batch-verify] Fetching papers (deduplicated)...");
  const paperMap = await fetchPapersDeduplicated(scoredByClaim);

  // ── Phase 3: Evidence Extraction ──────────────────────────────────
  console.log("[batch-verify] Phase 3: Extracting evidence...");
  const evidenceByClaim = await runPhase3EvidenceExtraction(
    claims,
    scoredByClaim,
    paperMap,
    tokens,
    maxPollMs,
    options?.onBatchSubmitted,
  );

  // ── Build results ─────────────────────────────────────────────────
  const results: VerificationResult[] = [];
  const globalPaperMap = new Map<string, PaperToIngest>();

  for (let i = 0; i < claims.length; i++) {
    const evidence = evidenceByClaim[i];
    const { verificationStatus, overallConfidence } =
      aggregateVerdict(evidence);

    for (const ev of evidence) {
      const key = paperCacheKey(ev);
      if (!globalPaperMap.has(key)) {
        globalPaperMap.set(key, {
          doi: ev.doi,
          pmid: ev.pmid,
          title: ev.title,
          authors: ev.authors,
          year: ev.year,
          journal: ev.journal,
        });
      }
    }

    results.push({
      claimId: claims[i].claimId,
      verificationStatus,
      overallConfidence,
      evidence,
    });
  }

  const uniquePapers = await resolveMissingDois(
    Array.from(globalPaperMap.values()),
  );

  const metrics = buildMetrics(results, tokens, claims.length, searchHits);
  metrics.estimatedCostUsd = tokens.estimateCost(MODEL, true);

  console.log(
    `[batch-verify] Complete: ${results.length} claims verified, ${uniquePapers.length} unique papers`,
  );
  console.log(
    `[batch-verify] Tokens: ${tokens.totalInputTokens} in / ${tokens.totalOutputTokens} out (~$${metrics.estimatedCostUsd.toFixed(4)} batch pricing)`,
  );

  return { results, metrics, papersToIngest: uniquePapers };
}

// ── Phase 1: Query Building ───────────────────────────────────────────

async function runPhase1QueryBuilding(
  claims: VerifiableClaim[],
  tokens: TokenAccumulator,
  maxPollMs: number,
  onBatchSubmitted?: (phase: string, batchId: string) => Promise<void>,
): Promise<string[][]> {
  const requests = claims.map((claim, i) => ({
    customId: `query-${i}`,
    systemPrompt: QUERY_BUILDING_SYSTEM_PROMPT,
    userContent: buildQueryUserMessage(claim),
  }));

  const jsonl = buildBatchJsonl(requests);
  const batchId = await submitBatch(jsonl);
  console.log(`[batch-verify] Phase 1 batch submitted: ${batchId}`);
  await onBatchSubmitted?.("queryBuilding", batchId);

  const resultMap = await pollBatchUntilComplete(batchId, 30_000, maxPollMs);

  const queriesByClaim: string[][] = [];
  for (let i = 0; i < claims.length; i++) {
    const entry = resultMap.get(`query-${i}`);
    if (entry) {
      accumulateUsage(tokens, "queryBuilding", entry);
      const queries = parseQueryResult(entry.content);
      if (queries) {
        queriesByClaim.push(queries);
        continue;
      }
    }
    // Fallback: entity-based query
    queriesByClaim.push([claims[i].entities.slice(0, 4).join(" ")]);
  }

  return queriesByClaim;
}

function parseQueryResult(content: string): string[] | null {
  try {
    const parsed = JSON.parse(content);
    const result = queryResponseSchema.safeParse(parsed);
    if (result.success) return result.data.queries;
  } catch {
    // parse failure
  }
  return null;
}

// ── Phase 2: Abstract Scoring ─────────────────────────────────────────

async function runPhase2AbstractScoring(
  claims: VerifiableClaim[],
  candidatesByClaim: CandidateAbstract[][],
  tokens: TokenAccumulator,
  maxPollMs: number,
  onBatchSubmitted?: (phase: string, batchId: string) => Promise<void>,
): Promise<ScoredAbstract[][]> {
  // Track which claims have candidates (skip empty ones)
  const claimIndicesWithCandidates: number[] = [];
  const requests: { customId: string; systemPrompt: string; userContent: string }[] = [];

  for (let i = 0; i < claims.length; i++) {
    if (candidatesByClaim[i].length === 0) continue;
    claimIndicesWithCandidates.push(i);
    requests.push({
      customId: `score-${i}`,
      systemPrompt: ABSTRACT_SCORING_SYSTEM_PROMPT,
      userContent: buildScoringUserMessage(claims[i], candidatesByClaim[i]),
    });
  }

  if (requests.length === 0) {
    return claims.map(() => []);
  }

  const jsonl = buildBatchJsonl(requests);
  const batchId = await submitBatch(jsonl);
  console.log(`[batch-verify] Phase 2 batch submitted: ${batchId}`);
  await onBatchSubmitted?.("abstractScoring", batchId);

  const resultMap = await pollBatchUntilComplete(batchId, 30_000, maxPollMs);

  const scoredByClaim: ScoredAbstract[][] = claims.map(() => []);

  for (const claimIdx of claimIndicesWithCandidates) {
    const entry = resultMap.get(`score-${claimIdx}`);
    if (!entry) continue;

    accumulateUsage(tokens, "abstractScoring", entry);
    const scored = parseScoringResult(
      entry.content,
      candidatesByClaim[claimIdx],
    );
    scoredByClaim[claimIdx] = scored;
  }

  return scoredByClaim;
}

function parseScoringResult(
  content: string,
  abstracts: CandidateAbstract[],
): ScoredAbstract[] {
  try {
    const parsed = JSON.parse(content);
    const result = scorerResponseSchema.safeParse(parsed);
    if (!result.success) return [];

    const scored: ScoredAbstract[] = [];
    for (const score of result.data.scores) {
      if (
        score.verdict === "IRRELEVANT" ||
        score.index < 0 ||
        score.index >= abstracts.length
      ) {
        continue;
      }
      scored.push({
        ...abstracts[score.index],
        verdict: score.verdict,
        confidence: score.confidence,
        keySentence: score.keySentence,
      });
    }

    scored.sort((a, b) => {
      const aAccess = hasFullTextAccess(a) ? 1 : 0;
      const bAccess = hasFullTextAccess(b) ? 1 : 0;
      if (aAccess !== bAccess) return bAccess - aAccess;
      return b.confidence - a.confidence;
    });

    return scored.slice(0, TOP_N);
  } catch {
    return [];
  }
}

// ── Paper Fetch (deduplicated) ────────────────────────────────────────

async function fetchPapersDeduplicated(
  scoredByClaim: ScoredAbstract[][],
): Promise<Map<string, PaperFullText>> {
  const paperMap = new Map<string, PaperFullText>();
  const uniqueKeys = new Map<
    string,
    { doi?: string; pmid?: string; title: string }
  >();

  for (const scored of scoredByClaim) {
    for (const s of scored) {
      const key = paperCacheKey(s);
      if (!uniqueKeys.has(key)) {
        uniqueKeys.set(key, { doi: s.doi, pmid: s.pmid, title: s.title });
      }
    }
  }

  console.log(
    `[batch-verify] Fetching ${uniqueKeys.size} unique papers...`,
  );

  for (const [key, ref] of uniqueKeys) {
    try {
      const paper = await fetchPaperFullTextCached({
        doi: ref.doi,
        pmid: ref.pmid,
        title: ref.title,
      });
      if (paper) {
        paperMap.set(key, paper);
      }
    } catch (err) {
      console.warn(
        `[batch-verify] Paper fetch failed for ${ref.doi ?? ref.pmid ?? ref.title}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log(
    `[batch-verify] Fetched ${paperMap.size}/${uniqueKeys.size} papers`,
  );
  return paperMap;
}

// ── Phase 3: Evidence Extraction ──────────────────────────────────────

interface Phase3Request {
  claimIndex: number;
  paperIndex: number;
  scored: ScoredAbstract;
  paper: PaperFullText;
}

async function runPhase3EvidenceExtraction(
  claims: VerifiableClaim[],
  scoredByClaim: ScoredAbstract[][],
  paperMap: Map<string, PaperFullText>,
  tokens: TokenAccumulator,
  maxPollMs: number,
  onBatchSubmitted?: (phase: string, batchId: string) => Promise<void>,
): Promise<EvidenceResult[][]> {
  const phase3Requests: Phase3Request[] = [];
  const batchRequests: { customId: string; systemPrompt: string; userContent: string; maxTokens: number }[] = [];

  // Items that skip LLM (abstract-only papers)
  const abstractOnlyItems: { claimIndex: number; scored: ScoredAbstract }[] =
    [];

  for (let ci = 0; ci < claims.length; ci++) {
    const scored = scoredByClaim[ci];
    for (let pi = 0; pi < scored.length; pi++) {
      const s = scored[pi];
      const key = paperCacheKey(s);
      const paper = paperMap.get(key);

      if (!paper || paper.sections.length === 0) {
        abstractOnlyItems.push({ claimIndex: ci, scored: s });
        continue;
      }

      const paperText = preparePaperText(paper);
      phase3Requests.push({ claimIndex: ci, paperIndex: pi, scored: s, paper });
      batchRequests.push({
        customId: `evidence-${ci}-${pi}`,
        systemPrompt: EVIDENCE_EXTRACTION_SYSTEM_PROMPT,
        userContent: buildEvidenceUserMessage(claims[ci], paperText, paper.title),
        maxTokens: 2048,
      });
    }
  }

  // Initialize evidence arrays
  const evidenceByClaim: EvidenceResult[][] = claims.map(() => []);

  // Add abstract-only results directly
  for (const item of abstractOnlyItems) {
    evidenceByClaim[item.claimIndex].push(
      buildAbstractOnlyResult(item.scored),
    );
  }

  if (batchRequests.length === 0) {
    return evidenceByClaim;
  }

  const jsonl = buildBatchJsonl(batchRequests);
  const batchId = await submitBatch(jsonl);
  console.log(
    `[batch-verify] Phase 3 batch submitted: ${batchId} (${batchRequests.length} requests)`,
  );
  await onBatchSubmitted?.("evidenceExtraction", batchId);

  const resultMap = await pollBatchUntilComplete(batchId, 30_000, maxPollMs);

  for (const req of phase3Requests) {
    const customId = `evidence-${req.claimIndex}-${req.paperIndex}`;
    const entry = resultMap.get(customId);

    if (entry) {
      accumulateUsage(tokens, "evidenceExtraction", entry);
      const evidence = parseEvidenceResult(entry.content, req.scored, req.paper);
      evidenceByClaim[req.claimIndex].push(evidence);
    } else {
      // Fallback to abstract-only
      evidenceByClaim[req.claimIndex].push(
        buildAbstractOnlyResult(req.scored),
      );
    }
  }

  return evidenceByClaim;
}

function parseEvidenceResult(
  content: string,
  scored: ScoredAbstract,
  paper: PaperFullText,
): EvidenceResult {
  try {
    const parsed = JSON.parse(content);
    const result = evidenceResponseSchema.safeParse(parsed);
    if (!result.success) {
      return buildAbstractOnlyResult(scored);
    }

    return {
      pmid: scored.pmid ?? paper.pmid,
      doi: scored.doi ?? paper.doi,
      title: paper.title || scored.title,
      authors: paper.authors.length > 0 ? paper.authors : scored.authors,
      year: scored.year,
      journal: scored.journal ?? paper.journal,
      verdict: result.data.verdict,
      confidence: result.data.confidence,
      passages: result.data.passages,
      fetchTier: paper.fetchTier,
      abstractOnly: false,
    };
  } catch {
    return buildAbstractOnlyResult(scored);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function accumulateUsage(
  tokens: TokenAccumulator,
  phase: string,
  entry: BatchResultEntry,
): void {
  if (entry.usage) {
    tokens.add(phase, entry.usage);
  }
}
