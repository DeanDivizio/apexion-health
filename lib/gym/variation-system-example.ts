/**
 * Variation System (Minimal Example) - Apexion Health
 *
 * Goal:
 * Model “mods” (variations) in a way that:
 * - lets us define reusable variation VALUE sets once (ex: width: close/neutral/wide)
 * - but lets the EFFECT of those values differ per exercise (bench width ≠ squat stance width)
 * - supports weighted muscle targeting (base targets + variation effects → normalized)
 *
 * Key idea:
 * - VariationTemplate: defines a reusable dimension + its option keys (portable)
 * - ExerciseDefinition: opts into templates + defines per-option effects (NOT portable)
 * - Workout entry: stores selected option per variation key (validated against the exercise)
 *
 * This file is intentionally self-contained as a reference implementation.
 * When we adopt this, we’ll move the types into `lib/gym/types.ts` + schemas into `lib/gym/schemas.ts`.
 */

// =============================================================================
// SECTION 1: PRIMITIVES
// =============================================================================

/**
 * Minimal subset for this example. In the real app this would be your full MuscleGroup union.
 */
export type MuscleGroup =
  | "chestUpper"
  | "chestMid"
  | "chestLower"
  | "deltsFront"
  | "triceps"
  | "lats"
  | "rhomboids"
  | "biceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "lowerBack";

/**
 * Weighted muscle targeting.
 * - weights are fractions (0..1)
 * - all weights should sum to 1.0 after normalization
 */
export type MuscleTargets = Partial<Record<MuscleGroup, number>>;

/**
 * Portable “variation template” (schema only).
 * Example: width = closest|close|neutral|wide|widest.
 *
 * This is reusable across exercises. It does NOT define what “wide” does.
 */
export interface VariationTemplate {
  /** Stable id referenced by exercises and workout entries */
  id: string;
  /** User-facing label */
  label: string;
  /** Allowed options (portable keys) */
  options: Array<{
    key: string;
    label: string;
    /** Optional: for ordering (UI sliders, etc.) */
    order?: number;
  }>;
}

/**
 * Exercise-level UI overrides for a reusable variation template.
 *
 * Example:
 * - template: WIDTH_TEMPLATE (closest/close/neutral/wide/widest)
 * - but for bench press, label should be “Grip Width”
 * - for squats, label should be “Stance Width”
 *
 * Keys remain identical (so saved data stays compatible), only display changes.
 */
export interface VariationTemplateOverride {
  template: VariationTemplate;
  /** Override label for this dimension for this exercise */
  labelOverride?: string;
  /** Optional per-option label overrides (keys must match template option keys) */
  optionLabelOverrides?: Record<string, string>;
}

/**
 * A non-portable effect that alters muscle weights.
 * We support BOTH:
 * - multipliers: scale existing weights (good for relative emphasis)
 * - deltas: add/subtract absolute weight (good for explicit shifts)
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
 * Each exercise declares which variations it supports and the per-option effects.
 *
 * IMPORTANT:
 * The same variation template (e.g. `width`) can be used by multiple exercises,
 * but the effects differ per exercise.
 */
export interface ExerciseDefinition {
  id: string;
  name: string;

  /** Base (canonical) muscle distribution for the exercise. */
  baseTargets: MuscleTargets;

  /**
   * Exercise opts into variation templates.
   * Example:
   *   {
   *     width: { template: WIDTH_TEMPLATE, labelOverride: "Grip Width" },
 *     planeAngle: { template: PLANE_ANGLE_TEMPLATE },
   *   }
   */
  variationTemplates: Record<string, VariationTemplateOverride>;

  /**
   * Exercise-specific effects, keyed by:
   * - variation id (ex: "width")
   * - option key (ex: "wide")
   */
  variationEffects: Record<string, Record<string, VariationEffect>>;
}

/**
 * What we store on a workout entry (the “mods”/variations).
 * For each variation id, store which option key was chosen.
 */
export type SelectedVariations = Record<string, string>;

