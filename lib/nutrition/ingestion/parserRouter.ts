import type {
  NutritionParserPreference,
  NutritionSourceType,
  ParsedArtifactResult,
} from "@/lib/nutrition/ingestion/types";
import { parseCsvArtifact } from "@/lib/nutrition/ingestion/parsers/csvParser";
import { parsePdfArtifact } from "@/lib/nutrition/ingestion/parsers/pdfTableParser";
import { parseWithOcrFallback } from "@/lib/nutrition/ingestion/parsers/ocrParser";
import { parseXlsxArtifact } from "@/lib/nutrition/ingestion/parsers/xlsxParser";

interface ParserRouterInput {
  body: Uint8Array;
  sourceType: NutritionSourceType;
  parserPreference: NutritionParserPreference;
  chainName: string;
  mimeType: string | null;
  posthogDistinctId?: string;
}

export async function parseRetailArtifact(
  input: ParserRouterInput,
): Promise<ParsedArtifactResult> {
  let deterministic: ParsedArtifactResult = {
    extractionMethod: "ocr_llm",
    items: [],
    warnings: [
      {
        code: "unsupported_source_type",
        message: `No deterministic parser configured for source type ${input.sourceType}.`,
      },
    ],
  };

  if (input.sourceType === "csv") {
    deterministic = parseCsvArtifact(input.body);
  } else if (input.sourceType === "xlsx") {
    deterministic = parseXlsxArtifact(input.body);
  } else if (input.sourceType === "pdf") {
    deterministic = await parsePdfArtifact(input.body);
  }

  if (
    deterministic.items.length === 0 &&
    input.parserPreference === "ocr_allowed"
  ) {
    const fallback = await parseWithOcrFallback({
      body: input.body,
      chainName: input.chainName,
      sourceType: input.sourceType,
      mimeType: input.mimeType,
      posthogDistinctId: input.posthogDistinctId,
    });
    return {
      extractionMethod: fallback.extractionMethod,
      items: fallback.items,
      warnings: [...deterministic.warnings, ...fallback.warnings],
    };
  }

  return deterministic;
}
