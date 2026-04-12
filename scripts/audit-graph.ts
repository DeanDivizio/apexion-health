import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

// ── Types ──────────────────────────────────────────────────────────────

type Severity = "warning" | "error";

interface AuditFinding {
  check: string;
  severity: Severity;
  message: string;
  details: unknown[];
  count: number;
}

interface AuditReport {
  timestamp: string;
  durationMs: number;
  sourceFilter: string | null;
  summary: {
    totalFindings: number;
    errors: number;
    warnings: number;
  };
  checks: {
    nearDuplicateConcepts: AuditFinding;
    contradictoryEdges: AuditFinding;
    orphanedConcepts: AuditFinding;
    unlinkedClaimsNeo4j: AuditFinding;
    unlinkedClaimsSyncDrift: AuditFinding;
    danglingReferences: AuditFinding;
    lowConfidenceSubgraph: AuditFinding;
    prismaNeo4jSync: AuditFinding;
  };
}

// ── Opposing relationship pairs ────────────────────────────────────────

const OPPOSING_PAIRS: [string, string][] = [
  ["INCREASES", "DECREASES"],
  ["ACTIVATES", "INHIBITS"],
  ["SUPPORTS", "CONTRADICTS"],
  ["SYNERGIZES_WITH", "ANTAGONIZES_WITH"],
  ["TREATS", "PREVENTS"],
];

const CONCEPT_REL_TYPES = [
  "INCREASES",
  "DECREASES",
  "ACTIVATES",
  "INHIBITS",
  "REGULATES",
  "MODULATES",
  "TREATS",
  "PREVENTS",
  "HAS_MECHANISM",
  "IS_FORM_OF",
  "IS_METABOLITE_OF",
  "IS_PRECURSOR_TO",
  "IS_BIOMARKER_FOR",
  "REQUIRES",
  "INTERACTS_WITH",
  "SYNERGIZES_WITH",
  "ANTAGONIZES_WITH",
  "CORRELATES_WITH",
  "CO_OCCURS_WITH",
];

// ── Helpers ────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, "").replace(/s$/, "");
}

// ── Check implementations ──────────────────────────────────────────────

async function checkNearDuplicateConcepts(
  getSession: () => import("neo4j-driver").Session,
): Promise<AuditFinding> {
  const session = getSession();
  try {
    const allConcepts = await session.run(
      `MATCH (c:Concept) RETURN c.name AS name LIMIT 10000`,
    );

    const byNormalized = new Map<string, string[]>();
    for (const rec of allConcepts.records) {
      const name = rec.get("name") as string;
      const key = normalize(name);
      const group = byNormalized.get(key);
      if (group) {
        group.push(name);
      } else {
        byNormalized.set(key, [name]);
      }
    }

    const details: { nameA: string; nameB: string }[] = [];
    for (const [, names] of byNormalized) {
      if (names.length < 2) continue;
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          details.push({ nameA: names[i], nameB: names[j] });
        }
      }
    }

    return {
      check: "near_duplicate_concepts",
      severity: "warning",
      message:
        details.length > 0
          ? `Found ${details.length} near-duplicate concept pair(s) that may need merging`
          : "No near-duplicate concepts detected",
      details,
      count: details.length,
    };
  } finally {
    await session.close();
  }
}

