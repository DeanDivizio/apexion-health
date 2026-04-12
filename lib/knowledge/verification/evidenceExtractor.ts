import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";
import { fetchPaperFullTextCached } from "../sources/paperFetcher";
import type { VerifiableClaim, ScoredAbstract, EvidenceResult } from "./types";
import type { TokenAccumulator } from "./tokenTracker";
import type { PaperFullText } from "../types";
import {
  EVIDENCE_EXTRACTION_SYSTEM_PROMPT,
  evidenceResponseSchema,
  buildEvidenceUserMessage,
  preparePaperText,
} from "./prompts";
import { buildAbstractOnlyResult } from "./verificationUtils";
import { EXTRACTION_MODEL } from "../config";

const MODEL = EXTRACTION_MODEL;
const MAX_RETRIES = 2;

export function paperCacheKey(scored: { doi?: string; pmid?: string; title: string }): string {
  return scored.doi?.toLowerCase() ?? scored.pmid ?? scored.title.toLowerCase();
}

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}

export async function extractEvidence(
  claim: VerifiableClaim,
  scoredAbstracts: ScoredAbstract[],
  tokens?: TokenAccumulator,
  paperCache?: Map<string, PaperFullText>,
): Promise<EvidenceResult[]> {
  const results: EvidenceResult[] = [];

  for (const scored of scoredAbstracts) {
    try {
      const evidence = await extractEvidenceForPaper(claim, scored, tokens, paperCache);
      results.push(evidence);
    } catch (err) {
      console.warn(
        `[evidence] Failed for "${scored.title}": ${err instanceof Error ? err.message : err}`,
      );
      results.push(buildAbstractOnlyResult(scored));
    }
  }

  return results;
}

async function extractEvidenceForPaper(
  claim: VerifiableClaim,
  scored: ScoredAbstract,
  tokens?: TokenAccumulator,
  paperCache?: Map<string, PaperFullText>,
): Promise<EvidenceResult> {
  const key = paperCacheKey(scored);
  let paper = paperCache?.get(key) ?? null;

  if (paper) {
    console.log(`[evidence] In-memory cache hit for "${scored.title.slice(0, 60)}"`);
  } else {
    paper = await fetchPaperFullTextCached({
      doi: scored.doi,
      pmid: scored.pmid,
      title: scored.title,
    });
    if (paper && paperCache) {
      paperCache.set(key, paper);
    }
  }

  if (!paper || paper.sections.length === 0) {
    console.log(`[evidence] No full text for "${scored.title}", using abstract`);
    return buildAbstractOnlyResult(scored);
  }

  const paperText = preparePaperText(paper);
  const client = getClient();
  const userMessage = buildEvidenceUserMessage(claim, paperText, paper.title);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }

    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EVIDENCE_EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_completion_tokens: 2048,
      });

      tokens?.add("evidenceExtraction", response.usage);

      const rawText = response.choices[0]?.message?.content;
      if (!rawText) {
        console.warn(`[evidence] Attempt ${attempt + 1}: empty response`);
        continue;
      }

      const parsed = JSON.parse(rawText);
      const result = evidenceResponseSchema.safeParse(parsed);
      if (!result.success) {
        console.warn(
          `[evidence] Attempt ${attempt + 1}: schema validation failed:`,
          result.error.issues,
        );
        continue;
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
    } catch (err) {
      console.error(
        `[evidence] Attempt ${attempt + 1} error:`,
        err instanceof Error ? `${err.name}: ${err.message}` : err,
      );
      if (attempt === MAX_RETRIES) break;
    }
  }

  console.warn(
    `[evidence] LLM extraction failed for "${scored.title}", using abstract`,
  );
  return buildAbstractOnlyResult(scored);
}
