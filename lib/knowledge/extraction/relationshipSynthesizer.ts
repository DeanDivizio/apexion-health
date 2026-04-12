import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";
import { z } from "zod";
import { relationshipPredicateSchema } from "./schemas";
import type { Chunk, ExtractedEntity, ExtractedRelationship } from "../types";
import { EXTRACTION_MODEL } from "../config";

const MODEL = EXTRACTION_MODEL;
const MAX_RETRIES = 2;
const WINDOW_SIZE = 5;
const WINDOW_STRIDE = 3;

const SYSTEM_PROMPT = `You are a biomedical relationship synthesis expert. You are given:
1. A list of known entities already extracted from a source.
2. A multi-section text passage spanning several sections of that source.

Your job is to identify relationships between ANY of the known entities, even if the two entities appear in different sections. Focus on connections that require reading across sections to discover -- relationships that wouldn't be obvious from a single paragraph.

Use these predicates:
INCREASES, DECREASES, ACTIVATES, INHIBITS, REGULATES, MODULATES, TREATS, PREVENTS, HAS_MECHANISM, IS_FORM_OF, IS_METABOLITE_OF, IS_PRECURSOR_TO, IS_BIOMARKER_FOR, REQUIRES, INTERACTS_WITH, SYNERGIZES_WITH, ANTAGONIZES_WITH, CORRELATES_WITH, CO_OCCURS_WITH

Rules:
- Subject and object MUST be names from the provided entity list. Do not invent new entities.
- Pick the most specific predicate. Avoid CORRELATES_WITH when a causal predicate fits.
- Only extract relationships supported by the provided text. Do not rely on external knowledge.
- Confidence reflects how strongly the combined text supports this relationship.
- Context: a brief passage (under 100 chars) from the text supporting the relationship.
- Skip relationships that are trivially obvious from a single sentence.

Return JSON:
{
  "relationships": [{ "subject": "...", "predicate": "...", "object": "...", "confidence": 0.8, "context": "..." }]
}`;

const synthesisResponseSchema = z.object({
  relationships: z.array(
    z.object({
      subject: z.string(),
      predicate: relationshipPredicateSchema,
      object: z.string(),
      confidence: z.number().min(0).max(1),
      context: z.string(),
    }),
  ),
});

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}

function buildSlidingWindows(chunks: Chunk[]): Chunk[][] {
  if (chunks.length <= WINDOW_SIZE) return [chunks];

  const windows: Chunk[][] = [];
  for (let i = 0; i < chunks.length; i += WINDOW_STRIDE) {
    const window = chunks.slice(i, i + WINDOW_SIZE);
    if (window.length >= 2) windows.push(window);
  }
  return windows;
}

function buildEntityListStr(entities: ExtractedEntity[]): string {
  return entities
    .map((e) => `- ${e.name} (${e.type})`)
    .join("\n");
}

async function synthesizeWindow(
  client: OpenAI,
  entities: ExtractedEntity[],
  windowChunks: Chunk[],
): Promise<ExtractedRelationship[]> {
  const entityListStr = buildEntityListStr(entities);
  const combinedText = windowChunks
    .map((c, i) => `--- Section ${i + 1} ---\n${c.content}`)
    .join("\n\n");

  const userMessage = `## Known Entities\n${entityListStr}\n\n## Text Passages\n${combinedText}`;

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
          { role: "user", content: userMessage },
        ],
        max_completion_tokens: 4096,
      });

      const rawText = response.choices[0]?.message?.content;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const result = synthesisResponseSchema.safeParse(parsed);
      if (result.success) return result.data.relationships;
    } catch {
      if (attempt === MAX_RETRIES) return [];
    }
  }

  return [];
}

export async function synthesizeRelationships(
  entities: ExtractedEntity[],
  chunks: Chunk[],
  existingRelationships: ExtractedRelationship[],
): Promise<ExtractedRelationship[]> {
  if (chunks.length < 2 || entities.length === 0) return [];

  const client = getClient();
  const windows = buildSlidingWindows(chunks);
  const entityNameSet = new Set(entities.map((e) => e.name));

  const existingKeys = new Set(
    existingRelationships.map(
      (r) => `${r.subject}|${r.predicate}|${r.object}`,
    ),
  );

  console.log(
    `[synthesizer] Synthesizing across ${windows.length} windows (${chunks.length} chunks, ${entities.length} entities)`,
  );

  const allNew: ExtractedRelationship[] = [];

  for (let i = 0; i < windows.length; i++) {
    console.log(`[synthesizer] Processing window ${i + 1}/${windows.length}`);
    const rels = await synthesizeWindow(client, entities, windows[i]);

    for (const rel of rels) {
      if (!entityNameSet.has(rel.subject) || !entityNameSet.has(rel.object)) {
        continue;
      }
      const key = `${rel.subject}|${rel.predicate}|${rel.object}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        allNew.push(rel);
      }
    }
  }

  console.log(
    `[synthesizer] Discovered ${allNew.length} new cross-chunk relationships`,
  );

  return allNew;
}
