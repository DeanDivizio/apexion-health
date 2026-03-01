import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import {
  syncWhoopData,
  purgeAllBiometricData,
} from "@/lib/providers/whoop/sync-service";

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

  // Connections in ERROR state can still be recovered — getValidToken will
  // attempt a refresh which may succeed (e.g. after a concurrent-refresh race).
  // No need to block syncs for ERROR connections.

  const body = await request.json().catch(() => ({}));
  const fullBackfill = body.fullBackfill === true;
  const purge = body.purge === true;

  try {
    if (purge) {
      await purgeAllBiometricData(connection.id);
    }

    const result = await syncWhoopData(connection.id, {
      fullBackfill: fullBackfill || purge,
      maxPagesPerType: fullBackfill || purge ? 10 : 2,
    });
    return NextResponse.json({
      success: true,
      pagesProcessed: result.pagesProcessed,
      complete: result.complete,
    });
  } catch (err) {
    console.error("Whoop sync error:", err);
    return NextResponse.json(
      { error: "Sync failed", message: String(err) },
      { status: 500 },
    );
  }
}
