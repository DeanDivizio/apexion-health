export const NUTRIENT_KEYS = {
  calories:     { key: "calories",      name: "Calories",       unit: "kcal",  category: "macro" },
  protein:      { key: "protein",       name: "Protein",        unit: "g",     category: "macro" },
  carbs:        { key: "carbs",         name: "Carbohydrates",  unit: "g",     category: "macro" },
  fat:          { key: "fat",           name: "Total Fat",      unit: "g",     category: "macro" },
  saturatedFat: { key: "saturated-fat", name: "Saturated Fat",  unit: "g",     category: "macro" },
  transFat:     { key: "trans-fat",     name: "Trans Fat",      unit: "g",     category: "macro" },
  fiber:        { key: "fiber",         name: "Dietary Fiber",  unit: "g",     category: "macro" },
  sugars:       { key: "sugars",        name: "Total Sugars",   unit: "g",     category: "macro" },
  addedSugars:  { key: "added-sugars",  name: "Added Sugars",   unit: "g",     category: "macro" },
  cholesterol:  { key: "cholesterol",   name: "Cholesterol",    unit: "mg",    category: "other" },
  sodium:       { key: "sodium",        name: "Sodium",         unit: "mg",    category: "mineral" },
  calcium:      { key: "calcium",       name: "Calcium",        unit: "mg",    category: "mineral" },
  iron:         { key: "iron",          name: "Iron",           unit: "mg",    category: "mineral" },
  potassium:    { key: "potassium",     name: "Potassium",      unit: "mg",    category: "mineral" },
  magnesium:    { key: "magnesium",     name: "Magnesium",      unit: "mg",    category: "mineral" },
  vitaminA:     { key: "vitamin-a",     name: "Vitamin A",      unit: "mcg",   category: "vitamin" },
  vitaminC:     { key: "vitamin-c",     name: "Vitamin C",      unit: "mg",    category: "vitamin" },
  vitaminD:     { key: "vitamin-d",     name: "Vitamin D",      unit: "mcg",   category: "vitamin" },
} as const;

export type NutrientKeyId = keyof typeof NUTRIENT_KEYS;
