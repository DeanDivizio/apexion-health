/**
 * Backfill selfIngredientKey for simple (non-compound) custom substances
 * that are missing it. This ensures logging them produces
 * SubstanceLogItemIngredient rows, which the hydration summary uses
 * to count electrolytes like potassium, sodium, and magnesium.
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

async function main() {
  const substances = await db.substance.findMany({
    where: {
      isCompound: false,
      selfIngredientKey: null,
      ownerUserId: { not: null },
    },
    select: { id: true, displayName: true },
  });

  if (substances.length === 0) {
    console.log("No simple custom substances need backfilling.");
    return;
  }

  console.log(
    `Found ${substances.length} simple custom substance(s) missing selfIngredientKey:`,
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

  console.log("Backfill complete.");
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