// =============================================================================
// SECTION 2: REUSABLE VARIATION TEMPLATES (portable schema)
// =============================================================================

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

export const PLANE_ANGLE_TEMPLATE: VariationTemplate = {
  id: "planeAngle",
  label: "Plane Angle",
  options: [
    { key: "untracked", label: "Untracked", order: 1 },
    { key: "-15", label: "-15°", order: 2 },
    { key: "0", label: "0°", order: 3 },
    { key: "15", label: "15°", order: 4 },
    { key: "30", label: "30°", order: 5 },
    { key: "45", label: "45°", order: 6 },
    { key: "60", label: "60°", order: 7 },
  ],
};

// =============================================================================
// SECTION 3: EXERCISE DEFINITIONS (non-portable effects live here)
// =============================================================================

/**
 * Bench press uses `width` + `plane`, but “width” means grip width on the bar.
 * Effects below are deliberately simplified for the example.
 */
export const BENCH_PRESS: ExerciseDefinition = {
  id: "benchPress",
  name: "Bench Press",

  baseTargets: {
    chestMid: 0.55,
    chestUpper: 0.15,
    chestLower: 0.10,
    deltsFront: 0.12,
    triceps: 0.08,
  },

  variationTemplates: {
    width: {
      template: WIDTH_TEMPLATE,
      labelOverride: "Grip Width",
    },
    planeAngle: {
      template: PLANE_ANGLE_TEMPLATE,
      labelOverride: "Bench Angle",
    },
  },

  variationEffects: {
    /**
     * Bench Press width effects:
     * - wider tends to shift toward chest, away from triceps
     * - closer tends to shift toward triceps/delts, away from chest
     */
    width: {
      closest: { deltas: { triceps: +0.08, chestMid: -0.06, deltsFront: +0.02 } },
      close: { deltas: { triceps: +0.05, chestMid: -0.04, deltsFront: +0.01 } },
      neutral: {}, // no change
      wide: { deltas: { chestMid: +0.05, triceps: -0.04, deltsFront: -0.01 } },
      widest: { deltas: { chestMid: +0.07, triceps: -0.06, deltsFront: -0.01 } },
    },

    /**
     * Bench Press plane effects:
     * - incline biases chestUpper + deltsFront
     * - decline biases chestLower
     */
    planeAngle: {
      "-15": { deltas: { chestLower: +0.10, chestUpper: -0.07, deltsFront: -0.03 } },
      "0": {},
      "15": { deltas: { chestUpper: +0.10, chestLower: -0.07, deltsFront: +0.03 } },
      "30": { deltas: { chestUpper: +0.10, chestLower: -0.07, deltsFront: +0.03 } },
      "45": { deltas: { chestUpper: +0.10, chestLower: -0.07, deltsFront: +0.03 } },
      "60": { deltas: { chestUpper: +0.10, chestLower: -0.07, deltsFront: +0.03 } },
      untracked: {},
    },
  },
};

/**
 * Lat pulldown uses `width` too, but “width” means hand spacing on the bar.
 * Effects differ from bench press even though the template is identical.
 */
export const LAT_PULLDOWN: ExerciseDefinition = {
  id: "latPulldown",
  name: "Lat Pulldown",

  baseTargets: {
    lats: 0.65,
    rhomboids: 0.25,
    biceps: 0.10,
  },

  variationTemplates: {
    width: {
      template: WIDTH_TEMPLATE,
      labelOverride: "Handle Width",
    },
  },

  variationEffects: {
    width: {
      closest: { deltas: { rhomboids: +0.06, lats: -0.06 } }, // more “row-ish”
      close: { deltas: { rhomboids: +0.03, lats: -0.03 } },
      neutral: {},
      wide: { deltas: { lats: +0.04, rhomboids: -0.04 } },
      widest: { deltas: { lats: +0.06, rhomboids: -0.06 } },
    },
  },
};

