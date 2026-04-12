import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { extractChannelId } from "@/lib/knowledge/sources/youtubeService";
import { requireAdminApi } from "../_auth";

export async function GET() {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;

  const channels = await prisma.knowledgeChannel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { sources: true } } },
  });

  return NextResponse.json(channels);
}

export async function POST(request: Request) {
  if (process.env.ENABLE_INGESTION !== "true") {
    return NextResponse.json({ error: "Ingestion disabled" }, { status: 403 });
  }

  const adminCheckPost = await requireAdminApi();
  if (adminCheckPost) return adminCheckPost;

  const body = await request.json();
  const { name, url, topicDomains } = body;

  if (!name || !url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 });
  }

  const channelId = extractChannelId(url);

  const channel = await prisma.knowledgeChannel.create({
    data: {
      channelId,
      name,
      url,
      topicDomains: topicDomains ?? [],
      active: true,
    },
  });

  return NextResponse.json(channel, { status: 201 });
}
