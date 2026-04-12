import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";
import type {
  VerifiableClaim,
  CandidateAbstract,
  ScoredAbstract,
} from "./types";
import type { TokenAccumulator } from "./tokenTracker";
import {
  ABSTRACT_SCORING_SYSTEM_PROMPT,
  scorerResponseSchema,
  buildScoringUserMessage,
  hasFullTextAccess,
} from "./prompts";
import { EXTRACTION_MODEL } from "../config";

const MODEL = EXTRACTION_MODEL;
const MAX_RETRIES = 2;
const TOP_N = 3;

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}

export async function scoreAbstracts(
  claim: VerifiableClaim,
  abstracts: CandidateAbstract[],
  tokens?: TokenAccumulator,
): Promise<ScoredAbstract[]> {
  if (abstracts.length === 0) return [];

  const client = getClient();
  const userMessage = buildScoringUserMessage(claim, abstracts);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }

    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: ABSTRACT_SCORING_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_completion_tokens: 4096,
      });

      tokens?.add("abstractScoring", response.usage);

      const rawText = response.choices[0]?.message?.content;
      if (!rawText) {
        console.warn(`[scorer] Attempt ${attempt + 1}: empty response`);
        continue;
      }

      const parsed = JSON.parse(rawText);
      const result = scorerResponseSchema.safeParse(parsed);
      if (!result.success) {
        console.warn(
          `[scorer] Attempt ${attempt + 1}: schema validation failed:`,
          result.error.issues,
        );
        continue;
      }

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
    } catch (err) {
      console.error(
        `[scorer] Attempt ${attempt + 1} error:`,
        err instanceof Error ? `${err.name}: ${err.message}` : err,
      );
      if (attempt === MAX_RETRIES) {
        console.warn("[scorer] LLM scoring failed after retries");
        return [];
      }
    }
  }

  return [];
}
