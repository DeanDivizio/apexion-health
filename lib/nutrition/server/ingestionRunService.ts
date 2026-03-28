import { prisma } from "@/lib/db/prisma";
import {
  ingestionArtifactInputSchema,
  parsedArtifactResultSchema,
} from "@/lib/nutrition/ingestion/schemas";
import type {
  NutritionIngestionRunStatus,
  RetailChainSourceConfig,
} from "@/lib/nutrition/ingestion/types";
import {
  createIngestionArtifactRecord,
  fetchRetailSourceArtifact,
  loadCachedParsedResult,
  saveParsedResultOnArtifact,
  toArtifactInput,
} from "@/lib/nutrition/server/sourceFetchService";
import {
  assertRetailIngestionModels,
  getPrioritizedChainSources,
  touchRetailChainSourceVerifiedAt,
} from "@/lib/nutrition/server/sourceRegistryService";
import {
  listRetailStagingItems,
  stageRetailItemsForRun,
} from "@/lib/nutrition/server/retailStagingService";

const db = prisma as any;

const STALE_RUN_THRESHOLD_MS = 10 * 60 * 1000;
const TRANSIENT_STATUSES: NutritionIngestionRunStatus[] = [
  "queued",
  "fetching",
  "fetched",
  "parsing",
];

function logIngestion(
  runId: string,
  step: string,
  data?: Record<string, unknown>,
) {
  console.log(
    JSON.stringify({
      tag: "ingestion",
      runId,
      step,
      ts: new Date().toISOString(),
      ...data,
    }),
  );
}

export interface IngestionRunSummary {
  runId: string;
  chainId: string;
  status: NutritionIngestionRunStatus;
  chainName: string | null;
  sourceId: string | null;
  sourceName: string | null;
  sourceType: string | null;
  startedAtIso: string | null;
  finishedAtIso: string | null;
  artifactId: string | null;
  attemptedSourceIds: string[];
  stagingItemCount: number;
  approvedItemCount: number;
  hardIssueRowCount: number;
  softIssueRowCount: number;
  errorMessage: string | null;
}

export interface IngestionRunDetail extends IngestionRunSummary {
  sourceUrl: string | null;
}

export interface CreateIngestionRunParams {
  chainId: string;
  sourceId?: string | null;
  triggeredByUserId?: string | null;
  sourceSnapshot?: RetailChainSourceConfig | null;
}

export interface RunChainIngestionOptions {
  runId?: string;
}

function getSourceSnapshotUpdate(source?: RetailChainSourceConfig | null) {
  if (!source) {
    return {
      sourceUrlSnapshot: null,
      sourceTypeSnapshot: null,
      fetchMethodSnapshot: null,
      parserPreferenceSnapshot: null,
    };
  }

  return {
    sourceUrlSnapshot: source.sourceUrl,
    sourceTypeSnapshot: source.sourceType,
    fetchMethodSnapshot: source.fetchMethod,
    parserPreferenceSnapshot: source.parserPreference,
  };
}

export async function createIngestionRun(
  params: CreateIngestionRunParams,
): Promise<string> {
  assertRetailIngestionModels();

  const created = await db.nutritionRetailIngestionRun.create({
    data: {
      chainId: params.chainId,
      sourceId: params.sourceId ?? null,
      status: "queued",
      triggeredByUserId: params.triggeredByUserId ?? null,
      ...getSourceSnapshotUpdate(params.sourceSnapshot),
    },
    select: { id: true },
  });

  return created.id;
}

export async function setIngestionRunStatus(
  runId: string,
  status: NutritionIngestionRunStatus,
  options?: {
    errorMessage?: string | null;
    source?: RetailChainSourceConfig | null;
    sourceId?: string | null;
    finishedAt?: Date | null;
  },
): Promise<void> {
  assertRetailIngestionModels();

  await db.nutritionRetailIngestionRun.update({
    where: { id: runId },
    data: {
      status,
      sourceId:
        options?.sourceId !== undefined ? options.sourceId : options?.source?.id,
      ...(options?.source ? getSourceSnapshotUpdate(options.source) : {}),
      ...(options?.errorMessage !== undefined
        ? { errorMessage: options.errorMessage }
        : {}),
      ...(options?.finishedAt !== undefined
        ? { finishedAt: options.finishedAt }
        : {}),
    },
  });
}

