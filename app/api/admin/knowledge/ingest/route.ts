import { NextResponse } from "next/server";
import { runIngestionPipeline } from "@/lib/knowledge/pipeline";
import { requireAdminApi } from "../_auth";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (process.env.ENABLE_INGESTION !== "true") {
    return NextResponse.json({ error: "Ingestion disabled" }, { status: 403 });
  }

  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;

  const body = await request.json();
  const { sourceId, sourceType, steps, useBatchApi } = body;

  if (!sourceId) {
    return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
  }

  try {
    await runIngestionPipeline({
      sourceType: sourceType ?? "PODCAST",
      sourceId,
      steps,
      useBatchApi,
    });

    return NextResponse.json({ success: true, sourceId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
