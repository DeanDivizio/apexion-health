/**
 * Gym Types - Apexion Health
 * 
 * This file contains all type definitions for the gym/workout tracking vertical.
 * Types are organized into sections:
 * 1. Primitives (muscle groups, categories, enums)
 * 2. Exercise Definitions (what exercises exist)
 * 3. Workout Data (sets, exercises, sessions)
 * 4. User Metadata (stats, PRs, custom exercises)
 */

// =============================================================================
// SECTION 1: PRIMITIVES
// =============================================================================

/**
 * Granular muscle group definitions.
 * Chest and back are broken down into sub-regions for better tracking.
 */
export type MuscleGroup =
  // Chest (broken down by region)
  | "chestUpper"      // Clavicular head - incline movements
  | "chestMid"        // Sternal head - flat movements
  | "chestLower"      // Costal head - decline movements
  // Back (broken down by muscle)
  | "lats"            // Latissimus dorsi - pulldowns, rows
  | "trapsUpper"      // Upper trapezius - shrugs
  | "trapsMid"        // Middle trapezius - rows with retraction
  | "trapsLower"      // Lower trapezius - prone Y-raises
  | "rhomboids"       // Rhomboid major/minor - rows with squeeze
  | "lowerBack"   // Lower back - deadlifts, extensions
  // Shoulders (broken down by head)
  | "deltsFront"      // Anterior deltoid - front raises, pressing
  | "deltsSide"       // Lateral deltoid - lateral raises
  | "deltsRear"       // Posterior deltoid - reverse flyes, face pulls
  // Arms
  | "biceps"
  | "triceps"
  | "forearms"
  // Core
  | "absUpper"        // Upper rectus abdominis
  | "absLower"        // Lower rectus abdominis
  | "obliques"        // Internal/external obliques
  | "transverseAbs"   // Transverse abdominis - deep core
  // Lower body
  | "quads"
  | "hamstrings"
  | "glutes"
  | "hipFlexors"
  | "adductors"       // Inner thigh
  | "abductors"       // Outer hip/glute med
  | "calves";

/**
 * High-level exercise categories for grouping in UI.
 */
export type ExerciseCategory = "upperBody" | "lowerBody" | "core" | "cardio";

/**
 * Grip variations that modify an exercise.
 */
export type GripType = 
  | "normal"
  | "pronated"        // Palms facing down/away
  | "supinated"       // Palms facing up/toward
  | "neutral"         // Palms facing each other
  | "neutralSupinated"; // Hybrid neutral/supinated

/**
 * Body position/angle that modifies an exercise.
 */
export type MovementPlane = 
  | "normal"
  | "inclined"        // Angled upward (e.g., incline bench)
  | "declined"        // Angled downward (e.g., decline bench)
  | "prone"           // Face down
  | "supine";         // Face up

/**
 * Distance units for cardio exercises.
 */
export type DistanceUnit = "km" | "mi";

/**
 * Fixed rep tracking mode for strength exercises.
 */
export type StrengthRepMode = "bilateral" | "dualUnilateral";

// =============================================================================
// SECTION 2: EXERCISE DEFINITIONS
// =============================================================================

/**
 * A single weighted muscle target.
 * We use weights to represent "bias" (ex: incline bench biases chestUpper).
 *
 * Rules:
 * - weights are fractions in (0..1]
 * - within a target set, weights should sum to 1.0 (after normalization)
 */
export interface MuscleTarget {
  muscle: MuscleGroup;
  /** Weight fraction (0..1) */
  weight: number;
}

/**
 * A set of muscle targets for an exercise.
 * Stored as an array so ordering is stable for UI and diffs.
 */
export type MuscleTargets = MuscleTarget[];

/**
 * Portable “variation template” schema.
 *
 * Defines a reusable dimension and its option keys ONCE.
 * Example: width = closest|close|neutral|wide|widest
 *
 * IMPORTANT:
 * Templates do NOT define the effect of an option on muscle weights.
 * Effects live per exercise (and can differ across exercises).
 */
export interface VariationTemplate {
  /** Stable id referenced by exercises and workout entries */
  id: string;
  /** Default user-facing label */
  label: string;
  /** Short UI helper text describing what this dimension controls */
  description: string;
  /** Allowed options (portable keys) */
  options: Array<{
    key: string;
    label: string;
    /** Short UI helper text explaining what selecting this option means */
    description: string;
    /** Optional ordering for UI */
    order?: number;
  }>;
}

/**
 * Exercise-level UI overrides for a reusable variation template.
 *
 * Example:
 * - template: WIDTH_TEMPLATE
 * - bench press: labelOverride = "Grip Width"
 * - squat: labelOverride = "Stance Width"
 *
 * Keys remain identical (saved data stays compatible), only display changes.
 */
