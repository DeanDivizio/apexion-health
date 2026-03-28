"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import {
  createRetailChainSourceSchema,
  createMealSessionSchema,
  createRetailChainSchema,
  createRetailItemSchema,
  createRetailUserItemSchema,
  createUserFoodSchema,
  setRetailStagingItemApprovalInputSchema,
  stageRetailItemsInputSchema,
  updateRetailChainSourceSchema,
  updateRetailStagingItemInputSchema,
  upsertUserGoalsSchema,
} from "@/lib/nutrition";
import { normalizeDateInput } from "@/lib/dates/dateStr";
import { updateTag } from "next/cache";
import {
  bulkCreateRetailItems,
  createMealSession,
  createRetailChain,
  createRetailUserItem,
  createUserFood,
  deleteMealSession,
  getMacroSummaryByDateRange,
  getMealSession,
  getMicroNutrientSummary,
  getNutritionBootstrap,
  getUserGoals,
  listMealSessions,
  listRetailChains,
  searchFoundationFoods,
  searchRetailItems,
  searchUserFoods,
  updateMealSession,
  upsertUserGoals,
} from "@/lib/nutrition/server/nutritionService";
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
  runChainIngestion,
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

const ADMIN_EMAIL = "dean@deandivizio.com";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

async function requireAdminUserId(): Promise<string> {
  const userId = await requireUserId();
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses.find(
    (entry) => entry.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (email !== ADMIN_EMAIL) {
    throw new Error("Admin access required.");
  }

  return userId;
}

export async function getNutritionBootstrapAction() {
  const userId = await requireUserId();
  return getNutritionBootstrap(userId);
}

export async function searchFoodsAction(query: string) {
  const userId = await requireUserId();
  const [foundation, userFoods] = await Promise.all([
    searchFoundationFoods(query),
    searchUserFoods(userId, query),
  ]);
  return { foundation, userFoods };
}

export async function createUserFoodAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createUserFoodSchema.parse(input);
  return createUserFood(userId, parsed);
}

export async function searchRetailItemsAction(chainId: string, query: string) {
  const userId = await requireUserId();
  return searchRetailItems(chainId, query, userId);
}

export async function createRetailUserItemAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createRetailUserItemSchema.parse(input);
  return createRetailUserItem(userId, parsed);
}

export async function createMealSessionAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createMealSessionSchema.parse(input);
  const result = await createMealSession(userId, parsed);
  updateTag(`hydrationSummary:${userId}`);
  updateTag(`microSummary:${userId}`);
  updateTag(`macroSummary:${userId}`);
  return result;
}

export async function listMealSessionsAction(options?: {
  startDate?: string;
  endDate?: string;
}) {
  const userId = await requireUserId();
  return listMealSessions(userId, options);
}

export async function getMealSessionAction(sessionId: string) {
  const userId = await requireUserId();
  return getMealSession(userId, sessionId);
}

export async function updateMealSessionAction(
  sessionId: string,
  input: unknown,
) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  const parsed = createMealSessionSchema.parse(input);
  const result = await updateMealSession(userId, sessionId, parsed);
  updateTag(`hydrationSummary:${userId}`);
  updateTag(`microSummary:${userId}`);
  updateTag(`macroSummary:${userId}`);
  return result;
}

export async function deleteMealSessionAction(sessionId: string) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  const result = await deleteMealSession(userId, sessionId);
  updateTag(`hydrationSummary:${userId}`);
  updateTag(`microSummary:${userId}`);
  updateTag(`macroSummary:${userId}`);
  return result;
}

export async function getMacroSummaryAction(
  startDate: string,
  endDate: string,
) {
  const userId = await requireUserId();
  return getMacroSummaryByDateRange(userId, startDate, endDate);
}

export interface TodayMacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Today’s macros only — fast path for home hero; uses cached macro queries. */
export async function getTodayMacroTotalsAction(
  dateStr: string,
): Promise<TodayMacroTotals> {
  const userId = await requireUserId();
  const rows = await getMacroSummaryByDateRange(userId, dateStr, dateStr);
  const dateCandidates = new Set(normalizeDateInput(dateStr).sessionDateCandidates);
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;

  for (const row of rows) {
    if (!dateCandidates.has(row.dateStr)) continue;
    calories += row.calories;
    protein += row.protein;
    carbs += row.carbs;
    fat += row.fat;
  }

  return {
    calories,
    protein,
    carbs,
    fat,
  };
}

export async function getUserGoalsAction() {
  const userId = await requireUserId();
  return getUserGoals(userId);
}

export async function upsertUserGoalsAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = upsertUserGoalsSchema.parse(input);
  const result = await upsertUserGoals(userId, parsed);
  updateTag(`nutritionGoals:${userId}`);
  return result;
}

export async function getMicroNutrientSummaryAction(dateStr: string) {
  const userId = await requireUserId();
  return getMicroNutrientSummary(userId, dateStr);
}

export async function createRetailChainAction(input: unknown) {
  await requireUserId();
  const parsed = createRetailChainSchema.parse(input);
  return createRetailChain(parsed);
}

export async function listRetailChainsAction() {
  await requireUserId();
  return listRetailChains();
}

export async function bulkCreateRetailItemsAction(
  chainId: string,
  items: unknown,
) {
  await requireUserId();
  if (!chainId) throw new Error("Chain ID is required.");
  const parsed = (Array.isArray(items) ? items : []).map((item) =>
    createRetailItemSchema.parse(item),
  );
  return bulkCreateRetailItems(chainId, parsed);
}

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

export async function runRetailChainIngestionAction(chainId: string) {
  const adminUserId = await requireAdminUserId();
  if (!chainId) throw new Error("Chain ID is required.");
  return runChainIngestion(chainId, adminUserId);
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
