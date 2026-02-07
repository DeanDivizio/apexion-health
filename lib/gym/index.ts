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

// Variation templates
export {
  // Individual templates
  WIDTH_TEMPLATE,
  PLANE_ANGLE_TEMPLATE,
  GRIP_TEMPLATE,
  CABLE_ATTACHMENT_TEMPLATE,
  RESISTANCE_SOURCE_TEMPLATE,
  BODY_POSITION_TEMPLATE,
  SUPPORT_TEMPLATE,
  UNILATERAL_MODE_TEMPLATE,
  RANGE_OF_MOTION_TEMPLATE,
  CADENCE_TEMPLATE,
  PAUSE_TEMPLATE,
  BAR_TYPE_TEMPLATE,
  GRIP_TECHNIQUE_TEMPLATE,
  GRIP_ASSISTANCE_TEMPLATE,
  FOOT_VERTICAL_POSITION_TEMPLATE,
  FOOT_ANGLE_TEMPLATE,
  HEEL_ELEVATION_TEMPLATE,
  // Registry & utilities
  VARIATION_TEMPLATES,
  VARIATION_TEMPLATE_MAP,
  getVariationOptionLabel,
} from "./variations";

// Exercise definitions & utilities
export {
  // Exercise data
  DEFAULT_EXERCISES,
  DEFAULT_CARDIO_EXERCISES,
  DEFAULT_EXERCISE_GROUPS,
  EXERCISE_MAP,
  // Lookup utilities
  getExerciseByKey,
  isUnilateralExercise,
  getExercisesByCategory,
  getExercisesByMuscle,
  // Display helpers
  CATEGORY_DISPLAY_NAMES,
  // Form defaults
  DEFAULT_STRENGTH_SET,
  DEFAULT_UNILATERAL_SET,
  RPE_LABELS,
} from "./exercises";
