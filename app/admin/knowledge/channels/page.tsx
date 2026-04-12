import { connection } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ChannelManager } from "./ChannelManager";

export default async function ChannelsPage() {
  await connection();
  const channels = await prisma.knowledgeChannel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { sources: true } } },
  });

  const isIngestionEnabled = process.env.ENABLE_INGESTION === "true";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">
          YouTube Channels
        </h1>
        <p className="text-sm text-neutral-400">
          Manage watched channels for podcast transcript ingestion.
        </p>
      </div>

      <ChannelManager
        initialChannels={channels}
        isIngestionEnabled={isIngestionEnabled}
      />
    </div>
  );
}
