/**
 * Movement Presets - Apexion Health
 *
 * Curated starting-point definitions for custom exercises.
 * Each preset provides base muscle targets (summing to 1.0), a default rep mode,
 * and default variation supports derived from the canonical exercise taxonomy.
 *
 * The user selects a category then a preset; the preset's movementPattern,
 * bodyRegion, and movementPlane are stored as metadata on the DB row.
 */

import type {
  ExerciseCategory,
  MuscleTargets,
  StrengthRepMode,
} from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MovementPreset {
  id: string;
  label: string;
  description: string;
  movementPattern: string;
  bodyRegion: string;
  movementPlane?: string;
  baseTargets: MuscleTargets;
  repMode: StrengthRepMode;
  defaultVariationSupports: Array<{
    templateId: string;
    defaultOptionKey: string;
  }>;
}

// ---------------------------------------------------------------------------
// Global default option keys (used when a preset doesn't override)
// ---------------------------------------------------------------------------

const GLOBAL_DEFAULTS: Record<string, string> = {
  width: "neutral",
  cadence: "untracked",
  pause: "untracked",
  resistanceSource: "untracked",
  barType: "straightBar",
  grip: "normal",
  bodyPosition: "standing",
  support: "none",
  cableAttachment: "straightBar",
  footAngle: "toesForward",
  heelElevation: "flat",
  kneeAngle: "neutral",
  rangeOfMotion: "full",
  gripTechnique: "standard",
  gripAssistance: "none",
  planeAngle: "0",
};

function supports(
  templateIds: string[],
  overrides?: Record<string, string>,
): MovementPreset["defaultVariationSupports"] {
  return templateIds.map((id) => ({
    templateId: id,
    defaultOptionKey: overrides?.[id] ?? GLOBAL_DEFAULTS[id] ?? "untracked",
  }));
}

// ---------------------------------------------------------------------------
// Upper Body Presets (11)
// ---------------------------------------------------------------------------

