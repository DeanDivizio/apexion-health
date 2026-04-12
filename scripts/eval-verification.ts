import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../.env") });

interface ClaimSnapshot {
  claimId: string;
  claimText: string;
  verdict: string;
  confidence: number;
  evidenceDois: string[];
}

interface DiffResult {
  claimId: string;
  claimText: string;
  beforeVerdict: string;
  afterVerdict: string;
  beforeConfidence: number;
  afterConfidence: number;
  evidenceChanged: boolean;
}

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const { verifyClaims } = await import(
    "../lib/knowledge/verification/claimVerifier"
  );
  const { verifyClaimsBatch } = await import(
    "../lib/knowledge/verification/batchClaimVerifier"
  );
  const { getPostHogClient } = await import("../lib/posthog-server");

  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf("--source");
  const limitIdx = args.indexOf("--limit");
  const useBatch = args.includes("--batch");
  const apply = args.includes("--apply");

  if (sourceIdx === -1) {
    console.error(
      "Usage: npx tsx scripts/eval-verification.ts --source <sourceId> [--batch] [--limit N] [--apply]",
    );
    process.exit(1);
  }

  const sourceId = args[sourceIdx + 1];
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;

  console.log("=== Verification Eval ===");
  console.log(`Source: ${sourceId}`);
  console.log(`Mode: ${useBatch ? "batch" : "sync"}`);
  if (limit) console.log(`Limit: ${limit}`);
  if (apply) console.log("*** --apply: will persist results ***");
  console.log();

  // 1. Load previously-verified claims
  const claims = await prisma.knowledgeClaim.findMany({
    where: {
      sourceId,
      verificationStatus: { not: "UNVERIFIED" },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  if (claims.length === 0) {
    console.log("No previously-verified claims found for this source.");
    return;
  }

  console.log(`Found ${claims.length} previously-verified claims\n`);

  // 2. Snapshot "before" state
  const beforeSnapshots: ClaimSnapshot[] = claims.map((c) => {
    const meta = c.metadata as Record<string, unknown> | null;
    const evidenceArr =
      (meta?.evidence as Array<{ doi?: string; pmid?: string }>) ?? [];
    const evidenceDois = evidenceArr
      .map((e) => e.doi ?? e.pmid)
      .filter(Boolean) as string[];

    let aggregatedConfidence = 0;
    if (evidenceArr.length > 0) {
      const confArr = evidenceArr
        .map((e) => (e as Record<string, unknown>).confidence as number)
        .filter((c) => typeof c === "number");
      aggregatedConfidence =
        confArr.length > 0
          ? confArr.reduce((s, v) => s + v, 0) / confArr.length
          : 0;
    }

    return {
      claimId: c.id,
      claimText: c.claimText,
      verdict: c.verificationStatus,
      confidence: aggregatedConfidence,
      evidenceDois,
    };
  });

  // 3. Re-run verification (in memory, no DB mutations)
  const verifiableClaims = claims.map((c) => ({
    claimId: c.id,
    claimText: c.claimText,
    confidence: c.confidence,
    entities:
      ((c.metadata as Record<string, unknown>)?.entities as string[]) ?? [],
    sourceId: c.sourceId,
  }));

  console.log("Re-verifying claims...\n");
  const t0 = Date.now();

  const { results, metrics } = useBatch
    ? await verifyClaimsBatch(verifiableClaims, { maxPollMs: 3_600_000 })
    : await verifyClaims(verifiableClaims);

  const durationSec = ((Date.now() - t0) / 1000).toFixed(1);

  // 4. Snapshot "after" state
  const afterSnapshots: ClaimSnapshot[] = results.map((r) => ({
    claimId: r.claimId,
    claimText:
      claims.find((c) => c.id === r.claimId)?.claimText ?? "",
    verdict: r.verificationStatus,
    confidence: r.overallConfidence,
    evidenceDois: r.evidence
      .map((e) => e.doi ?? e.pmid)
      .filter(Boolean) as string[],
  }));

  // 5. Diff
  const diffs: DiffResult[] = [];
  let verdictFlips = 0;
  let confidenceDeltaSum = 0;
  let evidenceChanges = 0;

  for (let i = 0; i < beforeSnapshots.length; i++) {
    const before = beforeSnapshots[i];
    const after = afterSnapshots.find((a) => a.claimId === before.claimId);
    if (!after) continue;

    const verdictChanged = before.verdict !== after.verdict;
    const confidenceDelta = Math.abs(before.confidence - after.confidence);
    const beforeDois = new Set(before.evidenceDois);
    const afterDois = new Set(after.evidenceDois);
    const evidenceChanged =
      beforeDois.size !== afterDois.size ||
      [...beforeDois].some((d) => !afterDois.has(d));

    if (verdictChanged) verdictFlips++;
    confidenceDeltaSum += confidenceDelta;
    if (evidenceChanged) evidenceChanges++;

    if (verdictChanged || evidenceChanged) {
      diffs.push({
        claimId: before.claimId,
        claimText: before.claimText,
        beforeVerdict: before.verdict,
        afterVerdict: after.verdict,
        beforeConfidence: before.confidence,
        afterConfidence: after.confidence,
        evidenceChanged,
      });
    }
  }

  const totalClaims = beforeSnapshots.length;
  const agreementRate =
    totalClaims > 0 ? (totalClaims - verdictFlips) / totalClaims : 1;
  const avgConfidenceDelta =
    totalClaims > 0 ? confidenceDeltaSum / totalClaims : 0;

  // 6. Print report
  console.log("\n=== Eval Results ===");
  console.log(`Claims evaluated: ${totalClaims}`);
  console.log(`Agreement rate: ${(agreementRate * 100).toFixed(1)}%`);
  console.log(`Verdict flips: ${verdictFlips}`);
  console.log(`Avg confidence delta: ${avgConfidenceDelta.toFixed(3)}`);
  console.log(`Evidence paper changes: ${evidenceChanges}`);
  console.log(`Duration: ${durationSec}s`);
  console.log();

  if (diffs.length > 0) {
    console.log("=== Changes ===");
    for (const d of diffs) {
      const flipStr =
        d.beforeVerdict !== d.afterVerdict
          ? `${d.beforeVerdict} → ${d.afterVerdict}`
          : d.beforeVerdict;
      const confStr = `conf: ${d.beforeConfidence.toFixed(2)} → ${d.afterConfidence.toFixed(2)}`;
      const evStr = d.evidenceChanged ? " [evidence changed]" : "";
      console.log(
        `  ${d.claimId.slice(0, 8)} | ${flipStr} | ${confStr}${evStr}`,
      );
      console.log(`    "${d.claimText.slice(0, 100)}..."`);
    }
    console.log();
  }

  console.log("=== Cost ===");
  console.log(
    `Tokens: ${metrics.totalInputTokens} in / ${metrics.totalOutputTokens} out`,
  );
  console.log(`Estimated cost: $${metrics.estimatedCostUsd.toFixed(4)}`);
  console.log(`Mode: ${useBatch ? "batch" : "sync"}`);

  // 7. Emit PostHog event
  try {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: "knowledge-pipeline",
      event: "knowledge_eval_completed",
      properties: {
        sourceId,
        mode: useBatch ? "batch" : "sync",
        claimCount: totalClaims,
        agreementRate,
        verdictFlips,
        avgConfidenceDelta,
        evidenceChanges,
        durationSec: parseFloat(durationSec),
        estimatedCostUsd: metrics.estimatedCostUsd,
      },
    });
    await posthog.shutdown();
  } catch {
    // PostHog failures are non-fatal
  }

  // 8. Optionally apply results
  if (apply) {
    console.log("\n=== Applying results ===");
    for (const result of results) {
      const paperIds = result.evidence
        .map((e) => e.doi ?? e.pmid)
        .filter(Boolean) as string[];

      const existingClaim = await prisma.knowledgeClaim.findUnique({
        where: { id: result.claimId },
        select: { metadata: true },
      });
      const existingMeta = existingClaim?.metadata ?? {};

      await prisma.knowledgeClaim.update({
        where: { id: result.claimId },
        data: {
          verificationStatus: result.verificationStatus,
          supportingPaperIds: paperIds,
          metadata: {
            ...((existingMeta as Record<string, unknown>) ?? {}),
            evidence: result.evidence.map((e) => ({
              title: e.title,
              doi: e.doi ?? null,
              pmid: e.pmid ?? null,
              verdict: e.verdict,
              confidence: e.confidence,
              passages: e.passages.map((p) => ({
                text: p.text,
                section: p.section,
              })),
              fetchTier: e.fetchTier,
            })),
          },
        },
      });
    }
    console.log(`Applied ${results.length} results to database.`);
  }
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
