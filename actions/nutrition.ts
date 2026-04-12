"use server";

import { auth } from "@clerk/nextjs/server";
import {
  createFoodPresetSchema,
  createMealSessionSchema,
  createRetailChainSchema,
  createRetailItemSchema,
  createRetailUserItemSchema,
  createUserFoodSchema,
  updateFoodPresetSchema,
  updateUserFoodSchema,
  upsertUserGoalsSchema,
} from "@/lib/nutrition";
import { normalizeDateInput } from "@/lib/dates/dateStr";
import { updateTag } from "next/cache";
import {
  bulkCreateRetailItems,
  createFoodPreset,
  createMealSession,
  createRetailChain,
  createRetailUserItem,
  createUserFood,
  deleteUserFood,
  deleteFoodPreset,
  deleteMealSession,
  getMacroSummaryByDateRange,
  getMealSession,
  getMicroNutrientSummary,
  getNutritionBootstrap,
  getUserGoals,
  listFoodPresets,
  listMealSessions,
  listRetailChains,
  listUserFoods,
  searchFoundationFoods,
  searchRetailItems,
  searchUserFoods,
  updateFoodPreset,
  updateMealSession,
  updateUserFood,
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

export async function listUserFoodsAction() {
  const userId = await requireUserId();
  return listUserFoods(userId);
}

export async function updateUserFoodAction(foodId: string, input: unknown) {
  const userId = await requireUserId();
  if (!foodId) throw new Error("Food ID is required.");
  const parsed = updateUserFoodSchema.parse(input);
  return updateUserFood(userId, foodId, parsed);
}

export async function deleteUserFoodAction(foodId: string) {
  const userId = await requireUserId();
  if (!foodId) throw new Error("Food ID is required.");
  await deleteUserFood(userId, foodId);
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
  console.log(`[NUTRITION] createMeal done for user=${userId}, session dateStr=${result.dateStr}, items=${result.items?.length ?? "?"}`);
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
  console.log(`[NUTRITION] getTodayMacroTotals called for date=${dateStr} user=${userId}`);
  const rows = await getMacroSummaryByDateRange(userId, dateStr, dateStr);
  console.log(`[NUTRITION] getMacroSummaryByDateRange returned ${rows.length} rows:`, JSON.stringify(rows));
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

  console.log(`[NUTRITION] getTodayMacroTotals result: cal=${calories} pro=${protein} carb=${carbs} fat=${fat}`);
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

// ─── Food presets ─────────────────────────────────────────────────────────────

export async function listFoodPresetsAction() {
  const userId = await requireUserId();
  return listFoodPresets(userId);
}

export async function createFoodPresetAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createFoodPresetSchema.parse(input);
  const result = await createFoodPreset(userId, parsed);
  updateTag(`nutritionPresets:${userId}`);
  return result;
}

export async function updateFoodPresetAction(
  presetId: string,
  input: unknown,
) {
  const userId = await requireUserId();
  if (!presetId) throw new Error("Preset ID is required.");
  const parsed = updateFoodPresetSchema.parse(input);
  const result = await updateFoodPreset(userId, presetId, parsed);
  updateTag(`nutritionPresets:${userId}`);
  return result;
}

export async function deleteFoodPresetAction(presetId: string) {
  const userId = await requireUserId();
  if (!presetId) throw new Error("Preset ID is required.");
  await deleteFoodPreset(userId, presetId);
  updateTag(`nutritionPresets:${userId}`);
}