export interface VariationTemplateOverride {
  templateId: string;
  /** Override label for this dimension for this exercise */
  labelOverride?: string;
  /** Optional per-option label overrides (keys must match template option keys) */
  optionLabelOverrides?: Record<string, string>;
}

/**
 * A muscle-weight effect applied by selecting a variation option.
 *
 * We support both:
 * - multipliers: scale existing weights (relative emphasis)
 * - deltas: add/subtract absolute weight (explicit shifts)
 *
 * Apply order:
 * 1) multipliers
 * 2) deltas
 * 3) clamp negatives to 0
 * 4) normalize to sum to 1
 */
export interface VariationEffect {
  multipliers?: Partial<Record<MuscleGroup, number>>;
  deltas?: Partial<Record<MuscleGroup, number>>;
}

/**
 * Per-exercise effects for variations.
 * Keyed by:
 * - variationId (template id, ex: "width")
 * - optionKey (ex: "wide")
 */
export type VariationEffects = Record<string, Record<string, VariationEffect>>;

/**
 * Defines an exercise that can be performed.
 * Used to populate exercise pickers and store custom exercises.
 */
export interface ExerciseDefinition {
  /** Unique identifier - UUID for custom exercises, stable string for defaults */
  id: string;
  /** Display name (e.g., "Bench Press") */
  name: string;
  /** camelCase key for storage/lookup (e.g., "benchPress") */
  key: string;
  /** High-level category for grouping */
  category: ExerciseCategory;
  /** Base (canonical) muscle distribution for the exercise. */
  baseTargets: MuscleTargets;
  /** Whether this is a user-created exercise */
  isCustom?: boolean;
  /** Whether this exercise is typically done one side at a time */
  isUnilateral?: boolean;
  /** Fixed rep mode for strength exercises (bilateral vs left/right) */
  repMode?: StrengthRepMode;

  /**
   * Optional exercise variations (mods) supported by this exercise.
   * These reference global templates (by id) and optionally override UI labels.
   */
  variationTemplates?: Record<string, VariationTemplateOverride>;

  /**
   * Optional per-exercise effects for variations.
   * Allows "wide" to mean different things across exercises.
   */
  variationEffects?: VariationEffects;
}

/**
 * Groups exercises by category for UI display.
 * Used in exercise picker dropdowns.
 */
export interface ExerciseGroup {
  group: ExerciseCategory;
  items: string[]; // Array of exercise keys (camelCase)
}

// =============================================================================
// SECTION 3: WORKOUT DATA (Sets, Exercises, Sessions)
// =============================================================================

/**
 * Rep count structure supporting both bilateral and unilateral movements.
 * 
 * For bilateral exercises (both sides together):
 *   { bilateral: 10 }
 * 
 * For unilateral exercises (one side at a time):
 *   { left: 10, right: 8 }
 * 
 * Validation: Either `bilateral` is set, OR both `left` and `right` are set.
 */
export interface RepCount {
  /** Reps for bilateral (both sides together) movements */
  bilateral?: number;
  /** Left side reps for unilateral movements */
  left?: number;
  /** Right side reps for unilateral movements */
  right?: number;
}

/**
 * A single set of a strength exercise.
 */
export interface StrengthSet {
  /** Weight used (in user's preferred unit, typically lbs) */
  weight: number;
  /** Rep count - supports both bilateral and unilateral tracking */
  reps: RepCount;
  /** Rating of Perceived Exertion (1-10, where 10 is failure) */
  effort?: number;
  /** Duration of the set in seconds (for time-under-tension tracking) */
  duration?: number;
}

/**
 * Modifications that alter how an exercise is performed.
 * These modify the exercise key for stats tracking (e.g., "benchPress_inclined_pronated").
 */
export interface ExerciseModifications {
  /** Hand/grip position */
  grip?: GripType;
  /** Body angle/position */
  movementPlane?: MovementPlane;
}

/**
 * A strength exercise entry in a workout.
 */
export interface StrengthExerciseEntry {
  type: "strength";
  /** The exercise key (camelCase, e.g., "benchPress") */
  exerciseType: string;
  /** Array of sets performed */
  sets: StrengthSet[];
  /**
   * Legacy modifications (kept for backward compatibility with current UI).
   * Planned migration: replace with `variations`.
   */
  modifications?: ExerciseModifications;

  /**
   * Exercise-specific variations (preferred long-term).
   * Example: { width: "wide", plane: "incline" }
   */
  variations?: Record<string, string>;
  /** User notes for this exercise instance */
  notes?: string;
}

