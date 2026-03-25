import { z } from "zod";
import { extractStructuredData } from "./extractStructuredData";
import { nutrientProfileSchema } from "@/lib/nutrition/schemas";

const retailMenuItemSchema = z.object({
  name: z.string(),
  category: z.string().nullable(),
  servingSize: z.number().nullable(),
  servingUnit: z.string().nullable(),
  nutrients: nutrientProfileSchema,
});

const retailMenuResponseSchema = z.object({
  items: z.array(retailMenuItemSchema),
});

export type RetailMenuItemData = z.infer<typeof retailMenuItemSchema>;

function buildSystemPrompt(chainName: string) {
  return `You are a restaurant nutrition data extractor. You are reading a nutrition chart or table from ${chainName}.

Rules:
- Extract EVERY menu item visible in the image.
- Recognize common table formats with columns for calories, fat, protein, carbs, sodium, etc.
- Map nutrients to these keys: calories, protein, carbs, fat, saturatedFat, transFat, fiber, sugars, addedSugars, cholesterol, sodium, calcium, iron, potassium, vitaminA, vitaminC, vitaminD.
- Use standardized units: g, mg, mcg, kcal.
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
