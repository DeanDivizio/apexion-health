"use server";

import {
  createRetailChainSchema,
  createRetailChainSourceSchema,
  setRetailStagingItemApprovalInputSchema,
  stageRetailItemsInputSchema,
  updateRetailChainSourceSchema,
  updateRetailStagingItemInputSchema,
} from "@/lib/nutrition";
import { requireAdminUserId } from "@/lib/auth/admin";
import { createRetailChain } from "@/lib/nutrition/server/nutritionService";
import {
  createRetailChainSource,
  deactivateRetailChainSource,
  listRetailChainSources,
  updateRetailChainSource,
} from "@/lib/nutrition/server/sourceRegistryService";
import {
  createIngestionRun,
  getIngestionRunDetail,
  getIngestionRunSummary,
  listIngestionRuns,
} from "@/lib/nutrition/server/ingestionRunService";
import {
  listRetailStagingItems,
  setRetailStagingItemApproval,
  stageRetailItemsForRun,
  updateRetailStagingItem,
} from "@/lib/nutrition/server/retailStagingService";
import { publishRetailIngestionRun } from "@/lib/nutrition/server/retailPublishService";
import {
  getMonthlyRetailQueue,
  runMonthlyRetailRefresh,
} from "@/lib/nutrition/server/monthlyQueueService";

export async function listRetailChainSourcesAction(
  chainId: string,
  includeInactive = false,
) {
  await requireAdminUserId();
  if (!chainId) throw new Error("Chain ID is required.");
  return listRetailChainSources(chainId, includeInactive);
}

export async function createRetailChainSourceAction(input: unknown) {
  await requireAdminUserId();
  const parsed = createRetailChainSourceSchema.parse(input);
  return createRetailChainSource(parsed);
}

export async function updateRetailChainSourceAction(
  sourceId: string,
  input: unknown,
) {
  await requireAdminUserId();
  if (!sourceId) throw new Error("Source ID is required.");
  const parsed = updateRetailChainSourceSchema.parse(input);
  return updateRetailChainSource(sourceId, parsed);
}

export async function deactivateRetailChainSourceAction(sourceId: string) {
  await requireAdminUserId();
  if (!sourceId) throw new Error("Source ID is required.");
  return deactivateRetailChainSource(sourceId);
}

export async function createRetailChainAdminAction(input: unknown) {
  await requireAdminUserId();
  const parsed = createRetailChainSchema.parse(input);
  return createRetailChain(parsed);
}

export async function runRetailChainIngestionAction(chainId: string) {
  const adminUserId = await requireAdminUserId();
  if (!chainId) throw new Error("Chain ID is required.");

  const runId = await createIngestionRun({
    chainId,
    triggeredByUserId: adminUserId,
    sourceSnapshot: null,
    sourceId: null,
  });

  return getIngestionRunSummary(runId);
}

export async function getRetailIngestionRunSummaryAction(runId: string) {
  await requireAdminUserId();
  if (!runId) throw new Error("Run ID is required.");
  return getIngestionRunSummary(runId);
}

export async function getRetailIngestionRunDetailAction(runId: string) {
  await requireAdminUserId();
  if (!runId) throw new Error("Run ID is required.");
  return getIngestionRunDetail(runId);
}

export async function listRetailIngestionRunsAction(options?: {
  chainId?: string;
  limit?: number;
}) {
  await requireAdminUserId();
  return listIngestionRuns(options);
}

export async function createRetailIngestionRunAction(chainId: string) {
  const adminUserId = await requireAdminUserId();
  if (!chainId) throw new Error("Chain ID is required.");
  return createIngestionRun({
    chainId,
    triggeredByUserId: adminUserId,
    sourceSnapshot: null,
    sourceId: null,
  });
}

export async function stageRetailItemsForRunAction(
  runId: string,
  input: unknown,
) {
  const adminUserId = await requireAdminUserId();
  if (!runId) throw new Error("Run ID is required.");
  const parsed = stageRetailItemsInputSchema.parse(input);
  return stageRetailItemsForRun(runId, parsed, adminUserId);
}

export async function listRetailStagingItemsAction(runId: string) {
  await requireAdminUserId();
  if (!runId) throw new Error("Run ID is required.");
  return listRetailStagingItems(runId);
}

export async function updateRetailStagingItemAction(
  stagingItemId: string,
  input: unknown,
) {
  const adminUserId = await requireAdminUserId();
  if (!stagingItemId) throw new Error("Staging item ID is required.");
  const parsed = updateRetailStagingItemInputSchema.parse(input);
  return updateRetailStagingItem(stagingItemId, parsed, adminUserId);
}

export async function setRetailStagingItemApprovalAction(
  stagingItemId: string,
  input: unknown,
) {
  const adminUserId = await requireAdminUserId();
  if (!stagingItemId) throw new Error("Staging item ID is required.");
  const parsed = setRetailStagingItemApprovalInputSchema.parse(input);
  return setRetailStagingItemApproval(stagingItemId, parsed.approved, adminUserId);
}

export async function publishRetailIngestionRunAction(runId: string) {
  await requireAdminUserId();
  if (!runId) throw new Error("Run ID is required.");
  return publishRetailIngestionRun(runId);
}

export async function getMonthlyRetailQueueAction(limit = 25) {
  await requireAdminUserId();
  return getMonthlyRetailQueue(limit);
}

export async function runMonthlyRetailRefreshAction(limit = 25) {
  const adminUserId = await requireAdminUserId();
  return runMonthlyRetailRefresh({
    limit,
    triggeredByUserId: adminUserId,
  });
}
