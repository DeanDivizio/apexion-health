import { z } from "zod";
import { extractStructuredData } from "./extractStructuredData";

function coerceNumeric(val: unknown): number | undefined {
  if (val == null) return undefined;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

const ocrNutrient = z.preprocess(coerceNumeric, z.number().optional());
const ocrNutrientRequired = z.preprocess(
  (val) => coerceNumeric(val) ?? 0,
  z.number().default(0),
);

const ocrNutrientProfileSchema = z.object({
  calories: ocrNutrientRequired,
  protein: ocrNutrientRequired,
  carbs: ocrNutrientRequired,
  fat: ocrNutrientRequired,
  saturatedFat: ocrNutrient,
  transFat: ocrNutrient,
  fiber: ocrNutrient,
  sugars: ocrNutrient,
  addedSugars: ocrNutrient,
  cholesterol: ocrNutrient,
  sodium: ocrNutrient,
  calcium: ocrNutrient,
  iron: ocrNutrient,
  potassium: ocrNutrient,
  magnesium: ocrNutrient,
  vitaminA: ocrNutrient,
  vitaminC: ocrNutrient,
  vitaminD: ocrNutrient,
}).passthrough();

const ocrServingSize = z.preprocess(coerceNumeric, z.number().nullable().default(null));

const retailMenuItemSchema = z.object({
  name: z.string(),
  category: z.string().nullable(),
  servingSize: ocrServingSize,
  servingUnit: z.string().nullable(),
  nutrients: ocrNutrientProfileSchema,
});

const retailMenuResponseSchema = z.object({
  items: z.array(retailMenuItemSchema),
});

export type RetailMenuItemData = z.infer<typeof retailMenuItemSchema>;

function buildSystemPrompt(chainName: string) {
  return `You are a restaurant nutrition data extractor. You are reading a nutrition chart or table from ${chainName}.

Rules:
- Extract EVERY menu item visible in the document or image.
- Recognize common table formats with columns for calories, fat, protein, carbs, sodium, etc.
- Map nutrients to these keys: calories, protein, carbs, fat, saturatedFat, transFat, fiber, sugars, addedSugars, cholesterol, sodium, calcium, iron, potassium, vitaminA, vitaminC, vitaminD.
- Return numeric values ONLY (no units). Example: 680, not "680 kcal".
- If a column header uses abbreviations (Cal, Pro, Carb, etc.), interpret them correctly.
- If there are category headers (e.g., "Entrees", "Sides", "Beverages"), include them in the category field.
- Return null for values not present in the table.
- For ${chainName}, use context about typical menu structure if helpful.

Return ONLY valid JSON:
{
  "items": [
    {
      "name": string,
      "category": string | null,
      "servingSize": number | null,
      "servingUnit": string | null,
      "nutrients": { calories, protein, carbs, fat, ... }
    }
  ]
}`;
}

export async function extractRetailMenuData(
  image: string,
  chainName: string,
  posthogDistinctId?: string,
): Promise<RetailMenuItemData[]> {
  const result = await extractStructuredData({
    image,
    systemPrompt: buildSystemPrompt(chainName),
    responseSchema: retailMenuResponseSchema,
    posthogDistinctId,
  });
  return result.items;
}