export async function recoverStaleRuns(): Promise<number> {
  assertRetailIngestionModels();

  const cutoff = new Date(Date.now() - STALE_RUN_THRESHOLD_MS);

  const staleRuns = await db.nutritionRetailIngestionRun.findMany({
    where: {
      status: { in: TRANSIENT_STATUSES },
      startedAt: { lt: cutoff },
      finishedAt: null,
    },
    select: { id: true, status: true, chainId: true },
  });

  if (!staleRuns.length) return 0;

  for (const run of staleRuns) {
    logIngestion(run.id, "stale_recovery", {
      previousStatus: run.status,
      chainId: run.chainId,
    });
  }

  const result = await db.nutritionRetailIngestionRun.updateMany({
    where: {
      id: { in: staleRuns.map((r: any) => r.id) },
    },
    data: {
      status: "fetch_failed",
      errorMessage:
        "Run timed out — stuck in a transient state for over 10 minutes.",
      finishedAt: new Date(),
    },
  });

  return result.count;
}

export async function cancelIngestionRun(runId: string): Promise<void> {
  assertRetailIngestionModels();

  const run = await db.nutritionRetailIngestionRun.findUnique({
    where: { id: runId },
    select: { status: true },
  });

  if (!run) throw new Error("Ingestion run not found.");

  const cancellable = TRANSIENT_STATUSES.includes(run.status);
  if (!cancellable) {
    throw new Error(
      `Cannot cancel a run in "${run.status}" status — only transient runs can be cancelled.`,
    );
  }

  logIngestion(runId, "cancelled", { previousStatus: run.status });

  await db.nutritionRetailIngestionRun.update({
    where: { id: runId },
    data: {
      status: "fetch_failed",
      errorMessage: "Manually cancelled by admin.",
      finishedAt: new Date(),
    },
  });
}

export async function getIngestionRunSummary(
  runId: string,
): Promise<IngestionRunSummary | null> {
  assertRetailIngestionModels();

  const run = await db.nutritionRetailIngestionRun.findUnique({
    where: { id: runId },
    include: {
      artifacts: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
        select: { id: true, sourceUrl: true, sourceType: true },
      },
      stagingItems: {
        select: { id: true, approved: true, hardIssueCount: true, softIssueCount: true },
      },
      chain: {
        select: { name: true },
      },
      source: {
        select: { id: true, sourceName: true },
      },
    },
  });

  if (!run) return null;

  const approvedItemCount = run.stagingItems.filter((item: any) => item.approved).length;
  const hardIssueRowCount = run.stagingItems.filter(
    (item: any) => item.hardIssueCount > 0,
  ).length;
  const softIssueRowCount = run.stagingItems.filter(
    (item: any) => item.softIssueCount > 0,
  ).length;

  return {
    runId: run.id,
    chainId: run.chainId,
    status: run.status,
    chainName: run.chain?.name ?? null,
    sourceId: run.source?.id ?? run.sourceId ?? null,
    sourceName: run.source?.sourceName ?? null,
    sourceType:
      (run.artifacts[0]?.sourceType as string | undefined) ??
      (run.sourceTypeSnapshot as string | undefined) ??
      null,
    startedAtIso: run.startedAt ? run.startedAt.toISOString() : null,
    finishedAtIso: run.finishedAt ? run.finishedAt.toISOString() : null,
    artifactId: run.artifacts[0]?.id ?? null,
    attemptedSourceIds: run.sourceId ? [run.sourceId] : [],
    stagingItemCount: run.stagingItems.length,
    approvedItemCount,
    hardIssueRowCount,
    softIssueRowCount,
    errorMessage: run.errorMessage ?? null,
  };
}

