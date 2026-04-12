import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ClaimEvidence } from "./ClaimEvidence";

export default async function ClaimsPage() {
  await connection();
  const claims = await prisma.knowledgeClaim.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      claimText: true,
      confidence: true,
      verificationStatus: true,
      supportingPaperIds: true,
      metadata: true,
      createdAt: true,
      source: { select: { title: true, sourceType: true } },
    },
  });

  const statusCounts = await prisma.knowledgeClaim.groupBy({
    by: ["verificationStatus"],
    _count: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Claims</h1>
        <p className="text-sm text-neutral-400">
          Extracted factual claims and their verification status.
        </p>
      </div>

      <div className="flex gap-3">
        {statusCounts.map((s) => (
          <div
            key={s.verificationStatus}
            className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2"
          >
            <p className="text-xs text-neutral-400">
              {s.verificationStatus}
            </p>
            <p className="text-lg font-semibold text-neutral-100">
              {s._count}
            </p>
          </div>
        ))}
      </div>

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
                <span>{claim.source.title}</span>
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
                {claim.supportingPaperIds.length > 0 && (
                  <span className="text-neutral-600">
                    {claim.supportingPaperIds.length}{" "}
                    {claim.supportingPaperIds.length === 1
                      ? "paper"
                      : "papers"}
                  </span>
                )}
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
            No claims extracted yet. Ingest sources to generate claims.
          </p>
        )}
      </div>
    </div>
  );
}
