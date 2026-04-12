import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";
import type { Chunk, ExtractedClaim } from "../types";
import { claimExtractionResponseSchema } from "./schemas";
import { EXTRACTION_MODEL } from "../config";

const MODEL = EXTRACTION_MODEL;
const MAX_RETRIES = 2;
const BATCH_SIZE = 5;

const SYSTEM_PROMPT = `You are a scientific claim extraction expert. Given a text chunk from a health/fitness podcast or scientific paper, extract verifiable factual claims.

A verifiable claim is a specific assertion about cause-effect, dosage-response, or comparative effectiveness that could be checked against scientific literature.

Examples of good claims:
- "Creatine supplementation at 5g/day increases lean body mass in resistance-trained individuals"
- "Cold exposure at 11 minutes per week total increases brown fat activation"
- "Magnesium L-threonate crosses the blood-brain barrier more effectively than other magnesium forms"

NOT claims (too vague or opinion):
- "Sleep is important for health"
- "You should eat more vegetables"
- "This is an interesting study"

Return JSON matching this shape:
{
  "claims": [{ "claimText": "...", "confidence": 0.9, "entities": ["entity1", "entity2"] }]
}

Rules:
- Only extract claims that are specific and verifiable.
- Confidence reflects how definitively the claim is stated (1.0 = stated as fact with citations, 0.5 = suggested/implied).
- List the entities (nutrients, supplements, exercises, conditions, etc.) involved in each claim.
- Aim for precision over recall -- fewer high-quality claims are better than many vague ones.`;

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}

async function extractClaimsFromChunk(
  client: OpenAI,
  chunkText: string,
): Promise<ExtractedClaim[]> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }

    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: chunkText },
        ],
        max_completion_tokens: 4096,
      });

      const rawText = response.choices[0]?.message?.content;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const result = claimExtractionResponseSchema.safeParse(parsed);
      if (result.success) return result.data.claims;
    } catch {
      if (attempt === MAX_RETRIES) return [];
    }
  }

  return [];
}

export async function extractClaimsFromChunks(
  chunks: Chunk[],
): Promise<ExtractedClaim[]> {
  const client = getClient();
  const allClaims: ExtractedClaim[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
    console.log(`[claims] Processing batch ${batchNum}/${totalBatches} (chunks ${i + 1}–${Math.min(i + BATCH_SIZE, chunks.length)})`);

    const results = await Promise.all(
      batch.map((chunk) => extractClaimsFromChunk(client, chunk.content)),
    );

    for (const claims of results) {
      allClaims.push(...claims);
    }
  }

  return allClaims;
}
