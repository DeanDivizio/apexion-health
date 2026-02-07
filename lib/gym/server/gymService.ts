/**
 * Gym Service - Server-side Database Operations
 *
 * This module provides the data access layer for the gym/workout tracking feature.
 * It handles all Prisma database operations for:
 * - Creating workout sessions with exercises and sets
 * - Listing/retrieving workout history
 * - Fetching user-specific gym metadata (custom exercises, PRs, stats)
 *
 * The service translates between:
 * - Application types (from @/lib/gym) used by the UI and business logic
 * - Database schema (Prisma models) used for persistence
 *
 * Key concepts:
 * - WorkoutSession: A single gym visit containing multiple exercises
 * - ExerciseEntry: Either a strength or cardio exercise
 * - StrengthSet: Weight + reps for strength exercises (supports bilateral & unilateral)
 * - Variations: Exercise modifications (grip width, incline, etc.) stored separately
 */

import { prisma } from "@/lib/db/prisma";
import {
  EXERCISE_MAP,
  type DistanceUnit,
  type ExerciseCategory,
  type ExerciseEntry,
  type ExerciseGroup,
  type ExerciseRecord,
  type ExerciseStats,
  type GymUserMeta,
  type RepCount,
  type WorkoutSession,
} from "@/lib/gym";

// =============================================================================
// INTERNAL TYPES & HELPERS
// =============================================================================

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
 * @param reps - The RepCount from the application (either bilateral or left/right)
 * @returns Database-ready object with all three rep columns
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
 *
 * @param cols - The raw database columns
 * @returns A RepCount object for application use
 *
 * Logic: If repsBilateral has a value, it's a bilateral exercise.
 * Otherwise, reconstruct the left/right values (defaulting to 0).
 */
function columnsToRepCount(cols: RepColumns): RepCount {
  if (cols.repsBilateral !== null && cols.repsBilateral !== undefined) {
    return { bilateral: cols.repsBilateral };
  }
  return { left: cols.repsLeft ?? 0, right: cols.repsRight ?? 0 };
}

/**
 * Transforms variation selections from a Record to an array of rows for DB insertion.
 *
 * Variations are stored as a join table linking exercises to variation templates.
 * Each variation has:
 * - templateId: Which variation type (e.g., "width", "grip", "plane")
 * - optionKey: Which option was selected (e.g., "wide", "narrow")
 *
 * @param variations - Map of templateId -> selected optionKey
 * @returns Array of { templateId, optionKey } objects for createMany
 */
function variationsToRows(variations?: Record<string, string>) {
  if (!variations) return [];
  return Object.entries(variations).map(([templateId, optionKey]) => ({
    templateId,
    optionKey,
  }));
}

// =============================================================================
// CREATE OPERATIONS
// =============================================================================

/**
 * Creates a new workout session with all its exercises and sets.
 *
 * Uses a database transaction to ensure atomicity - if any part fails,
 * the entire workout is rolled back (no partial saves).
 *
 * Data structure created:
 * - GymWorkoutSession (1 per workout)
 *   └── GymWorkoutExercise (1 per exercise in the session)
 *       ├── GymStrengthSet (multiple, only for strength exercises)
 *       └── GymWorkoutExerciseVariation (multiple, for exercise modifications)
 *
 * @param userId - The Clerk user ID
 * @param session - The complete workout session data from the form
 * @returns The created session record (without nested relations)
 */
