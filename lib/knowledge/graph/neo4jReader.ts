import neo4j from "neo4j-driver";
import { getNeo4jSession } from "./neo4jClient";

export interface GraphNode {
  name: string;
  type: string;
  aliases: string[];
  description?: string;
}

export interface GraphRelationship {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  context: string;
  sourceId: string;
}

export async function getConceptNeighbors(
  conceptName: string,
  depth: number = 1,
): Promise<{ nodes: GraphNode[]; relationships: GraphRelationship[] }> {
  const session = getNeo4jSession();
  const maxDepth = Math.max(1, Math.min(depth, 5));

  try {
    const result = await session.run(
      `MATCH path = (c:Concept {name: $name})-[*1..${maxDepth}]-(neighbor:Concept)
       WHERE neighbor <> c
       UNWIND relationships(path) AS r
       WITH neighbor, r
       WHERE NOT startNode(r):Source AND NOT endNode(r):Source
       RETURN DISTINCT
              neighbor.name AS name, neighbor.type AS type,
              neighbor.aliases AS aliases, neighbor.description AS description,
              type(r) AS predicate, r.confidence AS confidence,
              r.context AS context, r.sourceId AS sourceId,
              startNode(r).name AS subject, endNode(r).name AS object
       LIMIT 200`,
      { name: conceptName },
    );

    const nodes: GraphNode[] = [];
    const relationships: GraphRelationship[] = [];
    const seenNodes = new Set<string>();
    const seenRels = new Set<string>();

    for (const record of result.records) {
      const name = record.get("name") as string;
      if (!seenNodes.has(name)) {
        seenNodes.add(name);
        nodes.push({
          name,
          type: (record.get("type") as string) ?? "unknown",
          aliases: (record.get("aliases") as string[]) ?? [],
          description: (record.get("description") as string) ?? undefined,
        });
      }

      const subject = record.get("subject") as string;
      const predicate = record.get("predicate") as string;
      const object = record.get("object") as string;
      const relKey = `${subject}|${predicate}|${object}`;

      if (!seenRels.has(relKey)) {
        seenRels.add(relKey);
        relationships.push({
          subject,
          predicate,
          object,
          confidence: (record.get("confidence") as number) ?? 0,
          context: (record.get("context") as string) ?? "",
          sourceId: (record.get("sourceId") as string) ?? "",
        });
      }
    }

    return { nodes, relationships };
  } finally {
    await session.close();
  }
}

export async function searchConcepts(
  query: string,
  limit: number = 20,
): Promise<GraphNode[]> {
  const session = getNeo4jSession();

  try {
    const result = await session.run(
      `MATCH (c:Concept)
       WHERE toLower(c.name) CONTAINS toLower($query)
          OR ANY(alias IN c.aliases WHERE toLower(alias) CONTAINS toLower($query))
       RETURN c.name AS name, c.type AS type, c.aliases AS aliases,
              c.description AS description
       LIMIT $limit`,
      { query, limit: neo4j.int(limit) },
    );

    return result.records.map((record) => ({
      name: record.get("name") as string,
      type: (record.get("type") as string) ?? "unknown",
      aliases: (record.get("aliases") as string[]) ?? [],
      description: (record.get("description") as string) ?? undefined,
    }));
  } finally {
    await session.close();
  }
}

export async function getConceptPath(
  fromConcept: string,
  toConcept: string,
  maxDepth: number = 4,
): Promise<GraphRelationship[]> {
  const session = getNeo4jSession();
  const safeDepth = Math.max(1, Math.min(maxDepth, 8));

  try {
    const result = await session.run(
      `MATCH path = shortestPath(
         (a:Concept {name: $from})-[*1..${safeDepth}]->(b:Concept {name: $to})
       )
       UNWIND relationships(path) AS r
       RETURN startNode(r).name AS subject, type(r) AS predicate,
              endNode(r).name AS object, r.confidence AS confidence,
              r.context AS context, r.sourceId AS sourceId`,
      { from: fromConcept, to: toConcept },
    );

    if (result.records.length > 0) {
      return result.records.map(recordToRelationship);
    }

    // Fall back to undirected if no directed path exists
    const fallback = await session.run(
      `MATCH path = shortestPath(
         (a:Concept {name: $from})-[*1..${safeDepth}]-(b:Concept {name: $to})
       )
       UNWIND relationships(path) AS r
       RETURN startNode(r).name AS subject, type(r) AS predicate,
              endNode(r).name AS object, r.confidence AS confidence,
              r.context AS context, r.sourceId AS sourceId`,
      { from: fromConcept, to: toConcept },
    );

    return fallback.records.map(recordToRelationship);
  } finally {
    await session.close();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recordToRelationship(record: any): GraphRelationship {
  return {
    subject: record.get("subject") as string,
    predicate: record.get("predicate") as string,
    object: record.get("object") as string,
    confidence: (record.get("confidence") as number) ?? 0,
    context: (record.get("context") as string) ?? "",
    sourceId: (record.get("sourceId") as string) ?? "",
  };
}
