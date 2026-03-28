import { z } from "zod";
import { nutrientProfileSchema } from "@/lib/nutrition/schemas";

export const nutritionSourceTypeSchema = z.enum([
  "csv",
  "xlsx",
  "pdf",
  "html_link",
  "manual_upload",
]);

export const nutritionFetchMethodSchema = z.enum([
  "direct_download",
  "manual_upload_only",
]);

export const nutritionParserPreferenceSchema = z.enum([
  "deterministic_first",
  "ocr_allowed",
]);

export const nutritionIngestionRunStatusSchema = z.enum([
  "queued",
  "fetching",
  "fetched",
  "parsing",
  "staged",
  "needs_source",
  "fetch_failed",
  "review_required",
  "publish_ready",
  "published",
  "rejected",
]);

export const nutritionExtractionMethodSchema = z.enum([
  "csv_parser",
  "xlsx_parser",
  "pdf_table_parser",
  "ocr_llm",
]);

export const nutritionValidationSeveritySchema = z.enum(["hard", "soft", "info"]);

export const createRetailChainSourceSchema = z.object({
  chainId: z.string().min(1),
  sourceName: z.string().trim().min(1),
  sourceUrl: z.string().url().nullable().default(null),
  sourceType: nutritionSourceTypeSchema,
  fetchMethod: nutritionFetchMethodSchema.default("direct_download"),
  parserPreference: nutritionParserPreferenceSchema.default("deterministic_first"),
  active: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
  notes: z.string().trim().nullable().default(null),
});

export const updateRetailChainSourceSchema = z.object({
  sourceName: z.string().trim().min(1).optional(),
  sourceUrl: z.string().url().nullable().optional(),
  sourceType: nutritionSourceTypeSchema.optional(),
  fetchMethod: nutritionFetchMethodSchema.optional(),
  parserPreference: nutritionParserPreferenceSchema.optional(),
  active: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  notes: z.string().trim().nullable().optional(),
  lastVerifiedAtIso: z.string().datetime().nullable().optional(),
});

export const ingestionArtifactInputSchema = z.object({
  sourceUrl: z.string().nullable().default(null),
  sourceType: nutritionSourceTypeSchema,
  fileName: z.string().nullable().default(null),
  mimeType: z.string().nullable().default(null),
  storagePath: z.string().nullable().default(null),
  fileSizeBytes: z.number().int().nonnegative().nullable().default(null),
  checksumSha256: z.string().nullable().default(null),
  httpStatus: z.number().int().nullable().default(null),
});

export const normalizedRetailItemCandidateSchema = z.object({
  name: z.string().trim().min(1),
  normalizedName: z.string().trim().min(1),
  category: z.string().trim().nullable().default(null),
  nutrients: nutrientProfileSchema,
  servingSize: z.number().positive().nullable().default(null),
  servingUnit: z.string().trim().nullable().default(null),
  extractionMethod: nutritionExtractionMethodSchema,
  confidence: z.number().min(0).max(1).nullable().default(null),
});

export const parserWarningSchema = z.object({
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

export const parsedArtifactResultSchema = z.object({
  extractionMethod: nutritionExtractionMethodSchema,
  items: z.array(normalizedRetailItemCandidateSchema),
  warnings: z.array(parserWarningSchema).default([]),
});

export const validationIssueSchema = z.object({
  severity: nutritionValidationSeveritySchema,
  code: z.string().trim().min(1),
  message: z.string().trim().min(1),
  meta: z.record(z.unknown()).optional(),
});

export const stageRetailItemsInputSchema = z.array(
  z.object({
    name: z.string().trim().min(1),
    category: z.string().trim().nullable().default(null),
    nutrients: nutrientProfileSchema,
    servingSize: z.number().positive().nullable().default(null),
    servingUnit: z.string().trim().nullable().default(null),
    extractionMethod: nutritionExtractionMethodSchema.default("ocr_llm"),
    confidence: z.number().min(0).max(1).nullable().default(null),
  }),
);

export const updateRetailStagingItemInputSchema = z.object({
  name: z.string().trim().min(1).optional(),
  category: z.string().trim().nullable().optional(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  servingSize: z.number().positive().nullable().optional(),
  servingUnit: z.string().trim().nullable().optional(),
});

export const setRetailStagingItemApprovalInputSchema = z.object({
  approved: z.boolean(),
});

export type CreateRetailChainSourceInput = z.infer<typeof createRetailChainSourceSchema>;
export type UpdateRetailChainSourceInput = z.infer<typeof updateRetailChainSourceSchema>;
export type IngestionArtifactInput = z.infer<typeof ingestionArtifactInputSchema>;
export type NormalizedRetailItemCandidateInput = z.infer<typeof normalizedRetailItemCandidateSchema>;
export type ParsedArtifactResultInput = z.infer<typeof parsedArtifactResultSchema>;
export type ValidationIssueInput = z.infer<typeof validationIssueSchema>;
export type StageRetailItemsInput = z.infer<typeof stageRetailItemsInputSchema>;
export type UpdateRetailStagingItemInput = z.infer<typeof updateRetailStagingItemInputSchema>;
export type SetRetailStagingItemApprovalInput = z.infer<
  typeof setRetailStagingItemApprovalInputSchema
>;
