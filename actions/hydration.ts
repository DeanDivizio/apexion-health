"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

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

function normalizeDateInputs(dateStr: string): {
  isoDate: string;
  sessionDateCandidates: string[];
} {
  const compactPattern = /^\d{8}$/;
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (compactPattern.test(dateStr)) {
    const isoDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    return { isoDate, sessionDateCandidates: [dateStr, isoDate] };
  }

  if (isoPattern.test(dateStr)) {
    const compact = dateStr.replace(/-/g, "");
    return { isoDate: dateStr, sessionDateCandidates: [dateStr, compact] };
  }

  const digitsOnly = dateStr.replace(/\D/g, "");
  if (digitsOnly.length === 8) {
    const isoDate = `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 6)}-${digitsOnly.slice(6, 8)}`;
    return { isoDate, sessionDateCandidates: [digitsOnly, isoDate] };
  }

  return { isoDate: dateStr, sessionDateCandidates: [dateStr] };
}

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
  const dateStr = now.toISOString().slice(0, 10);

  const result = await prisma.hydrationLog.create({
    data: {
      userId,
      amountOz,
      dateStr,
    },
  });

  updateTag("hydrationSummary");
  return result;
}

export interface HydrationSummaryView {
  waterOz: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
}

export async function getHydrationSummaryAction(
  dateStr: string,
): Promise<HydrationSummaryView> {
  const userId = await requireUserId();
  const { isoDate, sessionDateCandidates } = normalizeDateInputs(dateStr);

  const [hydrationLogs, mealNutrients, substanceIngredients] =
    await Promise.all([
      prisma.hydrationLog.findMany({
        where: { userId, dateStr },
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
        })
        .catch(() => []),
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

  return {
    waterOz,
    sodiumMg: electrolytes.sodium,
    potassiumMg: electrolytes.potassium,
    magnesiumMg: electrolytes.magnesium,
  };
}
