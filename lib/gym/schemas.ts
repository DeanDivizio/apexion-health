/**
 * Gym Zod Schemas - Apexion Health
 * 
 * Validation schemas corresponding to types in ./types.ts
 * Used for form validation and API input validation.
 */

import { z } from "zod";

// =============================================================================
// PRIMITIVE SCHEMAS
// =============================================================================

export const muscleGroupSchema = z.enum([
  // Chest
  "chestUpper", "chestMid", "chestLower",
  // Back
  "lats", "trapsUpper", "trapsMid", "trapsLower", "rhomboids", "erectorSpinae",
  // Shoulders
  "deltsFront", "deltsSide", "deltsRear",
  // Arms
  "biceps", "triceps", "forearms",
  // Core
  "absUpper", "absLower", "obliques", "transverseAbs",
  // Lower body
  "quads", "hamstrings", "glutes", "hipFlexors", "adductors", "abductors", "calves",
]);

export const exerciseCategorySchema = z.enum(["upperBody", "lowerBody", "core", "cardio"]);

export const gripTypeSchema = z.enum(["normal", "pronated", "supinated", "neutral", "neutralSupinated"]);

export const strengthRepModeSchema = z.enum(["bilateral", "dualUnilateral"]);

export const movementPlaneSchema = z.enum(["normal", "inclined", "declined", "prone", "supine"]);

export const distanceUnitSchema = z.enum(["km", "mi"]);

// =============================================================================
// EXERCISE DEFINITION SCHEMAS
// =============================================================================

/**
 * Weighted muscle target for an exercise.
 * Weight should be in (0..1] and target sets should sum to ~1.0 (validated below).
 */
export const muscleTargetSchema = z.object({
  muscle: muscleGroupSchema,
  weight: z.number().gt(0).lte(1),
});

/**
 * A set of muscle targets.
 * Validates that weights sum to 1.0 within a small tolerance.
 */
export const muscleTargetsSchema = z
  .array(muscleTargetSchema)
  .min(1, "At least one muscle target is required")
  .refine(
    (targets) => {
      const sum = targets.reduce((acc, t) => acc + t.weight, 0);
      return Math.abs(sum - 1) < 1e-6;
    },
    { message: "Muscle target weights must sum to 1.0" },
  );

/**
 * Reusable variation template schema (portable).
 */
export const variationTemplateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  options: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        order: z.number().optional(),
      }),
    )
    .min(1, "At least one option is required"),
});

/**
 * Exercise-level UI override for a template.
 */
export const variationTemplateOverrideSchema = z.object({
  templateId: z.string().min(1),
  labelOverride: z.string().optional(),
  optionLabelOverrides: z.record(z.string(), z.string()).optional(),
});

/**
 * Variation effect schema (non-portable).
 */
export const variationEffectSchema = z.object({
  multipliers: z.record(muscleGroupSchema, z.number()).optional(),
  deltas: z.record(muscleGroupSchema, z.number()).optional(),
});

/**
 * Per-exercise variation effects: variationId -> optionKey -> effect
 */
export const variationEffectsSchema = z.record(z.string(), z.record(z.string(), variationEffectSchema));

export const exerciseDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Exercise name is required"),
  key: z.string().min(1, "Exercise key is required"),
  category: exerciseCategorySchema,
  baseTargets: muscleTargetsSchema,
  isCustom: z.boolean().optional(),
  isUnilateral: z.boolean().optional(),
  repMode: strengthRepModeSchema.optional(),
  variationTemplates: z.record(z.string(), variationTemplateOverrideSchema).optional(),
  variationEffects: variationEffectsSchema.optional(),
});

export const exerciseGroupSchema = z.object({
  group: exerciseCategorySchema,
  items: z.array(z.string()),
});

// =============================================================================
// WORKOUT DATA SCHEMAS
// =============================================================================

/**
 * Rep count schema with custom validation.
 * Ensures either bilateral is set, OR both left and right are set.
 */
export const repCountSchema = z.object({
  bilateral: z.number().int().min(1).optional(),
  left: z.number().int().min(0).optional(),
  right: z.number().int().min(0).optional(),
}).refine(
  (data) => {
    // Either bilateral is set
    if (data.bilateral !== undefined) {
      return data.left === undefined && data.right === undefined;
    }
    // Or both left and right are set
    return data.left !== undefined && data.right !== undefined;
  },
  {
    message: "Either provide bilateral reps, or both left and right reps",
  }
);

export const strengthSetSchema = z.object({
  weight: z.number().min(0, "Weight cannot be negative"),
  reps: repCountSchema,
  effort: z.number().int().min(0).max(10).optional(),
  duration: z.number().min(0).optional(),
});

export const exerciseModificationsSchema = z.object({
  grip: gripTypeSchema.optional(),
  movementPlane: movementPlaneSchema.optional(),
});

export const strengthExerciseEntrySchema = z.object({
  type: z.literal("strength"),
  exerciseType: z.string().min(1, "Select an exercise"),
  sets: z.array(strengthSetSchema).min(1, "Add at least one set"),
  modifications: exerciseModificationsSchema.optional(),
  variations: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
});

