import { after, NextRequest, NextResponse } from "next/server";
import { requireAdminUserId } from "@/lib/auth/admin";
import {
  createIngestionRun,
  getIngestionRunSummary,
  runChainIngestion,
  setIngestionRunStatus,
} from "@/lib/nutrition/server/ingestionRunService";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  let adminUserId: string;
  try {
    adminUserId = await requireAdminUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const chainId = typeof body.chainId === "string" ? body.chainId : "";
  if (!chainId) {
    return NextResponse.json(
      { error: "chainId is required" },
      { status: 400 },
    );
  }

  const runId = await createIngestionRun({
    chainId,
    triggeredByUserId: adminUserId,
    sourceSnapshot: null,
    sourceId: null,
  });

  after(async () => {
    try {
      await runChainIngestion(chainId, adminUserId, { runId });
    } catch (error) {
      console.error("Background retail ingestion failed:", error);
      await setIngestionRunStatus(runId, "fetch_failed", {
        errorMessage:
          error instanceof Error
            ? error.message
            : "Unexpected ingestion failure.",
        finishedAt: new Date(),
      }).catch(() => {});
    }
  });

  const summary = await getIngestionRunSummary(runId);

  return NextResponse.json(
    summary ?? {
      runId,
      chainId,
      status: "queued",
      chainName: null,
      sourceId: null,
      sourceName: null,
      sourceType: null,
      startedAtIso: null,
      finishedAtIso: null,
      artifactId: null,
      attemptedSourceIds: [],
      stagingItemCount: 0,
      approvedItemCount: 0,
      hardIssueRowCount: 0,
      softIssueRowCount: 0,
      errorMessage: null,
    },
  );
}