/**
 * A cardio exercise entry in a workout.
 */
export interface CardioExerciseEntry {
  type: "cardio";
  /** The exercise key (camelCase, e.g., "running") */
  exerciseType: string;
  /** Duration in minutes */
  duration: number;
  /** Distance covered (optional) */
  distance?: number;
  /** Unit for distance */
  unit?: DistanceUnit;
  /**
   * Exercise-specific variations (optional).
   * Example: { terrain: "hills" } (template-driven)
   */
  variations?: Record<string, string>;
  /** User notes for this exercise instance */
  notes?: string;
}

/**
 * Union type for any exercise entry.
 * Use discriminated union on `type` field.
 */
export type ExerciseEntry = StrengthExerciseEntry | CardioExerciseEntry;

/**
 * A complete workout session.
 */
export interface WorkoutSession {
  /** Date in YYYYMMDD format */
  date: string;
  /** Start time (e.g., "9:30 AM") */
  startTime: string;
  /** End time (e.g., "10:45 AM") */
  endTime: string;
  /** All exercises performed in this session */
  exercises: ExerciseEntry[];
}

// =============================================================================
// SECTION 4: USER METADATA (Stats, PRs, Custom Exercises)
// =============================================================================

/**
 * A personal record for an exercise.
 * Volume = weight × total reps (average of left/right for unilateral).
 */
export interface ExerciseRecord {
  /** Date the PR was set (YYYYMMDD) */
  date: string;
  /** Weight used */
  weight: number;
  /** Reps achieved */
  reps: RepCount;
  /** Calculated total volume for comparison */
  totalVolume: number;
}

/**
 * Historical stats for a specific exercise (including modifications).
 * 
 * The `exerciseKey` includes modifications, e.g., "benchPress_inclined_pronated".
 * This allows tracking separate PRs for different variations.
 */
export interface ExerciseStats {
  /** 
   * The full exercise key including modifications.
   * Format: "{exerciseType}" or "{exerciseType}_{grip}_{movementPlane}"
   * Examples: "benchPress", "benchPress_inclined", "lateralRaise_pronated"
   */
  exerciseKey: string;
  /** 
   * Display name for UI (cached at time of first record).
   * Includes modification labels, e.g., "Bench Press (Inclined, Pronated)"
   */
  displayName: string;
  /** Category for grouping in stats views */
  category: ExerciseCategory;
  /** Most recent session where this exercise was performed */
  mostRecentSession?: {
    date: string;
    sets: StrengthSet[];
  };
  /** Personal record (highest volume single set) */
  recordSet?: ExerciseRecord;
  /** Persistent notes about this exercise (form cues, etc.) */
  notes?: string;
}

/**
 * Per-user gym metadata stored in DynamoDB.
 * Contains custom exercises and historical stats.
 */
export interface GymUserMeta {
  /** User ID (Clerk ID) */
  userID: string;
  /** User's custom exercises grouped by category */
  customExercises: ExerciseGroup[];
  /** Stats for each exercise the user has performed */
  exerciseData: Record<string, ExerciseStats>;
}

// =============================================================================
// SECTION 5: FORM STATE (UI-specific, not persisted to DB)
// =============================================================================

/**
 * Date components for form state.
 * Kept separate for easier form field binding.
 */
export interface DateFormFields {
  month: string;  // "01" - "12"
  day: string;    // "01" - "31"
  year: string;   // "2024"
}

/**
 * Time components for form state.
 */
export interface TimeFormFields {
  hour: string;   // "1" - "12"
  minute: string; // "00" - "59"
  ampm: "AM" | "PM";
}

/**
 * Complete workout form state.
 * This is what the form manages internally; it gets transformed
 * to WorkoutSession before submission.
 */
export interface WorkoutFormState {
  date: DateFormFields;
  startTime: TimeFormFields;
  endTime: TimeFormFields;
  /** If true, use current time as end time on submit */
  useCurrentEndTime: boolean;
  /** Exercises being logged */
  exercises: ExerciseEntry[];
}

// =============================================================================
// SECTION 6: TYPE GUARDS & UTILITIES
// =============================================================================

/**
 * Type guard to check if an exercise entry is a strength exercise.
 */
export function isStrengthExercise(entry: ExerciseEntry): entry is StrengthExerciseEntry {
  return entry.type === "strength";
}

/**
 * Type guard to check if an exercise entry is a cardio exercise.
 */
export function isCardioExercise(entry: ExerciseEntry): entry is CardioExerciseEntry {
  return entry.type === "cardio";
}

/**
 * Check if a RepCount represents unilateral tracking.
 */
export function isUnilateralReps(reps: RepCount): boolean {
  return reps.left !== undefined && reps.right !== undefined;
}

