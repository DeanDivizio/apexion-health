import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";
import type { VerifiableClaim } from "./types";
import type { TokenAccumulator } from "./tokenTracker";
import {
  QUERY_BUILDING_SYSTEM_PROMPT,
  queryResponseSchema,
  buildQueryUserMessage,
} from "./prompts";
import { EXTRACTION_MODEL } from "../config";

const MODEL = EXTRACTION_MODEL;
const MAX_RETRIES = 2;

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}

export async function buildSearchQueries(
  claim: VerifiableClaim,
  tokens?: TokenAccumulator,
): Promise<string[]> {
  const client = getClient();
  const userMessage = buildQueryUserMessage(claim);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }

    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: QUERY_BUILDING_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_completion_tokens: 4096,
      });

      tokens?.add("queryBuilding", response.usage);

      const choice = response.choices[0];
      const rawText = choice?.message?.content;
      if (!rawText) {
        console.warn(
          `[query] Attempt ${attempt + 1}: empty content — finish_reason: ${choice?.finish_reason}, usage: ${JSON.stringify(response.usage)}`,
        );
        continue;
      }

      const parsed = JSON.parse(rawText);
      const result = queryResponseSchema.safeParse(parsed);
      if (result.success) return result.data.queries;
      console.warn(
        `[query] Attempt ${attempt + 1}: schema validation failed:`,
        result.error.issues,
      );
    } catch (err) {
      console.error(
        `[query] Attempt ${attempt + 1} error:`,
        err instanceof Error ? `${err.name}: ${err.message}` : err,
      );
      if (attempt === MAX_RETRIES) break;
    }
  }

  console.warn("[query] LLM failed, falling back to entity-based query");
  return [claim.entities.slice(0, 4).join(" ")];
}
