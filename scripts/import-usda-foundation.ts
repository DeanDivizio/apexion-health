/**
 * Import USDA FoodData Central foundation foods into NutritionFoundationFood.
 *
 * Usage:
 *   npm run seed:usda-foundation
 *   npx tsx scripts/import-usda-foundation.ts [path-to-foundation-foods.json]
 *
 * Defaults to docs/provenance/nutrition/USDA Data/foundationFoodsDec25.json
 * if no path is provided. The JSON file should be the "foundationDownload"
 * file from https://fdc.nal.usda.gov/download-datasets
 */

import { prisma } from "../lib/db/prisma";
import { readFileSync } from "fs";
import { resolve } from "path";

const DEFAULT_DATA_PATH = resolve(
  __dirname,
  "../docs/provenance/nutrition/USDA Data/foundationFoodsDec25.json",
);

const USDA_NUTRIENT_MAP: Record<number, string> = {
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

const USDA_CALORIE_IDS = [1008, 2047, 2048] as const;
const USDA_ENERGY_KJ_ID = 1062;
const VEGETABLES_CATEGORY = "Vegetables and Vegetable Products";

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

  const calorieCandidates = new Map<number, number>();
  let energyKilojoules: number | null = null;
  let hasExplicitEnergy = false;

  for (const fn of foodNutrients) {
    if (fn.amount == null) continue;

    if (USDA_CALORIE_IDS.includes(fn.nutrient.id as (typeof USDA_CALORIE_IDS)[number])) {
      calorieCandidates.set(fn.nutrient.id, fn.amount);
      hasExplicitEnergy = true;
      continue;
    }

    if (fn.nutrient.id === USDA_ENERGY_KJ_ID) {
      energyKilojoules = fn.amount;
      hasExplicitEnergy = true;
      continue;
    }

    const key = USDA_NUTRIENT_MAP[fn.nutrient.id];
    if (key) {
      profile[key] = fn.amount;
    }
  }

  for (const calorieId of USDA_CALORIE_IDS) {
    const calories = calorieCandidates.get(calorieId);
    if (calories != null) {
      profile.calories = calories;
      break;
    }
  }

  if (profile.calories === 0 && energyKilojoules != null) {
    profile.calories = energyKilojoules / 4.184;
  }

  return { profile, hasExplicitEnergy };
}

function buildPortions(rawPortions?: RawPortion[]) {
  if (!rawPortions?.length) return null;

  return rawPortions
    .filter((p) => p.gramWeight > 0)
    .map((p) => ({
      amount: p.amount,
      unit: p.measureUnit?.name ?? "serving",
      gramWeight: p.gramWeight,
      modifier: p.modifier || undefined,
    }));
}

async function main() {
  const filePath = process.argv[2] || DEFAULT_DATA_PATH;

  console.log(`Reading ${filePath}...`);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const foods: RawFoundationFood[] = raw.FoundationFoods ?? raw;

  console.log(`Found ${foods.length} foundation foods.`);

  const db = prisma as any;
  const BATCH_SIZE = 100;
  let imported = 0;
  let skipped = 0;
  let skippedForMissingEnergy = 0;
  let derivedVegetableCalories = 0;

  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    const batch = foods.slice(i, i + BATCH_SIZE);

    for (const food of batch) {
      try {
        const { profile: nutrients, hasExplicitEnergy } = buildNutrientProfile(food.foodNutrients);
        const category = food.foodCategory?.description ?? null;

        if (!hasExplicitEnergy) {
          const canDeriveForVegetableCategory = category === VEGETABLES_CATEGORY;
          if (!canDeriveForVegetableCategory) {
            skippedForMissingEnergy++;
            skipped++;
            continue;
          }

          nutrients.calories = nutrients.protein * 4 + nutrients.carbs * 4 + nutrients.fat * 9;
          derivedVegetableCalories++;
        }

        const portions = buildPortions(food.foodPortions);

        await db.nutritionFoundationFood.upsert({
          where: { fdcId: food.fdcId },
          create: {
            fdcId: food.fdcId,
            name: food.description,
            category,
            nutrients,
            portions,
            defaultServingSize: 100,
            defaultServingUnit: "g",
          },
          update: {
            name: food.description,
            category,
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
  console.log(`Derived vegetable calories: ${derivedVegetableCalories}`);
  console.log(`Skipped for missing energy (non-vegetables): ${skippedForMissingEnergy}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
