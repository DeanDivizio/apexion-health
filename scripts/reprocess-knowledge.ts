import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const { runIngestionPipeline } = await import("../lib/knowledge/pipeline");
  const { clearSourceFromGraph } = await import(
    "../lib/knowledge/graph/neo4jWriter"
  );
  const { closeNeo4jDriver } = await import(
    "../lib/knowledge/graph/neo4jClient"
  );

  const sources = await prisma.knowledgeSource.findMany({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "asc" },
  });

  console.log(
    `=== Reprocessing ${sources.length} completed sources ===\n`,
  );

  if (sources.length === 0) {
    console.log("No completed sources to reprocess.");
    await prisma.$disconnect();
    return;
  }

  const reprocessSteps = [
    "EXTRACT_ENTITIES" as const,
    "RESOLVE_ENTITIES" as const,
    "SYNTHESIZE_RELATIONSHIPS" as const,
    "EXTRACT_CLAIMS" as const,
  ];

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const label = `[${i + 1}/${sources.length}] ${source.sourceType} "${source.title}"`;

    console.log(`\n${label}`);
    console.log(`  ID: ${source.id}`);
    console.log(`  Steps: ${reprocessSteps.join(" → ")}`);

    try {
      console.log(`  Clearing old graph data...`);
      await clearSourceFromGraph(source.id);

      console.log(`  Clearing old claims...`);
      await prisma.knowledgeClaim.deleteMany({
        where: { sourceId: source.id },
      });
      await prisma.knowledgeIngestionRun.deleteMany({
        where: {
          sourceId: source.id,
          step: { in: reprocessSteps },
        },
      });

      console.log(`  Running pipeline...`);
      await runIngestionPipeline({
        sourceId: source.id,
        sourceType: source.sourceType,
        steps: reprocessSteps,
      });

      console.log(`  Done.`);
      succeeded++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  FAILED: ${msg}`);
      failed++;
    }
  }

  console.log(`\n=== Reprocessing complete ===`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed: ${failed}`);

  try {
    await closeNeo4jDriver();
  } catch {
    // ignore
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
