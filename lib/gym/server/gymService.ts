/**
 * Gym Service - Server-side Database Operations
 *
 * This module provides the data access layer for the gym/workout tracking feature.
 * It handles all Prisma database operations for:
 * - Creating, reading, updating, and deleting workout sessions
 * - Exercise stats and personal record (PR) tracking
 * - User-specific gym metadata (custom exercises, PRs, stats)
 * - User preferences (weight unit, etc.)
 *
 * The service translates between:
 * - Application types (from @/lib/gym) used by the UI and business logic
 * - Database schema (Prisma models) used for persistence
 *
 * Key concepts:
 * - WorkoutSession: A single gym visit containing multiple exercises
 * - ExerciseEntry: Either a strength or cardio exercise
 * - StrengthSet: Weight + reps for strength exercises (supports bilateral & unilateral)
 * - Variations: Exercise modifications (grip width, incline, etc.) stored as a join table
 * - PR detection: Automatically updates personal records when new workouts are saved
 */

import { prisma } from "@/lib/db/prisma";
import {
  EXERCISE_MAP,
  calculateSetVolume,
  type DistanceUnit,
  type ExerciseCategory,
  type ExerciseEntry,
  type ExerciseGroup,
  type ExerciseRecord,
  type ExerciseStats,
  type GymUserMeta,
  type RepCount,
  type StrengthSet,
  type WorkoutSession,
} from "@/lib/gym";

// =============================================================================
// INTERNAL TYPES & HELPERS
// =============================================================================

/** Prisma interactive transaction client. */
type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Database column structure for rep counts.
 * The DB stores reps in 3 nullable columns to support both bilateral and unilateral exercises:
 * - Bilateral (e.g., bench press): uses repsBilateral, others are null
 * - Unilateral (e.g., dumbbell curl): uses repsLeft/repsRight, bilateral is null
 */
type RepColumns = {
  repsBilateral: number | null;
  repsLeft: number | null;
  repsRight: number | null;
};

/**
 * Converts an application RepCount to database column format.
 *
 * @example
 * // Bilateral exercise (both arms together)
 * repCountToColumns({ bilateral: 10 })
 * // => { repsBilateral: 10, repsLeft: null, repsRight: null }
 *
 * @example
 * // Unilateral exercise (one arm at a time)
 * repCountToColumns({ left: 10, right: 8 })
 * // => { repsBilateral: null, repsLeft: 10, repsRight: 8 }
 */
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

/**
 * Converts database rep columns back to application RepCount format.
 */
function columnsToRepCount(cols: RepColumns): RepCount {
  if (cols.repsBilateral !== null && cols.repsBilateral !== undefined) {
    return { bilateral: cols.repsBilateral };
  }
  return { left: cols.repsLeft ?? 0, right: cols.repsRight ?? 0 };
}

/**
 * Transforms variation selections from a Record to an array of rows for DB insertion.
 */
function variationsToRows(variations?: Record<string, string>) {
  if (!variations) return [];
  return Object.entries(variations).map(([templateId, optionKey]) => ({
    templateId,
    optionKey,
  }));
}

/**
 * Calculate set volume directly from DB column values.
 * Uses the same logic as calculateSetVolume but works with raw DB columns.
 */
function calculateVolumeFromColumns(weight: number, cols: RepColumns): number {
  if (cols.repsBilateral !== null && cols.repsBilateral !== undefined) {
    return weight * cols.repsBilateral;
  }
  const avgReps = ((cols.repsLeft ?? 0) + (cols.repsRight ?? 0)) / 2;
  return weight * avgReps;
}

// =============================================================================
// DB-TO-APP TRANSFORMATION HELPERS
// =============================================================================

/**
 * Transform a DB exercise record into an application ExerciseEntry.
 * Handles both strength and cardio exercise types.
 */
