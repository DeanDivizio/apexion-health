import { prisma } from "@/lib/db/prisma";
import { cacheTag, cacheLife } from "next/cache";
import {
  MICRONUTRIENT_KEY_SET,
  NUTRIENT_KEYS,
  resolveNutrientMeta,
} from "@/lib/nutrition/nutrientKeys";
import { normalizeDateInput, toCompactDateStr } from "@/lib/dates/dateStr";
import type {
  FoodPresetItemView,
  FoodPresetView,
  FoundationFoodView,
  MacroSummaryByDate,
  MealItemViewEntry,
  NutrientProfile,
  NutritionBootstrap,
  NutritionMealSessionView,
  NutritionUserFoodView,
  NutritionUserGoalsView,
  RecentFoodEntry,
  RetailChainView,
  RetailItemView,
} from "@/lib/nutrition/types";
import type {
  CreateFoodPresetInput,
  CreateMealSessionInput,
  CreateRetailChainInput,
  CreateRetailItemInput,
  CreateRetailUserItemInput,
  CreateUserFoodInput,
  MealItemDraftInput,
  UpdateFoodPresetInput,
  UpsertUserGoalsInput,
} from "@/lib/nutrition/schemas";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;
type TxClient = any;

function hasNutritionModels() {
  return (
    typeof db?.nutritionFoundationFood?.findMany === "function" &&
    typeof db?.nutritionUserFood?.findMany === "function" &&
    typeof db?.nutritionMealSession?.findMany === "function"
  );
}

function assertModelsAvailable() {
  if (!hasNutritionModels()) {
    throw new Error(
      "Nutrition models are unavailable. Run migrations and regenerate Prisma client.",
    );
  }
}

function generateChainKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function toFoundationFoodView(row: any): FoundationFoodView {
  return {
    id: row.id,
    fdcId: row.fdcId,
    name: row.name,
    category: row.category ?? null,
    nutrients: row.nutrients as NutrientProfile,
    portions: Array.isArray(row.portions) ? row.portions : [],
    defaultServingSize: row.defaultServingSize,
    defaultServingUnit: row.defaultServingUnit,
  };
}

function toUserFoodView(row: any): NutritionUserFoodView {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? null,
    nutrients: row.nutrients as NutrientProfile,
    servingSize: row.servingSize,
    servingUnit: row.servingUnit,
    ingredients: row.ingredients ?? null,
  };
}

function toRetailChainView(row: any): RetailChainView {
  return { id: row.id, key: row.key, name: row.name };
}

function toRetailItemView(row: any, isUserItem: boolean): RetailItemView {
  return {
    id: row.id,
    chainId: row.chainId,
    name: row.name,
    category: row.category ?? null,
    nutrients: row.nutrients as NutrientProfile,
    servingSize: row.servingSize ?? null,
    servingUnit: row.servingUnit ?? null,
    isUserItem,
  };
}

function toMealItemViewEntry(row: any): MealItemViewEntry {
  return {
    foodSource: row.foodSource,
    sourceFoodId: row.sourceFoodId ?? null,
    foundationFoodId: row.foundationFoodId ?? null,
    snapshotName: row.snapshotName,
    snapshotBrand: row.snapshotBrand ?? null,
    servings: row.servings,
    portionLabel: row.portionLabel ?? null,
    portionGramWeight: row.portionGramWeight ?? null,
    snapshotCalories: row.snapshotCalories,
    snapshotProtein: row.snapshotProtein,
    snapshotCarbs: row.snapshotCarbs,
    snapshotFat: row.snapshotFat,
  };
}

function toSessionView(row: any): NutritionMealSessionView {
  return {
    id: row.id,
    loggedAtIso: row.loggedAt.toISOString(),
    dateStr: row.dateStr,
    mealLabel: row.mealLabel ?? null,
    notes: row.notes ?? null,
    items: (row.items ?? []).map(toMealItemViewEntry),
  };
}

function toPresetItemView(row: any): FoodPresetItemView {
  return {
    foodSource: row.foodSource,
    sourceFoodId: row.sourceFoodId ?? null,
    foundationFoodId: row.foundationFoodId ?? null,
    snapshotName: row.snapshotName,
    snapshotBrand: row.snapshotBrand ?? null,
    servings: row.servings,
    portionLabel: row.portionLabel ?? null,
    portionGramWeight: row.portionGramWeight ?? null,
    nutrients: row.nutrients as NutrientProfile,
  };
}

