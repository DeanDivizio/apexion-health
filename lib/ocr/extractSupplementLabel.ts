import { z } from "zod";
import { extractStructuredData } from "./extractStructuredData";

const supplementIngredientSchema = z.object({
  name: z.string(),
  amountPerServing: z.number(),
  unit: z.string(),
});

const supplementLabelSchema = z.object({
  productName: z.string().nullable(),
  brand: z.string().nullable(),
  servingSize: z.string().nullable(),
  ingredients: z.array(supplementIngredientSchema),
});

export type SupplementLabelData = z.infer<typeof supplementLabelSchema>;

const SYSTEM_PROMPT = `You are a supplement label data extractor. Given an image of a Supplement Facts panel, extract the product name, brand, serving size, and every LEAF-LEVEL ingredient with its per-serving amount.

CRITICAL — Exclude blend/group headers:
- Supplement labels often group ingredients under bolded proprietary blend headers like "Vaso-Endure Matrix†", "3-FEINE Stim Matrix†", "Mental Resilience Intensifier†", "Focus Blend", "Greens Complex", "Energy Matrix", etc.
- These headers show a TOTAL amount for the group and are often marked with a dagger (†) or asterisk (*) and are bolded or stylistically distinct from the sub-ingredients listed below them.
- NEVER include these group/blend headers in the ingredients array. They are NOT ingredients.
- ONLY include the individual sub-ingredients listed underneath each group, which have their own individual amounts.
- If a blend header has NO individual sub-ingredients listed (only a group total), then include one entry with the blend name and total amount as a last resort.

Rules:
- Only include leaf-level ingredient rows — the actual substances, not category headers.
- Each ingredient needs a human-readable name, a numeric amountPerServing, and a unit string.
- Standardize units: mg, mcg, g, IU, ml, CFU, billion CFU, etc.
- If the label shows only %DV (no absolute amount), convert using these daily values:
  - Vitamin A: 900mcg, Vitamin C: 90mg, Vitamin D: 20mcg, Vitamin E: 15mg, Vitamin K: 120mcg
  - Thiamin/B1: 1.2mg, Riboflavin/B2: 1.3mg, Niacin/B3: 16mg, Pantothenic Acid/B5: 5mg
  - Vitamin B6: 1.7mg, Biotin/B7: 30mcg, Folate/B9: 400mcg DFE, Vitamin B12: 2.4mcg
  - Calcium: 1300mg, Iron: 18mg, Phosphorus: 1250mg, Iodine: 150mcg, Magnesium: 420mg
  - Zinc: 11mg, Selenium: 55mcg, Copper: 0.9mg, Manganese: 2.3mg, Chromium: 35mcg
  - Molybdenum: 45mcg, Chloride: 2300mg, Potassium: 4700mg, Choline: 550mg, Sodium: 2300mg
- If a %DV conversion is not possible (nutrient not in the list above), skip that ingredient.
- All amounts must be per ONE serving as stated on the label.
- Use the ingredient's common name. "Vitamin D (as Cholecalciferol)" becomes "Vitamin D3". Drop parenthetical forms unless they meaningfully disambiguate.
- servingSize: the label's serving size as-is (e.g. "1 scoop (13.56 g)"). Null if not visible.
- productName: the supplement's name if visible. Null if not visible.
- brand: the manufacturer/brand if visible. Null if not visible.
- Do not invent values. Only include ingredients explicitly listed with a numeric amount.

Return ONLY valid JSON matching this shape:
{
  "productName": string | null,
  "brand": string | null,
  "servingSize": string | null,
  "ingredients": [
    { "name": "Vitamin D3", "amountPerServing": 50, "unit": "mcg" },
    { "name": "Omega-3 (EPA)", "amountPerServing": 360, "unit": "mg" }
  ]
}`;

export async function extractSupplementLabel(
  image: string,
  posthogDistinctId?: string,
): Promise<SupplementLabelData> {
  return extractStructuredData({
    image,
    systemPrompt: SYSTEM_PROMPT,
    responseSchema: supplementLabelSchema,
    posthogDistinctId,
  });
}
