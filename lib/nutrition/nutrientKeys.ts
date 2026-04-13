export interface NutrientMeta {
  key: string;
  name: string;
  unit: string;
  category: "macro" | "vitamin" | "mineral" | "caffeine" | "other";
}

export const NUTRIENT_KEYS: Record<string, NutrientMeta> = {
  // Macros
  calories:     { key: "calories",       name: "Calories",          unit: "kcal",  category: "macro" },
  protein:      { key: "protein",        name: "Protein",           unit: "g",     category: "macro" },
  carbs:        { key: "carbs",          name: "Carbohydrates",     unit: "g",     category: "macro" },
  fat:          { key: "fat",            name: "Total Fat",         unit: "g",     category: "macro" },
  saturatedFat: { key: "saturated-fat",  name: "Saturated Fat",     unit: "g",     category: "macro" },
  transFat:     { key: "trans-fat",      name: "Trans Fat",         unit: "g",     category: "macro" },
  fiber:        { key: "fiber",          name: "Dietary Fiber",     unit: "g",     category: "macro" },
  sugars:       { key: "sugars",         name: "Total Sugars",      unit: "g",     category: "macro" },
  addedSugars:  { key: "added-sugars",   name: "Added Sugars",      unit: "g",     category: "macro" },

  // Vitamins
  vitaminA:     { key: "vitamin-a",      name: "Vitamin A",         unit: "mcg",   category: "vitamin" },
  vitaminC:     { key: "vitamin-c",      name: "Vitamin C",         unit: "mg",    category: "vitamin" },
  vitaminD:     { key: "vitamin-d",      name: "Vitamin D",         unit: "mcg",   category: "vitamin" },
  vitaminE:     { key: "vitamin-e",      name: "Vitamin E",         unit: "mg",    category: "vitamin" },
  vitaminK:     { key: "vitamin-k",      name: "Vitamin K",         unit: "mcg",   category: "vitamin" },
  vitaminB1:    { key: "vitamin-b1",     name: "Thiamin (B1)",      unit: "mg",    category: "vitamin" },
  vitaminB2:    { key: "vitamin-b2",     name: "Riboflavin (B2)",   unit: "mg",    category: "vitamin" },
  vitaminB3:    { key: "vitamin-b3",     name: "Niacin (B3)",       unit: "mg",    category: "vitamin" },
  vitaminB5:    { key: "vitamin-b5",     name: "Pantothenic Acid (B5)", unit: "mg", category: "vitamin" },
  vitaminB6:    { key: "vitamin-b6",     name: "Vitamin B6",        unit: "mg",    category: "vitamin" },
  vitaminB7:    { key: "vitamin-b7",     name: "Biotin (B7)",       unit: "mcg",   category: "vitamin" },
  vitaminB9:    { key: "vitamin-b9",     name: "Folate (B9)",       unit: "mcg",   category: "vitamin" },
  vitaminB12:   { key: "vitamin-b12",    name: "Vitamin B12",       unit: "mcg",   category: "vitamin" },

  // Minerals
  calcium:      { key: "calcium",        name: "Calcium",           unit: "mg",    category: "mineral" },
  iron:         { key: "iron",           name: "Iron",              unit: "mg",    category: "mineral" },
  potassium:    { key: "potassium",      name: "Potassium",         unit: "mg",    category: "mineral" },
  magnesium:    { key: "magnesium",      name: "Magnesium",         unit: "mg",    category: "mineral" },
  sodium:       { key: "sodium",         name: "Sodium",            unit: "mg",    category: "mineral" },
  zinc:         { key: "zinc",           name: "Zinc",              unit: "mg",    category: "mineral" },
  selenium:     { key: "selenium",       name: "Selenium",          unit: "mcg",   category: "mineral" },
  copper:       { key: "copper",         name: "Copper",            unit: "mg",    category: "mineral" },
  manganese:    { key: "manganese",      name: "Manganese",         unit: "mg",    category: "mineral" },
  chromium:     { key: "chromium",       name: "Chromium",          unit: "mcg",   category: "mineral" },
  molybdenum:   { key: "molybdenum",     name: "Molybdenum",        unit: "mcg",   category: "mineral" },
  phosphorus:   { key: "phosphorus",     name: "Phosphorus",        unit: "mg",    category: "mineral" },
  iodine:       { key: "iodine",         name: "Iodine",            unit: "mcg",   category: "mineral" },
  chloride:     { key: "chloride",       name: "Chloride",          unit: "mg",    category: "mineral" },

  // Caffeine
  caffeine:     { key: "caffeine",       name: "Caffeine",          unit: "mg",    category: "caffeine" },

  // Other
  cholesterol:  { key: "cholesterol",    name: "Cholesterol",       unit: "mg",    category: "other" },
  choline:      { key: "choline",        name: "Choline",           unit: "mg",    category: "other" },
  omega3:       { key: "omega-3",        name: "Omega-3",           unit: "mg",    category: "other" },
  omega6:       { key: "omega-6",        name: "Omega-6",           unit: "mg",    category: "other" },
} as const;

export type NutrientKeyId = keyof typeof NUTRIENT_KEYS;

/** Kebab-case keys rolled up from substance logs into the home micronutrient summary (food is unchanged). Excludes macros so meds/supps only contribute catalog micronutrients (e.g. vitamin-d), not drug ingredient keys. */
export const MICRONUTRIENT_KEY_SET = new Set<string>(
  Object.values(NUTRIENT_KEYS)
    .filter((m) => m.category !== "macro")
    .map((m) => m.key),
);

/**
 * Returns metadata for a nutrient by its camelCase profile key.
 * Known nutrients use the canonical NUTRIENT_KEYS entry. Unknown ones
 * get a generated kebab-case key, a humanised name, and a best-guess unit.
 */
export function resolveNutrientMeta(camelKey: string): NutrientMeta {
  const known = NUTRIENT_KEYS[camelKey];
  if (known) return known;

  const kebabKey = camelKey.replace(/([A-Z])/g, "-$1").toLowerCase();
  const name = camelKey
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  return { key: kebabKey, name, unit: "mg", category: "other" };
}