/**
 * Squat example: uses the SAME portable WIDTH_TEMPLATE options,
 * but the display label should be “Stance Width”.
 *
 * This highlights the key design point:
 * - width option KEYS are reused (closest/close/neutral/wide/widest)
 * - the UI LABEL is overridden per exercise (stance vs grip vs handle)
 * - and the EFFECTS are exercise-specific (not shown here)
 */
export const BACK_SQUAT: ExerciseDefinition = {
  id: "backSquat",
  name: "Back Squat",
  baseTargets: {
    quads: 0.55,
    glutes: 0.25,
    hamstrings: 0.10,
    lowerBack: 0.10,
  },
  variationTemplates: {
    width: {
      template: WIDTH_TEMPLATE,
      labelOverride: "Stance Width",
      optionLabelOverrides: {
        closest: "Narrowest",
        neutral: "Standard",
      },
    },
  },
  variationEffects: {
    width: {
      // intentionally empty in this example (effects would be squat-specific)
    },
  },
};

// =============================================================================
// SECTION 4: CORE ALGORITHM (apply variations → effective weights)
// =============================================================================

export function computeEffectiveTargets(exercise: ExerciseDefinition, selected: SelectedVariations): MuscleTargets {
  // Start from base.
  let weights: MuscleTargets = { ...exercise.baseTargets };

  // For each selected variation, apply the exercise-specific effect.
  for (const [variationId, optionKey] of Object.entries(selected)) {
    const templateOverride = exercise.variationTemplates[variationId];
    if (!templateOverride) continue; // exercise doesn’t support this variation
    const template = templateOverride.template;

    // Ensure option is valid for that template.
    const allowed = new Set(template.options.map((o) => o.key));
    if (!allowed.has(optionKey)) continue;

    const effect = exercise.variationEffects?.[variationId]?.[optionKey];
    if (!effect) continue;

    weights = applyEffect(weights, effect);
  }

  return normalizeTargets(weights);
}

function applyEffect(base: MuscleTargets, effect: VariationEffect): MuscleTargets {
  let out: MuscleTargets = { ...base };

  // 1) multipliers
  if (effect.multipliers) {
    for (const [muscle, m] of Object.entries(effect.multipliers) as Array<[MuscleGroup, number]>) {
      out[muscle] = (out[muscle] ?? 0) * m;
    }
  }

  // 2) deltas
  if (effect.deltas) {
    for (const [muscle, d] of Object.entries(effect.deltas) as Array<[MuscleGroup, number]>) {
      out[muscle] = (out[muscle] ?? 0) + d;
    }
  }

  // 3) clamp negatives to 0
  for (const k of Object.keys(out) as MuscleGroup[]) {
    if ((out[k] ?? 0) < 0) out[k] = 0;
  }

  return out;
}

function normalizeTargets(targets: MuscleTargets): MuscleTargets {
  const entries = Object.entries(targets).filter(([, v]) => typeof v === "number" && v > 0) as Array<[MuscleGroup, number]>;
  const sum = entries.reduce((acc, [, v]) => acc + v, 0);
  if (sum <= 0) return {};

  const normalized: MuscleTargets = {};
  for (const [muscle, v] of entries) {
    normalized[muscle] = v / sum;
  }
  return normalized;
}

// =============================================================================
// SECTION 5: “WORKOUT ENTRY” EXAMPLE
// =============================================================================

/**
 * Example: Bench Press, incline, close grip width.
 *
 * In the real system, the workout entry would store:
 * - exerciseId or exerciseType key
 * - selected variations like { planeAngle: "30", width: "close" }
 * - sets, reps, etc.
 */
export const exampleSelectedVariations: SelectedVariations = {
  planeAngle: "30",
  width: "close",
};

export const exampleEffectiveTargets = computeEffectiveTargets(BENCH_PRESS, exampleSelectedVariations);

/**
 * exampleEffectiveTargets will look like (roughly):
 * {
 *   chestUpper: ~0.26,
 *   chestMid:   ~0.49,
 *   chestLower: ~0.03,
 *   deltsFront: ~0.15,
 *   triceps:    ~0.07,
 * }
 *
 * NOTE: exact numbers depend on normalization after applying deltas.
 */

