import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { syncWhoopData } from "@/lib/providers/whoop/sync-service";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connection = await prisma.providerConnection.findUnique({
    where: { userId_provider: { userId, provider: "whoop" } },
  });

  if (!connection || connection.status === "REVOKED") {
    return NextResponse.json(
      { error: "No active Whoop connection" },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const fullBackfill = body.fullBackfill === true;

  try {
    const result = await syncWhoopData(connection.id, { fullBackfill });
    return NextResponse.json({
      success: true,
      pagesProcessed: result.pagesProcessed,
    });
  } catch (err) {
    console.error("Whoop sync error:", err);
    return NextResponse.json(
      { error: "Sync failed", message: String(err) },
      { status: 500 },
    );
  }
}