const HORIZONTAL_PUSH: MovementPreset = {
  id: "horizontalPush",
  label: "Horizontal Push (chest)",
  description: "Bench press, push-up, and chest pressing movements.",
  movementPattern: "push",
  bodyRegion: "upperBody",
  movementPlane: "horizontal",
  baseTargets: [
    { muscle: "chestMid", weight: 0.58 },
    { muscle: "chestUpper", weight: 0.12 },
    { muscle: "chestLower", weight: 0.08 },
    { muscle: "deltsFront", weight: 0.12 },
    { muscle: "triceps", weight: 0.10 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports([
    "width", "planeAngle", "resistanceSource", "cadence", "pause",
  ]),
};

const VERTICAL_PUSH: MovementPreset = {
  id: "verticalPush",
  label: "Vertical Push (shoulders)",
  description: "Overhead press and shoulder pressing movements.",
  movementPattern: "push",
  bodyRegion: "upperBody",
  movementPlane: "vertical",
  baseTargets: [
    { muscle: "deltsFront", weight: 0.55 },
    { muscle: "deltsSide", weight: 0.20 },
    { muscle: "triceps", weight: 0.25 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["width", "bodyPosition", "resistanceSource", "barType", "cadence", "pause"],
    { bodyPosition: "seated" },
  ),
};

const VERTICAL_PULL: MovementPreset = {
  id: "verticalPull",
  label: "Vertical Pull (pulldown / pull-up)",
  description: "Pulldowns, pull-ups, and lat-focused vertical pulls.",
  movementPattern: "pull",
  bodyRegion: "upperBody",
  movementPlane: "vertical",
  baseTargets: [
    { muscle: "lats", weight: 0.58 },
    { muscle: "rhomboids", weight: 0.16 },
    { muscle: "biceps", weight: 0.15 },
    { muscle: "trapsLower", weight: 0.06 },
    { muscle: "deltsRear", weight: 0.05 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports([
    "width", "grip", "cableAttachment", "cadence", "pause",
  ]),
};

const HORIZONTAL_PULL: MovementPreset = {
  id: "horizontalPull",
  label: "Horizontal Row",
  description: "Cable rows, dumbbell rows, and horizontal pulling.",
  movementPattern: "pull",
  bodyRegion: "upperBody",
  movementPlane: "horizontal",
  baseTargets: [
    { muscle: "lats", weight: 0.42 },
    { muscle: "rhomboids", weight: 0.27 },
    { muscle: "trapsMid", weight: 0.15 },
    { muscle: "biceps", weight: 0.11 },
    { muscle: "lowerBack", weight: 0.05 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["width", "grip", "cableAttachment", "support", "resistanceSource", "cadence", "pause"],
    { cableAttachment: "vHandle" },
  ),
};

const CHEST_FLY: MovementPreset = {
  id: "chestFly",
  label: "Chest Fly",
  description: "Cable flyes, dumbbell flyes, and pec deck movements.",
  movementPattern: "push",
  bodyRegion: "upperBody",
  movementPlane: "horizontal",
  baseTargets: [
    { muscle: "chestMid", weight: 0.70 },
    { muscle: "chestUpper", weight: 0.15 },
    { muscle: "chestLower", weight: 0.15 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["planeAngle", "bodyPosition", "resistanceSource", "cadence", "pause"],
    { bodyPosition: "seated" },
  ),
};

const REAR_DELT_FLY: MovementPreset = {
  id: "rearDeltFly",
  label: "Rear Delt / Face Pull",
  description: "Reverse flyes, face pulls, and rear delt isolation.",
  movementPattern: "pull",
  bodyRegion: "upperBody",
  baseTargets: [
    { muscle: "deltsRear", weight: 0.55 },
    { muscle: "rhomboids", weight: 0.22 },
    { muscle: "trapsMid", weight: 0.17 },
    { muscle: "trapsLower", weight: 0.06 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["bodyPosition", "support", "resistanceSource", "cableAttachment", "cadence", "pause"],
    { cableAttachment: "rope" },
  ),
};

const LATERAL_RAISE: MovementPreset = {
  id: "lateralRaiseIsolation",
  label: "Lateral Raise",
  description: "Lateral raises and side delt isolation.",
  movementPattern: "push",
  bodyRegion: "upperBody",
  baseTargets: [
    { muscle: "deltsSide", weight: 0.80 },
    { muscle: "trapsUpper", weight: 0.20 },
  ],
  repMode: "dualUnilateral",
  defaultVariationSupports: supports(
    ["bodyPosition", "resistanceSource", "rangeOfMotion", "cadence", "pause"],
    { resistanceSource: "dumbbell" },
  ),
};

const FRONT_RAISE: MovementPreset = {
  id: "frontRaiseIsolation",
  label: "Front Raise",
  description: "Front raises and anterior delt isolation.",
  movementPattern: "push",
  bodyRegion: "upperBody",
  baseTargets: [
    { muscle: "deltsFront", weight: 0.90 },
    { muscle: "deltsSide", weight: 0.10 },
  ],
  repMode: "dualUnilateral",
  defaultVariationSupports: supports(
    ["grip", "bodyPosition", "resistanceSource", "cadence", "pause"],
    { resistanceSource: "dumbbell" },
  ),
};

const TRAPS_SHRUG: MovementPreset = {
  id: "trapsShrug",
  label: "Shrug / Trap",
  description: "Barbell shrugs, dumbbell shrugs, and trap work.",
  movementPattern: "pull",
  bodyRegion: "upperBody",
  baseTargets: [
    { muscle: "trapsUpper", weight: 0.80 },
    { muscle: "trapsMid", weight: 0.20 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports([
    "resistanceSource", "barType", "cadence", "pause",
  ]),
};

const ISOLATION_BICEP: MovementPreset = {
  id: "isolationBicep",
  label: "Bicep Curl",
  description: "All curl variations for bicep isolation.",
  movementPattern: "pull",
  bodyRegion: "upperBody",
  baseTargets: [
    { muscle: "biceps", weight: 0.80 },
    { muscle: "forearms", weight: 0.20 },
  ],
  repMode: "dualUnilateral",
  defaultVariationSupports: supports(
    ["grip", "bodyPosition", "support", "resistanceSource", "barType", "cadence", "pause"],
    { grip: "supinated" },
  ),
};

const ISOLATION_TRICEP: MovementPreset = {
  id: "isolationTricep",
  label: "Tricep Extension / Pushdown",
  description: "Tricep pushdowns, extensions, and skull crushers.",
  movementPattern: "push",
  bodyRegion: "upperBody",
  baseTargets: [
    { muscle: "triceps", weight: 0.90 },
    { muscle: "forearms", weight: 0.10 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["bodyPosition", "resistanceSource", "cableAttachment", "barType", "cadence", "pause"],
    { cableAttachment: "rope" },
  ),
};

// ---------------------------------------------------------------------------
// Lower Body Presets (9)
// ---------------------------------------------------------------------------

const SQUAT: MovementPreset = {
  id: "squat",
  label: "Squat",
  description: "Back squat, front squat, and squat pattern movements.",
  movementPattern: "squat",
  bodyRegion: "lowerBody",
  baseTargets: [
    { muscle: "quads", weight: 0.55 },
    { muscle: "glutes", weight: 0.25 },
    { muscle: "hamstrings", weight: 0.10 },
    { muscle: "lowerBack", weight: 0.10 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports([
    "width", "barType", "heelElevation", "footAngle", "cadence", "pause",
  ]),
};

const HINGE: MovementPreset = {
  id: "hinge",
  label: "Hip Hinge / Deadlift",
  description: "Deadlifts, RDLs, and hip hinge movements.",
  movementPattern: "hinge",
  bodyRegion: "lowerBody",
  baseTargets: [
    { muscle: "hamstrings", weight: 0.38 },
    { muscle: "glutes", weight: 0.30 },
    { muscle: "lowerBack", weight: 0.25 },
    { muscle: "lats", weight: 0.05 },
    { muscle: "trapsUpper", weight: 0.02 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports([
    "width", "barType", "gripTechnique", "gripAssistance", "cadence", "pause",
  ]),
};

const LUNGE: MovementPreset = {
  id: "lunge",
  label: "Lunge / Split Squat",
  description: "Lunges, split squats, and single-leg squat patterns.",
  movementPattern: "lunge",
  bodyRegion: "lowerBody",
  baseTargets: [
    { muscle: "quads", weight: 0.45 },
    { muscle: "glutes", weight: 0.35 },
    { muscle: "hamstrings", weight: 0.20 },
  ],
  repMode: "dualUnilateral",
  defaultVariationSupports: supports(
    ["width", "resistanceSource", "cadence", "pause"],
    { resistanceSource: "dumbbell" },
  ),
};

const HIP_EXTENSION: MovementPreset = {
  id: "hipExtension",
  label: "Hip Extension / Thrust",
  description: "Hip thrusts, glute bridges, and hip extension patterns.",
  movementPattern: "extension",
  bodyRegion: "lowerBody",
  baseTargets: [
    { muscle: "glutes", weight: 0.78 },
    { muscle: "hamstrings", weight: 0.22 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["width", "kneeAngle", "footAngle", "resistanceSource", "cadence", "pause"],
    { resistanceSource: "barbell" },
  ),
};

const LEG_EXTENSION: MovementPreset = {
  id: "legExtension",
  label: "Leg Extension (quad isolation)",
  description: "Seated leg extension for quad isolation.",
  movementPattern: "extension",
  bodyRegion: "lowerBody",
  baseTargets: [
    { muscle: "quads", weight: 1.0 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports([
    "footAngle", "cadence", "pause",
  ]),
};

const LEG_CURL: MovementPreset = {
  id: "legCurl",
  label: "Leg Curl (hamstring isolation)",
  description: "Seated or lying leg curls for hamstring isolation.",
  movementPattern: "flexion",
  bodyRegion: "lowerBody",
  baseTargets: [
    { muscle: "hamstrings", weight: 1.0 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["bodyPosition", "footAngle", "cadence", "pause"],
    { bodyPosition: "seated" },
  ),
};

const CALF_RAISE: MovementPreset = {
  id: "calfRaise",
  label: "Calf Raise",
  description: "Standing or seated calf raises.",
  movementPattern: "extension",
  bodyRegion: "lowerBody",
  baseTargets: [
    { muscle: "calves", weight: 1.0 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports([
    "bodyPosition", "footAngle", "resistanceSource", "cadence", "pause",
  ]),
};

const HIP_ABDUCTION: MovementPreset = {
  id: "hipAbduction",
  label: "Hip Abduction",
  description: "Machine or band hip abduction for outer hip work.",
  movementPattern: "extension",
  bodyRegion: "lowerBody",
  baseTargets: [
    { muscle: "abductors", weight: 1.0 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["bodyPosition", "resistanceSource", "cadence", "pause"],
    { bodyPosition: "seated", resistanceSource: "machineSelectorized" },
  ),
};

const HIP_ADDUCTION: MovementPreset = {
  id: "hipAdduction",
  label: "Hip Adduction",
  description: "Machine or band hip adduction for inner thigh work.",
  movementPattern: "extension",
  bodyRegion: "lowerBody",
  baseTargets: [
    { muscle: "adductors", weight: 1.0 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["bodyPosition", "resistanceSource", "cadence", "pause"],
    { bodyPosition: "seated", resistanceSource: "machineSelectorized" },
  ),
};

// ---------------------------------------------------------------------------
// Core Presets (5)
// ---------------------------------------------------------------------------

const AB_FLEXION: MovementPreset = {
  id: "abFlexion",
  label: "Ab Flexion / Crunch",
  description: "Crunches, sit-ups, and trunk flexion movements.",
  movementPattern: "flexion",
  bodyRegion: "core",
  baseTargets: [
    { muscle: "absUpper", weight: 0.35 },
    { muscle: "absLower", weight: 0.43 },
    { muscle: "hipFlexors", weight: 0.22 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["planeAngle", "bodyPosition", "resistanceSource", "cadence", "pause"],
    { bodyPosition: "supine", resistanceSource: "bodyweight" },
  ),
};

const ANTI_EXTENSION: MovementPreset = {
  id: "antiExtension",
  label: "Plank / Anti-Extension",
  description: "Planks, ab wheel rollouts, and anti-extension core work.",
  movementPattern: "extension",
  bodyRegion: "core",
  baseTargets: [
    { muscle: "transverseAbs", weight: 0.40 },
    { muscle: "absUpper", weight: 0.25 },
    { muscle: "obliques", weight: 0.20 },
    { muscle: "absLower", weight: 0.15 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["resistanceSource"],
    { resistanceSource: "bodyweight" },
  ),
};

const ROTATION: MovementPreset = {
  id: "rotation",
  label: "Rotation / Twist",
  description: "Russian twists, cable woodchops, and rotational core work.",
  movementPattern: "rotation",
  bodyRegion: "core",
  baseTargets: [
    { muscle: "obliques", weight: 0.55 },
    { muscle: "absUpper", weight: 0.25 },
    { muscle: "absLower", weight: 0.20 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["resistanceSource", "cadence", "pause"],
    { resistanceSource: "bodyweight" },
  ),
};

const ANTI_ROTATION: MovementPreset = {
  id: "antiRotation",
  label: "Side Plank / Anti-Rotation",
  description: "Side planks, Pallof presses, and anti-rotation core work.",
  movementPattern: "rotation",
  bodyRegion: "core",
  baseTargets: [
    { muscle: "obliques", weight: 0.60 },
    { muscle: "transverseAbs", weight: 0.25 },
    { muscle: "glutes", weight: 0.15 },
  ],
  repMode: "dualUnilateral",
  defaultVariationSupports: supports(
    ["resistanceSource"],
    { resistanceSource: "bodyweight" },
  ),
};

const BACK_EXTENSION: MovementPreset = {
  id: "backExtension",
  label: "Back Extension",
  description: "Hyperextensions, reverse hypers, and lower back work.",
  movementPattern: "extension",
  bodyRegion: "core",
  baseTargets: [
    { muscle: "lowerBack", weight: 0.55 },
    { muscle: "glutes", weight: 0.25 },
    { muscle: "hamstrings", weight: 0.20 },
  ],
  repMode: "bilateral",
  defaultVariationSupports: supports(
    ["planeAngle", "resistanceSource", "cadence", "pause"],
    { planeAngle: "45", resistanceSource: "bodyweight" },
  ),
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const ALL_PRESETS: MovementPreset[] = [
  // Upper Body
  HORIZONTAL_PUSH,
  VERTICAL_PUSH,
  VERTICAL_PULL,
  HORIZONTAL_PULL,
  CHEST_FLY,
  REAR_DELT_FLY,
  LATERAL_RAISE,
  FRONT_RAISE,
  TRAPS_SHRUG,
  ISOLATION_BICEP,
  ISOLATION_TRICEP,
  // Lower Body
  SQUAT,
  HINGE,
  LUNGE,
  HIP_EXTENSION,
  LEG_EXTENSION,
  LEG_CURL,
  CALF_RAISE,
  HIP_ABDUCTION,
  HIP_ADDUCTION,
  // Core
  AB_FLEXION,
  ANTI_EXTENSION,
  ROTATION,
  ANTI_ROTATION,
  BACK_EXTENSION,
];

const PRESET_MAP = new Map<string, MovementPreset>(
  ALL_PRESETS.map((p) => [p.id, p]),
);

const CATEGORY_MAP: Record<string, ExerciseCategory> = {
  upperBody: "upperBody",
  lowerBody: "lowerBody",
  core: "core",
};

const PRESETS_BY_CATEGORY = new Map<ExerciseCategory, MovementPreset[]>();
for (const preset of ALL_PRESETS) {
  const cat = CATEGORY_MAP[preset.bodyRegion] ?? "upperBody";
  const list = PRESETS_BY_CATEGORY.get(cat) ?? [];
  list.push(preset);
  PRESETS_BY_CATEGORY.set(cat, list);
}

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

export function getPreset(presetId: string): MovementPreset | undefined {
  return PRESET_MAP.get(presetId);
}

export function getPresetsForCategory(
  category: ExerciseCategory,
): MovementPreset[] {
  return PRESETS_BY_CATEGORY.get(category) ?? [];
}

const CATEGORY_FALLBACKS: Record<string, string> = {
  upperBody: "horizontalPush",
  lowerBody: "squat",
  core: "abFlexion",
};

export function getFallbackPreset(category: ExerciseCategory): MovementPreset {
  const fallbackId = CATEGORY_FALLBACKS[category] ?? "horizontalPush";
  return PRESET_MAP.get(fallbackId)!;
}
