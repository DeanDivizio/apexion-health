import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

async function main() {
  const { getNeo4jSession, closeNeo4jDriver } = await import(
    "../lib/knowledge/graph/neo4jClient"
  );
  const session = getNeo4jSession();

  try {
    // 1. Node counts by label
    console.log("=== Node Counts ===");
    const counts = await session.run(
      `MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC`,
    );
    for (const r of counts.records) {
      console.log(`  ${r.get("label")}: ${r.get("count")}`);
    }

    // 2. Relationship counts by type
    console.log("\n=== Relationship Counts ===");
    const relCounts = await session.run(
      `MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count ORDER BY count DESC`,
    );
    for (const r of relCounts.records) {
      console.log(`  ${r.get("type")}: ${r.get("count")}`);
    }

    // 3. Concept nodes by type
    console.log("\n=== Concepts by Entity Type ===");
    const byType = await session.run(
      `MATCH (c:Concept) RETURN c.type AS type, count(c) AS count, collect(c.name)[0..5] AS examples ORDER BY count DESC`,
    );
    for (const r of byType.records) {
      const examples = (r.get("examples") as string[]).join(", ");
      console.log(`  ${r.get("type")} (${r.get("count")}): ${examples}`);
    }

    // 4. Most connected concepts (by degree)
    console.log("\n=== Top 15 Most Connected Concepts ===");
    const connected = await session.run(
      `MATCH (c:Concept)
       OPTIONAL MATCH (c)-[r]-(:Concept)
       WITH c, count(r) AS degree
       ORDER BY degree DESC LIMIT 15
       RETURN c.name AS name, c.type AS type, degree`,
    );
    for (const r of connected.records) {
      console.log(`  ${r.get("name")} (${r.get("type")}): ${r.get("degree")} connections`);
    }

    // 5. Sample of concept-to-concept relationships (not MENTIONED_IN)
    console.log("\n=== Sample Concept-to-Concept Relationships (20) ===");
    const sampleRels = await session.run(
      `MATCH (a:Concept)-[r]->(b:Concept)
       RETURN a.name AS from, type(r) AS rel, b.name AS to,
              r.confidence AS conf, r.context AS ctx
       ORDER BY r.confidence DESC
       LIMIT 20`,
    );
    for (const r of sampleRels.records) {
      const conf = Number(r.get("conf") ?? 0).toFixed(2);
      const ctx = (r.get("ctx") as string ?? "").slice(0, 80);
      console.log(`  ${r.get("from")} --[${r.get("rel")}]--> ${r.get("to")}  (conf: ${conf})`);
      if (ctx) console.log(`    "${ctx}"`);
    }

    // 6. Orphan check: concepts with ONLY MENTIONED_IN edges
    console.log("\n=== Orphan Check ===");
    const orphans = await session.run(
      `MATCH (c:Concept)
       WHERE NOT (c)-[:INCREASES|DECREASES|ACTIVATES|INHIBITS|REGULATES|MODULATES|TREATS|PREVENTS|HAS_MECHANISM|IS_FORM_OF|IS_METABOLITE_OF|IS_PRECURSOR_TO|IS_BIOMARKER_FOR|REQUIRES|INTERACTS_WITH|SYNERGIZES_WITH|ANTAGONIZES_WITH|CORRELATES_WITH|CO_OCCURS_WITH]-()
       RETURN count(c) AS orphanCount`,
    );
    const total = await session.run(`MATCH (c:Concept) RETURN count(c) AS total`);
    const orphanCount = orphans.records[0].get("orphanCount");
    const totalCount = total.records[0].get("total");
    console.log(`  ${orphanCount} of ${totalCount} concepts have no concept-to-concept edges (${((Number(orphanCount) / Number(totalCount)) * 100).toFixed(0)}% orphan rate)`);

    // 7. Claims in graph
    console.log("\n=== Claims in Graph ===");
    const claimCount = await session.run(`MATCH (cl:Claim) RETURN count(cl) AS count`);
    console.log(`  Total claims: ${claimCount.records[0].get("count")}`);
    const claimWithConcepts = await session.run(
      `MATCH (cl:Claim)-[:INVOLVES]->(c:Concept)
       WITH cl, count(c) AS conceptCount
       RETURN count(cl) AS claimsWithConcepts, avg(conceptCount) AS avgConcepts`,
    );
    const rec = claimWithConcepts.records[0];
    console.log(`  Claims linked to concepts: ${rec.get("claimsWithConcepts")}`);
    console.log(`  Avg concepts per claim: ${Number(rec.get("avgConcepts") ?? 0).toFixed(1)}`);

    // 8. Sample claims with their linked concepts
    console.log("\n=== Sample Claims (5) ===");
    const sampleClaims = await session.run(
      `MATCH (cl:Claim)-[:INVOLVES]->(c:Concept)
       WITH cl, collect(c.name) AS concepts
       RETURN cl.text AS claim, concepts
       LIMIT 5`,
    );
    for (const r of sampleClaims.records) {
      const concepts = (r.get("concepts") as string[]).join(", ");
      console.log(`  "${(r.get("claim") as string).slice(0, 120)}"`);
      console.log(`    → Concepts: ${concepts}`);
    }

    // 9. Multi-hop path example
    console.log("\n=== Path Discovery Test ===");
    const paths = await session.run(
      `MATCH (a:Concept)-[r1]->(b:Concept)-[r2]->(c:Concept)
       WHERE a <> c AND type(r1) <> 'MENTIONED_IN' AND type(r2) <> 'MENTIONED_IN'
       RETURN a.name AS start, type(r1) AS rel1, b.name AS mid, type(r2) AS rel2, c.name AS end
       LIMIT 10`,
    );
    if (paths.records.length === 0) {
      console.log("  No multi-hop paths found.");
    } else {
      for (const r of paths.records) {
        console.log(`  ${r.get("start")} --[${r.get("rel1")}]--> ${r.get("mid")} --[${r.get("rel2")}]--> ${r.get("end")}`);
      }
    }

  } finally {
    await session.close();
    await closeNeo4jDriver();
  }
}

main().catch(console.error);