/**
 * Get total reps from a RepCount (sum of left + right for unilateral).
 */
export function getTotalReps(reps: RepCount): number {
  if (reps.bilateral !== undefined) {
    return reps.bilateral;
  }
  return (reps.left ?? 0) + (reps.right ?? 0);
}

/**
 * Calculate volume for a set (weight × reps).
 * For unilateral, uses average of left and right.
 */
export function calculateSetVolume(set: StrengthSet): number {
  const { weight, reps } = set;
  if (reps.bilateral !== undefined) {
    return weight * reps.bilateral;
  }
  // For unilateral, use average reps × weight
  const avgReps = ((reps.left ?? 0) + (reps.right ?? 0)) / 2;
  return weight * avgReps;
}

/**
 * Build the exercise key from type and modifications.
 * Used for stats tracking.
 */
export function buildExerciseKey(
  exerciseType: string,
  modifications?: ExerciseModifications
): string {
  if (!modifications) return exerciseType;
  
  const parts = [exerciseType];
  
  if (modifications.grip && modifications.grip !== "normal") {
    parts.push(modifications.grip);
  }
  if (modifications.movementPlane && modifications.movementPlane !== "normal") {
    parts.push(modifications.movementPlane);
  }
  
  return parts.join("_");
}

// =============================================================================
// SECTION 7: WEIGHTED TARGET UTILITIES
// =============================================================================

/**
 * Convert MuscleTargets (array) to a map for computation.
 */
export function targetsToMap(targets: MuscleTargets): Partial<Record<MuscleGroup, number>> {
  const out: Partial<Record<MuscleGroup, number>> = {};
  for (const t of targets) {
    out[t.muscle] = (out[t.muscle] ?? 0) + t.weight;
  }
  return out;
}

/**
 * Normalize a target map so weights sum to 1.0.
 * Filters out zero/negative weights.
 */
export function normalizeTargetMap(map: Partial<Record<MuscleGroup, number>>): Partial<Record<MuscleGroup, number>> {
  const entries = Object.entries(map).filter(([, v]) => typeof v === "number" && v > 0) as Array<[MuscleGroup, number]>;
  const sum = entries.reduce((acc, [, v]) => acc + v, 0);
  if (sum <= 0) return {};

  const normalized: Partial<Record<MuscleGroup, number>> = {};
  for (const [muscle, v] of entries) {
    normalized[muscle] = v / sum;
  }
  return normalized;
}

/**
 * Convert a normalized target map back to MuscleTargets array.
 * Sorted by descending weight for stable display.
 */
export function targetMapToTargets(map: Partial<Record<MuscleGroup, number>>): MuscleTargets {
  return (Object.entries(map) as Array<[MuscleGroup, number]>)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([muscle, weight]) => ({ muscle, weight }));
}

/**
 * Apply a VariationEffect to a target map.
 * (multiplier → delta → clamp)
 */
export function applyVariationEffect(
  base: Partial<Record<MuscleGroup, number>>,
  effect: VariationEffect,
): Partial<Record<MuscleGroup, number>> {
  let out: Partial<Record<MuscleGroup, number>> = { ...base };

  if (effect.multipliers) {
    for (const [muscle, m] of Object.entries(effect.multipliers) as Array<[MuscleGroup, number]>) {
      out[muscle] = (out[muscle] ?? 0) * m;
    }
  }

  if (effect.deltas) {
    for (const [muscle, d] of Object.entries(effect.deltas) as Array<[MuscleGroup, number]>) {
      out[muscle] = (out[muscle] ?? 0) + d;
    }
  }

  for (const k of Object.keys(out) as MuscleGroup[]) {
    if ((out[k] ?? 0) < 0) out[k] = 0;
  }

  return out;
}

/**
 * Compute effective muscle targets given an exercise and selected variations.
 *
 * - starts from exercise.baseTargets
 * - applies each selected variation’s effect (if defined)
 * - normalizes to sum to 1
 */
export function computeEffectiveTargets(
  exercise: Pick<ExerciseDefinition, "baseTargets" | "variationEffects">,
  selectedVariations?: Record<string, string>,
): MuscleTargets {
  let map = targetsToMap(exercise.baseTargets);
  if (!selectedVariations || !exercise.variationEffects) {
    return targetMapToTargets(normalizeTargetMap(map));
  }

  for (const [variationId, optionKey] of Object.entries(selectedVariations)) {
    const effect = exercise.variationEffects?.[variationId]?.[optionKey];
    if (!effect) continue;
    map = applyVariationEffect(map, effect);
  }

  return targetMapToTargets(normalizeTargetMap(map));
}