function transformExercise(dbExercise: {
  type: string;
  exerciseKey: string;
  durationMinutes: number | null;
  distance: number | null;
  distanceUnit: string | null;
  notes: string | null;
  strengthSets: Array<{
    weight: number;
    repsBilateral: number | null;
    repsLeft: number | null;
    repsRight: number | null;
    effort: number | null;
    durationSeconds: number | null;
  }>;
  variations: Array<{
    templateId: string;
    optionKey: string;
  }>;
}): ExerciseEntry {
  // Rebuild the variations map from join table rows
  const variations: Record<string, string> = {};
  for (const row of dbExercise.variations) {
    variations[row.templateId] = row.optionKey;
  }
  const hasVariations = Object.keys(variations).length > 0;

  if (dbExercise.type === "cardio") {
    return {
      type: "cardio",
      exerciseType: dbExercise.exerciseKey,
      duration: dbExercise.durationMinutes ?? 0,
      distance: dbExercise.distance ?? undefined,
      unit: (dbExercise.distanceUnit as DistanceUnit) ?? undefined,
      variations: hasVariations ? variations : undefined,
      notes: dbExercise.notes ?? undefined,
    };
  }

  return {
    type: "strength",
    exerciseType: dbExercise.exerciseKey,
    sets: dbExercise.strengthSets.map((set) => ({
      weight: set.weight,
      reps: columnsToRepCount({
        repsBilateral: set.repsBilateral,
        repsLeft: set.repsLeft,
        repsRight: set.repsRight,
      }),
      effort: set.effort ?? undefined,
      duration: set.durationSeconds ?? undefined,
    })),
    variations: hasVariations ? variations : undefined,
    notes: dbExercise.notes ?? undefined,
  };
}

// =============================================================================
// WRITE HELPERS (used by create & update)
// =============================================================================

/**
 * Creates exercise records, sets, and variation selections for a session.
 * Extracted for reuse between create and update flows.
 */
