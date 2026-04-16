import { z } from "zod";

export const labResultItemInputSchema = z.object({
  markerId: z.string().uuid(),
  value: z.number(),
  unit: z.string(),
  rangeLow: z.number().nullable().optional(),
  rangeHigh: z.number().nullable().optional(),
  flag: z.enum(["H", "L"]).nullable().optional(),
  rawName: z.string(),
});

export type LabResultItemInput = z.infer<typeof labResultItemInputSchema>;

export const confirmLabReportInputSchema = z.object({
  reportDate: z.string(),
  drawTime: z.string().nullable().optional(),
  institution: z.string().nullable().optional(),
  providerName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  results: z.array(labResultItemInputSchema),
  newAliases: z
    .array(
      z.object({
        rawName: z.string(),
        markerId: z.string().uuid(),
      }),
    )
    .optional(),
  file: z
    .object({
      base64: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      encrypted: z.boolean(),
    })
    .nullable()
    .optional(),
});

export type ConfirmLabReportInput = z.infer<typeof confirmLabReportInputSchema>;