export const cardioExerciseEntrySchema = z.object({
  type: z.literal("cardio"),
  exerciseType: z.string().min(1, "Select an exercise"),
  duration: z.number().min(0.1, "Duration must be greater than 0"),
  distance: z.number().min(0).optional(),
  unit: distanceUnitSchema.optional(),
  variations: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * Discriminated union for exercise entries.
 * Use `type` field to determine which schema applies.
 */
export const exerciseEntrySchema = z.discriminatedUnion("type", [
  strengthExerciseEntrySchema,
  cardioExerciseEntrySchema,
]);

export const workoutSessionSchema = z.object({
  date: z.string().regex(/^\d{8}$/, "Date must be in YYYYMMDD format"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  exercises: z.array(exerciseEntrySchema),
});

// =============================================================================
// USER METADATA SCHEMAS
// =============================================================================

export const exerciseRecordSchema = z.object({
  date: z.string().regex(/^\d{8}$/, "Date must be in YYYYMMDD format"),
  weight: z.number().min(0),
  reps: repCountSchema,
  totalVolume: z.number().min(0),
});

export const exerciseStatsSchema = z.object({
  exerciseKey: z.string().min(1),
  displayName: z.string().min(1),
  category: exerciseCategorySchema,
  mostRecentSession: z.object({
    date: z.string(),
    sets: z.array(strengthSetSchema),
  }).optional(),
  recordSet: exerciseRecordSchema.optional(),
  notes: z.string().optional(),
});

export const gymUserMetaSchema = z.object({
  userID: z.string().min(1),
  customExercises: z.array(exerciseGroupSchema),
  exerciseData: z.record(z.string(), exerciseStatsSchema),
});

// =============================================================================
// FORM STATE SCHEMAS (for react-hook-form)
// =============================================================================

export const dateFormFieldsSchema = z.object({
  month: z.string().regex(/^(0[1-9]|1[0-2])$/, "Invalid month"),
  day: z.string().regex(/^(0[1-9]|[12]\d|3[01])$/, "Invalid day"),
  year: z.string().regex(/^\d{4}$/, "Invalid year"),
});

export const timeFormFieldsSchema = z.object({
  hour: z.string().regex(/^([1-9]|1[0-2])$/, "Invalid hour"),
  minute: z.string().regex(/^[0-5]\d$/, "Invalid minute"),
  ampm: z.enum(["AM", "PM"]),
});

/**
 * Main workout form schema.
 * Used with react-hook-form and zodResolver.
 */
export const workoutFormSchema = z.object({
  date: dateFormFieldsSchema,
  startTime: timeFormFieldsSchema,
  endTime: timeFormFieldsSchema,
  useCurrentEndTime: z.boolean(),
  exercises: z.array(exerciseEntrySchema),
});

// =============================================================================
// INFERRED TYPES (for convenience)
// =============================================================================

export type MuscleGroupSchema = z.infer<typeof muscleGroupSchema>;
export type ExerciseCategorySchema = z.infer<typeof exerciseCategorySchema>;
export type GripTypeSchema = z.infer<typeof gripTypeSchema>;
export type StrengthRepModeSchema = z.infer<typeof strengthRepModeSchema>;
export type MovementPlaneSchema = z.infer<typeof movementPlaneSchema>;
export type DistanceUnitSchema = z.infer<typeof distanceUnitSchema>;

export type ExerciseDefinitionSchema = z.infer<typeof exerciseDefinitionSchema>;
export type ExerciseGroupSchema = z.infer<typeof exerciseGroupSchema>;

export type RepCountSchema = z.infer<typeof repCountSchema>;
export type StrengthSetSchema = z.infer<typeof strengthSetSchema>;
export type ExerciseModificationsSchema = z.infer<typeof exerciseModificationsSchema>;
export type StrengthExerciseEntrySchema = z.infer<typeof strengthExerciseEntrySchema>;
export type CardioExerciseEntrySchema = z.infer<typeof cardioExerciseEntrySchema>;
export type ExerciseEntrySchema = z.infer<typeof exerciseEntrySchema>;
export type WorkoutSessionSchema = z.infer<typeof workoutSessionSchema>;

export type MuscleTargetSchema = z.infer<typeof muscleTargetSchema>;
export type MuscleTargetsSchema = z.infer<typeof muscleTargetsSchema>;
export type VariationTemplateSchema = z.infer<typeof variationTemplateSchema>;
export type VariationTemplateOverrideSchema = z.infer<typeof variationTemplateOverrideSchema>;
export type VariationEffectSchema = z.infer<typeof variationEffectSchema>;
export type VariationEffectsSchema = z.infer<typeof variationEffectsSchema>;

export type ExerciseRecordSchema = z.infer<typeof exerciseRecordSchema>;
export type ExerciseStatsSchema = z.infer<typeof exerciseStatsSchema>;
export type GymUserMetaSchema = z.infer<typeof gymUserMetaSchema>;

export type DateFormFieldsSchema = z.infer<typeof dateFormFieldsSchema>;
export type TimeFormFieldsSchema = z.infer<typeof timeFormFieldsSchema>;
export type WorkoutFormSchema = z.infer<typeof workoutFormSchema>;
