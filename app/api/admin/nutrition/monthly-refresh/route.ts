import { NextResponse } from "next/server";
import { runMonthlyRetailRefresh } from "@/lib/nutrition/server/monthlyQueueService";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerSecret = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  if (headerSecret && headerSecret === secret) return true;
  if (authHeader && authHeader === `Bearer ${secret}`) return true;
  return false;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(100, limitParam)) : 25;

  try {
    const result = await runMonthlyRetailRefresh({ limit });
    return NextResponse.json({
      ok: true,
      queueCount: result.queue.length,
      runCount: result.runs.length,
      runs: result.runs.map((run) => ({
        runId: run.runId,
        chainId: run.chainId,
        chainName: run.chainName,
        status: run.status,
        stagingItemCount: run.stagingItemCount,
        errorMessage: run.errorMessage,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Monthly refresh failed",
      },
      { status: 500 },
    );
  }
}