function toPresetView(row: any): FoodPresetView {
  return {
    id: row.id,
    name: row.name,
    items: (row.items ?? []).map(toPresetItemView),
  };
}

function toGoalsView(row: any): NutritionUserGoalsView {
  return {
    calories: row.calories ?? null,
    protein: row.protein ?? null,
    carbs: row.carbs ?? null,
    fat: row.fat ?? null,
    microGoals: row.microGoals as Record<string, { target: number; unit: string }> | null,
    waterGoalOz: row.waterGoalOz ?? null,
    sodiumGoalMg: row.sodiumGoalMg ?? null,
    potassiumGoalMg: row.potassiumGoalMg ?? null,
    magnesiumGoalMg: row.magnesiumGoalMg ?? null,
  };
}

// ─── Nutrient persistence helpers ────────────────────────────────────────────

function buildNutrientRows(
  mealItemId: string,
  nutrients: NutrientProfile,
  servings: number,
  portionGramWeight: number | null,
  foodSource: string,
) {
  const rows: any[] = [];
  const scale = foodSource === "foundation" && portionGramWeight != null
    ? (portionGramWeight / 100) * servings
    : servings;

  for (const [profileKey, perServing] of Object.entries(nutrients)) {
    if (perServing == null || perServing === 0) continue;
    const meta = resolveNutrientMeta(profileKey);
    rows.push({
      mealItemId,
      nutrientKey: meta.key,
      nutrientName: meta.name,
      amount: perServing * scale,
      unit: meta.unit,
    });
  }
  return rows;
}

function computeSnapshotMacros(
  nutrients: NutrientProfile,
  servings: number,
  portionGramWeight: number | null,
  foodSource: string,
) {
  const scale = foodSource === "foundation" && portionGramWeight != null
    ? (portionGramWeight / 100) * servings
    : servings;
  return {
    snapshotCalories: nutrients.calories * scale,
    snapshotProtein: nutrients.protein * scale,
    snapshotCarbs: nutrients.carbs * scale,
    snapshotFat: nutrients.fat * scale,
  };
}

// ─── Recently logged foods ───────────────────────────────────────────────────

