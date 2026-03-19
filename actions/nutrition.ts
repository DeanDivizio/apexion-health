"use server";

import { auth } from "@clerk/nextjs/server";
import {
  createMealSessionSchema,
  createRetailChainSchema,
  createRetailItemSchema,
  createRetailUserItemSchema,
  createUserFoodSchema,
  upsertUserGoalsSchema,
} from "@/lib/nutrition";
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

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
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
  updateTag("hydrationSummary");
  updateTag("microSummary");
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
  updateTag("hydrationSummary");
  updateTag("microSummary");
  updateTag(`macroSummary:${userId}`);
  return result;
}

export async function deleteMealSessionAction(sessionId: string) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  const result = await deleteMealSession(userId, sessionId);
  updateTag("hydrationSummary");
  updateTag("microSummary");
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
  const row = rows.find((r) => r.dateStr === dateStr);
  return {
    calories: row?.calories ?? 0,
    protein: row?.protein ?? 0,
    carbs: row?.carbs ?? 0,
    fat: row?.fat ?? 0,
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
  updateTag("nutritionGoals");
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
