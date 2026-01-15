/**
 * Gym Constants - Apexion Health
 * 
 * Default exercise lists and configuration.
 * This is the single source of truth for built-in exercises.
 */

import type {
  ExerciseDefinition,
  ExerciseGroup,
  MuscleGroup,
  VariationTemplate,
} from "./types";

// =============================================================================
// VARIATION TEMPLATES (portable)
// =============================================================================

/**
 * Portable “width” template used across exercises.
 * Note: exercises can override the display label (e.g., Grip Width vs Stance Width).
 */
export const WIDTH_TEMPLATE: VariationTemplate = {
  id: "width",
  label: "Width",
  options: [
    { key: "closest", label: "Closest", order: 1 },
    { key: "close", label: "Close", order: 2 },
    { key: "neutral", label: "Neutral", order: 3 },
    { key: "wide", label: "Wide", order: 4 },
    { key: "widest", label: "Widest", order: 5 },
  ],
};

/**
 * Portable “plane” template (decline/flat/incline).
 */
export const PLANE_TEMPLATE: VariationTemplate = {
  id: "plane",
  label: "Plane",
  options: [
    { key: "decline", label: "Decline", order: 1 },
    { key: "flat", label: "Flat", order: 2 },
    { key: "incline", label: "Incline", order: 3 },
  ],
};

/**
 * Portable “grip” template.
 */
export const GRIP_TEMPLATE: VariationTemplate = {
  id: "grip",
  label: "Grip",
  options: [
    { key: "normal", label: "Normal", order: 1 },
    { key: "pronated", label: "Pronated", order: 2 },
    { key: "supinated", label: "Supinated", order: 3 },
    { key: "neutral", label: "Neutral", order: 4 },
    { key: "neutralSupinated", label: "Neutral/Supinated", order: 5 },
  ],
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Helper for creating a normalized muscle target list.
 * Throws if weights don't sum to 1.0 (prevents subtle analytics bugs).
 */
function targets(...pairs: Array<[MuscleGroup, number]>) {
  const sum = pairs.reduce((acc, [, w]) => acc + w, 0);
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`Muscle targets must sum to 1.0. Got ${sum}`);
  }
  return pairs.map(([muscle, weight]) => ({ muscle, weight }));
}

// =============================================================================
// DEFAULT EXERCISE DEFINITIONS
// =============================================================================

/**
 * Complete definitions for all built-in exercises.
 * Includes muscle group targeting for future analytics features.
 */
