import { extractRetailMenuData } from "@/lib/ocr/extractRetailMenuData";
import type {
  NormalizedRetailItemCandidate,
  ParsedArtifactResult,
  NutritionSourceType,
} from "@/lib/nutrition/ingestion/types";
import { normalizeRetailItemName } from "@/lib/nutrition/ingestion/parsers/common";

function sourceTypeToMimeType(sourceType: NutritionSourceType): string {
  switch (sourceType) {
    case "csv":
      return "text/csv";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "pdf":
      return "application/pdf";
    case "manual_upload":
    case "html_link":
    default:
      return "application/octet-stream";
  }
}

function toDataUrl(body: Uint8Array, mimeType: string): string {
  const base64 = Buffer.from(body).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function supportsOcrFallback(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf"
  );
}

export async function parseWithOcrFallback(params: {
  body: Uint8Array;
  chainName: string;
  sourceType: NutritionSourceType;
  mimeType: string | null;
  posthogDistinctId?: string;
}): Promise<ParsedArtifactResult> {
  const detectedMimeType =
    (params.mimeType ?? "").split(";")[0].trim().toLowerCase() ||
    sourceTypeToMimeType(params.sourceType);
  if (!supportsOcrFallback(detectedMimeType)) {
    return {
      extractionMethod: "ocr_llm",
      items: [],
      warnings: [
        {
          code: "ocr_unsupported_mime",
          message: `OCR fallback is not supported for MIME type ${detectedMimeType}.`,
        },
      ],
    };
  }

  const imageData = toDataUrl(params.body, detectedMimeType);
  const extracted = await extractRetailMenuData(
    imageData,
    params.chainName,
    params.posthogDistinctId,
  );

  const items: NormalizedRetailItemCandidate[] = extracted
    .map((item) => {
      const name = item.name?.trim() ?? "";
      if (!name) return null;
      return {
        name,
        normalizedName: normalizeRetailItemName(name),
        category: item.category?.trim() || null,
        nutrients: {
          calories: item.nutrients.calories ?? 0,
          protein: item.nutrients.protein ?? 0,
          carbs: item.nutrients.carbs ?? 0,
          fat: item.nutrients.fat ?? 0,
          saturatedFat: item.nutrients.saturatedFat,
          transFat: item.nutrients.transFat,
          fiber: item.nutrients.fiber,
          sugars: item.nutrients.sugars,
          addedSugars: item.nutrients.addedSugars,
          cholesterol: item.nutrients.cholesterol,
          sodium: item.nutrients.sodium,
          calcium: item.nutrients.calcium,
          iron: item.nutrients.iron,
          potassium: item.nutrients.potassium,
          magnesium: item.nutrients.magnesium,
          vitaminA: item.nutrients.vitaminA,
          vitaminC: item.nutrients.vitaminC,
          vitaminD: item.nutrients.vitaminD,
        },
        servingSize: item.servingSize || null,
        servingUnit: item.servingUnit ?? null,
        extractionMethod: "ocr_llm" as const,
        confidence: 0.65,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    extractionMethod: "ocr_llm",
    items,
    warnings:
      items.length === 0
        ? [
            {
              code: "ocr_no_items",
              message: "OCR fallback returned no extractable menu rows.",
            },
          ]
        : [],
  };
}
