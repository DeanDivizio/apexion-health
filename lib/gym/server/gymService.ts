import { prisma } from "@/lib/db/prisma";
import {
  EXERCISE_MAP,
  type ExerciseEntry,
  type ExerciseGroup,
  type ExerciseRecord,
  type ExerciseStats,
  type GymUserMeta,
  type RepCount,
  type WorkoutSession,
} from "@/lib/gym";

type RepColumns = {
  repsBilateral: number | null;
  repsLeft: number | null;
  repsRight: number | null;
};

function repCountToColumns(reps: RepCount): RepColumns {
  if (reps.bilateral !== undefined) {
    return { repsBilateral: reps.bilateral, repsLeft: null, repsRight: null };
  }
  return {
    repsBilateral: null,
    repsLeft: reps.left ?? null,
    repsRight: reps.right ?? null,
  };
}

function columnsToRepCount(cols: RepColumns): RepCount {
  if (cols.repsBilateral !== null && cols.repsBilateral !== undefined) {
    return { bilateral: cols.repsBilateral };
  }
  return { left: cols.repsLeft ?? 0, right: cols.repsRight ?? 0 };
}

function variationsToRows(variations?: Record<string, string>) {
  if (!variations) return [];
  return Object.entries(variations).map(([templateId, optionKey]) => ({
    templateId,
    optionKey,
  }));
}

export async function createWorkoutSession(userId: string, session: WorkoutSession) {
  return prisma.$transaction(async (tx) => {
    const createdSession = await tx.gymWorkoutSession.create({
      data: {
        userId,
        dateStr: session.date,
        startTimeStr: session.startTime,
        endTimeStr: session.endTime,
      },
    });

    for (const [exerciseIndex, exercise] of session.exercises.entries()) {
      const createdExercise = await tx.gymWorkoutExercise.create({
        data: {
          sessionId: createdSession.id,
          order: exerciseIndex,
          type: exercise.type,
          exerciseKey: exercise.exerciseType,
          notes: exercise.notes ?? null,
          durationMinutes: exercise.type === "cardio" ? exercise.duration : null,
          distance: exercise.type === "cardio" ? exercise.distance ?? null : null,
          distanceUnit: exercise.type === "cardio" ? exercise.unit ?? null : null,
        },
      });

      if (exercise.type === "strength") {
        for (const [setIndex, set] of exercise.sets.entries()) {
          const repColumns = repCountToColumns(set.reps);
          await tx.gymStrengthSet.create({
            data: {
              exerciseId: createdExercise.id,
              order: setIndex,
              weight: set.weight,
              effort: set.effort ?? null,
              durationSeconds: set.duration ?? null,
              ...repColumns,
            },
          });
        }
      }

      const variationRows = variationsToRows(exercise.variations);
      if (variationRows.length > 0) {
        await tx.gymWorkoutExerciseVariation.createMany({
          data: variationRows.map((row) => ({
            exerciseId: createdExercise.id,
            templateId: row.templateId,
            optionKey: row.optionKey,
          })),
        });
      }
    }

    return createdSession;
  });
}

export async function listWorkoutSessions(
  userId: string,
  options?: { startDate?: string; endDate?: string },
): Promise<WorkoutSession[]> {
  const sessions = await prisma.gymWorkoutSession.findMany({
    where: {
      userId,
      ...(options?.startDate || options?.endDate
        ? {
            dateStr: {
              ...(options.startDate ? { gte: options.startDate } : {}),
              ...(options.endDate ? { lte: options.endDate } : {}),
            },
          }
        : {}),
    },
    orderBy: [{ dateStr: "desc" }, { startTimeStr: "desc" }],
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          strengthSets: { orderBy: { order: "asc" } },
          variations: true,
        },
      },
    },
  });

  return sessions.map((session) => ({
    date: session.dateStr,
    startTime: session.startTimeStr,
    endTime: session.endTimeStr,
    exercises: session.exercises.map((exercise) => {
      const variations: Record<string, string> = {};
      for (const row of exercise.variations) {
        variations[row.templateId] = row.optionKey;
      }

      if (exercise.type === "cardio") {
        return {
          type: "cardio",
          exerciseType: exercise.exerciseKey,
          duration: exercise.durationMinutes ?? 0,
          distance: exercise.distance ?? undefined,
          unit: exercise.distanceUnit ?? undefined,
          variations: Object.keys(variations).length ? variations : undefined,
          notes: exercise.notes ?? undefined,
        };
      }

      return {
        type: "strength",
        exerciseType: exercise.exerciseKey,
        sets: exercise.strengthSets.map((set) => ({
          weight: set.weight,
          reps: columnsToRepCount({
            repsBilateral: set.repsBilateral,
            repsLeft: set.repsLeft,
            repsRight: set.repsRight,
          }),
          effort: set.effort ?? undefined,
          duration: set.durationSeconds ?? undefined,
        })),
        variations: Object.keys(variations).length ? variations : undefined,
        notes: exercise.notes ?? undefined,
      };
    }),
  }));
}

function buildCustomExerciseGroups(customExercises: Array<{ key: string; category: string }>): ExerciseGroup[] {
  const groups = new Map<string, string[]>();
  for (const exercise of customExercises) {
    const items = groups.get(exercise.category) ?? [];
    items.push(exercise.key);
    groups.set(exercise.category, items);
  }

  return Array.from(groups.entries()).map(([group, items]) => ({
    group,
    items: items.sort(),
  }));
}

export async function getGymMeta(userId: string): Promise<GymUserMeta> {
  const [customExercises, statRows, sessions] = await Promise.all([
    prisma.gymCustomExercise.findMany({
      where: { userId },
      select: { key: true, category: true, name: true },
    }),
    prisma.gymUserExerciseStat.findMany({
      where: { userId },
    }),
    listWorkoutSessions(userId),
  ]);

  const exerciseData: Record<string, ExerciseStats> = {};
  const customExerciseMap = new Map(customExercises.map((exercise) => [exercise.key, exercise]));

  for (const row of statRows) {
    const exerciseDef = EXERCISE_MAP.get(row.exerciseKey);
    const customExercise = customExerciseMap.get(row.exerciseKey);
    const displayName = exerciseDef?.name ?? customExercise?.name ?? row.exerciseKey;
    const category = exerciseDef?.category ?? customExercise?.category ?? "upperBody";

    let recordSet: ExerciseRecord | undefined;
    if (row.prDateStr && row.prWeight !== null && row.prTotalVolume !== null) {
      recordSet = {
        date: row.prDateStr,
        weight: row.prWeight ?? 0,
        reps: columnsToRepCount({
          repsBilateral: row.prRepsBilateral,
          repsLeft: row.prRepsLeft,
          repsRight: row.prRepsRight,
        }),
        totalVolume: row.prTotalVolume ?? 0,
      };
    }

    exerciseData[row.exerciseKey] = {
      exerciseKey: row.exerciseKey,
      displayName,
      category,
      recordSet,
      notes: row.notes ?? undefined,
    };
  }

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.type !== "strength") continue;
      const exerciseKey = exercise.exerciseType;
      const existing = exerciseData[exerciseKey];
      if (existing?.mostRecentSession) continue;

      exerciseData[exerciseKey] = {
        exerciseKey,
        displayName: existing?.displayName ?? exercise.exerciseType,
        category: existing?.category ?? "upperBody",
        mostRecentSession: {
          date: session.date,
          sets: exercise.sets,
        },
        recordSet: existing?.recordSet,
        notes: existing?.notes,
      };
    }
  }

  return {
    userID: userId,
    customExercises: buildCustomExerciseGroups(customExercises),
    exerciseData,
  };
}