const RAW_DEFAULT_EXERCISES: ExerciseDefinition[] = [
  // ===== UPPER BODY - CHEST =====
  {
    id: "benchPress",
    name: "Bench Press",
    key: "benchPress",
    category: "upperBody",
    baseTargets: targets(
      ["chestMid", 0.58],
      ["chestUpper", 0.12],
      ["chestLower", 0.08],
      ["deltsFront", 0.12],
      ["triceps", 0.10],
    ),
    variationTemplates: {
      width: { templateId: WIDTH_TEMPLATE.id, labelOverride: "Grip Width" },
      plane: { templateId: PLANE_TEMPLATE.id, labelOverride: "Bench Angle" },
    },
    variationEffects: {
      width: {
        closest: { deltas: { triceps: +0.08, chestMid: -0.06, deltsFront: +0.02 } },
        close: { deltas: { triceps: +0.05, chestMid: -0.04, deltsFront: +0.01 } },
        neutral: {},
        wide: { deltas: { chestMid: +0.05, triceps: -0.04, deltsFront: -0.01 } },
        widest: { deltas: { chestMid: +0.07, triceps: -0.06, deltsFront: -0.01 } },
      },
      plane: {
        incline: { deltas: { chestUpper: +0.10, chestLower: -0.07, deltsFront: +0.03 } },
        flat: {},
        decline: { deltas: { chestLower: +0.10, chestUpper: -0.07, deltsFront: -0.03 } },
      },
    },
  },
  {
    id: "chestPress",
    name: "Chest Press",
    key: "chestPress",
    category: "upperBody",
    baseTargets: targets(
      ["chestMid", 0.60],
      ["chestUpper", 0.12],
      ["chestLower", 0.08],
      ["deltsFront", 0.10],
      ["triceps", 0.10],
    ),
  },
  {
    id: "pecFly",
    name: "Pec Fly",
    key: "pecFly",
    category: "upperBody",
    baseTargets: targets(
      ["chestMid", 0.70],
      ["chestUpper", 0.15],
      ["chestLower", 0.15],
    ),
  },
  {
    id: "pushUp",
    name: "Push Up",
    key: "pushUp",
    category: "upperBody",
    baseTargets: targets(
      ["chestMid", 0.55],
      ["deltsFront", 0.15],
      ["triceps", 0.20],
      ["absUpper", 0.10],
    ),
  },
  
  // ===== UPPER BODY - BACK =====
  {
    id: "lateralPulldown",
    name: "Lateral Pulldown",
    key: "lateralPulldown",
    category: "upperBody",
    baseTargets: targets(
      ["lats", 0.62],
      ["rhomboids", 0.18],
      ["trapsLower", 0.10],
      ["biceps", 0.10],
    ),
    variationTemplates: {
      width: { templateId: WIDTH_TEMPLATE.id, labelOverride: "Handle Width" },
    },
    variationEffects: {
      width: {
        closest: { deltas: { rhomboids: +0.06, lats: -0.06 } },
        close: { deltas: { rhomboids: +0.03, lats: -0.03 } },
        neutral: {},
        wide: { deltas: { lats: +0.04, rhomboids: -0.04 } },
        widest: { deltas: { lats: +0.06, rhomboids: -0.06 } },
      },
    },
  },
  {
    id: "seatedRow",
    name: "Seated Row",
    key: "seatedRow",
    category: "upperBody",
    baseTargets: targets(
      ["lats", 0.45],
      ["rhomboids", 0.30],
      ["trapsMid", 0.15],
      ["biceps", 0.10],
    ),
  },
  {
    id: "pullUp",
    name: "Pull Up",
    key: "pullUp",
    category: "upperBody",
    baseTargets: targets(
      ["lats", 0.55],
      ["biceps", 0.20],
      ["rhomboids", 0.15],
      ["deltsRear", 0.10],
    ),
  },
  {
    id: "rearDelt",
    name: "Rear Delt",
    key: "rearDelt",
    category: "upperBody",
    baseTargets: targets(
      ["deltsRear", 0.65],
      ["rhomboids", 0.20],
      ["trapsMid", 0.15],
    ),
  },
  
  // ===== UPPER BODY - SHOULDERS =====
  {
    id: "lateralRaise",
    name: "Lateral Raise",
    key: "lateralRaise",
    category: "upperBody",
    baseTargets: targets(
      ["deltsSide", 0.80],
      ["trapsUpper", 0.20],
    ),
    isUnilateral: true,
  },
  {
    id: "shoulderPress",
    name: "Shoulder Press",
    key: "shoulderPress",
    category: "upperBody",
    baseTargets: targets(
      ["deltsFront", 0.55],
      ["deltsSide", 0.20],
      ["triceps", 0.25],
    ),
  },
  {
    id: "frontRaise",
    name: "Front Raise",
    key: "frontRaise",
    category: "upperBody",
    baseTargets: targets(
      ["deltsFront", 0.90],
      ["deltsSide", 0.10],
    ),
    isUnilateral: true,
  },
  
  // ===== UPPER BODY - ARMS =====
  {
    id: "bicepCurl",
    name: "Bicep Curl",
    key: "bicepCurl",
    category: "upperBody",
    baseTargets: targets(
      ["biceps", 0.80],
      ["forearms", 0.20],
    ),
    isUnilateral: true,
    variationTemplates: {
      grip: { templateId: GRIP_TEMPLATE.id, labelOverride: "Grip" },
    },
  },
  {
    id: "tricepExtension",
    name: "Tricep Extension",
    key: "tricepExtension",
    category: "upperBody",
    baseTargets: targets(
      ["triceps", 1.0],
    ),
  },
  {
    id: "tricepPushdown",
    name: "Tricep Pushdown",
    key: "tricepPushdown",
    category: "upperBody",
    baseTargets: targets(
      ["triceps", 0.85],
      ["forearms", 0.15],
    ),
  },
  {
    id: "hammerCurl",
    name: "Hammer Curl",
    key: "hammerCurl",
    category: "upperBody",
    baseTargets: targets(
      ["biceps", 0.60],
      ["forearms", 0.40],
    ),
    isUnilateral: true,
  },
  
  // ===== CORE =====
  {
    id: "abdominalCrunch",
    name: "Abdominal Crunch",
    key: "abdominalCrunch",
    category: "core",
    baseTargets: targets(
      ["absUpper", 0.65],
      ["absLower", 0.35],
    ),
  },
  {
    id: "backExtension",
    name: "Back Extension",
    key: "backExtension",
    category: "core",
    baseTargets: targets(
      ["lowerBack", 0.55],
      ["glutes", 0.25],
      ["hamstrings", 0.20],
    ),
  },
  {
    id: "plank",
    name: "Plank",
    key: "plank",
    category: "core",
    baseTargets: targets(
      ["transverseAbs", 0.40],
      ["absUpper", 0.25],
      ["absLower", 0.15],
      ["obliques", 0.20],
    ),
  },
  {
    id: "russianTwist",
    name: "Russian Twist",
    key: "russianTwist",
    category: "core",
    baseTargets: targets(
      ["obliques", 0.55],
      ["absUpper", 0.25],
      ["absLower", 0.20],
    ),
  },
  {
    id: "legRaise",
    name: "Leg Raise",
    key: "legRaise",
    category: "core",
    baseTargets: targets(
      ["absLower", 0.60],
      ["hipFlexors", 0.40],
    ),
  },
  
  // ===== LOWER BODY =====
  {
    id: "backSquat",
    name: "Back Squat",
    key: "backSquat",
    category: "lowerBody",
    baseTargets: targets(
      ["quads", 0.55],
      ["glutes", 0.25],
      ["hamstrings", 0.10],
      ["lowerBack", 0.10],
    ),
    variationTemplates: {
      width: {
        templateId: WIDTH_TEMPLATE.id,
        labelOverride: "Stance Width",
        optionLabelOverrides: { closest: "Narrowest", neutral: "Standard" },
      },
    },
  },
  {
    id: "frontSquat",
    name: "Front Squat",
    key: "frontSquat",
    category: "lowerBody",
    baseTargets: targets(
      ["quads", 0.65],
      ["glutes", 0.18],
      ["absUpper", 0.10],
      ["lowerBack", 0.07],
    ),
  },
  {
    id: "deadlift",
    name: "Deadlift",
    key: "deadlift",
    category: "lowerBody",
    baseTargets: targets(
      ["hamstrings", 0.30],
      ["glutes", 0.30],
      ["lowerBack", 0.25],
      ["lats", 0.10],
      ["trapsUpper", 0.05],
    ),
  },
  {
    id: "romanianDeadlift",
    name: "Romanian Deadlift",
    key: "romanianDeadlift",
    category: "lowerBody",
    baseTargets: targets(
      ["hamstrings", 0.45],
      ["glutes", 0.30],
      ["lowerBack", 0.25],
    ),
  },
  {
    id: "legPress",
    name: "Leg Press",
    key: "legPress",
    category: "lowerBody",
    baseTargets: targets(
      ["quads", 0.60],
      ["glutes", 0.25],
      ["hamstrings", 0.15],
    ),
  },
  {
    id: "legExtension",
    name: "Leg Extension",
    key: "legExtension",
    category: "lowerBody",
    baseTargets: targets(
      ["quads", 1.0],
    ),
  },
  {
    id: "legCurl",
    name: "Leg Curl",
    key: "legCurl",
    category: "lowerBody",
    baseTargets: targets(
      ["hamstrings", 1.0],
    ),
  },
  {
    id: "hipThrust",
    name: "Hip Thrust",
    key: "hipThrust",
    category: "lowerBody",
    baseTargets: targets(
      ["glutes", 0.80],
      ["hamstrings", 0.20],
    ),
  },
  {
    id: "lunge",
    name: "Lunge",
    key: "lunge",
    category: "lowerBody",
    baseTargets: targets(
      ["quads", 0.45],
      ["glutes", 0.35],
      ["hamstrings", 0.20],
    ),
    isUnilateral: true,
  },
  {
    id: "lateralLunge",
    name: "Lateral Lunge",
    key: "lateralLunge",
    category: "lowerBody",
    baseTargets: targets(
      ["adductors", 0.45],
      ["quads", 0.35],
      ["glutes", 0.20],
    ),
    isUnilateral: true,
  },
  {
    id: "bulgarianSplitSquat",
    name: "Bulgarian Split Squat",
    key: "bulgarianSplitSquat",
    category: "lowerBody",
    baseTargets: targets(
      ["quads", 0.45],
      ["glutes", 0.35],
      ["hamstrings", 0.20],
    ),
    isUnilateral: true,
  },
  {
    id: "calfRaise",
    name: "Calf Raise",
    key: "calfRaise",
    category: "lowerBody",
    baseTargets: targets(
      ["calves", 1.0],
    ),
  },
  {
    id: "kettlebellSwing",
    name: "Kettlebell Swing",
    key: "kettlebellSwing",
    category: "lowerBody",
    baseTargets: targets(
      ["glutes", 0.45],
      ["hamstrings", 0.25],
      ["lowerBack", 0.20],
      ["deltsFront", 0.10],
    ),
  },
  {
    id: "hipAbduction",
    name: "Hip Abduction",
    key: "hipAbduction",
    category: "lowerBody",
    baseTargets: targets(
      ["abductors", 1.0],
    ),
  },
  {
    id: "hipAdduction",
    name: "Hip Adduction",
    key: "hipAdduction",
    category: "lowerBody",
    baseTargets: targets(
      ["adductors", 1.0],
    ),
  },
];

