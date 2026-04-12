import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminApi } from "../_auth";

export async function GET(request: Request) {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const sourceType = searchParams.get("sourceType");
  const channelId = searchParams.get("channelId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (sourceType) where.sourceType = sourceType;
  if (channelId) where.channelId = channelId;

  const sources = await prisma.knowledgeSource.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      channel: { select: { name: true } },
      _count: { select: { ingestionRuns: true, claims: true } },
    },
  });

  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  if (process.env.ENABLE_INGESTION !== "true") {
    return NextResponse.json({ error: "Ingestion disabled" }, { status: 403 });
  }

  const adminCheckPost = await requireAdminApi();
  if (adminCheckPost) return adminCheckPost;

  const body = await request.json();
  const { sourceType, title, externalId, url, authors } = body;

  const source = await prisma.knowledgeSource.create({
    data: {
      sourceType,
      title,
      externalId,
      url,
      authors: authors ?? [],
      status: "PENDING",
    },
  });

  return NextResponse.json(source, { status: 201 });
}