async function createExercisesForSession(
  tx: TxClient,
  sessionId: string,
  exercises: ExerciseEntry[],
) {
  for (const [exerciseIndex, exercise] of exercises.entries()) {
    const createdExercise = await tx.gymWorkoutExercise.create({
      data: {
        sessionId,
        order: exerciseIndex,
        type: exercise.type,
        exerciseKey: exercise.exerciseType,
        notes: exercise.notes ?? null,
        durationMinutes: exercise.type === "cardio" ? exercise.duration : null,
        distance: exercise.type === "cardio" ? exercise.distance ?? null : null,
        distanceUnit: exercise.type === "cardio" ? exercise.unit ?? null : null,
      },
    });

    // Create strength sets
    if (exercise.type === "strength") {
      for (const [setIndex, set] of exercise.sets.entries()) {
        await tx.gymStrengthSet.create({
          data: {
            exerciseId: createdExercise.id,
            order: setIndex,
            weight: set.weight,
            effort: set.effort ?? null,
            durationSeconds: set.duration ?? null,
            ...repCountToColumns(set.reps),
          },
        });
      }
    }

    // Create variation selections
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
}

/**
 * Detects personal records from a newly created workout session
 * and creates/updates the user's exercise stats accordingly.
 *
 * For each strength exercise, finds the highest-volume set and
 * compares it against the user's stored PR.
 */
async function updateStatsAfterCreate(
  tx: TxClient,
  userId: string,
  session: WorkoutSession,
) {
  for (const exercise of session.exercises) {
    if (exercise.type !== "strength") continue;

    // Find the highest-volume set in this exercise
    let bestVolume = 0;
    let bestSet: StrengthSet | null = null;
    for (const set of exercise.sets) {
      const volume = calculateSetVolume(set);
      if (volume > bestVolume) {
        bestVolume = volume;
        bestSet = set;
      }
    }

    if (!bestSet || bestVolume <= 0) continue;

    const existing = await tx.gymUserExerciseStat.findUnique({
      where: {
        userId_exerciseKey: { userId, exerciseKey: exercise.exerciseType },
      },
    });

    const repCols = repCountToColumns(bestSet.reps);

    if (!existing) {
      // First time performing this exercise — create stat with PR
      await tx.gymUserExerciseStat.create({
        data: {
          userId,
          exerciseKey: exercise.exerciseType,
          prDateStr: session.date,
          prWeight: bestSet.weight,
          prRepsBilateral: repCols.repsBilateral,
          prRepsLeft: repCols.repsLeft,
          prRepsRight: repCols.repsRight,
          prTotalVolume: bestVolume,
        },
      });
    } else if (existing.prTotalVolume === null || bestVolume > existing.prTotalVolume) {
      // New personal record — update
      await tx.gymUserExerciseStat.update({
        where: { id: existing.id },
        data: {
          prDateStr: session.date,
          prWeight: bestSet.weight,
          prRepsBilateral: repCols.repsBilateral,
          prRepsLeft: repCols.repsLeft,
          prRepsRight: repCols.repsRight,
          prTotalVolume: bestVolume,
        },
      });
    }
  }
}

/**
 * Recalculates the PR for a specific exercise by scanning all remaining sessions.
 * Called after delete/update to ensure stats remain accurate.
 *
 * If no sets remain, the PR fields are cleared but the stat row is preserved
 * (to retain user notes).
 */
async function recalculateExerciseStat(
  tx: TxClient,
  userId: string,
  exerciseKey: string,
) {
  // Find all strength sets for this exercise across all user's sessions
  const sets = await tx.gymStrengthSet.findMany({
    where: {
      exercise: {
        exerciseKey,
        session: { userId },
      },
    },
    include: {
      exercise: {
        include: {
          session: { select: { dateStr: true } },
        },
      },
    },
  });

  let bestVolume = 0;
  let bestSet: (typeof sets)[number] | null = null;

  for (const set of sets) {
    const volume = calculateVolumeFromColumns(set.weight, {
      repsBilateral: set.repsBilateral,
      repsLeft: set.repsLeft,
      repsRight: set.repsRight,
    });
    if (volume > bestVolume) {
      bestVolume = volume;
      bestSet = set;
    }
  }

  const existing = await tx.gymUserExerciseStat.findUnique({
    where: { userId_exerciseKey: { userId, exerciseKey } },
  });

  if (!existing) return;

  if (bestSet && bestVolume > 0) {
    await tx.gymUserExerciseStat.update({
      where: { id: existing.id },
      data: {
        prDateStr: bestSet.exercise.session.dateStr,
        prWeight: bestSet.weight,
        prRepsBilateral: bestSet.repsBilateral,
        prRepsLeft: bestSet.repsLeft,
        prRepsRight: bestSet.repsRight,
        prTotalVolume: bestVolume,
      },
    });
  } else {
    // No sets remain — clear the PR but keep the stat row (preserves notes)
    await tx.gymUserExerciseStat.update({
      where: { id: existing.id },
      data: {
        prDateStr: null,
        prWeight: null,
        prRepsBilateral: null,
        prRepsLeft: null,
        prRepsRight: null,
        prTotalVolume: null,
      },
    });
  }
}

// =============================================================================
// CREATE OPERATIONS
// =============================================================================

/**
 * Creates a new workout session with all its exercises, sets, and variations.
 * Also detects and records personal records.
 *
 * Uses a database transaction to ensure atomicity — if any part fails,
 * the entire workout is rolled back.
 */
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

    await createExercisesForSession(tx, createdSession.id, session.exercises);
    await updateStatsAfterCreate(tx, userId, session);

    return createdSession;
  });
}

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * Retrieves a single workout session by ID.
 * Returns null if the session doesn't exist or doesn't belong to the user.
 */
