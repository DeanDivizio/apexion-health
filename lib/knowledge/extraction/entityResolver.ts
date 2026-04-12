import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";
import { z } from "zod";
import type {
  ExtractedEntity,
  ExtractedRelationship,
  ExtractionResult,
} from "../types";
import { EXTRACTION_MODEL } from "../config";

const MODEL = EXTRACTION_MODEL;
const MAX_RETRIES = 2;
const ENTITY_BATCH_SIZE = 80;

const SYSTEM_PROMPT = `You are a biomedical entity resolution expert. Given a list of entities extracted from the same source, identify duplicates, synonyms, and variant names that refer to the same real-world concept.

For each group of duplicates, pick the best canonical name (prefer the most common scientific form) and list all variant names as aliases.

Return JSON:
{
  "groups": [
    {
      "canonical": "Vitamin D3",
      "type": "nutrient",
      "description": "fat-soluble secosteroid hormone precursor",
      "aliases": ["Vit D", "D3", "cholecalciferol", "Vitamin D"],
      "mergedFrom": ["Vitamin D3", "Vit D", "D3", "cholecalciferol"]
    }
  ],
  "unchanged": ["creatine monohydrate", "testosterone"]
}

Rules:
- Only merge entities that genuinely refer to the same concept. Do NOT merge related-but-distinct concepts (e.g. "Vitamin D3" and "Vitamin D2" are different).
- "unchanged" lists entity names that have no duplicates.
- Every input entity name must appear in exactly one group's mergedFrom OR in unchanged.
- Pick the type from the most specific entity in the group.
- Merge descriptions, keeping the most informative one.`;

const resolutionResponseSchema = z.object({
  groups: z.array(
    z.object({
      canonical: z.string(),
      type: z.string(),
      description: z.string().optional(),
      aliases: z.array(z.string()),
      mergedFrom: z.array(z.string()),
    }),
  ),
  unchanged: z.array(z.string()),
});

type ResolutionResponse = z.infer<typeof resolutionResponseSchema>;

export interface EntityResolution {
  canonicalEntities: ExtractedEntity[];
  nameMap: Map<string, string>;
}

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}

async function resolveEntityBatch(
  client: OpenAI,
  entities: ExtractedEntity[],
): Promise<ResolutionResponse> {
  const entityList = entities.map((e) => ({
    name: e.name,
    type: e.type,
    aliases: e.aliases,
    description: e.description ?? "",
  }));

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
          {
            role: "user",
            content: JSON.stringify(entityList, null, 2),
          },
        ],
        max_completion_tokens: 4096,
      });

      const rawText = response.choices[0]?.message?.content;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const result = resolutionResponseSchema.safeParse(parsed);
      if (result.success) return result.data;
    } catch {
      if (attempt === MAX_RETRIES) {
        return { groups: [], unchanged: entities.map((e) => e.name) };
      }
    }
  }

  return { groups: [], unchanged: entities.map((e) => e.name) };
}

export async function resolveEntities(
  entities: ExtractedEntity[],
): Promise<EntityResolution> {
  if (entities.length === 0) {
    return { canonicalEntities: [], nameMap: new Map() };
  }

  const client = getClient();
  const nameMap = new Map<string, string>();
  const canonicalEntities: ExtractedEntity[] = [];
  const entityByName = new Map(entities.map((e) => [e.name, e]));

  const batches: ExtractedEntity[][] = [];
  for (let i = 0; i < entities.length; i += ENTITY_BATCH_SIZE) {
    batches.push(entities.slice(i, i + ENTITY_BATCH_SIZE));
  }

  console.log(
    `[resolver] Resolving ${entities.length} entities in ${batches.length} batch(es)`,
  );

  for (let i = 0; i < batches.length; i++) {
    console.log(`[resolver] Processing batch ${i + 1}/${batches.length}`);
    const resolution = await resolveEntityBatch(client, batches[i]);

    for (const group of resolution.groups) {
      const canonicalEntity: ExtractedEntity = {
        name: group.canonical,
        type: (group.type as ExtractedEntity["type"]) ?? "mechanism",
        aliases: [...new Set(group.aliases)],
        description: group.description,
      };
      canonicalEntities.push(canonicalEntity);

      for (const variantName of group.mergedFrom) {
        nameMap.set(variantName, group.canonical);
        nameMap.set(variantName.toLowerCase(), group.canonical);
      }
      nameMap.set(group.canonical, group.canonical);
      nameMap.set(group.canonical.toLowerCase(), group.canonical);
    }

    for (const unchangedName of resolution.unchanged) {
      const original = entityByName.get(unchangedName);
      if (original) {
        canonicalEntities.push(original);
      }
      nameMap.set(unchangedName, unchangedName);
      nameMap.set(unchangedName.toLowerCase(), unchangedName);
    }
  }

  console.log(
    `[resolver] Resolved to ${canonicalEntities.length} canonical entities (from ${entities.length} raw)`,
  );

  return { canonicalEntities, nameMap };
}

export function remapRelationships(
  relationships: ExtractedRelationship[],
  nameMap: Map<string, string>,
): ExtractedRelationship[] {
  return relationships
    .map((rel) => {
      const subject =
        nameMap.get(rel.subject) ??
        nameMap.get(rel.subject.toLowerCase()) ??
        rel.subject;
      const object =
        nameMap.get(rel.object) ??
        nameMap.get(rel.object.toLowerCase()) ??
        rel.object;
      return { ...rel, subject, object };
    })
    .filter((rel) => rel.subject !== rel.object);
}

export function applyResolutionToResult(
  extraction: ExtractionResult,
  resolution: EntityResolution,
): ExtractionResult {
  const remapped = remapRelationships(
    extraction.relationships,
    resolution.nameMap,
  );

  const remappedClaims = extraction.claims.map((claim) => ({
    ...claim,
    entities: claim.entities.map(
      (e) =>
        resolution.nameMap.get(e) ??
        resolution.nameMap.get(e.toLowerCase()) ??
        e,
    ),
  }));

  return {
    entities: resolution.canonicalEntities,
    relationships: remapped,
    claims: remappedClaims,
  };
}
