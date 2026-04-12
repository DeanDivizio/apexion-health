import { TokenAccumulator } from "./tokenTracker";
import type {
  VerificationResult,
  VerificationRunMetrics,
  EvidenceResult,
  ScoredAbstract,
} from "./types";
import { EXTRACTION_MODEL } from "../config";

export function aggregateVerdict(evidence: EvidenceResult[]): {
  verificationStatus: VerificationResult["verificationStatus"];
  overallConfidence: number;
} {
  if (evidence.length === 0) {
    return { verificationStatus: "UNVERIFIED", overallConfidence: 0 };
  }

  const supports = evidence.filter((e) => e.verdict === "SUPPORTS");
  const contradicts = evidence.filter((e) => e.verdict === "CONTRADICTS");
  const avgConf =
    evidence.reduce((s, e) => s + e.confidence, 0) / evidence.length;

  if (supports.length > 0 && contradicts.length > 0) {
    return { verificationStatus: "CONTESTED", overallConfidence: avgConf };
  }
  if (supports.length > 0 && avgConf >= 0.7) {
    return { verificationStatus: "SUPPORTED", overallConfidence: avgConf };
  }
  if (contradicts.length > 0 && avgConf >= 0.7) {
    return { verificationStatus: "REFUTED", overallConfidence: avgConf };
  }
  return { verificationStatus: "UNVERIFIED", overallConfidence: avgConf };
}

export function buildMetrics(
  results: VerificationResult[],
  tokens: TokenAccumulator,
  totalClaims: number,
  searchHits: number,
): VerificationRunMetrics {
  const verdictDistribution: Record<string, number> = {};
  const fetchTierDistribution: Record<string, number> = {};
  let totalEvidenceCount = 0;
  let fullTextCount = 0;
  let abstractOnlyCount = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  for (const r of results) {
    verdictDistribution[r.verificationStatus] =
      (verdictDistribution[r.verificationStatus] ?? 0) + 1;

    totalEvidenceCount += r.evidence.length;

    for (const ev of r.evidence) {
      const tier = ev.fetchTier || "UNKNOWN";
      fetchTierDistribution[tier] = (fetchTierDistribution[tier] ?? 0) + 1;

      if (ev.abstractOnly) {
        abstractOnlyCount++;
      } else {
        fullTextCount++;
      }
    }

    if (r.overallConfidence > 0) {
      confidenceSum += r.overallConfidence;
      confidenceCount++;
    }
  }

  const totalEvidence = fullTextCount + abstractOnlyCount;
  const tokenJson = tokens.toJSON();

  return {
    totalInputTokens: tokens.totalInputTokens,
    totalOutputTokens: tokens.totalOutputTokens,
    llmCallCount: tokens.callCount,
    estimatedCostUsd: tokens.estimateCost(EXTRACTION_MODEL),
    verdictDistribution,
    avgEvidenceDepth:
      results.length > 0 ? totalEvidenceCount / results.length : 0,
    fullTextRate: totalEvidence > 0 ? fullTextCount / totalEvidence : 0,
    abstractOnlyRate:
      totalEvidence > 0 ? abstractOnlyCount / totalEvidence : 0,
    searchHitRate: totalClaims > 0 ? searchHits / totalClaims : 0,
    avgConfidence: confidenceCount > 0 ? confidenceSum / confidenceCount : 0,
    fetchTierDistribution,
    tokensByPhase: tokenJson.phases,
  };
}

export function buildAbstractOnlyResult(
  scored: ScoredAbstract,
): EvidenceResult {
  return {
    pmid: scored.pmid,
    doi: scored.doi,
    title: scored.title,
    authors: scored.authors,
    year: scored.year,
    journal: scored.journal,
    verdict: scored.verdict as "SUPPORTS" | "CONTRADICTS",
    confidence: scored.confidence,
    passages: [{ text: scored.keySentence, section: "Abstract" }],
    fetchTier: "ABSTRACT_ONLY",
    abstractOnly: true,
  };
}
