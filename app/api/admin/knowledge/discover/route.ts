import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { fetchChannelVideos } from "@/lib/knowledge/sources/youtubeService";
import { filterVideosByRelevance } from "@/lib/knowledge/sources/topicFilter";

export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerSecret = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  return headerSecret === secret || authHeader === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channels = await prisma.knowledgeChannel.findMany({
    where: { active: true },
  });

  const results: Record<string, { scanned: number; queued: number }> = {};

  for (const channel of channels) {
    try {
      const publishedAfter = channel.lastScannedAt?.toISOString();
      const videos = await fetchChannelVideos(channel.channelId, {
        maxResults: 50,
        publishedAfter,
      });

      const { relevant } = await filterVideosByRelevance(
        videos,
        channel.topicDomains,
        channel.relevanceThreshold,
      );

      let queued = 0;
      for (const video of relevant) {
        const existing = await prisma.knowledgeSource.findUnique({
          where: {
            sourceType_externalId: { sourceType: "PODCAST", externalId: video.videoId },
          },
        });
        if (!existing) {
          await prisma.knowledgeSource.create({
            data: {
              sourceType: "PODCAST",
              title: video.title,
              externalId: video.videoId,
              url: `https://www.youtube.com/watch?v=${video.videoId}`,
              channelId: channel.id,
              status: "PENDING",
              relevanceScore: video.relevanceScore,
              authors: [],
              metadata: { relevantTopics: video.relevantTopics },
            },
          });
          queued++;
        }
      }

      await prisma.knowledgeChannel.update({
        where: { id: channel.id },
        data: { lastScannedAt: new Date() },
      });

      results[channel.name] = { scanned: videos.length, queued };
    } catch (error) {
      results[channel.name] = { scanned: 0, queued: 0 };
    }
  }

  return NextResponse.json({ success: true, results });
}
