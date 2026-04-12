import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SourceManager } from "./SourceManager";

export default async function SourcesPage(props: {
  searchParams: Promise<{ status?: string; sourceType?: string; channelId?: string }>;
}) {
  await connection();
  const searchParams = await props.searchParams;

  const where: Record<string, unknown> = {};
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.sourceType) where.sourceType = searchParams.sourceType;
  if (searchParams.channelId) where.channelId = searchParams.channelId;

  const sources = await prisma.knowledgeSource.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      channel: { select: { name: true } },
      _count: { select: { ingestionRuns: true, claims: true } },
    },
  });

  const isIngestionEnabled = process.env.ENABLE_INGESTION === "true";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Sources</h1>
        <p className="text-sm text-neutral-400">
          Podcast episodes, scientific papers, and manual uploads.
        </p>
      </div>

      <SourceManager
        initialSources={sources}
        isIngestionEnabled={isIngestionEnabled}
      />
    </div>
  );
}
