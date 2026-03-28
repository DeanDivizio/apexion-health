import type { NutrientProfile } from "@/lib/nutrition/types";

export type NutritionSourceType =
  | "csv"
  | "xlsx"
  | "pdf"
  | "html_link"
  | "manual_upload";

export type NutritionFetchMethod = "direct_download" | "manual_upload_only";

export type NutritionParserPreference = "deterministic_first" | "ocr_allowed";

export type NutritionIngestionRunStatus =
  | "queued"
  | "fetching"
  | "fetched"
  | "parsing"
  | "staged"
  | "needs_source"
  | "fetch_failed"
  | "review_required"
  | "publish_ready"
  | "published"
  | "rejected";

export type NutritionExtractionMethod =
  | "csv_parser"
  | "xlsx_parser"
  | "pdf_table_parser"
  | "ocr_llm";

export type NutritionValidationSeverity = "hard" | "soft" | "info";

export interface RetailChainSourceConfig {
  id: string;
  chainId: string;
  sourceName: string;
  sourceUrl: string | null;
  manualStoragePath: string | null;
  manualFileName: string | null;
  manualMimeType: string | null;
  manualFileSizeBytes: number | null;
  manualChecksumSha256: string | null;
  manualUploadedAt: string | null;
  sourceType: NutritionSourceType;
  fetchMethod: NutritionFetchMethod;
  parserPreference: NutritionParserPreference;
  active: boolean;
  priority: number;
  lastVerifiedAt: string | null;
  notes: string | null;
}

export interface IngestionArtifactDescriptor {
  sourceUrl: string | null;
  sourceType: NutritionSourceType;
  fileName: string | null;
  mimeType: string | null;
  storagePath: string | null;
  fileSizeBytes: number | null;
  checksumSha256: string | null;
  httpStatus: number | null;
}

export interface NormalizedRetailItemCandidate {
  name: string;
  normalizedName: string;
  category: string | null;
  nutrients: NutrientProfile;
  servingSize: number | null;
  servingUnit: string | null;
  extractionMethod: NutritionExtractionMethod;
  confidence: number | null;
}

export interface ParserWarning {
  code: string;
  message: string;
}

export interface ParsedArtifactResult {
  extractionMethod: NutritionExtractionMethod;
  items: NormalizedRetailItemCandidate[];
  warnings: ParserWarning[];
}

export interface ValidationIssuePayload {
  severity: NutritionValidationSeverity;
  code: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface ChainPriorityEntry {
  chainId: string;
  chainName: string;
  score: number;
  missingSearches: number;
  userAddedItems: number;
  staleDays: number;
  pinned: boolean;
}