export async function listIngestionRuns(
  options?: { chainId?: string; limit?: number },
): Promise<IngestionRunSummary[]> {
  assertRetailIngestionModels();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const rows = await db.nutritionRetailIngestionRun.findMany({
    where: options?.chainId ? { chainId: options.chainId } : undefined,
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      artifacts: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
        select: { id: true, sourceUrl: true, sourceType: true },
      },
      stagingItems: {
        select: { id: true, approved: true, hardIssueCount: true, softIssueCount: true },
      },
      chain: {
        select: { name: true },
      },
      source: {
        select: { id: true, sourceName: true },
      },
    },
  });

  return rows.map((run: any) => {
    const approvedItemCount = run.stagingItems.filter((item: any) => item.approved).length;
    const hardIssueRowCount = run.stagingItems.filter(
      (item: any) => item.hardIssueCount > 0,
    ).length;
    const softIssueRowCount = run.stagingItems.filter(
      (item: any) => item.softIssueCount > 0,
    ).length;

    return {
      runId: run.id,
      chainId: run.chainId,
      status: run.status,
      chainName: run.chain?.name ?? null,
      sourceId: run.source?.id ?? run.sourceId ?? null,
      sourceName: run.source?.sourceName ?? null,
      sourceType:
        (run.artifacts[0]?.sourceType as string | undefined) ??
        (run.sourceTypeSnapshot as string | undefined) ??
        null,
      startedAtIso: run.startedAt ? run.startedAt.toISOString() : null,
      finishedAtIso: run.finishedAt ? run.finishedAt.toISOString() : null,
      artifactId: run.artifacts[0]?.id ?? null,
      attemptedSourceIds: run.sourceId ? [run.sourceId] : [],
      stagingItemCount: run.stagingItems.length,
      approvedItemCount,
      hardIssueRowCount,
      softIssueRowCount,
      errorMessage: run.errorMessage ?? null,
    };
  });
}

export async function getIngestionRunDetail(
  runId: string,
): Promise<IngestionRunDetail | null> {
  const summary = await getIngestionRunSummary(runId);
  if (!summary) return null;

  const artifact = await db.nutritionRetailIngestionArtifact.findFirst({
    where: { runId },
    orderBy: { fetchedAt: "desc" },
    select: { sourceUrl: true },
  });

  return {
    ...summary,
    sourceUrl: artifact?.sourceUrl ?? null,
  };
}

