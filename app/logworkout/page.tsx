import { Suspense } from "react";
import { getGymMetaAction } from "@/actions/gym";
import { WorkoutFlow } from "@/components/gym/WorkoutFlow";
import {
  CATEGORY_DISPLAY_NAMES,
  type GymUserMeta,
  type ExerciseCategory,
} from "@/lib/gym";
import type { ExerciseGroupOption } from "@/components/gym/ExerciseCombobox";

// ---------------------------------------------------------------------------
// Data loader (runs at request time, wrapped in Suspense)
// ---------------------------------------------------------------------------
async function WorkoutFlowLoader() {
  let userMeta: GymUserMeta | null = null;

  try {
    userMeta = await getGymMetaAction();
  } catch {
    // User might not have any data yet -- that's fine
  }

  // Build custom exercise groups for the combobox
  const customGroups: ExerciseGroupOption[] = [];
  if (userMeta && userMeta.customExercises.length > 0) {
    for (const group of userMeta.customExercises) {
      const exercises = group.items
        .map((key) => {
          const stat = userMeta!.exerciseData[key];
          return { key, name: stat?.displayName ?? key };
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

  return <WorkoutFlow userMeta={userMeta} customExerciseGroups={customGroups} />;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function WorkoutSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      <p className="text-sm text-muted-foreground">Loading workout data...</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (auth enforced by middleware -- only authenticated users reach this)
// ---------------------------------------------------------------------------
export default async function LogWorkoutPage() {
  return (
    <main className="w-full min-h-screen overflow-y-auto pb-20">
      <Suspense fallback={<WorkoutSkeleton />}>
        <WorkoutFlowLoader />
      </Suspense>
    </main>
  );
}
