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

const SYSTEM_PROMPT = `You are a nutrition label data extractor. Given an image of a nutrition facts label, extract ALL visible information into structured JSON.

Rules:
- Extract every nutrient visible on the label.
- Use standardized units: g (grams), mg (milligrams), mcg (micrograms), kcal (kilocalories).
- Convert %DV to absolute amounts using standard daily values when possible:
  - Vitamin D: 20mcg DV, Calcium: 1300mg DV, Iron: 18mg DV, Potassium: 4700mg DV
  - Vitamin A: 900mcg DV, Vitamin C: 90mg DV
- Return null for values not visible on the label.
- If the food name or brand is visible on the image, include those.
- servingSize and servingUnit should reflect the label's "Serving Size" line.
- All nutrient values should be per ONE serving.
- Map nutrients to these keys: calories, protein, carbs, fat, saturatedFat, transFat, fiber, sugars, addedSugars, cholesterol, sodium, calcium, iron, potassium, magnesium, vitaminA, vitaminC, vitaminD.

Return ONLY valid JSON matching this shape:
{
  "foodName": string | null,
  "brand": string | null,
  "servingSize": number,
  "servingUnit": string,
  "servingsPerContainer": number | null,
  "nutrients": { calories, protein, carbs, fat, ... },
  "ingredients": string | null
}`;

export async function extractNutritionLabel(
  image: string,
): Promise<NutritionLabelData> {
  return extractStructuredData({
    image,
    systemPrompt: SYSTEM_PROMPT,
    responseSchema: nutritionLabelSchema,
  });
}