export const DEFAULT_EXERCISES: ExerciseDefinition[] = RAW_DEFAULT_EXERCISES.map((exercise) => ({
  ...exercise,
  repMode: exercise.repMode ?? (exercise.isUnilateral ? "dualUnilateral" : "bilateral"),
}));

/**
 * Default cardio exercise definitions.
 */
export const DEFAULT_CARDIO_EXERCISES: ExerciseDefinition[] = [
  {
    id: "running",
    name: "Running",
    key: "running",
    category: "cardio",
    baseTargets: targets(
      ["quads", 0.40],
      ["hamstrings", 0.20],
      ["calves", 0.20],
      ["glutes", 0.20],
    ),
  },
  {
    id: "cycling",
    name: "Cycling",
    key: "cycling",
    category: "cardio",
    baseTargets: targets(
      ["quads", 0.55],
      ["hamstrings", 0.25],
      ["calves", 0.20],
    ),
  },
  {
    id: "swimming",
    name: "Swimming",
    key: "swimming",
    category: "cardio",
    baseTargets: targets(
      ["lats", 0.55],
      ["deltsFront", 0.25],
      ["deltsSide", 0.20],
    ),
  },
  {
    id: "rowing",
    name: "Rowing",
    key: "rowing",
    category: "cardio",
    baseTargets: targets(
      ["lats", 0.35],
      ["quads", 0.35],
      ["lowerBack", 0.15],
      ["biceps", 0.15],
    ),
  },
  {
    id: "elliptical",
    name: "Elliptical",
    key: "elliptical",
    category: "cardio",
    baseTargets: targets(
      ["quads", 0.45],
      ["glutes", 0.30],
      ["hamstrings", 0.25],
    ),
  },
  {
    id: "stairClimber",
    name: "Stair Climber",
    key: "stairClimber",
    category: "cardio",
    baseTargets: targets(
      ["quads", 0.35],
      ["glutes", 0.40],
      ["calves", 0.25],
    ),
  },
  {
    id: "jumpRope",
    name: "Jump Rope",
    key: "jumpRope",
    category: "cardio",
    baseTargets: targets(
      ["calves", 0.55],
      ["quads", 0.35],
      ["deltsSide", 0.10],
    ),
  },
  {
    id: "walking",
    name: "Walking",
    key: "walking",
    category: "cardio",
    baseTargets: targets(
      ["quads", 0.45],
      ["hamstrings", 0.20],
      ["calves", 0.20],
      ["glutes", 0.15],
    ),
  },
  {
    id: "hiking",
    name: "Hiking",
    key: "hiking",
    category: "cardio",
    baseTargets: targets(
      ["quads", 0.35],
      ["glutes", 0.30],
      ["hamstrings", 0.15],
      ["calves", 0.20],
    ),
  },
];

