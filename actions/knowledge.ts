"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAdminUserId } from "@/lib/auth/admin";
import { runIngestionPipeline } from "@/lib/knowledge/pipeline";
import { fetchChannelVideos, extractChannelId, resolveChannelHandle } from "@/lib/knowledge/sources/youtubeService";
import { filterVideosByRelevance } from "@/lib/knowledge/sources/topicFilter";
import type { KnowledgeSourceType } from "@prisma/client";

function requireIngestionEnabled() {
  if (process.env.ENABLE_INGESTION !== "true") {
    throw new Error("Ingestion is disabled in this environment.");
  }
}

export async function addChannel(
  name: string,
  url: string,
  topicDomains: string[],
) {
  await requireAdminUserId();
  requireIngestionEnabled();

  let channelId = extractChannelId(url);

  if (channelId.startsWith("@")) {
    channelId = await resolveChannelHandle(channelId);
  }

  return prisma.knowledgeChannel.create({
    data: { channelId, name, url, topicDomains, active: true },
  });
}

export async function scanChannelForVideos(
  channelDbId: string,
  fullRescan: boolean = false,
) {
  await requireAdminUserId();
  requireIngestionEnabled();

  const channel = await prisma.knowledgeChannel.findUniqueOrThrow({
    where: { id: channelDbId },
  });

  const publishedAfter =
    fullRescan ? undefined : channel.lastScannedAt?.toISOString();
  const allVideos = await fetchChannelVideos(channel.channelId, {
    maxResults: fullRescan ? 500 : 200,
    publishedAfter,
  });

  const videos = allVideos.filter((v) => v.hasCaptions !== false);
  const skippedNoCaptions = allVideos.length - videos.length;

  const { relevant, borderline, irrelevant, failed } = await filterVideosByRelevance(
    videos,
    channel.topicDomains,
    channel.relevanceThreshold,
  );

  const created: string[] = [];
  for (const video of relevant) {
    const existing = await prisma.knowledgeSource.findUnique({
      where: { sourceType_externalId: { sourceType: "PODCAST", externalId: video.videoId } },
    });
    if (!existing) {
      const source = await prisma.knowledgeSource.create({
        data: {
          sourceType: "PODCAST",
          title: video.title,
          externalId: video.videoId,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          channelId: channelDbId,
          status: "PENDING",
          relevanceScore: video.relevanceScore,
          authors: [],
          metadata: { relevantTopics: video.relevantTopics },
        },
      });
      created.push(source.id);
    }
  }

  await prisma.knowledgeChannel.update({
    where: { id: channelDbId },
    data: { lastScannedAt: new Date() },
  });

  return {
    totalVideos: allVideos.length,
    skippedNoCaptions,
    relevant: relevant.length,
    borderline: borderline.length,
    irrelevant: irrelevant.length,
    failed: failed.length,
    created: created.length,
  };
}

export async function addSourceManually(input: {
  sourceType: KnowledgeSourceType;
  title: string;
  externalId?: string;
  url?: string;
  authors?: string[];
}) {
  await requireAdminUserId();
  requireIngestionEnabled();

  if (input.externalId) {
    return prisma.knowledgeSource.upsert({
      where: {
        sourceType_externalId: {
          sourceType: input.sourceType,
          externalId: input.externalId,
        },
      },
      update: {
        title: input.title,
        url: input.url,
        authors: input.authors ?? [],
        status: "PENDING",
        metadata: {},
      },
      create: {
        sourceType: input.sourceType,
        title: input.title,
        externalId: input.externalId,
        url: input.url,
        authors: input.authors ?? [],
        status: "PENDING",
      },
    });
  }

  return prisma.knowledgeSource.create({
    data: {
      sourceType: input.sourceType,
      title: input.title,
      externalId: input.externalId,
      url: input.url,
      authors: input.authors ?? [],
      status: "PENDING",
    },
  });
}

export async function updateSource(
  sourceId: string,
  data: {
    title?: string;
    externalId?: string;
    url?: string;
    sourceType?: KnowledgeSourceType;
    status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  },
) {
  await requireAdminUserId();
  requireIngestionEnabled();

  return prisma.knowledgeSource.update({
    where: { id: sourceId },
    data,
  });
}

