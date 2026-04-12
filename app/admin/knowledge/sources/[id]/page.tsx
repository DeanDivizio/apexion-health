import { connection } from "next/server";
import { getSourceDetail } from "@/actions/knowledge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RunHistory } from "./RunHistory";
import { ClaimEvidence } from "../../claims/ClaimEvidence";

export default async function SourceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await props.params;
  const { source, runs, claims } = await getSourceDetail(id);

  const verifyRun = runs.find((r) => r.step === "VERIFY_CLAIMS");
  const verifyStats = (verifyRun?.stats ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/knowledge/sources"
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">
            {source.title}
          </h1>
          <p className="text-sm text-neutral-400">
            {source.sourceType} · {source.channel?.name ?? "Manual"} ·{" "}
            {source.createdAt.toLocaleDateString()}
          </p>
        </div>
        <span
          className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            source.status === "COMPLETED"
              ? "bg-emerald-950 text-emerald-400"
              : source.status === "FAILED"
                ? "bg-red-950 text-red-400"
                : source.status === "PROCESSING"
                  ? "bg-blue-950 text-blue-400"
                  : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {source.status}
        </span>
      </div>

      {typeof verifyStats.estimatedCostUsd === "number" && (
        <CostSummary stats={verifyStats} claimCount={claims.length} />
      )}

      {typeof verifyStats.verdictDistribution === "object" &&
        verifyStats.verdictDistribution !== null && (
          <QualityMetrics stats={verifyStats} claimCount={claims.length} />
        )}

      <RunHistory runs={runs} />

      <div>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">
          Claims ({claims.length})
        </h2>
        <div className="space-y-1">
          {claims.map((claim) => {
            const meta = claim.metadata as Record<string, unknown> | null;
            const evidence = (meta?.evidence ?? []) as Array<{
              title: string;
              doi?: string;
              pmid?: string;
              verdict: "SUPPORTS" | "CONTRADICTS";
              confidence: number;
              passages: { text: string; section: string }[];
              fetchTier: string;
            }>;

            return (
              <div
                key={claim.id}
                className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
              >
                <p className="text-sm text-neutral-200">{claim.claimText}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                  {claim.confidence != null && (
                    <span>
                      Confidence: {(claim.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      claim.verificationStatus === "SUPPORTED"
                        ? "bg-emerald-950 text-emerald-400"
                        : claim.verificationStatus === "REFUTED"
                          ? "bg-red-950 text-red-400"
                          : claim.verificationStatus === "CONTESTED"
                            ? "bg-yellow-950 text-yellow-400"
                            : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {claim.verificationStatus}
                  </span>
                </div>
                <ClaimEvidence
                  evidence={evidence}
                  paperCount={claim.supportingPaperIds.length}
                />
              </div>
            );
          })}
          {claims.length === 0 && (
            <p className="py-8 text-center text-sm text-neutral-500">
              No claims extracted yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CostSummary({
  stats,
  claimCount,
}: {
  stats: Record<string, unknown>;
  claimCount: number;
}) {
  const cost = stats.estimatedCostUsd as number;
  const inputTokens = (stats.totalInputTokens as number) ?? 0;
  const outputTokens = (stats.totalOutputTokens as number) ?? 0;
  const callCount = (stats.llmCallCount as number) ?? 0;
  const costPerClaim = claimCount > 0 ? cost / claimCount : 0;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <h2 className="mb-3 text-sm font-medium text-neutral-300">
        Verification Cost
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Cost" value={`$${cost.toFixed(4)}`} />
        <Metric
          label="Per Claim"
          value={`$${costPerClaim.toFixed(4)}`}
        />
        <Metric
          label="Input Tokens"
          value={inputTokens.toLocaleString()}
        />
        <Metric
          label="Output Tokens"
          value={outputTokens.toLocaleString()}
        />
        <Metric label="LLM Calls" value={callCount.toLocaleString()} />
        <Metric label="Claims Verified" value={String(claimCount)} />
      </div>
    </div>
  );
}

function QualityMetrics({
  stats,
  claimCount,
}: {
  stats: Record<string, unknown>;
  claimCount: number;
}) {
  const verdicts = stats.verdictDistribution as Record<string, number>;
  const fetchTiers = (stats.fetchTierDistribution as Record<string, number>) ?? {};
  const avgEvidence = stats.avgEvidenceDepth as number;
  const fullTextRate = stats.fullTextRate as number;
  const searchHitRate = stats.searchHitRate as number;
  const avgConfidence = stats.avgConfidence as number;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4">
      <h2 className="mb-3 text-sm font-medium text-neutral-300">
        Verification Quality
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Search Hit Rate"
          value={`${(searchHitRate * 100).toFixed(0)}%`}
        />
        <Metric
          label="Avg Evidence Depth"
          value={avgEvidence.toFixed(1)}
          sublabel="papers/claim"
        />
        <Metric
          label="Full-Text Rate"
          value={`${(fullTextRate * 100).toFixed(0)}%`}
        />
        <Metric
          label="Avg Confidence"
          value={`${(avgConfidence * 100).toFixed(0)}%`}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <p className="mb-1.5 text-xs text-neutral-500">Verdict Distribution</p>
          <div className="flex gap-2">
            {Object.entries(verdicts).map(([verdict, count]) => (
              <VerdictBadge
                key={verdict}
                verdict={verdict}
                count={count}
                total={claimCount}
              />
            ))}
          </div>
        </div>

        {Object.keys(fetchTiers).length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-neutral-500">
              Fetch Tier Distribution
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(fetchTiers)
                .sort(([, a], [, b]) => b - a)
                .map(([tier, count]) => (
                  <span
                    key={tier}
                    className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400"
                  >
                    {tier}: {count}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-lg font-semibold text-neutral-100">
        {value}
        {sublabel && (
          <span className="ml-1 text-xs font-normal text-neutral-500">
            {sublabel}
          </span>
        )}
      </p>
    </div>
  );
}

function VerdictBadge({
  verdict,
  count,
  total,
}: {
  verdict: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";
  const colorClass =
    verdict === "SUPPORTED"
      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
      : verdict === "REFUTED"
        ? "bg-red-950 text-red-400 border-red-800"
        : verdict === "CONTESTED"
          ? "bg-yellow-950 text-yellow-400 border-yellow-800"
          : "bg-neutral-800 text-neutral-400 border-neutral-700";

  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {verdict}: {count} ({pct}%)
    </span>
  );
}
