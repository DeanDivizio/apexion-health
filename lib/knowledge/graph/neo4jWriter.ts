import { getNeo4jSession, ensureIndexes } from "./neo4jClient";
import type { ExtractionResult, ExtractedEntity } from "../types";
import type { MergedRelationship } from "../extraction/deduplicateRelationships";

const ENTITY_BATCH = 50;
const REL_BATCH = 50;

export async function clearSourceFromGraph(sourceId: string): Promise<void> {
  const session = getNeo4jSession();
  try {
    await session.run(
      `MATCH (a:Concept)-[r]->(b:Concept) WHERE r.sourceId = $sourceId DELETE r`,
      { sourceId },
    );
    await session.run(
      `MATCH (cl:Claim)-[:EXTRACTED_FROM]->(s:Source {sourceId: $sourceId})
       DETACH DELETE cl`,
      { sourceId },
    );
    await session.run(
      `MATCH (s:Source {sourceId: $sourceId}) DETACH DELETE s`,
      { sourceId },
    );
    await session.run(
      `MATCH (c:Concept) WHERE NOT (c)--() DELETE c`,
    );
  } finally {
    await session.close();
  }
}

export async function writeExtractionToGraph(
  sourceId: string,
  sourceTitle: string,
  extraction: ExtractionResult,
  mergedRelationships?: MergedRelationship[],
): Promise<void> {
  await ensureIndexes();
  const session = getNeo4jSession();

  try {
    await session.run(
      `MERGE (s:Source {sourceId: $sourceId})
       SET s.title = $title, s.updatedAt = datetime()`,
      { sourceId, title: sourceTitle },
    );

    for (let i = 0; i < extraction.entities.length; i += ENTITY_BATCH) {
      const batch = extraction.entities.slice(i, i + ENTITY_BATCH);
      await session.run(
        `UNWIND $entities AS e
         MERGE (c:Concept {name: e.name})
         SET c.type = e.type,
             c.aliases = e.aliases,
             c.description = e.description,
             c.updatedAt = datetime()
         WITH c
         MATCH (s:Source {sourceId: $sourceId})
         MERGE (c)-[:MENTIONED_IN]->(s)`,
        {
          entities: batch.map((e) => ({
            name: e.name,
            type: e.type,
            aliases: e.aliases,
            description: e.description ?? "",
          })),
          sourceId,
        },
      );
    }

    const rels = mergedRelationships ?? extraction.relationships;
    const relsByPredicate = groupByPredicate(rels);

    for (const [predicate, group] of relsByPredicate) {
      const safePred = sanitizePredicate(predicate);
      for (let i = 0; i < group.length; i += REL_BATCH) {
        const batch = group.slice(i, i + REL_BATCH);
        await session.run(
          `UNWIND $rels AS r
           MERGE (a:Concept {name: r.subject})
           MERGE (b:Concept {name: r.object})
           WITH a, b, r
           MERGE (a)-[rel:${safePred} {sourceId: $sourceId}]->(b)
           SET rel.confidence = r.confidence,
               rel.context = r.context,
               rel.observationCount = r.observationCount,
               rel.updatedAt = datetime()`,
          {
            rels: batch.map((r) => ({
              subject: r.subject,
              object: r.object,
              confidence: r.confidence,
              context: r.context,
              observationCount: "observationCount" in r ? r.observationCount : 1,
            })),
            sourceId,
          },
        );
      }
    }
  } finally {
    await session.close();
  }
}

export async function writeClaimsToGraph(
  claims: Array<{ claimId: string; claimText: string; entities: string[] }>,
  sourceId: string,
): Promise<void> {
  if (claims.length === 0) return;

  const session = getNeo4jSession();
  try {
    for (let i = 0; i < claims.length; i += REL_BATCH) {
      const batch = claims.slice(i, i + REL_BATCH);
      await session.run(
        `UNWIND $claims AS c
         MERGE (cl:Claim {claimId: c.claimId})
         SET cl.text = c.claimText, cl.updatedAt = datetime()
         WITH cl, c
         MATCH (s:Source {sourceId: $sourceId})
         MERGE (cl)-[:EXTRACTED_FROM]->(s)`,
        {
          claims: batch.map((c) => ({
            claimId: c.claimId,
            claimText: c.claimText,
          })),
          sourceId,
        },
      );

      for (const claim of batch) {
        if (claim.entities.length === 0) continue;
        await session.run(
          `UNWIND $entities AS eName
           MATCH (cl:Claim {claimId: $claimId})
           MATCH (c:Concept {name: eName})
           MERGE (cl)-[:INVOLVES]->(c)`,
          { claimId: claim.claimId, entities: claim.entities },
        );
      }
    }
  } finally {
    await session.close();
  }
}

export async function writeStudySupportsClaim(
  studySourceId: string,
  claimId: string,
  supports: boolean,
  confidence: number,
): Promise<void> {
  const session = getNeo4jSession();
  const relType = supports ? "SUPPORTS" : "CONTRADICTS";

  try {
    await session.run(
      `MATCH (st:Source {sourceId: $studySourceId})
       MATCH (cl:Claim {claimId: $claimId})
       MERGE (st)-[r:${relType}]->(cl)
       SET r.confidence = $confidence, r.updatedAt = datetime()`,
      { studySourceId, claimId, confidence },
    );
  } finally {
    await session.close();
  }
}

const ALLOWED_PREDICATES = new Set([
  "INCREASES",
  "DECREASES",
  "TREATS",
  "PREVENTS",
  "CORRELATES_WITH",
  "CO_OCCURS_WITH",
  "ACTIVATES",
  "INHIBITS",
  "REGULATES",
  "MODULATES",
  "IS_FORM_OF",
  "IS_METABOLITE_OF",
  "IS_PRECURSOR_TO",
  "IS_BIOMARKER_FOR",
  "HAS_MECHANISM",
  "INTERACTS_WITH",
  "SYNERGIZES_WITH",
  "ANTAGONIZES_WITH",
  "REQUIRES",
  "SUPPORTS",
  "CONTRADICTS",
  "MENTIONED_IN",
  "AUTHORED_BY",
  "EXTRACTED_FROM",
  "INVOLVES",
]);

function sanitizePredicate(predicate: string): string {
  const upper = predicate.toUpperCase();
  if (ALLOWED_PREDICATES.has(upper)) return upper;
  return "CORRELATES_WITH";
}

function groupByPredicate<T extends { predicate: string }>(
  rels: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const rel of rels) {
    const pred = sanitizePredicate(rel.predicate);
    const group = map.get(pred);
    if (group) {
      group.push(rel);
    } else {
      map.set(pred, [rel]);
    }
  }
  return map;
}
