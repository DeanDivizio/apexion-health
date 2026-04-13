import { Suspense } from "react";
import { getGymMetaAction, getGymUserPreferencesAction } from "@/actions/gym";
import { WorkoutFlow } from "@/components/gym/WorkoutFlow";
import {
  CATEGORY_DISPLAY_NAMES,
  type GymUserMeta,
  type ExerciseCategory,
  type RepInputStyle,
} from "@/lib/gym";
import type { ExerciseGroupOption } from "@/components/gym/ExerciseCombobox";

function toRepInputStyle(value: string | undefined | null): RepInputStyle {
  return value === "freeform" ? "freeform" : "dropdown";
}

// ---------------------------------------------------------------------------
// Data loader (runs at request time, wrapped in Suspense)
// ---------------------------------------------------------------------------
async function WorkoutFlowLoader() {
  let userMeta: GymUserMeta | null = null;
  let repInputStyle: RepInputStyle = "dropdown";
  let carryOverWeight = true;
  let carryOverReps = false;

  try {
    const [meta, prefs] = await Promise.all([
      getGymMetaAction(),
      getGymUserPreferencesAction(),
    ]);
    userMeta = meta;
    repInputStyle = toRepInputStyle(prefs?.repInputStyle);
    carryOverWeight = prefs?.carryOverWeight ?? true;
    carryOverReps = prefs?.carryOverReps ?? false;
  } catch {
    // User might not have any data yet -- that's fine
  }

  // Build custom exercise groups for the combobox
  const customGroups: ExerciseGroupOption[] = [];
  if (userMeta && userMeta.customExercises.length > 0) {
    for (const group of userMeta.customExercises) {
      const exercises = group.items
        .map((key) => {
          const customDefinition = userMeta!.customExerciseDefinitions[key];
          const stat = userMeta!.exerciseData[key];
          return { key, name: customDefinition?.name ?? stat?.displayName ?? key };
        })
        .filter(Boolean);

      if (exercises.length > 0) {
        customGroups.push({
          label: `Custom - ${CATEGORY_DISPLAY_NAMES[group.group as ExerciseCategory] ?? group.group}`,
          exercises,
        });
      }
    }
  }

  return (
    <WorkoutFlow
      userMeta={userMeta}
      customExerciseGroups={customGroups}
      repInputStyle={repInputStyle}
      carryOverWeight={carryOverWeight}
      carryOverReps={carryOverReps}
    />
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function WorkoutSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      <p className="text-sm text-muted-foreground">Loading gym data...</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (auth enforced by middleware -- only authenticated users reach this)
// ---------------------------------------------------------------------------
export default async function LogWorkoutPage() {
  return (
    <main className="w-full min-h-screen overflow-y-auto pt-16 pb-20 bg-gradient-to-br from-blue-950/15 via-slate-950/30 to-black">
      <Suspense fallback={<WorkoutSkeleton />}>
        <WorkoutFlowLoader />
      </Suspense>
    </main>
  );
}
