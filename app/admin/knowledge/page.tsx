import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { BookOpen, FileText, FlaskConical, BrainCircuit } from "lucide-react";

export default async function KnowledgeDashboard() {
  await connection();
  const [channelCount, sourceCount, claimCount, pendingCount] =
    await Promise.all([
      prisma.knowledgeChannel.count(),
      prisma.knowledgeSource.count(),
      prisma.knowledgeClaim.count(),
      prisma.knowledgeSource.count({ where: { status: "PENDING" } }),
    ]);

  const recentSources = await prisma.knowledgeSource.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { channel: { select: { name: true } } },
  });

  const isIngestionEnabled = process.env.ENABLE_INGESTION === "true";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">
          Knowledge Base
        </h1>
        <p className="text-sm text-neutral-400">
          Manage podcast transcripts, scientific papers, and the knowledge
          graph.
        </p>
        {!isIngestionEnabled && (
          <p className="mt-2 rounded-lg border border-yellow-800/50 bg-yellow-950/30 px-3 py-2 text-xs text-yellow-400">
            Ingestion is disabled in this environment. Run locally with
            ENABLE_INGESTION=true to ingest content.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={BookOpen} label="Channels" value={channelCount} href="/admin/knowledge/channels" />
        <StatCard icon={FileText} label="Sources" value={sourceCount} href="/admin/knowledge/sources" />
        <StatCard icon={FlaskConical} label="Claims" value={claimCount} href="/admin/knowledge/claims" />
        <StatCard icon={BrainCircuit} label="Pending" value={pendingCount} href="/admin/knowledge/sources?status=PENDING" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-neutral-300">
          Recent Sources
        </h2>
        <div className="space-y-1">
          {recentSources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-neutral-200">
                  {source.title}
                </p>
                <p className="text-xs text-neutral-500">
                  {source.sourceType} · {source.channel?.name ?? "Manual"} ·{" "}
                  {source.createdAt.toLocaleDateString()}
                </p>
              </div>
              <span
                className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
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
          ))}
          {recentSources.length === 0 && (
            <p className="py-8 text-center text-sm text-neutral-500">
              No sources yet. Add a channel or source to get started.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin/knowledge/channels"
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-neutral-700"
        >
          Manage Channels
        </Link>
        <Link
          href="/admin/knowledge/sources"
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 transition-colors hover:bg-neutral-700"
        >
          View Sources
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-neutral-500" />
        <span className="text-xs text-neutral-400">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold text-neutral-100">{value}</p>
    </Link>
  );
}
