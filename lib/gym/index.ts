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
  WeightUnit,
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
  FixedFailureMode,
  FailureMode,
  RepCount,
  StrengthSet,
  StrengthExerciseEntry,
  CardioExerciseEntry,
  ExerciseEntry,
  WorkoutSession,
  // User metadata
  ExerciseRecord,
  ExerciseStats,
  CustomExerciseDefinition,
  VariationPresetSummary,
  SupersetTemplateSummary,
  GymUserMeta,
  // Form state
  DateFormFields,
  TimeFormFields,
  WorkoutFormState,
} from "./types";

// Type guards & utilities from types
export {
  FIXED_FAILURE_MODES,
  isStrengthExercise,
  isCardioExercise,
  isUnilateralReps,
  getTotalReps,
  calculateSetVolume,
  // Weighted target utilities
  targetsToMap,
  normalizeTargetMap,
  targetMapToTargets,
  applyVariationEffect,
  computeEffectiveTargets,
  exerciseStatsKey,
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
  weightUnitSchema,
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
  failureModeSchema,
  repCountSchema,
  strengthSetSchema,
  strengthExerciseEntrySchema,
  cardioExerciseEntrySchema,
  exerciseEntrySchema,
  workoutSessionSchema,
  // User metadata
  exerciseRecordSchema,
  exerciseStatsSchema,
  customExerciseDefinitionSchema,
  gymUserMetaSchema,
  // Form state
  dateFormFieldsSchema,
  timeFormFieldsSchema,
  workoutFormSchema,
  // Action inputs
  createCustomExerciseInputSchema,
  updateCustomExerciseInputSchema,
  listSessionsOptionsSchema,
  updateGymPreferencesSchema,
  repInputStyleSchema,
  updatePersistentExerciseNoteSchema,
  createSupersetTemplateInputSchema,
  supersetTemplateSummarySchema,
} from "./schemas";

// Inferred schema types (when you need types derived from schemas)
export type {
  RepCountSchema,
  StrengthSetSchema,
  StrengthExerciseEntrySchema,
  CardioExerciseEntrySchema,
  ExerciseEntrySchema,
  MuscleTargetSchema,
  MuscleTargetsSchema,
  VariationTemplateSchema,
  VariationTemplateOverrideSchema,
  VariationEffectSchema,
  VariationEffectsSchema,
  CustomExerciseDefinitionSchema,
  WorkoutSessionSchema,
  WorkoutFormSchema,
  StrengthRepModeSchema,
  WeightUnitSchema,
  CreateCustomExerciseInput,
  ListSessionsOptions,
  UpdateGymPreferences,
  UpdateCustomExerciseInput,
  UpdatePersistentExerciseNote,
  RepInputStyle,
  FailureModeSchema,
  CreateSupersetTemplateInput,
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
  RANGE_OF_MOTION_TEMPLATE,
  KNEE_ANGLE_TEMPLATE,
  CADENCE_TEMPLATE,
  PAUSE_TEMPLATE,
  BAR_TYPE_TEMPLATE,
  GRIP_TECHNIQUE_TEMPLATE,
  GRIP_ASSISTANCE_TEMPLATE,
  FOOT_VERTICAL_POSITION_TEMPLATE,
  FOOT_ANGLE_TEMPLATE,
  HEEL_ELEVATION_TEMPLATE,
  SEAT_HEIGHT_TEMPLATE,
  BAR_HEIGHT_TEMPLATE,
  CABLE_HEIGHT_TEMPLATE,
  SEAT_ANGLE_TEMPLATE,
  END_STOP_TEMPLATE,
  BACKREST_DEPTH_TEMPLATE,
  ANKLE_PAD_POSITION_TEMPLATE,
  THIGH_PAD_HEIGHT_TEMPLATE,
  FOOTPLATE_DEPTH_TEMPLATE,
  ARM_PATH_TEMPLATE,
  STANCE_TYPE_TEMPLATE,
  TORSO_LEAN_TEMPLATE,
  ELEVATION_TEMPLATE,
  ACCOMMODATING_RESISTANCE_TEMPLATE,
  ASSISTANCE_TEMPLATE,
  LOADED_BODYWEIGHT_TEMPLATE,
  ISO_HOLD_TEMPLATE,
  EXECUTION_PATTERN_TEMPLATE,
  // Registry & utilities
  VARIATION_TEMPLATES,
  VARIATION_TEMPLATE_MAP,
  getVariationOptionLabel,
} from "./variations";

// Session name & muscle group utilities
export {
  MUSCLE_GROUP_LABELS,
  getMuscleGroupsForExercises,
  generateSessionName,
} from "./sessionName";

// Presets
export type { MovementPreset } from "./presets";
export { getPreset, getPresetsForCategory, getFallbackPreset } from "./presets";

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
  RIR_LABELS,
} from "./exercises";