export async function runChainIngestion(
  chainId: string,
  triggeredByUserId?: string,
  options?: RunChainIngestionOptions,
): Promise<IngestionRunSummary> {
  assertRetailIngestionModels();
  const t0 = Date.now();

  const recoveredCount = await recoverStaleRuns();
  if (recoveredCount > 0) {
    console.log(
      JSON.stringify({
        tag: "ingestion",
        step: "stale_recovery_summary",
        recoveredCount,
        ts: new Date().toISOString(),
      }),
    );
  }

  const sources = await getPrioritizedChainSources(chainId);
  const initialSource = sources[0] ?? null;
  const runId =
    options?.runId ??
    (await createIngestionRun({
      chainId,
      sourceId: initialSource?.id ?? null,
      triggeredByUserId: triggeredByUserId ?? null,
      sourceSnapshot: initialSource,
    }));

  logIngestion(runId, "start", {
    chainId,
    sourceCount: sources.length,
    sourceIds: sources.map((s) => s.id),
  });

  if (options?.runId) {
    await setIngestionRunStatus(runId, "queued", {
      source: initialSource,
      sourceId: initialSource?.id ?? null,
      errorMessage: null,
    });
  }

  if (!sources.length) {
    logIngestion(runId, "no_sources", { chainId });
    await setIngestionRunStatus(runId, "needs_source", {
      errorMessage: "No active official sources configured for this chain.",
      finishedAt: new Date(),
    });
    return {
      runId,
      chainId,
      status: "needs_source",
      chainName: null,
      sourceId: null,
      sourceName: null,
      sourceType: null,
      startedAtIso: null,
      finishedAtIso: new Date().toISOString(),
      artifactId: null,
      attemptedSourceIds: [],
      stagingItemCount: 0,
      approvedItemCount: 0,
      hardIssueRowCount: 0,
      softIssueRowCount: 0,
      errorMessage: "No active official sources configured for this chain.",
    };
  }

  const attemptedSourceIds: string[] = [];
  let lastErrorMessage: string | null = null;
  let sawFetchFailure = false;

  for (const source of sources) {
    attemptedSourceIds.push(source.id);

    logIngestion(runId, "fetch_start", {
      sourceId: source.id,
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      sourceType: source.sourceType,
    });

    await setIngestionRunStatus(runId, "fetching", {
      source,
      sourceId: source.id,
      errorMessage: null,
    });

    const tFetch = Date.now();
    const fetchedArtifact = await fetchRetailSourceArtifact(source);

    logIngestion(runId, "fetch_end", {
      sourceId: source.id,
      fetchStatus: fetchedArtifact.status,
      durationMs: Date.now() - tFetch,
      httpStatus: fetchedArtifact.httpStatus,
      fileSizeBytes: fetchedArtifact.fileSizeBytes,
      errorMessage: fetchedArtifact.errorMessage,
    });

    if (fetchedArtifact.status === "needs_source") {
      lastErrorMessage = fetchedArtifact.errorMessage;
      continue;
    }

    if (fetchedArtifact.status === "fetch_failed") {
      sawFetchFailure = true;
      lastErrorMessage = fetchedArtifact.errorMessage;
      continue;
    }

    const artifactInput = ingestionArtifactInputSchema.parse(toArtifactInput(fetchedArtifact));
    const selectedArtifactId = await createIngestionArtifactRecord(runId, artifactInput);

    await setIngestionRunStatus(runId, "fetched", {
      source,
      sourceId: source.id,
      errorMessage: null,
    });
    await touchRetailChainSourceVerifiedAt(source.id);

    await setIngestionRunStatus(runId, "parsing");

    const chain = await db.nutritionRetailChain.findUnique({
      where: { id: chainId },
      select: { name: true },
    });

    logIngestion(runId, "parse_start", {
      sourceId: source.id,
      sourceType: artifactInput.sourceType,
      mimeType: artifactInput.mimeType,
      parserPreference: source.parserPreference,
    });

    const tParse = Date.now();
    const { parseRetailArtifact } = await import(
      "@/lib/nutrition/ingestion/parserRouter"
    );
    const parsed = await parseRetailArtifact({
      body: fetchedArtifact.body ?? new Uint8Array(),
      sourceType: artifactInput.sourceType,
      parserPreference: source.parserPreference,
      chainName: chain?.name ?? "restaurant chain",
      mimeType: artifactInput.mimeType,
      posthogDistinctId: triggeredByUserId,
    });

    logIngestion(runId, "parse_end", {
      sourceId: source.id,
      durationMs: Date.now() - tParse,
      itemCount: parsed.items.length,
      warningCount: parsed.warnings.length,
      warnings: parsed.warnings.map((w) => w.message),
      extractionMethod: parsed.extractionMethod,
    });

    if (!parsed.items.length) {
      sawFetchFailure = true;
      lastErrorMessage =
        parsed.warnings.map((warning) => warning.message).join(" | ") ||
        "Parser did not extract any items.";
      continue;
    }

    await saveParsedResultOnArtifact(selectedArtifactId, parsed);
    logIngestion(runId, "parsed_result_cached", {
      artifactId: selectedArtifactId,
      itemCount: parsed.items.length,
    });

    logIngestion(runId, "stage_start", { itemCount: parsed.items.length });
    const tStage = Date.now();

    const staged = await stageRetailItemsForRun(
      runId,
      parsed.items.map((item) => ({
        name: item.name,
        category: item.category,
        nutrients: item.nutrients,
        servingSize: item.servingSize,
        servingUnit: item.servingUnit,
        extractionMethod: item.extractionMethod,
        confidence: item.confidence,
      })),
      triggeredByUserId,
      selectedArtifactId,
    );

    const stagedRows = await listRetailStagingItems(runId);
    const approvedItemCount = stagedRows.filter((row) => row.approved).length;
    const hardIssueRowCount = stagedRows.filter((row) => row.hardIssueCount > 0).length;
    const softIssueRowCount = stagedRows.filter((row) => row.softIssueCount > 0).length;

    const finalStatus: NutritionIngestionRunStatus =
      hardIssueRowCount === 0 ? "publish_ready" : "review_required";

    logIngestion(runId, "stage_end", {
      durationMs: Date.now() - tStage,
      stagedCount: staged.stagedCount,
      approvedItemCount,
      hardIssueRowCount,
      softIssueRowCount,
    });

    await setIngestionRunStatus(runId, finalStatus, {
      finishedAt: new Date(),
      errorMessage:
        parsed.warnings.length > 0
          ? parsed.warnings.map((warning) => warning.message).join(" | ")
          : null,
    });

    logIngestion(runId, "complete", {
      status: finalStatus,
      totalDurationMs: Date.now() - t0,
    });

    return {
      runId,
      chainId,
      status: finalStatus,
      chainName: chain?.name ?? null,
      sourceId: source.id,
      sourceName: source.sourceName,
      sourceType: artifactInput.sourceType,
      startedAtIso: null,
      finishedAtIso: new Date().toISOString(),
      artifactId: selectedArtifactId,
      attemptedSourceIds,
      stagingItemCount: staged.stagedCount,
      approvedItemCount,
      hardIssueRowCount,
      softIssueRowCount,
      errorMessage:
        parsed.warnings.length > 0
          ? parsed.warnings.map((warning) => warning.message).join(" | ")
          : null,
    };
  }

  const terminalStatus: NutritionIngestionRunStatus = sawFetchFailure
    ? "fetch_failed"
    : "needs_source";
  await setIngestionRunStatus(runId, terminalStatus, {
    errorMessage: lastErrorMessage ?? "Unable to fetch any official source.",
    finishedAt: new Date(),
  });

  logIngestion(runId, "complete", {
    status: terminalStatus,
    totalDurationMs: Date.now() - t0,
    errorMessage: lastErrorMessage,
  });

  return {
    runId,
    chainId,
    status: terminalStatus,
    chainName: null,
    sourceId: null,
    sourceName: null,
    sourceType: null,
    startedAtIso: null,
    finishedAtIso: new Date().toISOString(),
    artifactId: null,
    attemptedSourceIds,
    stagingItemCount: 0,
    approvedItemCount: 0,
    hardIssueRowCount: 0,
    softIssueRowCount: 0,
    errorMessage: lastErrorMessage ?? "Unable to fetch any official source.",
  };
}

