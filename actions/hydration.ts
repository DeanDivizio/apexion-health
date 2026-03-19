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

  const ELECTROLYTE_KEYS = ["sodium", "potassium", "magnesium"];

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
            mealItem: { session: { userId, dateStr } },
          },
          select: { nutrientKey: true, amount: true },
        })
        .catch(() => []),
      db.substanceLogItemIngredient
        .findMany({
          where: {
            ingredientKey: { in: ELECTROLYTE_KEYS },
            logItem: {
              session: {
                userId,
                loggedAt: {
                  gte: new Date(`${dateStr}T00:00:00.000Z`),
                  lt: new Date(`${dateStr}T23:59:59.999Z`),
                },
              },
            },
          },
          select: { ingredientKey: true, amountTotal: true },
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
    if (ing.ingredientKey in electrolytes) {
      electrolytes[ing.ingredientKey] += ing.amountTotal;
    }
  }

  return {
    waterOz,
    sodiumMg: electrolytes.sodium,
    potassiumMg: electrolytes.potassium,
    magnesiumMg: electrolytes.magnesium,
  };
}