async function checkContradictoryEdges(
  getSession: () => import("neo4j-driver").Session,
  sourceId?: string,
): Promise<AuditFinding> {
  const session = getSession();
  try {
    const pairs = OPPOSING_PAIRS.map(([a, b]) => `["${a}", "${b}"]`).join(", ");
    const sourceClause = sourceId
      ? "AND (r1.sourceId = $sourceId OR r2.sourceId = $sourceId)"
      : "";

    const result = await session.run(
      `WITH [${pairs}] AS opposingPairs
       UNWIND opposingPairs AS pair
       MATCH (a:Concept)-[r1]->(b:Concept)
       WHERE type(r1) = pair[0]
       WITH a, b, r1, pair
       MATCH (a)-[r2]->(b)
       WHERE type(r2) = pair[1]
       ${sourceClause}
       RETURN a.name AS conceptA, b.name AS conceptB,
              pair[0] AS relType1, pair[1] AS relType2,
              r1.sourceId AS source1, r2.sourceId AS source2,
              r1.confidence AS conf1, r2.confidence AS conf2
       LIMIT 200`,
      sourceId ? { sourceId } : {},
    );

    const details = result.records.map((r) => ({
      conceptA: r.get("conceptA") as string,
      conceptB: r.get("conceptB") as string,
      relType1: r.get("relType1") as string,
      relType2: r.get("relType2") as string,
      source1: r.get("source1") as string,
      source2: r.get("source2") as string,
      confidence1: Number(r.get("conf1") ?? 0),
      confidence2: Number(r.get("conf2") ?? 0),
    }));

    return {
      check: "contradictory_edges",
      severity: "warning",
      message:
        details.length > 0
          ? `Found ${details.length} contradictory edge pair(s) between concepts`
          : "No contradictory edges detected",
      details,
      count: details.length,
    };
  } finally {
    await session.close();
  }
}

async function checkOrphanedConcepts(
  getSession: () => import("neo4j-driver").Session,
  sourceId?: string,
): Promise<AuditFinding> {
  const session = getSession();
  try {
    const relTypePattern = CONCEPT_REL_TYPES.map((t) => `:${t}`).join("|");
    const sourceClause = sourceId
      ? `AND (c)-[:MENTIONED_IN]->(:Source {sourceId: $sourceId})`
      : "";

    const result = await session.run(
      `MATCH (c:Concept)
       WHERE NOT (c)-[${relTypePattern}]-()
       ${sourceClause}
       WITH c
       OPTIONAL MATCH (c)-[m:MENTIONED_IN]->(s:Source)
       RETURN c.name AS name, c.type AS type, count(m) AS mentionCount
       ORDER BY mentionCount DESC
       LIMIT 200`,
      sourceId ? { sourceId } : {},
    );

    const totalResult = await session.run(
      sourceId
        ? `MATCH (c:Concept)-[:MENTIONED_IN]->(:Source {sourceId: $sourceId}) RETURN count(c) AS total`
        : `MATCH (c:Concept) RETURN count(c) AS total`,
      sourceId ? { sourceId } : {},
    );
    const totalCount = Number(totalResult.records[0]?.get("total") ?? 0);

    const details = result.records.map((r) => ({
      name: r.get("name") as string,
      type: r.get("type") as string,
      mentionCount: Number(r.get("mentionCount") ?? 0),
    }));

    const orphanRate = totalCount > 0 ? details.length / totalCount : 0;

    return {
      check: "orphaned_concepts",
      severity: orphanRate > 0.5 ? "error" : "warning",
      message:
        details.length > 0
          ? `${details.length} of ${totalCount} concepts (${(orphanRate * 100).toFixed(0)}%) have no concept-to-concept edges`
          : "No orphaned concepts detected",
      details: details.slice(0, 50),
      count: details.length,
    };
  } finally {
    await session.close();
  }
}

async function checkUnlinkedClaimsNeo4j(
  getSession: () => import("neo4j-driver").Session,
  sourceId?: string,
): Promise<AuditFinding> {
  const session = getSession();
  try {
    const sourceClause = sourceId
      ? `WHERE (cl)-[:EXTRACTED_FROM]->(:Source {sourceId: $sourceId})`
      : "";
    const result = await session.run(
      `MATCH (cl:Claim)
       ${sourceClause}
       WITH cl
       WHERE NOT (cl)-[:INVOLVES]->(:Concept)
       RETURN cl.claimId AS claimId, cl.text AS text
       LIMIT 200`,
      sourceId ? { sourceId } : {},
    );

    const details = result.records.map((r) => ({
      claimId: r.get("claimId") as string,
      text: ((r.get("text") as string) ?? "").slice(0, 120),
    }));

    return {
      check: "unlinked_claims_neo4j",
      severity: details.length > 0 ? "warning" : "warning",
      message:
        details.length > 0
          ? `${details.length} claim(s) in Neo4j have no INVOLVES edges to any concept`
          : "All claims in Neo4j are linked to concepts",
      details,
      count: details.length,
    };
  } finally {
    await session.close();
  }
}