export async function getWorkoutSession(
  userId: string,
  sessionId: string,
): Promise<(WorkoutSession & { id: string }) | null> {
  const session = await prisma.gymWorkoutSession.findFirst({
    where: { id: sessionId, userId },
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

  if (!session) return null;

  return {
    id: session.id,
    date: session.dateStr,
    startTime: session.startTimeStr,
    endTime: session.endTimeStr,
    exercises: session.exercises.map(transformExercise),
  };
}

/**
 * Retrieves a user's workout sessions with optional date filtering.
 * Returns sessions sorted newest-first with all nested data.
 */
export async function listWorkoutSessions(
  userId: string,
  options?: { startDate?: string; endDate?: string },
): Promise<Array<WorkoutSession & { id: string }>> {
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
    id: session.id,
    date: session.dateStr,
    startTime: session.startTimeStr,
    endTime: session.endTimeStr,
    exercises: session.exercises.map(transformExercise),
  }));
}

// =============================================================================
// UPDATE OPERATIONS
// =============================================================================

/**
 * Replaces a workout session's contents.
 *
 * Strategy: delete all child records, update session fields, recreate children.
 * Also recalculates PR stats for any exercises affected (old or new).
 */
export async function updateWorkoutSession(
  userId: string,
  sessionId: string,
  session: WorkoutSession,
) {
  return prisma.$transaction(async (tx) => {
    // Verify ownership and collect old exercise keys
    const existing = await tx.gymWorkoutSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        exercises: {
          where: { type: "strength" },
          select: { exerciseKey: true },
        },
      },
    });

    if (!existing) throw new Error("Workout session not found");

    // Track all exercise keys that need stat recalculation (old + new)
    const affectedKeys = new Set(existing.exercises.map((e) => e.exerciseKey));
    for (const ex of session.exercises) {
      if (ex.type === "strength") affectedKeys.add(ex.exerciseType);
    }

    // Delete old child records (cascade: exercises → sets + variations)
    await tx.gymWorkoutExercise.deleteMany({ where: { sessionId } });

    // Update session-level fields
    await tx.gymWorkoutSession.update({
      where: { id: sessionId },
      data: {
        dateStr: session.date,
        startTimeStr: session.startTime,
        endTimeStr: session.endTime,
      },
    });

    // Recreate exercises, sets, and variations
    await createExercisesForSession(tx, sessionId, session.exercises);

    // Recalculate stats for all affected exercises
    for (const key of affectedKeys) {
      await recalculateExerciseStat(tx, userId, key);
    }
  });
}

// =============================================================================
// DELETE OPERATIONS
// =============================================================================

/**
 * Deletes a workout session and recalculates stats for affected exercises.
 * The cascade on GymWorkoutSession handles deleting child records.
 */
export async function deleteWorkoutSession(userId: string, sessionId: string) {
  return prisma.$transaction(async (tx) => {
    // Verify ownership and collect affected exercise keys
    const session = await tx.gymWorkoutSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        exercises: {
          where: { type: "strength" },
          select: { exerciseKey: true },
        },
      },
    });

    if (!session) throw new Error("Workout session not found");

    const affectedKeys = [...new Set(session.exercises.map((e) => e.exerciseKey))];

    // Cascade deletes exercises, sets, and variations
    await tx.gymWorkoutSession.delete({ where: { id: sessionId } });

    // Recalculate stats for exercises that were in the deleted session
    for (const key of affectedKeys) {
      await recalculateExerciseStat(tx, userId, key);
    }
  });
}

// =============================================================================
// METADATA & STATS
// =============================================================================

/**
 * Groups custom exercises by category for UI display.
 */
function buildCustomExerciseGroups(
  customExercises: Array<{ key: string; category: string }>,
): ExerciseGroup[] {
  const groups = new Map<string, string[]>();
  for (const exercise of customExercises) {
    const items = groups.get(exercise.category) ?? [];
    items.push(exercise.key);
    groups.set(exercise.category, items);
  }
  return Array.from(groups.entries()).map(([group, items]) => ({
    group: group as ExerciseCategory,
    items: items.sort(),
  }));
}

