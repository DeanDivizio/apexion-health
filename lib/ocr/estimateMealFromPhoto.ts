import { z } from "zod";
import { OpenAI } from "@posthog/ai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getPostHogClient } from "@/lib/posthog-server";
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

export type EstimatedFoodItem = z.infer<typeof estimatedFoodItemSchema>;
export type PhotoEstimateResponse = z.infer<typeof photoEstimateResponseSchema>;

const INITIAL_SYSTEM_PROMPT = `You are a nutrition estimation expert. Given a photo of a meal or food, identify each distinct food item visible and estimate its nutritional content per the portion shown.

Rules:
- Break the meal down into individual food items (e.g. "Grilled Chicken Breast", "White Rice", "Steamed Broccoli").
- For each item, estimate the portion size shown and provide nutrients for THAT portion.
- Be realistic with estimates. Use standard nutritional data as your baseline.
- When unsure of exact amounts, provide reasonable middle-ground estimates.
- Use standardized units: g (grams) for serving weight, kcal for calories.
- Nutrient values should be numeric only (no units in the value).
- Use camelCase keys for nutrients: calories, protein, carbs, fat, saturatedFat, transFat, fiber, sugars, sodium, cholesterol, etc.
- servingUnit should describe the portion (e.g. "piece", "cup", "plate", "bowl", "g").
- Always include at least calories, protein, carbs, and fat for each item.

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

const REFINEMENT_SYSTEM_PROMPT = `You are a nutrition estimation expert. You previously analyzed a photo of a meal and produced an initial estimate. The user has now provided additional context about the meal. Use this context to refine your estimates.

Rules:
- Adjust portion sizes, item names, and nutritional values based on the new context.
- If the user says something contradicts your initial estimate, defer to the user's information.
- If the user provides info about cooking methods, ingredients, or restaurant specifics, factor that in.
- You may add or remove items based on the context (e.g. if the user says "there's also rice underneath").
- Keep following standard nutritional data as your baseline, adjusted by context.
- Use standardized units: g (grams) for serving weight, kcal for calories.
- Nutrient values should be numeric only (no units in the value).
- Use camelCase keys for nutrients: calories, protein, carbs, fat, saturatedFat, transFat, fiber, sugars, sodium, cholesterol, etc.
- Always include at least calories, protein, carbs, and fat for each item.

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

function buildImageContent(imageBase64: string) {
  return [
    { type: "image_url" as const, image_url: { url: imageBase64, detail: "high" as const } },
    { type: "text" as const, text: "Identify each food item in this photo and estimate its nutritional content. Return valid JSON." },
  ];
}

export async function estimateMealFromPhoto(
  imageBase64: string,
  posthogDistinctId?: string,
): Promise<PhotoEstimateResponse> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });

  const response = await client.chat.completions.create({
    model: "gpt-5.2",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: INITIAL_SYSTEM_PROMPT },
      { role: "user", content: buildImageContent(imageBase64) },
    ],
    max_completion_tokens: 32768,
    posthogDistinctId,
  });

  const rawText = response.choices[0]?.message?.content;
  if (!rawText) throw new Error("Empty response from model during photo estimation.");

  const parsed = JSON.parse(rawText);
  const result = photoEstimateResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }

  return result.data;
}

export async function refineMealEstimate(
  imageBase64: string,
  initialEstimate: PhotoEstimateResponse,
  userContext: string,
  posthogDistinctId?: string,
): Promise<PhotoEstimateResponse> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: REFINEMENT_SYSTEM_PROMPT },
    {
      role: "user",
      content: buildImageContent(imageBase64),
    },
    {
      role: "assistant",
      content: JSON.stringify(initialEstimate),
    },
    {
      role: "user",
      content: `Additional context about this meal: ${userContext}\n\nPlease refine your estimates based on this information and return updated JSON.`,
    },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-5.2",
    response_format: { type: "json_object" },
    messages,
    max_completion_tokens: 32768,
    posthogDistinctId,
  });

  const rawText = response.choices[0]?.message?.content;
  if (!rawText) throw new Error("Empty response from model during refinement.");

  const parsed = JSON.parse(rawText);
  const result = photoEstimateResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }

  return result.data;
}
