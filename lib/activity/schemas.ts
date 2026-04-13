import { z } from "zod";

export const activityDimensionKindSchema = z.enum([
  "text",
  "number",
  "number_with_unit",
  "date",
  "time",
  "datetime",
  "scale_1_5",
]);

export const activityDimensionConfigSchema = z
  .object({
    allowedUnits: z.array(z.string().min(1)).optional(),
    defaultUnit: z.string().min(1).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    placeholder: z.string().optional(),
  })
  .passthrough();

export const createActivityDimensionSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(80),
  kind: activityDimensionKindSchema,
  required: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
  config: activityDimensionConfigSchema.nullable().optional().default(null),
});

export const createActivityTypeInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().trim().max(32).nullable().optional().default(null),
  icon: z.string().trim().max(32).nullable().optional().default(null),
  dimensions: z.array(createActivityDimensionSchema).default([]),
});

export const updateActivityTypeInputSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  color: z.string().trim().max(32).nullable().optional(),
  icon: z.string().trim().max(32).nullable().optional(),
});

export const updateActivityDimensionsInputSchema = z.object({
  dimensions: z.array(createActivityDimensionSchema),
});

export const activityValueInputSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(80),
  kind: activityDimensionKindSchema,
  textValue: z.string().nullable().optional().default(null),
  numberValue: z.number().nullable().optional().default(null),
  unitValue: z.string().nullable().optional().default(null),
  dateValue: z.string().nullable().optional().default(null),
  timeValue: z.string().nullable().optional().default(null),
  dateTimeValueIso: z.string().datetime().nullable().optional().default(null),
  intValue: z.number().int().nullable().optional().default(null),
  jsonValue: z.unknown().nullable().optional().default(null),
});

export const createActivityLogInputSchema = z.object({
  activityTypeId: z.string().min(1),
  loggedAtIso: z.string().datetime(),
  timezoneOffsetMinutes: z.number().int().optional().default(0),
  values: z.array(activityValueInputSchema),
});

export const listActivityLogsOptionsSchema = z.object({
  startDate: z.string().regex(/^\d{8}$/).optional(),
  endDate: z.string().regex(/^\d{8}$/).optional(),
  activityTypeId: z.string().optional(),
});

export type CreateActivityTypeInput = z.infer<
  typeof createActivityTypeInputSchema
>;
export type UpdateActivityTypeInput = z.infer<
  typeof updateActivityTypeInputSchema
>;
export type UpdateActivityDimensionsInput = z.infer<
  typeof updateActivityDimensionsInputSchema
>;
export type ActivityValueInput = z.infer<typeof activityValueInputSchema>;
export type CreateActivityLogInput = z.infer<typeof createActivityLogInputSchema>;
export type ListActivityLogsOptions = z.infer<
  typeof listActivityLogsOptionsSchema
>;
