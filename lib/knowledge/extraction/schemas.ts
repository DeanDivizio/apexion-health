import { z } from "zod";

export const entityTypeSchema = z.enum([
  "nutrient",
  "supplement",
  "exercise",
  "biomarker",
  "condition",
  "mechanism",
  "person",
  "food",
]);

export const relationshipPredicateSchema = z.enum([
  "INCREASES",
  "DECREASES",
  "TREATS",
  "PREVENTS",
  "CORRELATES_WITH",
  "CO_OCCURS_WITH",
  "ACTIVATES",
  "INHIBITS",
  "REGULATES",
  "MODULATES",
  "IS_FORM_OF",
  "IS_METABOLITE_OF",
  "IS_PRECURSOR_TO",
  "IS_BIOMARKER_FOR",
  "HAS_MECHANISM",
  "INTERACTS_WITH",
  "SYNERGIZES_WITH",
  "ANTAGONIZES_WITH",
  "REQUIRES",
]);

export const extractedEntitySchema = z.object({
  name: z.string(),
  type: entityTypeSchema,
  aliases: z.array(z.string()),
  description: z.string().optional(),
});

export const extractedRelationshipSchema = z.object({
  subject: z.string(),
  predicate: relationshipPredicateSchema,
  object: z.string(),
  confidence: z.number().min(0).max(1),
  context: z.string(),
});

export const extractedClaimSchema = z.object({
  claimText: z.string(),
  confidence: z.number().min(0).max(1),
  entities: z.array(z.string()),
});

export const entityExtractionResponseSchema = z.object({
  entities: z.array(extractedEntitySchema),
  relationships: z.array(extractedRelationshipSchema),
});

export const claimExtractionResponseSchema = z.object({
  claims: z.array(extractedClaimSchema),
});

export type EntityExtractionResponse = z.infer<typeof entityExtractionResponseSchema>;
export type ClaimExtractionResponse = z.infer<typeof claimExtractionResponseSchema>;
