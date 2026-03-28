import { prisma } from "@/lib/db/prisma";
import { ingestionArtifactInputSchema } from "@/lib/nutrition/ingestion/schemas";
import type {
  NutritionIngestionRunStatus,
  RetailChainSourceConfig,
} from "@/lib/nutrition/ingestion/types";
import {
  createIngestionArtifactRecord,
  fetchRetailSourceArtifact,
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
): Promise<IngestionRunSummary> {
  assertRetailIngestionModels();

  const sources = await getPrioritizedChainSources(chainId);
  const initialSource = sources[0] ?? null;
  const runId = await createIngestionRun({
    chainId,
    sourceId: initialSource?.id ?? null,
    triggeredByUserId: triggeredByUserId ?? null,
    sourceSnapshot: initialSource,
  });

  if (!sources.length) {
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
    await setIngestionRunStatus(runId, "fetching", {
      source,
      sourceId: source.id,
      errorMessage: null,
    });

    const fetchedArtifact = await fetchRetailSourceArtifact(source);
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

    if (!parsed.items.length) {
      sawFetchFailure = true;
      lastErrorMessage =
        parsed.warnings.map((warning) => warning.message).join(" | ") ||
        "Parser did not extract any items.";
      continue;
    }

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

    await setIngestionRunStatus(
      runId,
      hardIssueRowCount === 0 ? "publish_ready" : "review_required",
      {
        finishedAt: new Date(),
        errorMessage:
          parsed.warnings.length > 0
            ? parsed.warnings.map((warning) => warning.message).join(" | ")
            : null,
      },
    );

    return {
      runId,
      chainId,
      status: hardIssueRowCount === 0 ? "publish_ready" : "review_required",
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