export async function deleteSource(sourceId: string) {
  await requireAdminUserId();
  requireIngestionEnabled();

  const { deleteChunksBySourceId } = await import("@/lib/knowledge/vectorStore");
  await deleteChunksBySourceId(sourceId);

  try {
    const { clearSourceFromGraph } = await import("@/lib/knowledge/graph/neo4jWriter");
    await clearSourceFromGraph(sourceId);
  } catch (err) {
    console.warn(`Failed to clear graph for source ${sourceId}: ${err}`);
  }

  return prisma.knowledgeSource.delete({
    where: { id: sourceId },
  });
}

export async function ingestSource(sourceId: string, useBatchApi?: boolean) {
  await requireAdminUserId();
  requireIngestionEnabled();

  const source = await prisma.knowledgeSource.findUniqueOrThrow({
    where: { id: sourceId },
    select: { sourceType: true },
  });

  await runIngestionPipeline({
    sourceType: source.sourceType,
    sourceId,
    useBatchApi,
  });
}

export async function ingestPendingSources(channelDbId?: string) {
  await requireAdminUserId();
  requireIngestionEnabled();

  const MAX_BATCH = 5;
  const MAX_DURATION_MS = 4 * 60 * 1000;

  const where: Record<string, unknown> = { status: "PENDING" };
  if (channelDbId) where.channelId = channelDbId;

  const sources = await prisma.knowledgeSource.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: MAX_BATCH,
  });

  if (sources.length === 0) return [];

  await prisma.knowledgeSource.updateMany({
    where: { id: { in: sources.map((s) => s.id) } },
    data: { status: "PROCESSING" },
  });

  const startTime = Date.now();
  const results: { id: string; status: string }[] = [];

  for (const source of sources) {
    if (Date.now() - startTime > MAX_DURATION_MS) {
      await prisma.knowledgeSource.update({
        where: { id: source.id },
        data: { status: "PENDING" },
      });
      results.push({ id: source.id, status: "skipped: time budget exceeded" });
      continue;
    }

    try {
      await runIngestionPipeline({ sourceType: source.sourceType, sourceId: source.id });
      const updated = await prisma.knowledgeSource.findUnique({
        where: { id: source.id },
        select: { status: true },
      });
      results.push({ id: source.id, status: updated?.status?.toLowerCase() ?? "unknown" });
    } catch (error) {
      await prisma.knowledgeSource.update({
        where: { id: source.id },
        data: { status: "FAILED" },
      }).catch(() => {});
      results.push({ id: source.id, status: `failed: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  return results;
}

export async function getChannels() {
  await requireAdminUserId();
  return prisma.knowledgeChannel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { sources: true } } },
  });
}

export async function getSources(options?: {
  status?: string;
  sourceType?: string;
  channelId?: string;
  limit?: number;
}) {
  await requireAdminUserId();

  const where: Record<string, unknown> = {};
  if (options?.status) where.status = options.status;
  if (options?.sourceType) where.sourceType = options.sourceType;
  if (options?.channelId) where.channelId = options.channelId;

  return prisma.knowledgeSource.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
    include: {
      channel: { select: { name: true } },
      _count: { select: { ingestionRuns: true, claims: true } },
    },
  });
}

export async function getIngestionRuns(sourceId: string) {
  await requireAdminUserId();
  return prisma.knowledgeIngestionRun.findMany({
    where: { sourceId },
    orderBy: { startedAt: "desc" },
  });
}

export async function getSourceDetail(sourceId: string) {
  await requireAdminUserId();

  const source = await prisma.knowledgeSource.findUniqueOrThrow({
    where: { id: sourceId },
    include: {
      channel: { select: { name: true } },
      _count: { select: { ingestionRuns: true, claims: true } },
    },
  });

  const runs = await prisma.knowledgeIngestionRun.findMany({
    where: { sourceId },
    orderBy: { startedAt: "desc" },
  });

  const claims = await prisma.knowledgeClaim.findMany({
    where: { sourceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      claimText: true,
      confidence: true,
      verificationStatus: true,
      supportingPaperIds: true,
      metadata: true,
    },
  });

  return { source, runs, claims };
}

export async function getClaims(options?: {
  verificationStatus?: string;
  sourceId?: string;
  limit?: number;
}) {
  await requireAdminUserId();

  const where: Record<string, unknown> = {};
  if (options?.verificationStatus) where.verificationStatus = options.verificationStatus;
  if (options?.sourceId) where.sourceId = options.sourceId;

  return prisma.knowledgeClaim.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
    include: { source: { select: { title: true, sourceType: true } } },
  });
}
