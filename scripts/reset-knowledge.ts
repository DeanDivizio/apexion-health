import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const { createSupabaseServerClient } = await import("../lib/supabase/server");

  console.log("=== Resetting knowledge base (keeping channels) ===\n");

  const claimsDeleted = await prisma.knowledgeClaim.deleteMany();
  console.log(`Deleted ${claimsDeleted.count} claims`);

  const runsDeleted = await prisma.knowledgeIngestionRun.deleteMany();
  console.log(`Deleted ${runsDeleted.count} ingestion runs`);

  const sourcesDeleted = await prisma.knowledgeSource.deleteMany();
  console.log(`Deleted ${sourcesDeleted.count} sources`);

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("knowledge_chunks")
      .delete()
      .gte("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
    console.log("Cleared knowledge_chunks from Supabase");
  } catch (e) {
    console.warn("Supabase cleanup skipped:", e instanceof Error ? e.message : e);
  }

  try {
    const { getNeo4jSession, closeNeo4jDriver } = await import(
      "../lib/knowledge/graph/neo4jClient"
    );
    const session = getNeo4jSession();
    await session.run("MATCH (n) DETACH DELETE n");
    await session.close();
    await closeNeo4jDriver();
    console.log("Cleared Neo4j graph");
  } catch (e) {
    console.warn("Neo4j cleanup skipped:", e instanceof Error ? e.message : e);
  }

  console.log("\nDone. Channels preserved, all sources and ingestion data cleared.");
  await prisma.$disconnect();
}

main().catch(console.error);
