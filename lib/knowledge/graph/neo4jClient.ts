import neo4j, { type Driver } from "neo4j-driver";

const globalForNeo4j = globalThis as unknown as {
  neo4jDriver?: Driver;
};

function getDriver(): Driver {
  if (globalForNeo4j.neo4jDriver) {
    return globalForNeo4j.neo4jDriver;
  }

  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !username || !password) {
    throw new Error(
      "NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD must be set.",
    );
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    maxConnectionLifetime: 60_000,
    connectionAcquisitionTimeout: 10_000,
  });
  globalForNeo4j.neo4jDriver = driver;
  return driver;
}

export function getNeo4jSession(database?: string) {
  const db = database ?? process.env.NEO4J_DATABASE ?? process.env.NEO4J_USERNAME ?? "neo4j";
  return getDriver().session({ database: db });
}

export async function verifyNeo4jConnection(): Promise<boolean> {
  const session = getNeo4jSession();
  try {
    await session.run("RETURN 1 AS ok");
  } catch {
    return false;
  } finally {
    await session.close();
  }
  try {
    await ensureIndexes();
  } catch {
    // Index creation failure is non-fatal for connection verification
  }
  return true;
}

let indexesEnsured = false;

export async function ensureIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const session = getNeo4jSession();
  try {
    await session.run(
      "CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE",
    );
    await session.run(
      "CREATE CONSTRAINT source_sourceId IF NOT EXISTS FOR (s:Source) REQUIRE s.sourceId IS UNIQUE",
    );
    await session.run(
      "CREATE CONSTRAINT claim_claimId IF NOT EXISTS FOR (cl:Claim) REQUIRE cl.claimId IS UNIQUE",
    );
    await session.run(
      "CREATE TEXT INDEX concept_name_text IF NOT EXISTS FOR (c:Concept) ON (c.name)",
    );
    indexesEnsured = true;
    console.log("[neo4j] Indexes and constraints ensured");
  } finally {
    await session.close();
  }
}

export async function closeNeo4jDriver(): Promise<void> {
  if (globalForNeo4j.neo4jDriver) {
    await globalForNeo4j.neo4jDriver.close();
    globalForNeo4j.neo4jDriver = undefined;
  }
}

const globalCleanup = globalThis as unknown as { neo4jCleanupRegistered?: boolean };
if (typeof process !== "undefined" && !globalCleanup.neo4jCleanupRegistered) {
  globalCleanup.neo4jCleanupRegistered = true;
  process.once("beforeExit", async () => {
    await closeNeo4jDriver();
  });
}