export async function createWorkoutSession(userId: string, session: WorkoutSession) {
  return prisma.$transaction(async (tx) => {
    // 1. Create the parent session record
    const createdSession = await tx.gymWorkoutSession.create({
      data: {
        userId,
        dateStr: session.date,
        startTimeStr: session.startTime,
        endTimeStr: session.endTime,
      },
    });

    // 2. Loop through each exercise in the session
    for (const [exerciseIndex, exercise] of session.exercises.entries()) {
      // Create the exercise record with type-specific fields
      // Cardio exercises have duration/distance, strength exercises don't
      const createdExercise = await tx.gymWorkoutExercise.create({
        data: {
          sessionId: createdSession.id,
          order: exerciseIndex, // Preserves exercise order in the workout
          type: exercise.type,
          exerciseKey: exercise.exerciseType,
          notes: exercise.notes ?? null,
          // Cardio-specific fields (null for strength exercises)
          durationMinutes: exercise.type === "cardio" ? exercise.duration : null,
          distance: exercise.type === "cardio" ? exercise.distance ?? null : null,
          distanceUnit: exercise.type === "cardio" ? exercise.unit ?? null : null,
        },
      });

      // 3. For strength exercises, create set records
      if (exercise.type === "strength") {
        for (const [setIndex, set] of exercise.sets.entries()) {
          const repColumns = repCountToColumns(set.reps);
          await tx.gymStrengthSet.create({
            data: {
              exerciseId: createdExercise.id,
              order: setIndex, // Preserves set order within the exercise
              weight: set.weight,
              effort: set.effort ?? null, // RPE (Rating of Perceived Exertion)
              durationSeconds: set.duration ?? null, // Time under tension
              ...repColumns, // Spread the rep columns (bilateral or left/right)
            },
          });
        }
      }

      // 4. Create variation records if any modifications were applied
      // (e.g., incline bench, wide grip, etc.)
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

// =============================================================================
// READ OPERATIONS
// =============================================================================

/**
 * Retrieves a user's workout sessions with optional date filtering.
 *
 * Fetches all nested data (exercises, sets, variations) and transforms
 * from database schema back to application types.
 *
 * @param userId - The Clerk user ID
 * @param options.startDate - Optional filter: only sessions on or after this date (YYYYMMDD)
 * @param options.endDate - Optional filter: only sessions on or before this date (YYYYMMDD)
 * @returns Array of WorkoutSession objects, sorted newest first
 */
export async function listWorkoutSessions(
  userId: string,
  options?: { startDate?: string; endDate?: string },
): Promise<WorkoutSession[]> {
  // Fetch sessions with all related data in a single query
  const sessions = await prisma.gymWorkoutSession.findMany({
    where: {
      userId,
      // Conditionally add date range filters
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
        orderBy: { order: "asc" }, // Maintain original exercise order
        include: {
          strengthSets: { orderBy: { order: "asc" } }, // Maintain original set order
          variations: true,
        },
      },
    },
  });

  // Transform database records to application types
  return sessions.map((session) => ({
    date: session.dateStr,
    startTime: session.startTimeStr,
    endTime: session.endTimeStr,
    exercises: session.exercises.map((exercise): ExerciseEntry => {
      // Rebuild the variations map from the join table rows
      const variations: Record<string, string> = {};
      for (const row of exercise.variations) {
        variations[row.templateId] = row.optionKey;
      }

      // Handle cardio exercises (running, cycling, etc.)
      if (exercise.type === "cardio") {
        return {
          type: "cardio",
          exerciseType: exercise.exerciseKey,
          duration: exercise.durationMinutes ?? 0,
          distance: exercise.distance ?? undefined,
          // Cast DB string to DistanceUnit type (DB stores as string, app needs union type)
          unit: (exercise.distanceUnit as DistanceUnit) ?? undefined,
          variations: Object.keys(variations).length ? variations : undefined,
          notes: exercise.notes ?? undefined,
        };
      }

      // Handle strength exercises (bench press, squats, etc.)
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

// =============================================================================
// METADATA & STATS
// =============================================================================

/**
 * Groups custom exercises by category for UI display.
 *
 * Takes a flat list of custom exercises and groups them into ExerciseGroup
 * objects for rendering in exercise picker dropdowns.
 *
 * @param customExercises - Array of custom exercise records with key and category
 * @returns Array of ExerciseGroup objects (category + sorted exercise keys)
 */
function buildCustomExerciseGroups(
  customExercises: Array<{ key: string; category: string }>,
): ExerciseGroup[] {
  // Group exercises by category using a Map
  const groups = new Map<string, string[]>();
  for (const exercise of customExercises) {
    const items = groups.get(exercise.category) ?? [];
    items.push(exercise.key);
    groups.set(exercise.category, items);
  }

  // Convert Map to array of ExerciseGroup objects
  return Array.from(groups.entries()).map(([group, items]) => ({
    // Cast to ExerciseCategory (DB stores as string, app needs union type)
    group: group as ExerciseCategory,
    items: items.sort(), // Alphabetical sort within each category
  }));
}

/**
 * Retrieves comprehensive gym metadata for a user.
 *
 * This is the main "bootstrap" call that loads everything the gym UI needs:
 * - Custom exercises the user has created
 * - Personal records and stats for each exercise
 * - Most recent session data for each exercise (for "repeat last workout" feature)
 *
 * The function merges data from multiple sources:
 * 1. User's custom exercise definitions
 * 2. Pre-computed stats from the stats table (PRs, notes)
 * 3. Session history (for most recent workout data)
 *
 * @param userId - The Clerk user ID
 * @returns GymUserMeta object with all user-specific gym data
 */
export async function getGymMeta(userId: string): Promise<GymUserMeta> {
  // Fetch all data sources in parallel for performance
  const [customExercises, statRows, sessions] = await Promise.all([
    // 1. User's custom exercise definitions
    prisma.gymCustomExercise.findMany({
      where: { userId },
      select: { key: true, category: true, name: true },
    }),
    // 2. Pre-aggregated exercise stats (PRs, notes)
    prisma.gymUserExerciseStat.findMany({
      where: { userId },
    }),
    // 3. Full workout history (for most recent session per exercise)
    listWorkoutSessions(userId),
  ]);

  // Build the exercise data map from stats
  const exerciseData: Record<string, ExerciseStats> = {};

  // Create a lookup map for custom exercises by key
  const customExerciseMap = new Map(
    customExercises.map((exercise) => [exercise.key, exercise]),
  );

  // Process pre-computed stats from the stats table
  for (const row of statRows) {
    // Try to find exercise definition (either built-in or custom)
    const exerciseDef = EXERCISE_MAP.get(row.exerciseKey);
    const customExercise = customExerciseMap.get(row.exerciseKey);

    // Determine display name and category (fallback chain)
    const displayName =
      exerciseDef?.name ?? customExercise?.name ?? row.exerciseKey;
    // Cast to ExerciseCategory (DB stores as string, app needs union type)
    const category: ExerciseCategory =
      (exerciseDef?.category as ExerciseCategory) ??
      (customExercise?.category as ExerciseCategory) ??
      "upperBody";

    // Build the personal record if we have all required fields
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

  // Augment exercise data with most recent session info
  // This enables "repeat last workout" functionality
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      // Only track most recent for strength exercises (cardio doesn't have sets)
      if (exercise.type !== "strength") continue;

      const exerciseKey = exercise.exerciseType;
      const existing = exerciseData[exerciseKey];

      // Skip if we already found a more recent session for this exercise
      if (existing?.mostRecentSession) continue;

      // Either update existing stats or create new entry
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
