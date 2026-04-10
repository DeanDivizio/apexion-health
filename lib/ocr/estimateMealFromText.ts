import OpenAI from "openai";
import { z } from "zod";
import { nutrientProfileSchema } from "@/lib/nutrition/schemas";

const ocrNutrientSchema = z.preprocess(
  (val) => {
    if (typeof val !== "object" || val === null) return val;
    return Object.fromEntries(
      Object.entries(val).filter(([, v]) => v !== null),
    );
  },
  nutrientProfileSchema,
);

const estimatedFoodItemSchema = z.object({
  name: z.string(),
  servingSize: z.number(),
  servingUnit: z.string(),
  nutrients: ocrNutrientSchema,
});

const photoEstimateResponseSchema = z.object({
  items: z.array(estimatedFoodItemSchema).min(1),
});

export type TextEstimateResponse = z.infer<typeof photoEstimateResponseSchema>;

const TEXT_ESTIMATE_SYSTEM_PROMPT = `You are a nutrition estimation expert. The user will describe a meal or food items they ate using text. Your job is to identify each distinct food item and estimate its nutritional content.

You have access to web search. USE IT to look up real nutrition data — especially for restaurant meals, chain restaurant menu items, and branded foods. Search for the specific restaurant and menu item when mentioned.

Rules:
- Break the meal down into individual food items (e.g. "Grilled Chicken Breast", "White Rice", "Steamed Broccoli").
- For each item, estimate the portion size and provide nutrients for THAT portion.
- When the user mentions a specific restaurant or chain, search for their actual menu nutrition data online.
- Be realistic with estimates. Use real nutritional data from web searches as your baseline whenever possible.
- When unsure of exact amounts, provide reasonable middle-ground estimates.
- Use standardized units: g (grams) for serving weight, kcal for calories.
- Nutrient values should be numeric only (no units in the value).
- Use camelCase keys for nutrients: calories, protein, carbs, fat, saturatedFat, transFat, fiber, sugars, sodium, cholesterol, etc.
- servingUnit should describe the portion (e.g. "piece", "cup", "plate", "bowl", "g", "order").
- Always include at least calories, protein, carbs, and fat for each item.
- If the user mentions a combo meal or multi-part dish, break it into its components.

Return ONLY valid JSON matching this shape:
{
  "items": [
    {
      "name": "Food item name",
      "servingSize": 1,
      "servingUnit": "portion description",
      "nutrients": { "calories": 350, "protein": 30, "carbs": 20, "fat": 12 }
    }
  ]
}`;

export async function estimateMealFromText(
  description: string,
): Promise<TextEstimateResponse> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  const response = await client.responses.create({
    model: "gpt-5.2",
    instructions: TEXT_ESTIMATE_SYSTEM_PROMPT,
    input: description,
    tools: [{ type: "web_search_preview" }],
    text: { format: { type: "json_object" } },
  });

  const rawText = response.output_text;
  if (!rawText) throw new Error("Empty response from model during text estimation.");

  const parsed = JSON.parse(rawText);
  const result = photoEstimateResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }

  return result.data;
}