export async function getRecentlyLoggedFoods(
  userId: string,
  limit = 20,
): Promise<RecentFoodEntry[]> {
  if (!hasNutritionModels()) return [];

  try {
    const recentItems = await db.nutritionMealItem.findMany({
      where: {
        session: { userId },
        foodSource: { in: ["foundation", "complex"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        foodSource: true,
        sourceFoodId: true,
        foundationFoodId: true,
      },
      take: limit * 3,
    });

    const seenFoundation = new Set<string>();
    const seenUserFood = new Set<string>();
    const orderedFoundationIds: string[] = [];
    const orderedUserFoodIds: string[] = [];
    const insertionOrder: Array<{ type: "foundation" | "complex"; id: string }> = [];

    for (const item of recentItems) {
      if (
        item.foodSource === "foundation" &&
        item.foundationFoodId &&
        !seenFoundation.has(item.foundationFoodId)
      ) {
        seenFoundation.add(item.foundationFoodId);
        orderedFoundationIds.push(item.foundationFoodId);
        insertionOrder.push({ type: "foundation", id: item.foundationFoodId });
      } else if (
        item.foodSource === "complex" &&
        item.sourceFoodId &&
        !seenUserFood.has(item.sourceFoodId)
      ) {
        seenUserFood.add(item.sourceFoodId);
        orderedUserFoodIds.push(item.sourceFoodId);
        insertionOrder.push({ type: "complex", id: item.sourceFoodId });
      }
      if (insertionOrder.length >= limit) break;
    }

    if (!insertionOrder.length) return [];

    const [foundationRows, userFoodRows] = await Promise.all([
      orderedFoundationIds.length > 0
        ? db.nutritionFoundationFood.findMany({
            where: { id: { in: orderedFoundationIds } },
          })
        : [],
      orderedUserFoodIds.length > 0
        ? db.nutritionUserFood.findMany({
            where: { id: { in: orderedUserFoodIds }, active: true },
          })
        : [],
    ]);

    const foundationMap = new Map(foundationRows.map((r: any) => [r.id, r]));
    const userFoodMap = new Map(userFoodRows.map((r: any) => [r.id, r]));

    const results: RecentFoodEntry[] = [];
    for (const entry of insertionOrder) {
      if (entry.type === "foundation") {
        const row = foundationMap.get(entry.id);
        if (row) results.push({ type: "foundation", data: toFoundationFoodView(row) });
      } else {
        const row = userFoodMap.get(entry.id);
        if (row) results.push({ type: "complex", data: toUserFoodView(row) });
      }
    }

    return results;
  } catch {
    return [];
  }
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

export async function getNutritionBootstrap(
  userId: string,
): Promise<NutritionBootstrap> {
  if (!hasNutritionModels()) {
    return { userFoods: [], retailChains: [], goals: null, recentFoods: [], presets: [] };
  }

  try {
    const [userFoods, retailChains, goals, recentFoods, presetRows] = await Promise.all([
      db.nutritionUserFood.findMany({
        where: { userId, active: true },
        orderBy: { name: "asc" },
      }),
      db.nutritionRetailChain.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      }),
      db.nutritionUserGoals.findUnique({ where: { userId } }),
      getRecentlyLoggedFoods(userId),
      db.nutritionFoodPreset?.findMany?.({
        where: { userId, active: true },
        orderBy: { name: "asc" },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      }) ?? [],
    ]);

    return {
      userFoods: userFoods.map(toUserFoodView),
      retailChains: retailChains.map(toRetailChainView),
      goals: goals ? toGoalsView(goals) : null,
      recentFoods,
      presets: (presetRows ?? []).map(toPresetView),
    };
  } catch {
    return { userFoods: [], retailChains: [], goals: null, recentFoods: [], presets: [] };
  }
}

// ─── Foundation food search ──────────────────────────────────────────────────

export async function searchFoundationFoods(
  query: string,
  limit = 20,
): Promise<FoundationFoodView[]> {
  assertModelsAvailable();
  if (!query.trim()) return [];

  const rows = await db.nutritionFoundationFood.findMany({
    where: { name: { contains: query.trim(), mode: "insensitive" } },
    take: limit,
    orderBy: { name: "asc" },
  });

  return rows.map(toFoundationFoodView);
}

// ─── User food CRUD ──────────────────────────────────────────────────────────

export async function createUserFood(
  userId: string,
  input: CreateUserFoodInput,
): Promise<NutritionUserFoodView> {
  assertModelsAvailable();

  const created = await db.nutritionUserFood.create({
    data: {
      userId,
      name: input.name,
      brand: input.brand,
      nutrients: input.nutrients,
      servingSize: input.servingSize,
      servingUnit: input.servingUnit,
      ingredients: input.ingredients,
    },
  });

  return toUserFoodView(created);
}

export async function searchUserFoods(
  userId: string,
  query: string,
  limit = 20,
): Promise<NutritionUserFoodView[]> {
  assertModelsAvailable();
  if (!query.trim()) return [];

  const rows = await db.nutritionUserFood.findMany({
    where: {
      userId,
      active: true,
      name: { contains: query.trim(), mode: "insensitive" },
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return rows.map(toUserFoodView);
}

// ─── Retail operations ───────────────────────────────────────────────────────

export async function listRetailChains(): Promise<RetailChainView[]> {
  assertModelsAvailable();
  const rows = await db.nutritionRetailChain.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return rows.map(toRetailChainView);
}

export async function searchRetailItems(
  chainId: string,
  query: string,
  userId: string,
  limit = 30,
): Promise<RetailItemView[]> {
  assertModelsAvailable();

  const where = query.trim()
    ? { chainId, active: true, name: { contains: query.trim(), mode: "insensitive" as const } }
    : { chainId, active: true };

  const [globalItems, userItems] = await Promise.all([
    db.nutritionRetailItem.findMany({ where, take: limit, orderBy: { name: "asc" } }),
    db.nutritionRetailUserItem.findMany({
      where: { ...where, userId },
      take: limit,
      orderBy: { name: "asc" },
    }),
  ]);

  return [
    ...globalItems.map((r: any) => toRetailItemView(r, false)),
    ...userItems.map((r: any) => toRetailItemView(r, true)),
  ];
}

export async function createRetailUserItem(
  userId: string,
  input: CreateRetailUserItemInput,
): Promise<RetailItemView> {
  assertModelsAvailable();

  const created = await db.nutritionRetailUserItem.create({
    data: {
      chainId: input.chainId,
      userId,
      name: input.name,
      category: input.category,
      nutrients: input.nutrients,
      servingSize: input.servingSize,
      servingUnit: input.servingUnit,
    },
  });

  return toRetailItemView(created, true);
}

export async function createRetailChain(
  input: CreateRetailChainInput,
): Promise<RetailChainView> {
  assertModelsAvailable();

  const key = generateChainKey(input.name) || `chain-${Date.now().toString(36)}`;
  const created = await db.nutritionRetailChain.create({
    data: { key, name: input.name.trim() },
  });

  return toRetailChainView(created);
}

export async function bulkCreateRetailItems(
  chainId: string,
  items: CreateRetailItemInput[],
): Promise<number> {
  assertModelsAvailable();

  const result = await db.nutritionRetailItem.createMany({
    data: items.map((item) => ({
      chainId,
      name: item.name,
      category: item.category,
      nutrients: item.nutrients,
      servingSize: item.servingSize,
      servingUnit: item.servingUnit,
    })),
  });

  return result.count;
}

// ─── Food preset CRUD ─────────────────────────────────────────────────────────

export async function listFoodPresets(
  userId: string,
): Promise<FoodPresetView[]> {
  assertModelsAvailable();

  const rows = await db.nutritionFoodPreset.findMany({
    where: { userId, active: true },
    orderBy: { name: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return rows.map(toPresetView);
}

export async function createFoodPreset(
  userId: string,
  input: CreateFoodPresetInput,
): Promise<FoodPresetView> {
  assertModelsAvailable();

  return db.$transaction(async (tx: TxClient) => {
    const preset = await tx.nutritionFoodPreset.create({
      data: { userId, name: input.name },
    });

    await tx.nutritionFoodPresetItem.createMany({
      data: input.items.map((item, index) => ({
        presetId: preset.id,
        foodSource: item.foodSource,
        sourceFoodId: item.sourceFoodId,
        foundationFoodId: item.foundationFoodId,
        snapshotName: item.snapshotName,
        snapshotBrand: item.snapshotBrand,
        servings: item.servings,
        portionLabel: item.portionLabel,
        portionGramWeight: item.portionGramWeight,
        nutrients: item.nutrients,
        sortOrder: index,
      })),
    });

    const full = await tx.nutritionFoodPreset.findUnique({
      where: { id: preset.id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    return toPresetView(full);
  });
}

export async function updateFoodPreset(
  userId: string,
  presetId: string,
  input: UpdateFoodPresetInput,
): Promise<FoodPresetView> {
  assertModelsAvailable();

  return db.$transaction(async (tx: TxClient) => {
    const existing = await tx.nutritionFoodPreset.findFirst({
      where: { id: presetId, userId, active: true },
      select: { id: true },
    });

    if (!existing) throw new Error("Preset not found.");

    if (input.name) {
      await tx.nutritionFoodPreset.update({
        where: { id: presetId },
        data: { name: input.name },
      });
    }

    if (input.items) {
      await tx.nutritionFoodPresetItem.deleteMany({ where: { presetId } });
      await tx.nutritionFoodPresetItem.createMany({
        data: input.items.map((item, index) => ({
          presetId,
          foodSource: item.foodSource,
          sourceFoodId: item.sourceFoodId,
          foundationFoodId: item.foundationFoodId,
          snapshotName: item.snapshotName,
          snapshotBrand: item.snapshotBrand,
          servings: item.servings,
          portionLabel: item.portionLabel,
          portionGramWeight: item.portionGramWeight,
          nutrients: item.nutrients,
          sortOrder: index,
        })),
      });
    }

    const full = await tx.nutritionFoodPreset.findUnique({
      where: { id: presetId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    return toPresetView(full);
  });
}

export async function deleteFoodPreset(
  userId: string,
  presetId: string,
): Promise<void> {
  assertModelsAvailable();

  const preset = await db.nutritionFoodPreset.findFirst({
    where: { id: presetId, userId, active: true },
    select: { id: true },
  });

  if (!preset) throw new Error("Preset not found.");

  await db.nutritionFoodPreset.update({
    where: { id: presetId },
    data: { active: false },
  });
}

// ─── Meal session CRUD ───────────────────────────────────────────────────────

export async function createMealSession(
  userId: string,
  input: CreateMealSessionInput,
): Promise<NutritionMealSessionView> {
  assertModelsAvailable();

  return db.$transaction(async (tx: TxClient) => {
    const session = await tx.nutritionMealSession.create({
      data: {
        userId,
        loggedAt: new Date(input.loggedAtIso),
        dateStr: input.dateStr,
        mealLabel: input.mealLabel,
        notes: input.notes,
      },
    });

    await persistMealItems(tx, session.id, input.items);

    const full = await tx.nutritionMealSession.findUnique({
      where: { id: session.id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    return toSessionView(full);
  });
}

export async function listMealSessions(
  userId: string,
  options?: { startDate?: string; endDate?: string },
): Promise<NutritionMealSessionView[]> {
  assertModelsAvailable();

  const dateFilter: any = {};
  if (options?.startDate) dateFilter.gte = options.startDate;
  if (options?.endDate) dateFilter.lte = options.endDate;

  const sessions = await db.nutritionMealSession.findMany({
    where: {
      userId,
      ...(Object.keys(dateFilter).length ? { dateStr: dateFilter } : {}),
    },
    orderBy: { loggedAt: "desc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return sessions.map(toSessionView);
}

export async function getMealSession(
  userId: string,
  sessionId: string,
): Promise<NutritionMealSessionView | null> {
  assertModelsAvailable();

  const session = await db.nutritionMealSession.findFirst({
    where: { id: sessionId, userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return session ? toSessionView(session) : null;
}

export async function updateMealSession(
  userId: string,
  sessionId: string,
  input: CreateMealSessionInput,
): Promise<void> {
  assertModelsAvailable();

  await db.$transaction(async (tx: TxClient) => {
    const existing = await tx.nutritionMealSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });

    if (!existing) throw new Error("Meal session not found.");

    await tx.nutritionMealSession.update({
      where: { id: sessionId },
      data: {
        loggedAt: new Date(input.loggedAtIso),
        dateStr: input.dateStr,
        mealLabel: input.mealLabel,
        notes: input.notes,
      },
    });

    await tx.nutritionMealItem.deleteMany({ where: { sessionId } });
    await persistMealItems(tx, sessionId, input.items);
  });
}

export async function deleteMealSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  assertModelsAvailable();

  const session = await db.nutritionMealSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });

  if (!session) throw new Error("Meal session not found.");

  await db.nutritionMealSession.delete({ where: { id: sessionId } });
}

async function persistMealItems(
  tx: TxClient,
  sessionId: string,
  items: MealItemDraftInput[],
) {
  const allNutrientRows: any[] = [];

  for (const [index, item] of items.entries()) {
    const macros = computeSnapshotMacros(
      item.nutrients as NutrientProfile,
      item.servings,
      item.portionGramWeight,
      item.foodSource,
    );

    const mealItem = await tx.nutritionMealItem.create({
      data: {
        sessionId,
        foodSource: item.foodSource,
        sourceFoodId: item.sourceFoodId,
        foundationFoodId: item.foundationFoodId,
        snapshotName: item.snapshotName,
        snapshotBrand: item.snapshotBrand,
        servings: item.servings,
        portionLabel: item.portionLabel,
        portionGramWeight: item.portionGramWeight,
        sortOrder: index,
        ...macros,
      },
    });

    const nutrientRows = buildNutrientRows(
      mealItem.id,
      item.nutrients as NutrientProfile,
      item.servings,
      item.portionGramWeight,
      item.foodSource,
    );
    allNutrientRows.push(...nutrientRows);
  }

  if (allNutrientRows.length) {
    await tx.nutritionMealItemNutrient.createMany({ data: allNutrientRows });
  }
}

// ─── Macro summary for homepage ──────────────────────────────────────────────

async function getMacroSummaryByDateRangeImpl(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<MacroSummaryByDate[]> {
  if (!hasNutritionModels()) return [];

  try {
    const start = normalizeDateInput(startDate);
    const end = normalizeDateInput(endDate);
    const dayCandidates = new Set<string>();
    const [startY, startM, startD] = start.isoDate.split("-").map(Number);
    const [endY, endM, endD] = end.isoDate.split("-").map(Number);
    const startMs = Date.UTC(startY, startM - 1, startD);
    const endMs = Date.UTC(endY, endM - 1, endD);
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((endMs - startMs) / MS_PER_DAY) + 1;

    if (Number.isFinite(totalDays) && totalDays > 0 && totalDays <= 366) {
      for (let i = 0; i < totalDays; i++) {
        const d = new Date(startMs + i * MS_PER_DAY);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        const compact = `${y}${m}${dd}`;
        const iso = `${y}-${m}-${dd}`;
        dayCandidates.add(compact);
        dayCandidates.add(iso);
      }
    } else {
      for (const candidate of start.sessionDateCandidates) dayCandidates.add(candidate);
      for (const candidate of end.sessionDateCandidates) dayCandidates.add(candidate);
    }

    const candidateArray = Array.from(dayCandidates);
    console.log(`[MACRO-IMPL] querying sessions for user=${userId} dayCandidates=${JSON.stringify(candidateArray)}`);

    const sessions = await db.nutritionMealSession.findMany({
      where: {
        userId,
        dateStr: { in: candidateArray },
      },
      include: {
        items: {
          select: {
            snapshotCalories: true,
            snapshotProtein: true,
            snapshotCarbs: true,
            snapshotFat: true,
          },
        },
      },
    });

    console.log(`[MACRO-IMPL] found ${sessions.length} sessions, dateStrs: ${sessions.map((s: any) => s.dateStr)}`);

    const map = new Map<string, MacroSummaryByDate>();
    for (const session of sessions) {
      const normalizedDate = normalizeDateInput(session.dateStr).compactDateStr;
      let entry = map.get(normalizedDate);
      if (!entry) {
        entry = { dateStr: normalizedDate, calories: 0, protein: 0, carbs: 0, fat: 0 };
        map.set(normalizedDate, entry);
      }
      for (const item of session.items) {
        entry.calories += item.snapshotCalories;
        entry.protein += item.snapshotProtein;
        entry.carbs += item.snapshotCarbs;
        entry.fat += item.snapshotFat;
      }
    }

    return Array.from(map.values());
  } catch {
    return [];
  }
}

/** Cached per user; invalidate with `updateTag(\`macroSummary:${userId}\`)` after meal changes. */
export async function getMacroSummaryByDateRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<MacroSummaryByDate[]> {
  "use cache";
  cacheTag(`macroSummary:${userId}`);
  cacheLife("minutes");

  console.log(`[CACHE-HIT] getMacroSummaryByDateRange EXECUTING (cache miss) user=${userId} ${startDate}-${endDate}`);
  return getMacroSummaryByDateRangeImpl(userId, startDate, endDate);
}

// ─── Micro nutrient summary ──────────────────────────────────────────────────

export interface MicroNutrientEntry {
  nutrientKey: string;
  nutrientName: string;
  amount: number;
  unit: string;
  category: "vitamin" | "mineral" | "other";
}

const MACRO_KEYS = new Set([
  "calories", "protein", "carbs", "fat",
  "saturated-fat", "trans-fat", "fiber", "sugars", "added-sugars",
]);

export async function getMicroNutrientSummary(
  userId: string,
  dateStr: string,
): Promise<MicroNutrientEntry[]> {
  "use cache";
  cacheTag(`microSummary:${userId}`);
  cacheLife("hours");

  if (!hasNutritionModels()) return [];

  try {
    const { isoDate, sessionDateCandidates } = normalizeDateInput(dateStr);
    const [mealNutrients, substanceIngredients] = await Promise.all([
      db.nutritionMealItemNutrient.findMany({
        where: {
          mealItem: {
            session: {
              userId,
              dateStr: { in: sessionDateCandidates },
            },
          },
        },
        select: {
          nutrientKey: true,
          nutrientName: true,
          amount: true,
          unit: true,
        },
      }),
      db.substanceLogItemIngredient.findMany({
        where: {
          logItem: {
            session: {
              userId,
              loggedAt: {
                gte: new Date(`${isoDate}T00:00:00.000Z`),
                lt: new Date(`${isoDate}T23:59:59.999Z`),
              },
            },
          },
        },
        select: {
          ingredientKey: true,
          ingredientName: true,
          amountTotal: true,
          unit: true,
        },
      }),
    ]);

    const totals = new Map<
      string,
      { name: string; amount: number; unit: string }
    >();

    for (const n of mealNutrients) {
      if (MACRO_KEYS.has(n.nutrientKey)) continue;
      const existing = totals.get(n.nutrientKey);
      if (existing) {
        existing.amount += n.amount;
      } else {
        totals.set(n.nutrientKey, {
          name: n.nutrientName,
          amount: n.amount,
          unit: n.unit,
        });
      }
    }

    for (const ing of substanceIngredients) {
      if (!MICRONUTRIENT_KEY_SET.has(ing.ingredientKey)) continue;
      const existing = totals.get(ing.ingredientKey);
      if (existing) {
        existing.amount += ing.amountTotal;
      } else {
        totals.set(ing.ingredientKey, {
          name: ing.ingredientName,
          amount: ing.amountTotal,
          unit: ing.unit,
        });
      }
    }

    const result: MicroNutrientEntry[] = [];
    for (const [key, data] of totals) {
      const meta = NUTRIENT_KEYS[
        Object.keys(NUTRIENT_KEYS).find(
          (k) => NUTRIENT_KEYS[k].key === key,
        ) ?? ""
      ];
      const category: "vitamin" | "mineral" | "other" =
        meta?.category === "vitamin"
          ? "vitamin"
          : meta?.category === "mineral"
            ? "mineral"
            : "other";

      result.push({
        nutrientKey: key,
        nutrientName: meta?.name ?? data.name,
        amount: data.amount,
        unit: meta?.unit ?? data.unit,
        category,
      });
    }

    return result.sort((a, b) => {
      const catOrder = { vitamin: 0, mineral: 1, other: 2 };
      const catDiff = catOrder[a.category] - catOrder[b.category];
      if (catDiff !== 0) return catDiff;
      return a.nutrientName.localeCompare(b.nutrientName);
    });
  } catch {
    return [];
  }
}

// ─── User goals ──────────────────────────────────────────────────────────────

export async function getUserGoals(
  userId: string,
): Promise<NutritionUserGoalsView | null> {
  "use cache";
  cacheTag(`nutritionGoals:${userId}`);
  cacheLife("hours");

  if (!hasNutritionModels()) return null;

  try {
    const row = await db.nutritionUserGoals.findUnique({ where: { userId } });
    return row ? toGoalsView(row) : null;
  } catch {
    return null;
  }
}

export async function upsertUserGoals(
  userId: string,
  input: UpsertUserGoalsInput,
): Promise<NutritionUserGoalsView> {
  assertModelsAvailable();

  const existing = await db.nutritionUserGoals.findUnique({
    where: { userId },
  });

  const next = {
    calories:
      input.calories !== undefined ? input.calories : existing?.calories ?? null,
    protein:
      input.protein !== undefined ? input.protein : existing?.protein ?? null,
    carbs: input.carbs !== undefined ? input.carbs : existing?.carbs ?? null,
    fat: input.fat !== undefined ? input.fat : existing?.fat ?? null,
    microGoals:
      input.microGoals !== undefined
        ? input.microGoals
        : (existing?.microGoals as Record<string, { target: number; unit: string }> | null) ??
          null,
    waterGoalOz:
      input.waterGoalOz !== undefined
        ? input.waterGoalOz
        : existing?.waterGoalOz ?? null,
    sodiumGoalMg:
      input.sodiumGoalMg !== undefined
        ? input.sodiumGoalMg
        : existing?.sodiumGoalMg ?? null,
    potassiumGoalMg:
      input.potassiumGoalMg !== undefined
        ? input.potassiumGoalMg
        : existing?.potassiumGoalMg ?? null,
    magnesiumGoalMg:
      input.magnesiumGoalMg !== undefined
        ? input.magnesiumGoalMg
        : existing?.magnesiumGoalMg ?? null,
  };

  const row = await db.nutritionUserGoals.upsert({
    where: { userId },
    create: {
      userId,
      ...next,
    },
    update: next,
  });

  return toGoalsView(row);
}