async function checkClaimSyncDrift(
  getSession: () => import("neo4j-driver").Session,
  prisma: import("@prisma/client").PrismaClient,
  sourceId?: string,
): Promise<AuditFinding> {
  const session = getSession();
  try {
    const neo4jResult = await session.run(
      sourceId
        ? `MATCH (cl:Claim)-[:EXTRACTED_FROM]->(:Source {sourceId: $sourceId})
           RETURN collect(cl.claimId) AS claimIds`
        : `MATCH (cl:Claim) RETURN collect(cl.claimId) AS claimIds`,
      sourceId ? { sourceId } : {},
    );
    const neo4jClaimIds = new Set<string>(
      (neo4jResult.records[0]?.get("claimIds") as string[]) ?? [],
    );

    const prismaWhere = sourceId ? { sourceId } : {};
    const prismaClaims = await prisma.knowledgeClaim.findMany({
      where: prismaWhere,
      select: { id: true },
    });
    const prismaClaimIds = new Set(prismaClaims.map((c) => c.id));

    const inPrismaNotNeo4j = [...prismaClaimIds].filter(
      (id) => !neo4jClaimIds.has(id),
    );
    const inNeo4jNotPrisma = [...neo4jClaimIds].filter(
      (id) => !prismaClaimIds.has(id),
    );

    const details = [
      ...inPrismaNotNeo4j.slice(0, 50).map((id) => ({
        claimId: id,
        drift: "in_prisma_not_neo4j" as const,
      })),
      ...inNeo4jNotPrisma.slice(0, 50).map((id) => ({
        claimId: id,
        drift: "in_neo4j_not_prisma" as const,
      })),
    ];
    const totalDrift = inPrismaNotNeo4j.length + inNeo4jNotPrisma.length;

    return {
      check: "unlinked_claims_sync_drift",
      severity: totalDrift > 0 ? "error" : "warning",
      message:
        totalDrift > 0
          ? `Prisma/Neo4j claim sync drift: ${inPrismaNotNeo4j.length} in Prisma only, ${inNeo4jNotPrisma.length} in Neo4j only`
          : "Prisma and Neo4j claims are in sync",
      details,
      count: totalDrift,
    };
  } finally {
    await session.close();
  }
}