// =============================================================================
// EXERCISE GROUPS (for UI pickers)
// =============================================================================

/**
 * Default exercise groups for the exercise picker UI.
 * Each group contains exercise keys (camelCase).
 */
export const DEFAULT_EXERCISE_GROUPS: ExerciseGroup[] = [
  {
    group: "upperBody",
    items: [
      "benchPress",
      "bicepCurl",
      "chestPress",
      "frontRaise",
      "hammerCurl",
      "lateralPulldown",
      "lateralRaise",
      "pecFly",
      "pullUp",
      "pushUp",
      "rearDelt",
      "seatedRow",
      "shoulderPress",
      "tricepExtension",
      "tricepPushdown",
    ],
  },
  {
    group: "core",
    items: [
      "abdominalCrunch",
      "backExtension",
      "legRaise",
      "plank",
      "russianTwist",
    ],
  },
  {
    group: "lowerBody",
    items: [
      "backSquat",
      "bulgarianSplitSquat",
      "calfRaise",
      "deadlift",
      "frontSquat",
      "hipAbduction",
      "hipAdduction",
      "hipThrust",
      "kettlebellSwing",
      "lateralLunge",
      "legCurl",
      "legExtension",
      "legPress",
      "lunge",
      "romanianDeadlift",
    ],
  },
  {
    group: "cardio",
    items: [
      "cycling",
      "elliptical",
      "hiking",
      "jumpRope",
      "rowing",
      "running",
      "stairClimber",
      "swimming",
      "walking",
    ],
  },
];

