import { buildSearchQueries } from "./queryBuilder";
import { searchLiterature } from "./literatureSearcher";
import { scoreAbstracts } from "./abstractScorer";
import { extractEvidence, paperCacheKey } from "./evidenceExtractor";
import { resolveMissingDois } from "./doiResolver";
import { TokenAccumulator } from "./tokenTracker";
import { aggregateVerdict, buildMetrics } from "./verificationUtils";
import type {
  VerifiableClaim,
  VerificationResult,
  VerificationOutput,
  PaperToIngest,
} from "./types";
import type { PaperFullText } from "../types";

export async function verifyClaims(
  claims: VerifiableClaim[],
): Promise<VerificationOutput> {
  const results: VerificationResult[] = [];
  const globalPaperMap = new Map<string, PaperToIngest>();
  const paperCache = new Map<string, PaperFullText>();
  const tokens = new TokenAccumulator();
  let searchHits = 0;

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    const prefix = `[verify] [${i + 1}/${claims.length}]`;
    console.log(
      `${prefix} Processing: "${claim.claimText.slice(0, 80)}..."`,
    );

    try {
      const { result, hadSearchHit } = await verifySingleClaim(
        claim,
        prefix,
        tokens,
        paperCache,
      );
      if (hadSearchHit) searchHits++;

      for (const ev of result.evidence) {
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

      results.push(result);
    } catch (err) {
      console.error(
        `${prefix} Failed: ${err instanceof Error ? err.message : err}`,
      );
      results.push({
        claimId: claim.claimId,
        verificationStatus: "UNVERIFIED",
        overallConfidence: 0,
        evidence: [],
      });
    }
  }

  const uniquePapers = await resolveMissingDois(
    Array.from(globalPaperMap.values()),
  );

  const metrics = buildMetrics(results, tokens, claims.length, searchHits);

  console.log(
    `[verify] Complete: ${results.length} claims verified, ${uniquePapers.length} unique papers found`,
  );
  console.log(
    `[verify] Paper cache: ${paperCache.size} unique papers cached in-memory across all claims`,
  );
  console.log(
    `[verify] Tokens: ${tokens.totalInputTokens} in / ${tokens.totalOutputTokens} out (${tokens.callCount} calls, ~$${metrics.estimatedCostUsd.toFixed(4)})`,
  );

  return { results, metrics, papersToIngest: uniquePapers };
}

async function verifySingleClaim(
  claim: VerifiableClaim,
  prefix: string,
  tokens: TokenAccumulator,
  paperCache: Map<string, PaperFullText>,
): Promise<{ result: VerificationResult; hadSearchHit: boolean }> {
  const queries = await buildSearchQueries(claim, tokens);
  console.log(`${prefix} Built ${queries.length} search queries`);

  const candidates = await searchLiterature(queries);
  console.log(`${prefix} Found ${candidates.length} candidate papers`);

  if (candidates.length === 0) {
    console.log(`${prefix} No candidates → UNVERIFIED`);
    return {
      result: {
        claimId: claim.claimId,
        verificationStatus: "UNVERIFIED",
        overallConfidence: 0,
        evidence: [],
      },
      hadSearchHit: false,
    };
  }

  const scored = await scoreAbstracts(claim, candidates, tokens);
  const supports = scored.filter((s) => s.verdict === "SUPPORTS").length;
  const contradicts = scored.filter((s) => s.verdict === "CONTRADICTS").length;
  console.log(
    `${prefix} Scoring: ${supports} SUPPORTS, ${contradicts} CONTRADICTS (${scored.length} relevant)`,
  );

  if (scored.length === 0) {
    console.log(`${prefix} No relevant abstracts → UNVERIFIED`);
    return {
      result: {
        claimId: claim.claimId,
        verificationStatus: "UNVERIFIED",
        overallConfidence: 0,
        evidence: [],
      },
      hadSearchHit: true,
    };
  }

  const evidence = await extractEvidence(claim, scored, tokens, paperCache);
  console.log(`${prefix} Evidence: ${evidence.length} papers analyzed`);

  const { verificationStatus, overallConfidence } =
    aggregateVerdict(evidence);
  console.log(
    `${prefix} Verdict: ${verificationStatus} (conf: ${overallConfidence.toFixed(2)})`,
  );

  return {
    result: {
      claimId: claim.claimId,
      verificationStatus,
      overallConfidence,
      evidence,
    },
    hadSearchHit: true,
  };
}

