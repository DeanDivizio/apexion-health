/**
 * Backfill for simple (non-compound) custom substances:
 *
 * 1. Sets selfIngredientKey on substances that are missing it.
 * 2. Creates missing SubstanceLogItemIngredient rows for existing log items
 *    that have a doseValue but no ingredient rows (because selfIngredientKey
 *    was null at log time).
 *
 * Usage:
 *   npx tsx --require dotenv/config scripts/backfill-substance-self-ingredient-key.ts
 */

import { prisma } from "../lib/db/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = prisma as any;

function generateKey(displayName: string): string {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

async function backfillSubstanceKeys() {
  const substances = await db.substance.findMany({
    where: {
      isCompound: false,
      selfIngredientKey: null,
      ownerUserId: { not: null },
    },
    select: { id: true, displayName: true },
  });

  if (substances.length === 0) {
    console.log("[Step 1] No simple custom substances need key backfilling.");
    return;
  }

  console.log(
    `[Step 1] Found ${substances.length} simple custom substance(s) missing selfIngredientKey:`,
  );

  for (const sub of substances) {
    const selfIngredientKey = generateKey(sub.displayName) || null;
    if (!selfIngredientKey) {
      console.log(`  SKIP "${sub.displayName}" — could not derive a key`);
      continue;
    }

    await db.substance.update({
      where: { id: sub.id },
      data: { selfIngredientKey },
    });
    console.log(
      `  Updated "${sub.displayName}" → selfIngredientKey="${selfIngredientKey}"`,
    );
  }
}

async function backfillLogItemIngredients() {
  const logItems = await db.substanceLogItem.findMany({
    where: {
      doseValue: { not: null, gt: 0 },
      substance: {
        isCompound: false,
        selfIngredientKey: { not: null },
      },
      ingredients: { none: {} },
    },
    select: {
      id: true,
      doseValue: true,
      doseUnit: true,
      substance: {
        select: {
          displayName: true,
          selfIngredientKey: true,
        },
      },
    },
  });

  if (logItems.length === 0) {
    console.log("[Step 2] No log items need ingredient backfilling.");
    return;
  }

  console.log(
    `[Step 2] Found ${logItems.length} log item(s) missing ingredient rows:`,
  );

  const ingredientRows = logItems.map((item: any) => ({
    logItemId: item.id,
    sourceIngredientId: null,
    ingredientKey: item.substance.selfIngredientKey,
    ingredientName: item.substance.displayName,
    amountTotal: item.doseValue,
    unit: item.doseUnit ?? "mg",
    sourceAmountPerServing: item.doseValue,
    sourceServings: 1,
  }));

  await db.substanceLogItemIngredient.createMany({ data: ingredientRows });

  for (const item of logItems) {
    console.log(
      `  Created ingredient row for "${item.substance.displayName}" — ${item.doseValue} ${item.doseUnit ?? "mg"}`,
    );
  }
}

async function main() {
  await backfillSubstanceKeys();
  await backfillLogItemIngredients();
  console.log("Backfill complete.");
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