async function checkDanglingReferences(
  getSession: () => import("neo4j-driver").Session,
  sourceId?: string,
): Promise<AuditFinding> {
  const session = getSession();
  try {
    const sourceClause = sourceId ? "WHERE r.sourceId = $sourceId" : "";
    const params = sourceId ? { sourceId } : {};

    const danglingExtracted = await session.run(
      `MATCH (cl:Claim)-[r:EXTRACTED_FROM]->(s)
       WHERE NOT s:Source
       RETURN cl.claimId AS claimId, type(r) AS relType
       LIMIT 50`,
    );

    const danglingSupportContradicts = await session.run(
      `MATCH (s)-[r:SUPPORTS|CONTRADICTS]->(cl)
       ${sourceClause}
       WITH s, r, cl
       WHERE NOT cl:Claim OR NOT s:Source
       RETURN type(r) AS relType, s.sourceId AS sourceId, cl.claimId AS claimId
       LIMIT 50`,
      params,
    );

    const relTypeList = CONCEPT_REL_TYPES.map((t) => `'${t}'`).join(",");
    const danglingConceptRels = await session.run(
      `MATCH (a)-[r]->(b)
       ${sourceClause}
       WITH a, r, b
       WHERE type(r) IN [${relTypeList}]
         AND (a:Concept OR b:Concept)
         AND (NOT a:Concept OR NOT b:Concept)
       RETURN type(r) AS relType, a.name AS fromName, b.name AS toName
       LIMIT 50`,
      params,
    );

    const details = [
      ...danglingExtracted.records.map((r) => ({
        type: "claim_missing_source" as const,
        claimId: r.get("claimId") as string,
      })),
      ...danglingSupportContradicts.records.map((r) => ({
        type: "support_contradicts_dangling" as const,
        relType: r.get("relType") as string,
        sourceId: r.get("sourceId") as string,
        claimId: r.get("claimId") as string,
      })),
      ...danglingConceptRels.records.map((r) => ({
        type: "concept_rel_dangling" as const,
        relType: r.get("relType") as string,
        from: r.get("fromName") as string,
        to: r.get("toName") as string,
      })),
    ];

    return {
      check: "dangling_references",
      severity: details.length > 0 ? "error" : "warning",
      message:
        details.length > 0
          ? `Found ${details.length} dangling reference(s) in the graph`
          : "No dangling references detected",
      details,
      count: details.length,
    };
  } finally {
    await session.close();
  }
}

async function checkLowConfidenceSubgraph(
  getSession: () => import("neo4j-driver").Session,
  sourceId?: string,
): Promise<AuditFinding> {
  const session = getSession();
  try {
    const sourceClause = sourceId ? "AND r.sourceId = $sourceId" : "";
    const relTypeList = CONCEPT_REL_TYPES.map((t) => `'${t}'`).join(",");

    const result = await session.run(
      `MATCH (a:Concept)-[r]->(b:Concept)
       WHERE r.confidence IS NOT NULL AND r.confidence < 0.5
         AND type(r) IN [${relTypeList}]
         ${sourceClause}
       RETURN a.name AS fromName, type(r) AS relType, b.name AS toName,
              r.confidence AS confidence, r.sourceId AS sourceId
       ORDER BY r.confidence ASC
       LIMIT 200`,
      sourceId ? { sourceId } : {},
    );

    const totalResult = await session.run(
      `MATCH (:Concept)-[r]->(:Concept)
       WHERE type(r) IN [${relTypeList}]
         ${sourceClause}
       RETURN count(r) AS total`,
      sourceId ? { sourceId } : {},
    );
    const total = Number(totalResult.records[0]?.get("total") ?? 0);

    const details = result.records.map((r) => ({
      from: r.get("fromName") as string,
      relType: r.get("relType") as string,
      to: r.get("toName") as string,
      confidence: Number(r.get("confidence") ?? 0),
      sourceId: r.get("sourceId") as string,
    }));

    const lowConfRate = total > 0 ? details.length / total : 0;

    return {
      check: "low_confidence_subgraph",
      severity: lowConfRate > 0.3 ? "error" : "warning",
      message:
        details.length > 0
          ? `${details.length} of ${total} concept edges (${(lowConfRate * 100).toFixed(0)}%) have confidence < 0.5`
          : "No low-confidence edges detected",
      details: details.slice(0, 50),
      count: details.length,
    };
  } finally {
    await session.close();
  }
}

