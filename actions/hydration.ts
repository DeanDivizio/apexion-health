"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  getUtcBoundsForLocalDate,
  normalizeDateInput,
  toCompactDateStr,
} from "@/lib/dates/dateStr";

const logHydrationSchema = z.object({
  amount: z.number().positive(),
  unit: z.enum(["oz", "ml"]),
});

const ML_PER_OZ = 29.5735;

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

const ELECTROLYTE_KEYS = ["sodium", "potassium", "magnesium"] as const;
type ElectrolyteKey = (typeof ELECTROLYTE_KEYS)[number];

function toMilligrams(amount: number, unit: string | null | undefined): number {
  if (!Number.isFinite(amount)) return 0;
  const normalizedUnit = (unit ?? "mg").trim().toLowerCase();

  if (normalizedUnit === "g" || normalizedUnit === "gram" || normalizedUnit === "grams") {
    return amount * 1000;
  }
  if (normalizedUnit === "mcg" || normalizedUnit === "μg" || normalizedUnit === "ug") {
    return amount / 1000;
  }
  return amount;
}

function resolveElectrolyteKey(
  ingredientKey: string,
  ingredientName: string,
): ElectrolyteKey | null {
  const key = ingredientKey.toLowerCase();
  const name = ingredientName.toLowerCase();

  for (const electrolyte of ELECTROLYTE_KEYS) {
    if (
      key === electrolyte ||
      key.startsWith(`${electrolyte}-`) ||
      name === electrolyte ||
      name.includes(`${electrolyte} `)
    ) {
      return electrolyte;
    }
  }

  return null;
}

export async function logHydrationAction(input: unknown) {
  const userId = await requireUserId();
  const { amount, unit } = logHydrationSchema.parse(input);

  const amountOz = unit === "ml" ? amount / ML_PER_OZ : amount;

  const now = new Date();
  const dateStr = toCompactDateStr(now);

  const result = await prisma.hydrationLog.create({
    data: {
      userId,
      amountOz,
      dateStr,
    },
  });

  updateTag(`hydrationSummary:${userId}`);
  return result;
}

import {
  DEFAULT_WATER_GOAL_OZ,
  DEFAULT_SODIUM_GOAL_MG,
  DEFAULT_POTASSIUM_GOAL_MG,
  DEFAULT_MAGNESIUM_GOAL_MG,
} from "@/lib/nutrition/defaults";

export interface HydrationSummaryView {
  waterOz: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  /** Resolved targets (DB or app defaults) for progress UI */
  waterGoalOz: number;
  sodiumGoalMg: number;
  potassiumGoalMg: number;
  magnesiumGoalMg: number;
}

async function getHydrationSummaryCached(
  userId: string,
  dateStr: string,
  timezoneOffsetMinutes = 0,
): Promise<HydrationSummaryView> {
  "use cache";
  cacheTag(`hydrationSummary:${userId}`);
  cacheLife("hours");

  const { sessionDateCandidates } = normalizeDateInput(dateStr);
  const { startUtc, endUtcExclusive } = getUtcBoundsForLocalDate(
    dateStr,
    timezoneOffsetMinutes,
  );

  const [hydrationLogs, mealNutrients, substanceIngredients, goalsRow] =
    await Promise.all([
      prisma.hydrationLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: startUtc,
            lt: endUtcExclusive,
          },
        },
        select: { amountOz: true },
      }),
      db.nutritionMealItemNutrient
        .findMany({
          where: {
            nutrientKey: { in: ELECTROLYTE_KEYS },
            mealItem: {
              session: {
                userId,
                dateStr: { in: sessionDateCandidates },
              },
            },
          },
          select: { nutrientKey: true, amount: true },
        })
        .catch(() => []),
      db.substanceLogItemIngredient
        .findMany({
          where: {
            logItem: {
              session: {
                userId,
                loggedAt: {
                  gte: startUtc,
                  lt: endUtcExclusive,
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
        })
        .catch(() => []),
      prisma.nutritionUserGoals
        .findUnique({
          where: { userId },
          select: {
            waterGoalOz: true,
            sodiumGoalMg: true,
            potassiumGoalMg: true,
            magnesiumGoalMg: true,
          },
        })
        .catch(() => null),
    ]);

  const waterOz = hydrationLogs.reduce(
    (sum: number, log: { amountOz: number }) => sum + log.amountOz,
    0,
  );

  const electrolytes: Record<string, number> = {
    sodium: 0,
    potassium: 0,
    magnesium: 0,
  };

  for (const n of mealNutrients) {
    if (n.nutrientKey in electrolytes) {
      electrolytes[n.nutrientKey] += n.amount;
    }
  }

  for (const ing of substanceIngredients) {
    const electrolyteKey = resolveElectrolyteKey(
      ing.ingredientKey,
      ing.ingredientName,
    );
    if (electrolyteKey) {
      electrolytes[electrolyteKey] += toMilligrams(ing.amountTotal, ing.unit);
    }
  }

  const waterGoalOz =
    goalsRow?.waterGoalOz != null ? goalsRow.waterGoalOz : DEFAULT_WATER_GOAL_OZ;
  const sodiumGoalMg =
    goalsRow?.sodiumGoalMg != null
      ? goalsRow.sodiumGoalMg
      : DEFAULT_SODIUM_GOAL_MG;
  const potassiumGoalMg =
    goalsRow?.potassiumGoalMg != null
      ? goalsRow.potassiumGoalMg
      : DEFAULT_POTASSIUM_GOAL_MG;
  const magnesiumGoalMg =
    goalsRow?.magnesiumGoalMg != null
      ? goalsRow.magnesiumGoalMg
      : DEFAULT_MAGNESIUM_GOAL_MG;

  return {
    waterOz,
    sodiumMg: electrolytes.sodium,
    potassiumMg: electrolytes.potassium,
    magnesiumMg: electrolytes.magnesium,
    waterGoalOz,
    sodiumGoalMg,
    potassiumGoalMg,
    magnesiumGoalMg,
  };
}

export async function getHydrationSummaryAction(
  dateStr: string,
  timezoneOffsetMinutes = 0,
): Promise<HydrationSummaryView> {
  const userId = await requireUserId();
  return getHydrationSummaryCached(userId, dateStr, timezoneOffsetMinutes);
}
