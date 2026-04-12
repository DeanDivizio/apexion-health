export interface VerifiableClaim {
  claimId: string;
  claimText: string;
  confidence: number | null;
  entities: string[];
  sourceId: string;
}

export interface CandidateAbstract {
  pmid?: string;
  doi?: string;
  pmcId?: string;
  openAccessUrl?: string;
  title: string;
  abstract: string;
  authors: string[];
  year?: number;
  journal?: string;
  source: "pubmed" | "semantic_scholar";
}

export interface ScoredAbstract extends CandidateAbstract {
  verdict: "SUPPORTS" | "CONTRADICTS" | "IRRELEVANT";
  confidence: number;
  keySentence: string;
}

export interface EvidencePassage {
  text: string;
  section: string;
}

export interface EvidenceResult {
  pmid?: string;
  doi?: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  verdict: "SUPPORTS" | "CONTRADICTS";
  confidence: number;
  passages: EvidencePassage[];
  fetchTier: string;
  abstractOnly: boolean;
}

export interface PaperToIngest {
  doi?: string;
  pmid?: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
}

export interface VerificationResult {
  claimId: string;
  verificationStatus: "SUPPORTED" | "CONTESTED" | "REFUTED" | "UNVERIFIED";
  overallConfidence: number;
  evidence: EvidenceResult[];
}

export interface VerificationRunMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  llmCallCount: number;
  estimatedCostUsd: number;
  verdictDistribution: Record<string, number>;
  avgEvidenceDepth: number;
  fullTextRate: number;
  abstractOnlyRate: number;
  searchHitRate: number;
  avgConfidence: number;
  fetchTierDistribution: Record<string, number>;
  tokensByPhase: Record<string, { promptTokens: number; completionTokens: number }>;
}

export interface VerificationOutput {
  results: VerificationResult[];
  metrics: VerificationRunMetrics;
  papersToIngest: PaperToIngest[];
}
