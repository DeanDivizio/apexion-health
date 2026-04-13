import { prisma } from "@/lib/db/prisma";
import { cacheTag, cacheLife } from "next/cache";

export interface UserHomePreferencesView {
  showMacroSummary: boolean;
  macroSummarySize: "large" | "small";
  showHydrationSummary: boolean;
  showMicroNutrientSummary: boolean;
  showWorkoutSummary: boolean;
  showMedsSummary: boolean;
  showActivitySummary: boolean;
  componentOrder: string[];
}

const DEFAULTS: UserHomePreferencesView = {
  showMacroSummary: true,
  macroSummarySize: "large",
  showHydrationSummary: true,
  showMicroNutrientSummary: false,
  showWorkoutSummary: true,
  showMedsSummary: true,
  showActivitySummary: true,
  componentOrder: [
    "macroSummary",
    "hydrationSummary",
    "workoutSummary",
    "medsSummary",
    "microNutrientSummary",
    "activitySummary",
  ],
};

export function getDefaults(): UserHomePreferencesView {
  return { ...DEFAULTS, componentOrder: [...DEFAULTS.componentOrder] };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

function hasModel(): boolean {
  return typeof db?.userHomePreferences?.findUnique === "function";
}

function rowToView(row: any): UserHomePreferencesView {
  return {
    showMacroSummary: row.showMacroSummary,
    macroSummarySize: row.macroSummarySize as "large" | "small",
    showHydrationSummary: row.showHydrationSummary,
    showMicroNutrientSummary: row.showMicroNutrientSummary,
    showWorkoutSummary: row.showWorkoutSummary,
    showMedsSummary: row.showMedsSummary,
    showActivitySummary: row.showActivitySummary ?? true,
    componentOrder: row.componentOrder as string[],
  };
}

export async function getUserHomePreferences(
  userId: string,
): Promise<UserHomePreferencesView> {
  "use cache";
  cacheTag(`homePreferences:${userId}`);
  cacheLife("hours");

  if (!hasModel()) return getDefaults();

  try {
    const row = await db.userHomePreferences.findUnique({
      where: { userId },
    });
    if (!row) return getDefaults();
    return rowToView(row);
  } catch {
    return getDefaults();
  }
}

export async function upsertUserHomePreferences(
  userId: string,
  input: Partial<UserHomePreferencesView>,
): Promise<UserHomePreferencesView> {
  if (!hasModel()) {
    throw new Error(
      "UserHomePreferences model is unavailable. Run migrations and regenerate Prisma client.",
    );
  }

  const row = await db.userHomePreferences.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
  return rowToView(row);
}