async function checkPrismaNeo4jSync(
  getSession: () => import("neo4j-driver").Session,
  prisma: import("@prisma/client").PrismaClient,
  sourceId?: string,
): Promise<AuditFinding> {
  const session = getSession();
  try {
    const neo4jClaimCount = await session.run(
      sourceId
        ? `MATCH (cl:Claim)-[:EXTRACTED_FROM]->(:Source {sourceId: $sourceId}) RETURN count(cl) AS count`
        : `MATCH (cl:Claim) RETURN count(cl) AS count`,
      sourceId ? { sourceId } : {},
    );
    const neo4jSourceCount = await session.run(
      sourceId
        ? `MATCH (s:Source {sourceId: $sourceId}) RETURN count(s) AS count`
        : `MATCH (s:Source) RETURN count(s) AS count`,
      sourceId ? { sourceId } : {},
    );
    const neo4jConceptCount = await session.run(
      sourceId
        ? `MATCH (c:Concept)-[:MENTIONED_IN]->(:Source {sourceId: $sourceId}) RETURN count(DISTINCT c) AS count`
        : `MATCH (c:Concept) RETURN count(c) AS count`,
      sourceId ? { sourceId } : {},
    );

    const prismaClaimCount = await prisma.knowledgeClaim.count({
      where: sourceId ? { sourceId } : {},
    });
    const prismaSourceCount = sourceId
      ? await prisma.knowledgeSource.count({ where: { id: sourceId } })
      : await prisma.knowledgeSource.count();

    const neo4jClaims = Number(neo4jClaimCount.records[0]?.get("count") ?? 0);
    const neo4jSources = Number(
      neo4jSourceCount.records[0]?.get("count") ?? 0,
    );
    const neo4jConcepts = Number(
      neo4jConceptCount.records[0]?.get("count") ?? 0,
    );

    const claimDiff = Math.abs(prismaClaimCount - neo4jClaims);
    const sourceDiff = Math.abs(prismaSourceCount - neo4jSources);
    const driftThreshold = 0.1;

    const claimDriftPct =
      prismaClaimCount > 0 ? claimDiff / prismaClaimCount : 0;
    const sourceDriftPct =
      prismaSourceCount > 0 ? sourceDiff / prismaSourceCount : 0;
    const hasDrift =
      claimDriftPct > driftThreshold || sourceDriftPct > driftThreshold;

    const details = [
      {
        entity: "Claims",
        prisma: prismaClaimCount,
        neo4j: neo4jClaims,
        diff: claimDiff,
      },
      {
        entity: "Sources",
        prisma: prismaSourceCount,
        neo4j: neo4jSources,
        diff: sourceDiff,
      },
      {
        entity: "Concepts",
        prisma: "n/a" as const,
        neo4j: neo4jConcepts,
        diff: null,
      },
    ];

    return {
      check: "prisma_neo4j_sync",
      severity: hasDrift ? "error" : "warning",
      message: hasDrift
        ? `Prisma/Neo4j count drift detected: claims diff=${claimDiff}, sources diff=${sourceDiff}`
        : `Prisma/Neo4j counts are within ${(driftThreshold * 100).toFixed(0)}% threshold`,
      details,
      count: hasDrift ? 1 : 0,
    };
  } finally {
    await session.close();
  }
}

// ── Console printer ────────────────────────────────────────────────────

function printFinding(finding: AuditFinding) {
  const icon = finding.count > 0 ? (finding.severity === "error" ? "✖" : "△") : "✔";
  const color =
    finding.count === 0
      ? "\x1b[32m"
      : finding.severity === "error"
        ? "\x1b[31m"
        : "\x1b[33m";
  const reset = "\x1b[0m";

  console.log(
    `\n  ${color}${icon}${reset} [${finding.check}] ${finding.message}`,
  );

  if (finding.count === 0) return;

  const preview = finding.details.slice(0, 10);
  for (const item of preview) {
    if (typeof item === "object" && item !== null) {
      const entries = Object.entries(item as Record<string, unknown>);
      const parts = entries
        .map(
          ([k, v]) =>
            `${k}=${typeof v === "string" ? v.slice(0, 60) : v}`,
        )
        .join("  ");
      console.log(`    ${parts}`);
    }
  }
  if (finding.details.length > 10) {
    console.log(`    ... and ${finding.details.length - 10} more`);
  }
}

