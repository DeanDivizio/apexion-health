/**
 * Import USDA FoodData Central foundation foods into NutritionFoundationFood.
 *
 * Usage:
 *   npx tsx scripts/import-usda-foundation.ts <path-to-foundation-foods.json>
 *
 * The JSON file should be the "foundationDownload" file from
 * https://fdc.nal.usda.gov/download-datasets
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { readFileSync } from "fs";

const USDA_NUTRIENT_MAP: Record<number, string> = {
  1008: "calories",
  1003: "protein",
  1005: "carbs",
  1004: "fat",
  1258: "saturatedFat",
  1257: "transFat",
  1079: "fiber",
  1063: "sugars",
  1253: "cholesterol",
  1093: "sodium",
  1087: "calcium",
  1089: "iron",
  1092: "potassium",
  1090: "magnesium",
  1106: "vitaminA",
  1162: "vitaminC",
  1114: "vitaminD",
};

interface RawFoodNutrient {
  nutrient: { id: number; name: string; unitName: string };
  amount?: number;
}

interface RawPortion {
  amount: number;
  measureUnit: { name: string };
  gramWeight: number;
  modifier?: string;
}

interface RawFoundationFood {
  fdcId: number;
  description: string;
  foodCategory?: { description: string };
  foodNutrients: RawFoodNutrient[];
  foodPortions?: RawPortion[];
}

function buildNutrientProfile(foodNutrients: RawFoodNutrient[]) {
  const profile: Record<string, number> = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  for (const fn of foodNutrients) {
    const key = USDA_NUTRIENT_MAP[fn.nutrient.id];
    if (key && fn.amount != null) {
      profile[key] = fn.amount;
    }
  }

  return profile;
}

function buildPortions(rawPortions?: RawPortion[]) {
  if (!rawPortions?.length) return null;

  return rawPortions
    .filter((p) => p.gramWeight > 0)
    .map((p) => ({
      amount: p.amount,
      unit: p.measureUnit?.name ?? "serving",
      gramWeight: p.gramWeight,
      modifier: p.modifier ?? undefined,
    }));
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-usda-foundation.ts <path-to-json>");
    process.exit(1);
  }

  console.log(`Reading ${filePath}...`);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const foods: RawFoundationFood[] = raw.FoundationFoods ?? raw;

  console.log(`Found ${foods.length} foundation foods.`);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  const db = prisma as any;
  const BATCH_SIZE = 100;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batch = foods.slice(i, i + BATCH_SIZE);

    for (const food of batch) {
      try {
        const nutrients = buildNutrientProfile(food.foodNutrients);
        const portions = buildPortions(food.foodPortions);

        await db.nutritionFoundationFood.upsert({
          where: { fdcId: food.fdcId },
          create: {
            fdcId: food.fdcId,
            name: food.description,
            category: food.foodCategory?.description ?? null,
            nutrients,
            portions,
            defaultServingSize: 100,
            defaultServingUnit: "g",
          },
          update: {
            name: food.description,
            category: food.foodCategory?.description ?? null,
            nutrients,
            portions,
          },
        });
        imported++;
      } catch (err) {
        console.warn(`Skipped fdcId=${food.fdcId}: ${err}`);
        skipped++;
      }
    }

    console.log(`Progress: ${Math.min(i + BATCH_SIZE, foods.length)}/${foods.length}`);
  }

  console.log(`Done. Imported: ${imported}, Skipped: ${skipped}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
