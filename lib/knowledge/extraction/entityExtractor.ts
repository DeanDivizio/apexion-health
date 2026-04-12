import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";
import type {
  Chunk,
  ExtractionResult,
  ExtractedEntity,
  ExtractedRelationship,
} from "../types";
import {
  entityExtractionResponseSchema,
  type EntityExtractionResponse,
} from "./schemas";
import { EXTRACTION_MODEL } from "../config";

const MODEL = EXTRACTION_MODEL;
const MAX_RETRIES = 2;
const BATCH_SIZE = 5;

const SYSTEM_PROMPT = `You are a biomedical knowledge extraction expert. Given a text chunk from a health/fitness podcast or scientific paper, extract entities and directional relationships.

## Entities

Extract named concepts with their type, aliases, and a one-line description.

Types: nutrient, supplement, exercise, biomarker, condition, mechanism, person, food

Rules:
- Normalize names to their most common scientific form (e.g. "Vitamin D3" not "Vit D", "creatine monohydrate" not "creatine").
- Include all aliases and abbreviations mentioned in the text.
- Only extract entities that are meaningfully discussed, not just mentioned in passing.
- Write a short description (under 80 chars) capturing what the entity is.

## Relationships

Extract directional relationships between entities using these predicates:

- INCREASES: A raises levels/activity of B (e.g. "exercise INCREASES BDNF")
- DECREASES: A lowers levels/activity of B
- ACTIVATES: A triggers or turns on B (a pathway, receptor, gene)
- INHIBITS: A blocks or suppresses B (a pathway, receptor, enzyme)
- REGULATES: A controls B (bidirectional or homeostatic)
- MODULATES: A influences B without a clear directional effect
- TREATS: A is used therapeutically for condition B
- PREVENTS: A reduces risk of condition B
- HAS_MECHANISM: A works via mechanism B (e.g. "curcumin HAS_MECHANISM NF-kB inhibition")
- IS_FORM_OF: A is a specific form/variant of B (e.g. "magnesium L-threonate IS_FORM_OF magnesium")
- IS_METABOLITE_OF: A is a metabolic product of B
- IS_PRECURSOR_TO: A is converted into B in the body
- IS_BIOMARKER_FOR: A is a measurable indicator of B
- REQUIRES: A needs B to function (e.g. "Vitamin D absorption REQUIRES magnesium")
- INTERACTS_WITH: A and B have a known interaction (neutral direction)
- SYNERGIZES_WITH: A and B together produce a greater-than-additive effect
- ANTAGONIZES_WITH: A and B counteract each other
- CORRELATES_WITH: A and B are statistically associated (use only when no causal direction is supported)
- CO_OCCURS_WITH: A and B tend to appear together (weakest link; avoid if a stronger predicate fits)

Rules:
- Pick the most specific predicate supported by the text. Avoid CORRELATES_WITH when a causal predicate fits.
- Confidence reflects the strength of evidence in THIS text (1.0 = stated as established fact, 0.5 = suggested/implied).
- Context quote: a brief passage (under 100 chars) from the text supporting the relationship.
- Subject and object MUST exactly match an entity name you extracted.

Return JSON:
{
  "entities": [{ "name": "...", "type": "...", "aliases": ["..."], "description": "..." }],
  "relationships": [{ "subject": "...", "predicate": "...", "object": "...", "confidence": 0.9, "context": "..." }]
}`;

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}

async function extractFromChunk(
  client: OpenAI,
  chunkText: string,
): Promise<EntityExtractionResponse> {
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
      const result = entityExtractionResponseSchema.safeParse(parsed);
      if (result.success) return result.data;
    } catch {
      if (attempt === MAX_RETRIES) {
        return { entities: [], relationships: [] };
      }
    }
  }

  return { entities: [], relationships: [] };
}

export async function extractEntitiesFromChunks(
  chunks: Chunk[],
): Promise<ExtractionResult> {
  const client = getClient();
  const allEntities: ExtractedEntity[] = [];
  const allRelationships: ExtractedRelationship[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
    console.log(
      `[entities] Processing batch ${batchNum}/${totalBatches} (chunks ${i + 1}–${Math.min(i + BATCH_SIZE, chunks.length)})`,
    );

    const results = await Promise.all(
      batch.map((chunk) => extractFromChunk(client, chunk.content)),
    );

    for (const result of results) {
      allEntities.push(...result.entities);
      allRelationships.push(...result.relationships);
    }
  }

  const deduped = deduplicateEntities(allEntities);

  return {
    entities: deduped,
    relationships: allRelationships,
    claims: [],
  };
}

function deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const map = new Map<string, ExtractedEntity>();

  for (const entity of entities) {
    const key = entity.name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      const mergedAliases = [
        ...new Set([...existing.aliases, ...entity.aliases]),
      ];
      const description =
        existing.description || entity.description || undefined;
      map.set(key, { ...existing, aliases: mergedAliases, description });
    } else {
      map.set(key, entity);
    }
  }

  return Array.from(map.values());
}
