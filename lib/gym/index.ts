/**
 * Gym Module - Apexion Health
 * 
 * Central export point for all gym-related types, schemas, and constants.
 * 
 * Usage:
 *   import { WorkoutSession, workoutFormSchema, DEFAULT_EXERCISES } from "@/lib/gym";
 *   // or
 *   import type { ExerciseEntry } from "@/lib/gym";
 */

// Types
export type {
  // Primitives
  MuscleGroup,
  ExerciseCategory,
  GripType,
  MovementPlane,
  DistanceUnit,
  StrengthRepMode,
  // Weighted targets
  MuscleTarget,
  MuscleTargets,
  // Variations
  VariationTemplate,
  VariationTemplateOverride,
  VariationEffect,
  VariationEffects,
  // Exercise definitions
  ExerciseDefinition,
  ExerciseGroup,
  // Workout data
  RepCount,
  StrengthSet,
  ExerciseModifications,
  StrengthExerciseEntry,
  CardioExerciseEntry,
  ExerciseEntry,
  WorkoutSession,
  // User metadata
  ExerciseRecord,
  ExerciseStats,
  GymUserMeta,
  // Form state
  DateFormFields,
  TimeFormFields,
  WorkoutFormState,
} from "./types";

// Type guards & utilities from types
export {
  isStrengthExercise,
  isCardioExercise,
  isUnilateralReps,
  getTotalReps,
  calculateSetVolume,
  buildExerciseKey,
  // Weighted target utilities
  targetsToMap,
  normalizeTargetMap,
  targetMapToTargets,
  applyVariationEffect,
  computeEffectiveTargets,
} from "./types";

// Zod schemas
export {
  // Primitives
  muscleGroupSchema,
  exerciseCategorySchema,
  gripTypeSchema,
  movementPlaneSchema,
  distanceUnitSchema,
  strengthRepModeSchema,
  // Weighted targets
  muscleTargetSchema,
  muscleTargetsSchema,
  // Variations
  variationTemplateSchema,
  variationTemplateOverrideSchema,
  variationEffectSchema,
  variationEffectsSchema,
  // Definitions
  exerciseDefinitionSchema,
  exerciseGroupSchema,
  // Workout data
  repCountSchema,
  strengthSetSchema,
  exerciseModificationsSchema,
  strengthExerciseEntrySchema,
  cardioExerciseEntrySchema,
  exerciseEntrySchema,
  workoutSessionSchema,
  // User metadata
  exerciseRecordSchema,
  exerciseStatsSchema,
  gymUserMetaSchema,
  // Form state
  dateFormFieldsSchema,
  timeFormFieldsSchema,
  workoutFormSchema,
} from "./schemas";

// Inferred schema types (when you need types derived from schemas)
export type {
  RepCountSchema,
  StrengthSetSchema,
  ExerciseModificationsSchema,
  StrengthExerciseEntrySchema,
  CardioExerciseEntrySchema,
  ExerciseEntrySchema,
  MuscleTargetSchema,
  MuscleTargetsSchema,
  VariationTemplateSchema,
  VariationTemplateOverrideSchema,
  VariationEffectSchema,
  VariationEffectsSchema,
  WorkoutSessionSchema,
  WorkoutFormSchema,
  StrengthRepModeSchema,
} from "./schemas";

// Constants
export {
  // Exercise data
  DEFAULT_EXERCISES,
  DEFAULT_CARDIO_EXERCISES,
  DEFAULT_EXERCISE_GROUPS,
  EXERCISE_MAP,
  // Variation templates (portable)
  WIDTH_TEMPLATE,
  PLANE_TEMPLATE,
  GRIP_TEMPLATE,
  // Lookup utilities
  getExerciseByKey,
  isUnilateralExercise,
  getExercisesByCategory,
  getExercisesByMuscle,
  // Display helpers
  CATEGORY_DISPLAY_NAMES,
  GRIP_DISPLAY_NAMES,
  MOVEMENT_PLANE_DISPLAY_NAMES,
  MUSCLE_GROUP_DISPLAY_NAMES,
  // Defaults
  DEFAULT_STRENGTH_SET,
  DEFAULT_UNILATERAL_SET,
  RPE_LABELS,
} from "./constants";
