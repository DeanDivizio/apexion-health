import type { NutrientProfile } from "@/lib/nutrition/types";
import type { NormalizedRetailItemCandidate } from "@/lib/nutrition/ingestion/types";

const NUTRIENT_HEADER_ALIASES: Record<keyof NutrientProfile, string[]> = {
  calories: ["calories", "kcal", "cal", "energy"],
  protein: ["protein", "pro"],
  carbs: ["carbs", "carbohydrates", "carbohydrate", "carb", "total carbs"],
  fat: ["fat", "total fat", "lipid"],
  saturatedFat: ["saturated fat", "sat fat", "saturated"],
  transFat: ["trans fat", "trans"],
  fiber: ["fiber", "dietary fiber"],
  sugars: ["sugars", "total sugars", "sugar"],
  addedSugars: ["added sugars", "added sugar"],
  cholesterol: ["cholesterol"],
  sodium: ["sodium", "salt"],
  calcium: ["calcium"],
  iron: ["iron"],
  potassium: ["potassium"],
  magnesium: ["magnesium"],
  vitaminA: ["vitamin a", "vit a"],
  vitaminC: ["vitamin c", "vit c"],
  vitaminD: ["vitamin d", "vit d"],
};

const ITEM_NAME_HEADER_ALIASES = [
  "item",
  "menu item",
  "product",
  "food",
  "name",
  "description",
];

const CATEGORY_HEADER_ALIASES = ["category", "section", "group", "menu section"];

const SERVING_HEADER_ALIASES = ["serving", "serving size", "portion", "portion size"];

function normalizeHeaderName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeRetailItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findColumnByAliases(
  headers: string[],
  aliases: string[],
): string | null {
  const normalizedHeaderMap = new Map(
    headers.map((header) => [normalizeHeaderName(header), header]),
  );
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeaderName(alias);
    const direct = normalizedHeaderMap.get(normalizedAlias);
    if (direct) return direct;

    const partialMatch = headers.find((header) =>
      normalizeHeaderName(header).includes(normalizedAlias),
    );
    if (partialMatch) return partialMatch;
  }
  return null;
}

function parseFloatFromUnknown(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null) return undefined;
  const asString = String(value).trim();
  if (!asString) return undefined;
  const match = asString.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractServing(value: unknown): { size: number | null; unit: string | null } {
  if (value == null) return { size: null, unit: null };
  const text = String(value).trim();
  if (!text) return { size: null, unit: null };
  const match = text.match(/(-?\d+(\.\d+)?)\s*([a-zA-Z]+)/);
  if (!match) return { size: null, unit: null };
  const size = Number(match[1]);
  if (!Number.isFinite(size) || size <= 0) return { size: null, unit: null };
  const unit = match[3]?.toLowerCase() ?? null;
  return { size, unit };
}

export function mapTabularRecordToCandidate(
  record: Record<string, unknown>,
  extractionMethod: NormalizedRetailItemCandidate["extractionMethod"],
): NormalizedRetailItemCandidate | null {
  const headers = Object.keys(record);
  const nameColumn = findColumnByAliases(headers, ITEM_NAME_HEADER_ALIASES);
  if (!nameColumn) return null;

  const rawName = record[nameColumn];
  const name = String(rawName ?? "").trim();
  if (!name) return null;

  const categoryColumn = findColumnByAliases(headers, CATEGORY_HEADER_ALIASES);
  const category = categoryColumn
    ? String(record[categoryColumn] ?? "").trim() || null
    : null;

  const servingColumn = findColumnByAliases(headers, SERVING_HEADER_ALIASES);
  const serving = servingColumn
    ? extractServing(record[servingColumn])
    : { size: null, unit: null };

  const nutrients: NutrientProfile = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };
  for (const nutrientKey of Object.keys(NUTRIENT_HEADER_ALIASES) as Array<keyof NutrientProfile>) {
    const column = findColumnByAliases(headers, NUTRIENT_HEADER_ALIASES[nutrientKey]);
    if (!column) continue;
    const parsed = parseFloatFromUnknown(record[column]);
    if (parsed == null) continue;
    nutrients[nutrientKey] = parsed;
  }

  return {
    name,
    normalizedName: normalizeRetailItemName(name),
    category,
    nutrients,
    servingSize: serving.size,
    servingUnit: serving.unit,
    extractionMethod,
    confidence: extractionMethod === "ocr_llm" ? 0.65 : 0.92,
  };
}