// =============================================================================
// LOOKUP UTILITIES
// =============================================================================

/**
 * Map of all exercises by key for O(1) lookups.
 */
export const EXERCISE_MAP: Map<string, ExerciseDefinition> = new Map(
  [...DEFAULT_EXERCISES, ...DEFAULT_CARDIO_EXERCISES].map((ex) => [ex.key, ex])
);

/**
 * Get an exercise definition by key.
 */
export function getExerciseByKey(key: string): ExerciseDefinition | undefined {
  return EXERCISE_MAP.get(key);
}

/**
 * Check if an exercise is typically unilateral.
 */
export function isUnilateralExercise(key: string): boolean {
  return EXERCISE_MAP.get(key)?.isUnilateral ?? false;
}

/**
 * Get all exercises for a specific category.
 */
export function getExercisesByCategory(category: ExerciseDefinition["category"]): ExerciseDefinition[] {
  return [...DEFAULT_EXERCISES, ...DEFAULT_CARDIO_EXERCISES].filter(
    (ex) => ex.category === category
  );
}

/**
 * Get all exercises that target a specific muscle group (primary or secondary).
 */
export function getExercisesByMuscle(muscle: MuscleGroup): ExerciseDefinition[] {
  return [...DEFAULT_EXERCISES, ...DEFAULT_CARDIO_EXERCISES].filter(
    (ex) => ex.baseTargets.some((t) => t.muscle === muscle)
  );
}

// =============================================================================
// UI DISPLAY HELPERS
// =============================================================================

/**
 * Display names for exercise categories.
 */
export const CATEGORY_DISPLAY_NAMES: Record<ExerciseDefinition["category"], string> = {
  upperBody: "Upper Body",
  lowerBody: "Lower Body",
  core: "Core",
  cardio: "Cardio",
};

/**
 * Display names for grip types.
 */
export const GRIP_DISPLAY_NAMES: Record<string, string> = {
  normal: "Normal",
  pronated: "Pronated (Overhand)",
  supinated: "Supinated (Underhand)",
  neutral: "Neutral",
  neutralSupinated: "Neutral/Supinated",
};

/**
 * Display names for movement planes.
 */
export const MOVEMENT_PLANE_DISPLAY_NAMES: Record<string, string> = {
  normal: "Normal",
  inclined: "Inclined",
  declined: "Declined",
  prone: "Prone (Face Down)",
  supine: "Supine (Face Up)",
};

/**
 * Display names for muscle groups.
 */
export const MUSCLE_GROUP_DISPLAY_NAMES: Record<MuscleGroup, string> = {
  // Chest
  chestUpper: "Upper Chest",
  chestMid: "Mid Chest",
  chestLower: "Lower Chest",
  // Back
  lats: "Lats",
  trapsUpper: "Upper Traps",
  trapsMid: "Mid Traps",
  trapsLower: "Lower Traps",
  rhomboids: "Rhomboids",
  lowerBack: "Lower Back",
  // Shoulders
  deltsFront: "Front Delts",
  deltsSide: "Side Delts",
  deltsRear: "Rear Delts",
  // Arms
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  // Core
  absUpper: "Upper Abs",
  absLower: "Lower Abs",
  obliques: "Obliques",
  transverseAbs: "Deep Core",
  // Lower body
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  hipFlexors: "Hip Flexors",
  adductors: "Adductors",
  abductors: "Abductors",
  calves: "Calves",
};

// =============================================================================
// FORM DEFAULTS
// =============================================================================

/**
 * Default values for a new strength set.
 */
export const DEFAULT_STRENGTH_SET = {
  weight: 0,
  reps: { bilateral: 1 },
} as const;

/**
 * Default values for a new unilateral strength set.
 */
export const DEFAULT_UNILATERAL_SET = {
  weight: 0,
  reps: { left: 0, right: 0 },
} as const;

/**
 * RPE (Rating of Perceived Exertion) scale labels.
 */
export const RPE_LABELS: Record<number, string> = {
  0: "Not Recorded",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "One From Failure",
  10: "Failure",
};