function printReport(report: AuditReport) {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║      Knowledge Graph Audit Report     ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`  Timestamp:  ${report.timestamp}`);
  console.log(`  Duration:   ${report.durationMs}ms`);
  if (report.sourceFilter) {
    console.log(`  Source:     ${report.sourceFilter}`);
  }
  console.log(
    `  Findings:   ${report.summary.totalFindings} total (${report.summary.errors} errors, ${report.summary.warnings} warnings)`,
  );

  const checks = Object.values(report.checks);
  for (const finding of checks) {
    printFinding(finding);
  }

  console.log("\n──────────────────────────────────────");
  if (report.summary.errors > 0) {
    console.log(
      `  \x1b[31m${report.summary.errors} error(s) require attention\x1b[0m`,
    );
  } else {
    console.log("  \x1b[32mNo errors detected\x1b[0m");
  }
  console.log();
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const { getNeo4jSession, closeNeo4jDriver } = await import(
    "../lib/knowledge/graph/neo4jClient"
  );
  const { getPostHogClient } = await import("../lib/posthog-server");

  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf("--source");
  const jsonOutput = args.includes("--json");
  const sourceId = sourceIdx !== -1 ? args[sourceIdx + 1] : undefined;

  if (!jsonOutput) {
    console.log("=== Knowledge Graph Audit ===");
    if (sourceId) console.log(`Scoped to source: ${sourceId}`);
    console.log("Running checks...\n");
  }

  const t0 = Date.now();

  try {
    const [
      nearDuplicateConcepts,
      contradictoryEdges,
      orphanedConcepts,
      unlinkedClaimsNeo4j,
      unlinkedClaimsSyncDrift,
      danglingReferences,
      lowConfidenceSubgraph,
      prismaNeo4jSync,
    ] = await Promise.all([
      checkNearDuplicateConcepts(getNeo4jSession),
      checkContradictoryEdges(getNeo4jSession, sourceId),
      checkOrphanedConcepts(getNeo4jSession, sourceId),
      checkUnlinkedClaimsNeo4j(getNeo4jSession, sourceId),
      checkClaimSyncDrift(getNeo4jSession, prisma, sourceId),
      checkDanglingReferences(getNeo4jSession, sourceId),
      checkLowConfidenceSubgraph(getNeo4jSession, sourceId),
      checkPrismaNeo4jSync(getNeo4jSession, prisma, sourceId),
    ]);

    const checks: AuditReport["checks"] = {
      nearDuplicateConcepts,
      contradictoryEdges,
      orphanedConcepts,
      unlinkedClaimsNeo4j,
      unlinkedClaimsSyncDrift,
      danglingReferences,
      lowConfidenceSubgraph,
      prismaNeo4jSync,
    };

    const allFindings = Object.values(checks);
    const errors = allFindings.filter(
      (f) => f.severity === "error" && f.count > 0,
    ).length;
    const warnings = allFindings.filter(
      (f) => f.severity === "warning" && f.count > 0,
    ).length;

    const report: AuditReport = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - t0,
      sourceFilter: sourceId ?? null,
      summary: { totalFindings: errors + warnings, errors, warnings },
      checks,
    };

    if (jsonOutput) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }

    try {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: "knowledge-pipeline",
        event: "knowledge_graph_audit",
        properties: {
          sourceFilter: sourceId ?? null,
          durationMs: report.durationMs,
          duplicateCount: nearDuplicateConcepts.count,
          contradictionCount: contradictoryEdges.count,
          orphanCount: orphanedConcepts.count,
          orphanRate:
            orphanedConcepts.message.match(/\((\d+)%\)/)?.[1] ?? "0",
          unlinkedClaimCount: unlinkedClaimsNeo4j.count,
          syncDriftCount: unlinkedClaimsSyncDrift.count,
          danglingRefCount: danglingReferences.count,
          lowConfidenceEdgeCount: lowConfidenceSubgraph.count,
          prismaNeo4jSyncDrift: prismaNeo4jSync.count > 0,
          totalErrors: errors,
          totalWarnings: warnings,
        },
      });
      await posthog.shutdown();
    } catch {
      // PostHog failures are non-fatal
    }
  } finally {
    await closeNeo4jDriver();
  }
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
