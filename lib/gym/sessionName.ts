/**
 * Session Name Generation & Muscle Group Resolution
 *
 * Two-tier muscle group resolution:
 * - Chips: full list of all muscle groups hit (sub-regions aggregated, no threshold)
 * - Name generation: only "targeted" groups (per-exercise weight >= MIN_TARGET_WEIGHT)
 */

import type { ExerciseEntry } from "./types";
import { EXERCISE_MAP } from "./exercises";

// Maps granular MuscleGroup keys to human-readable parent labels
export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chestUpper: "Chest",
  chestMid: "Chest",
  chestLower: "Chest",
  lats: "Back",
  trapsUpper: "Traps",
  trapsMid: "Back",
  trapsLower: "Back",
  rhomboids: "Back",
  lowerBack: "Lower Back",
  deltsFront: "Shoulders",
  deltsSide: "Shoulders",
  deltsRear: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  absUpper: "Core",
  absLower: "Core",
  obliques: "Core",
  transverseAbs: "Core",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  hipFlexors: "Hip Flexors",
  adductors: "Adductors",
  abductors: "Abductors",
  calves: "Calves",
};

const MIN_TARGET_WEIGHT = 0.15;

/**
 * For a single exercise, aggregate baseTargets weights by their parent label.
 * Returns a map of label -> total weight.
 */
function getWeightsByLabel(exerciseKey: string): Map<string, number> {
  const def = EXERCISE_MAP.get(exerciseKey);
  if (!def) return new Map();

  const labelWeights = new Map<string, number>();
  for (const target of def.baseTargets) {
    const label = MUSCLE_GROUP_LABELS[target.muscle] ?? target.muscle;
    labelWeights.set(label, (labelWeights.get(label) ?? 0) + target.weight);
  }
  return labelWeights;
}

/**
 * Returns all muscle group labels across a set of exercises.
 * Sub-regions are aggregated into parent labels. No weight threshold.
 * Used for displaying muscle group chips.
 */
export function getMuscleGroupsForExercises(exercises: ExerciseEntry[]): string[] {
  const labels = new Set<string>();
  for (const exercise of exercises) {
    const weights = getWeightsByLabel(exercise.exerciseType);
    for (const label of weights.keys()) {
      labels.add(label);
    }
  }
  return [...labels];
}

/**
 * Returns only the "targeted" muscle group labels -- those where at least one
 * exercise dedicates >= MIN_TARGET_WEIGHT to that label.
 * Used internally for session name classification.
 */
function getTargetedMuscleGroups(exercises: ExerciseEntry[]): Set<string> {
  const targeted = new Set<string>();
  for (const exercise of exercises) {
    const weights = getWeightsByLabel(exercise.exerciseType);
    for (const [label, weight] of weights) {
      if (weight >= MIN_TARGET_WEIGHT) {
        targeted.add(label);
      }
    }
  }
  return targeted;
}

// ---- Split classification helpers ----

const PUSH_GROUPS = new Set(["Chest", "Shoulders", "Triceps"]);
const PULL_GROUPS = new Set(["Back", "Traps", "Biceps"]);
const LEG_GROUPS = new Set([
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Hip Flexors",
  "Adductors",
  "Abductors",
]);
const ARM_GROUPS = new Set(["Biceps", "Triceps", "Forearms"]);
const CORE_GROUPS = new Set(["Core"]);
const UPPER_GROUPS = new Set([...PUSH_GROUPS, ...PULL_GROUPS, "Forearms"]);

function hasAny(groups: Set<string>, reference: Set<string>): boolean {
  for (const g of groups) {
    if (reference.has(g)) return true;
  }
  return false;
}

function isSubsetOf(groups: Set<string>, reference: Set<string>): boolean {
  for (const g of groups) {
    if (!reference.has(g)) return false;
  }
  return true;
}

/**
 * Generates a human-readable session name from the exercises performed.
 * Uses thresholded muscle groups to classify into common training splits.
 */
export function generateSessionName(exercises: ExerciseEntry[]): string {
  const hasStrength = exercises.some((e) => e.type === "strength");
  const hasCardio = exercises.some((e) => e.type === "cardio");

  if (!hasStrength && hasCardio) return "Cardio";
  if (exercises.length === 0) return "Workout";

  const targeted = getTargetedMuscleGroups(exercises);
  if (targeted.size === 0) return hasCardio ? "Cardio" : "Workout";

  // Ignore Lower Back and Forearms for split classification --
  // they're common stabilizers that blur the intent.
  const classifiable = new Set(targeted);
  classifiable.delete("Lower Back");
  classifiable.delete("Forearms");

  if (classifiable.size === 0) {
    return [...targeted].join(", ");
  }

  const hasPush = hasAny(classifiable, PUSH_GROUPS);
  const hasPull = hasAny(classifiable, PULL_GROUPS);
  const hasLegs = hasAny(classifiable, LEG_GROUPS);
  const hasCore = hasAny(classifiable, CORE_GROUPS);
  const hasArms = hasAny(classifiable, ARM_GROUPS);

  // Pure core
  if (isSubsetOf(classifiable, CORE_GROUPS)) return "Core";

  // Pure arms (biceps/triceps/forearms only)
  if (isSubsetOf(classifiable, ARM_GROUPS)) return "Arms";

  // Pure legs
  if (isSubsetOf(classifiable, LEG_GROUPS)) {
    return hasCore ? "Legs & Core" : "Legs";
  }

  // Push/Pull/Legs classification
  if (hasPush && !hasPull && !hasLegs) {
    const suffix = hasCore ? " & Core" : "";
    return `Push${suffix}`;
  }
  if (hasPull && !hasPush && !hasLegs) {
    const suffix = hasCore ? " & Core" : "";
    return `Pull${suffix}`;
  }

  // Upper body (push + pull, no legs)
  if (hasPush && hasPull && !hasLegs) {
    const suffix = hasCore ? " & Core" : "";
    return `Upper Body${suffix}`;
  }

  // Full body
  if ((hasPush || hasPull) && hasLegs) {
    return "Full Body";
  }

  // Lower body (legs + maybe core, no push/pull)
  if (hasLegs && !hasPush && !hasPull) {
    return hasCore ? "Lower Body & Core" : "Lower Body";
  }

  // Single dominant group -- if only one classifiable label remains meaningful
  if (classifiable.size === 1) {
    return [...classifiable][0];
  }

  // Fallback: join the top groups, but keep it short
  const sorted = [...classifiable];
  if (sorted.length <= 3) return sorted.join(" & ");
  return sorted.slice(0, 2).join(" & ") + " +";
}