/**
 * Retrieves comprehensive gym metadata for a user.
 *
 * This is the main "bootstrap" call that loads everything the gym UI needs:
 * - Custom exercises the user has created
 * - Personal records and stats for each exercise
 * - Most recent session data for each exercise (for "repeat last workout" feature)
 */
export async function getGymMeta(userId: string): Promise<GymUserMeta> {
  const [customExercises, statRows, sessions] = await Promise.all([
    prisma.gymCustomExercise.findMany({
      where: { userId },
      select: { key: true, category: true, name: true },
    }),
    prisma.gymUserExerciseStat.findMany({
      where: { userId },
    }),
    // TODO: Optimize — currently loads all sessions to find most recent per exercise.
    // Consider storing lastSessionDate/sets on GymUserExerciseStat or using a targeted query.
    listWorkoutSessions(userId),
  ]);

  const exerciseData: Record<string, ExerciseStats> = {};
  const customExerciseMap = new Map(
    customExercises.map((exercise) => [exercise.key, exercise]),
  );

  // Build stats from pre-computed PR data
  for (const row of statRows) {
    const exerciseDef = EXERCISE_MAP.get(row.exerciseKey);
    const customExercise = customExerciseMap.get(row.exerciseKey);

    const displayName =
      exerciseDef?.name ?? customExercise?.name ?? row.exerciseKey;
    const category: ExerciseCategory =
      (exerciseDef?.category as ExerciseCategory) ??
      (customExercise?.category as ExerciseCategory) ??
      "upperBody";

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

  // Augment with most recent session info (for "repeat last workout")
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (exercise.type !== "strength") continue;

      const exerciseKey = exercise.exerciseType;
      const existing = exerciseData[exerciseKey];

      // Skip if we already found a more recent session for this exercise
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

// =============================================================================
// EXERCISE DEFAULTS (User-specific variation preferences per exercise)
// =============================================================================

/**
 * Retrieves a user's saved default variation selections for a specific exercise.
 * Returns a map of templateId -> optionKey.
 */
export async function getExerciseDefaults(
  userId: string,
  exerciseKey: string,
): Promise<Record<string, string>> {
  const rows = await prisma.gymUserExerciseDefault.findMany({
    where: { userId, exerciseKey },
  });
  const defaults: Record<string, string> = {};
  for (const row of rows) {
    defaults[row.templateId] = row.optionKey;
  }
  return defaults;
}

/**
 * Saves (upserts) a user's default variation selections for a specific exercise.
 * Deletes all existing defaults for this exercise/user pair and creates new ones.
 */
export async function saveExerciseDefaults(
  userId: string,
  exerciseKey: string,
  defaults: Record<string, string>,
) {
  return prisma.$transaction(async (tx) => {
    // Remove existing defaults for this exercise
    await tx.gymUserExerciseDefault.deleteMany({
      where: { userId, exerciseKey },
    });

    // Create new defaults
    const rows = Object.entries(defaults).map(([templateId, optionKey]) => ({
      userId,
      exerciseKey,
      templateId,
      optionKey,
    }));

    if (rows.length > 0) {
      await tx.gymUserExerciseDefault.createMany({ data: rows });
    }
  });
}

// =============================================================================
// USER PREFERENCES
// =============================================================================

/**
 * Retrieves gym preferences for a user.
 * Returns defaults if no preferences have been saved yet.
 */
export async function getUserPreferences(userId: string) {
  const prefs = await prisma.gymUserPreferences.findUnique({
    where: { userId },
  });
  return prefs ?? { userId, weightUnit: "lbs" };
}

/**
 * Creates or updates gym preferences for a user.
 */
export async function updateUserPreferences(
  userId: string,
  data: { weightUnit?: string },
) {
  return prisma.gymUserPreferences.upsert({
    where: { userId },
    create: {
      userId,
      weightUnit: data.weightUnit ?? "lbs",
    },
    update: {
      ...(data.weightUnit !== undefined ? { weightUnit: data.weightUnit } : {}),
    },
  });
}
