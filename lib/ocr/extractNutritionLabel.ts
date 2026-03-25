import { z } from "zod";
import { extractStructuredData } from "./extractStructuredData";
import { nutrientProfileSchema } from "@/lib/nutrition/schemas";

const nutritionLabelSchema = z.object({
  foodName: z.string().nullable(),
  brand: z.string().nullable(),
  servingSize: z.number(),
  servingUnit: z.string(),
  servingsPerContainer: z.number().nullable(),
  nutrients: nutrientProfileSchema,
  ingredients: z.string().nullable(),
});

export type NutritionLabelData = z.infer<typeof nutritionLabelSchema>;

const SYSTEM_PROMPT = `You are a nutrition label data extractor. Given an image of a nutrition facts label or supplement facts panel, extract ALL visible information into structured JSON.

Rules:
- Extract EVERY nutrient visible on the label — do not skip any.
- Use standardized units: g (grams), mg (milligrams), mcg (micrograms), kcal (kilocalories).
- Nutrient values should NOT have units. Just the numeric value.
- Convert %DV to absolute amounts using standard daily values when possible:
  - Vitamin D: 20mcg, Calcium: 1300mg, Iron: 18mg, Potassium: 4700mg
  - Vitamin A: 900mcg, Vitamin C: 90mg, Vitamin E: 15mg, Vitamin K: 120mcg
  - Thiamin: 1.2mg, Riboflavin: 1.3mg, Niacin: 16mg, Vitamin B6: 1.7mg
  - Folate: 400mcg DFE, Vitamin B12: 2.4mcg, Biotin: 30mcg, Pantothenic Acid: 5mg
  - Choline: 550mg, Phosphorus: 1250mg, Iodine: 150mcg, Magnesium: 420mg
  - Zinc: 11mg, Selenium: 55mcg, Copper: 0.9mg, Manganese: 2.3mg
  - Chromium: 35mcg, Molybdenum: 45mcg, Chloride: 2300mg
- Return null for values not visible on the label.
- If the food name or brand is visible on the image, include those.
- servingSize and servingUnit should reflect the label's "Serving Size" line.
- All nutrient values should be per ONE serving.
- Use these camelCase keys for common nutrients:
  calories, protein, carbs, fat, saturatedFat, transFat, fiber, sugars, addedSugars,
  cholesterol, sodium, calcium, iron, potassium, magnesium,
  vitaminA, vitaminC, vitaminD, vitaminE, vitaminK,
  vitaminB1, vitaminB2, vitaminB3, vitaminB5, vitaminB6, vitaminB7, vitaminB9, vitaminB12,
  zinc, selenium, copper, manganese, chromium, molybdenum, phosphorus, iodine, chloride,
  choline, omega3, omega6
- For any nutrient NOT in the list above, generate a descriptive camelCase key (e.g. "lutein", "lycopene", "coq10").
- Only include nutrients that are visible on the label with a numeric value. Do not invent values.
- Supplement facts panels may not list macros (calories, protein, carbs, fat) — omit any that are absent.
- Do not include labels that are for a group of ingredients (i.e. "Focus Blend", "Active Blend", etc.).
- If grams per serving is available, use that. Serving unit should be an actual unit of measure (e.g. "g", "mg", "mcg", "kcal").
- - this means a serving size of "1/2 cups (55g)" should result in a serving size of 55 and a serving unit of "g".

Return ONLY valid JSON matching this shape:
{
  "foodName": string | null,
  "brand": string | null,
  "servingSize": number,
  "servingUnit": string,
  "servingsPerContainer": number | null,
  "nutrients": { "calories": 200, "protein": 10, ... }, // This is an example. The actual keys and valueswill be the ones defined above, and any others you find.
  "ingredients": string | null
}`;

export async function extractNutritionLabel(
  image: string,
  posthogDistinctId?: string,
): Promise<NutritionLabelData> {
  return extractStructuredData({
    image,
    systemPrompt: SYSTEM_PROMPT,
    responseSchema: nutritionLabelSchema,
    posthogDistinctId,
  });
}
