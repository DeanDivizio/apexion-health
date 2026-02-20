import { z } from "zod";

export const medicationDraftItemSchema = z.object({
  substanceId: z.string().min(1),
  snapshotName: z.string().min(1),
  doseValue: z.number().nullable().default(null),
  doseUnit: z.string().nullable().default(null),
  compoundServings: z.number().nullable().default(null),
  deliveryMethodId: z.string().nullable().default(null),
  variantId: z.string().nullable().default(null),
  injectionDepth: z.string().nullable().default(null),
});

export const createMedicationLogSessionInputSchema = z.object({
  loggedAtIso: z.string().datetime(),
  presetId: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
  items: z.array(medicationDraftItemSchema).min(1),
});

export const createMedicationPresetInputSchema = z.object({
  name: z.string().trim().min(1),
  items: z.array(medicationDraftItemSchema).min(1),
});

export const substanceIngredientInputSchema = z.object({
  name: z.string().trim().min(1),
  amountPerServing: z.number().positive(),
  unit: z.string().min(1).default("mg"),
});

export const createSubstanceInputSchema = z.object({
  displayName: z.string().trim().min(1),
  isCompound: z.boolean().default(false),
  defaultDoseUnit: z.string().nullable().default(null),
  brand: z.string().trim().nullable().default(null),
  notes: z.string().trim().nullable().default(null),
  methodIds: z.array(z.string().min(1)).default([]),
  ingredients: z.array(substanceIngredientInputSchema).default([]),
});

export type MedicationDraftItemInput = z.infer<typeof medicationDraftItemSchema>;
export type CreateMedicationLogSessionInput = z.infer<
  typeof createMedicationLogSessionInputSchema
>;
export type CreateMedicationPresetInput = z.infer<
  typeof createMedicationPresetInputSchema
>;
export type CreateSubstanceInput = z.infer<typeof createSubstanceInputSchema>;