export async function restageFromArtifact(
  runId: string,
  triggeredByUserId?: string,
): Promise<IngestionRunSummary> {
  assertRetailIngestionModels();

  const run = await db.nutritionRetailIngestionRun.findUnique({
    where: { id: runId },
    include: {
      artifacts: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
        select: { id: true, parsedResultJson: true },
      },
      chain: { select: { name: true } },
      source: { select: { id: true, sourceName: true } },
    },
  });

  if (!run) throw new Error("Ingestion run not found.");

  const artifact = run.artifacts[0];
  if (!artifact?.parsedResultJson) {
    throw new Error(
      "No cached extraction result on this run's artifact. The extraction must be re-run.",
    );
  }

  const parseResult = parsedArtifactResultSchema.safeParse(artifact.parsedResultJson);
  if (!parseResult.success) {
    throw new Error(
      `Cached extraction result failed validation: ${parseResult.error.message}`,
    );
  }

  const parsed = parseResult.data;

  if (!parsed.items.length) {
    throw new Error("Cached extraction result contains no items.");
  }

  logIngestion(runId, "restage_start", {
    artifactId: artifact.id,
    cachedItemCount: parsed.items.length,
  });

  await db.nutritionRetailStagingItem.deleteMany({ where: { runId } });

  await setIngestionRunStatus(runId, "parsing", { errorMessage: null });

  const staged = await stageRetailItemsForRun(
    runId,
    parsed.items.map((item) => ({
      name: item.name,
      category: item.category,
      nutrients: item.nutrients,
      servingSize: item.servingSize,
      servingUnit: item.servingUnit,
      extractionMethod: item.extractionMethod,
      confidence: item.confidence,
    })),
    triggeredByUserId,
    artifact.id,
  );

  const stagedRows = await listRetailStagingItems(runId);
  const approvedItemCount = stagedRows.filter((row) => row.approved).length;
  const hardIssueRowCount = stagedRows.filter((row) => row.hardIssueCount > 0).length;
  const softIssueRowCount = stagedRows.filter((row) => row.softIssueCount > 0).length;

  const finalStatus: NutritionIngestionRunStatus =
    hardIssueRowCount === 0 ? "publish_ready" : "review_required";

  await setIngestionRunStatus(runId, finalStatus, {
    finishedAt: new Date(),
    errorMessage: null,
  });

  logIngestion(runId, "restage_complete", {
    stagedCount: staged.stagedCount,
    hardIssues: staged.hardIssues,
    softIssues: staged.softIssues,
  });

  return {
    runId,
    chainId: run.chainId,
    status: finalStatus,
    chainName: run.chain?.name ?? null,
    sourceId: run.source?.id ?? run.sourceId ?? null,
    sourceName: run.source?.sourceName ?? null,
    sourceType: run.sourceTypeSnapshot ?? null,
    startedAtIso: run.startedAt ? run.startedAt.toISOString() : null,
    finishedAtIso: new Date().toISOString(),
    artifactId: artifact.id,
    attemptedSourceIds: run.sourceId ? [run.sourceId] : [],
    stagingItemCount: staged.stagedCount,
    approvedItemCount,
    hardIssueRowCount,
    softIssueRowCount,
    errorMessage: null,
  };
}
