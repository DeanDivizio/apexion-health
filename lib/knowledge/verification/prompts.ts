import { z } from "zod";
import { encode, decode } from "gpt-tokenizer";
import type { VerifiableClaim, CandidateAbstract } from "./types";
import type { PaperFullText } from "../types";

// ── System Prompts ──────────────────────────────────────────────────────

export const QUERY_BUILDING_SYSTEM_PROMPT = `You are a biomedical literature search expert. Convert a health/fitness claim into 1-2 PubMed search queries optimized for finding supporting or contradicting evidence.

Rules:
- Use MeSH terms when a standard term exists (e.g. "Creatine" → "creatine monohydrate")
- Keep each query under 15 words
- The first query should be specific to the exact claim
- The second query (if included) should be broader, covering the general topic
- Return JSON: { "queries": ["query1", "query2"] }`;

export const ABSTRACT_SCORING_SYSTEM_PROMPT = `You are a scientific evidence evaluator. Given a health/fitness claim and a list of paper abstracts, determine whether each abstract SUPPORTS, CONTRADICTS, or is IRRELEVANT to the claim.

For each abstract, return:
- verdict: "SUPPORTS", "CONTRADICTS", or "IRRELEVANT"
- confidence: 0-1 (how strongly the abstract relates to the specific claim, not general topic overlap)
- keySentence: the single most relevant sentence from the abstract (exact quote)

Rules:
- IRRELEVANT means the abstract is about a different topic or doesn't address the claim's specific assertion
- SUPPORTS means the abstract provides evidence consistent with the claim
- CONTRADICTS means the abstract provides evidence against the claim
- Be strict: general topic overlap is not enough for SUPPORTS/CONTRADICTS
- confidence reflects specificity of match, not quality of the study

Return JSON: { "scores": [{ "index": 0, "verdict": "...", "confidence": 0.8, "keySentence": "..." }, ...] }`;

export const EVIDENCE_EXTRACTION_SYSTEM_PROMPT = `You are a scientific evidence analyst. Given a health claim and the full text of a research paper, extract specific passages that support or contradict the claim.

Find 1-3 passages that directly address the claim. For each:
- text: exact quote from the paper (under 200 characters)
- section: which section it came from

Also provide an overall verdict (SUPPORTS or CONTRADICTS) and confidence (0-1).

Return JSON: { "verdict": "SUPPORTS", "confidence": 0.9, "passages": [{ "text": "...", "section": "Results" }] }`;

// ── Zod Schemas ─────────────────────────────────────────────────────────

export const queryResponseSchema = z.object({
  queries: z.array(z.string()).min(1).max(2),
});

export const scorerResponseSchema = z.object({
  scores: z.array(
    z.object({
      index: z.number(),
      verdict: z.enum(["SUPPORTS", "CONTRADICTS", "IRRELEVANT"]),
      confidence: z.number().min(0).max(1),
      keySentence: z.string(),
    }),
  ),
});

export const evidenceResponseSchema = z.object({
  verdict: z.enum(["SUPPORTS", "CONTRADICTS"]),
  confidence: z.number().min(0).max(1),
  passages: z.array(
    z.object({
      text: z.string(),
      section: z.string(),
    }),
  ),
});

// ── User Message Builders ───────────────────────────────────────────────

export function buildQueryUserMessage(claim: VerifiableClaim): string {
  const claimSnippet = claim.claimText.slice(0, 500);
  const entityStr = claim.entities.slice(0, 6).join(", ");
  return `Claim: "${claimSnippet}"\nEntities: ${entityStr}`;
}

export function buildScoringUserMessage(
  claim: VerifiableClaim,
  abstracts: CandidateAbstract[],
): string {
  const abstractList = abstracts
    .map((a, i) => `[${i}] "${a.title}"\n${a.abstract.slice(0, 1500)}`)
    .join("\n\n");
  return `Claim: "${claim.claimText}"\n\nAbstracts:\n${abstractList}`;
}

export function buildEvidenceUserMessage(
  claim: VerifiableClaim,
  paperText: string,
  paperTitle: string,
): string {
  return `Claim: "${claim.claimText}"\n\nPaper: "${paperTitle}"\n${paperText}`;
}

// ── Evidence Extraction Helpers ─────────────────────────────────────────

export const RELEVANT_SECTIONS = new Set([
  "abstract",
  "results",
  "discussion",
  "conclusion",
  "conclusions",
  "findings",
  "summary",
]);

export const MAX_PAPER_TOKENS = 12000;

export function preparePaperText(paper: PaperFullText): string {
  const relevantSections = paper.sections.filter((s) =>
    RELEVANT_SECTIONS.has(s.heading.toLowerCase()),
  );
  const sections =
    relevantSections.length > 0 ? relevantSections : paper.sections;

  const parts: string[] = [];
  let tokenCount = 0;

  for (const s of sections) {
    const sectionText = `## ${s.heading}\n${s.content}\n\n`;
    const sectionTokens = encode(sectionText).length;
    if (tokenCount + sectionTokens > MAX_PAPER_TOKENS) {
      const remaining = MAX_PAPER_TOKENS - tokenCount;
      if (remaining > 200) {
        const tokens = encode(sectionText);
        parts.push(decode(tokens.slice(0, remaining)));
      }
      break;
    }
    parts.push(sectionText);
    tokenCount += sectionTokens;
  }

  return parts.join("");
}

// ── Shared Utility ──────────────────────────────────────────────────────

export function hasFullTextAccess(paper: CandidateAbstract): boolean {
  if (paper.pmcId) return true;
  if (paper.openAccessUrl) return true;
  return false;
}
