"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import {
  workoutSessionSchema,
  createCustomExerciseInputSchema,
  listSessionsOptionsSchema,
  updateGymPreferencesSchema,
  EXERCISE_MAP,
} from "@/lib/gym";
import { updateTag } from "next/cache";
import {
  createWorkoutSession,
  deleteWorkoutSession,
  getExerciseDefaults,
  getGymMeta,
  getWorkoutDaySummary,
  getWorkoutSession,
  getUserPreferences,
  listWorkoutSessions,
  saveExerciseDefaults,
  updateUserPreferences,
  updateWorkoutSession,
} from "@/lib/gym/server/gymService";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

// =============================================================================
// HELPERS
// =============================================================================

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

// =============================================================================
// WORKOUT SESSION ACTIONS
// =============================================================================

export async function createWorkoutSessionAction(session: unknown) {
  const userId = await requireUserId();
  try {
    const parsed = workoutSessionSchema.parse(session);
    const result = await createWorkoutSession(userId, parsed);
    updateTag(`workoutSummary:${userId}`);
    return result;
  } catch (error) {
    const label = "[createWorkoutSessionAction]";
    if (error instanceof z.ZodError) {
      const details = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      console.error(label, "Zod validation failed:", details, JSON.stringify(error.issues));
      throw new Error(`Validation failed: ${details}`);
    }
    console.error(label, error);
    throw error;
  }
}

export async function getWorkoutSessionAction(sessionId: string) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  return getWorkoutSession(userId, sessionId);
}

export async function listWorkoutSessionsAction(options?: unknown) {
  const userId = await requireUserId();
  const parsed = options ? listSessionsOptionsSchema.parse(options) : undefined;
  return listWorkoutSessions(userId, parsed);
}

export async function updateWorkoutSessionAction(sessionId: string, session: unknown) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  const parsed = workoutSessionSchema.parse(session);
  const result = await updateWorkoutSession(userId, sessionId, parsed);
  updateTag(`workoutSummary:${userId}`);
  return result;
}

export async function deleteWorkoutSessionAction(sessionId: string) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  const result = await deleteWorkoutSession(userId, sessionId);
  updateTag(`workoutSummary:${userId}`);
  return result;
}

// =============================================================================
// METADATA ACTIONS
// =============================================================================

export async function getGymMetaAction() {
  const userId = await requireUserId();
  return getGymMeta(userId);
}

// =============================================================================
// CUSTOM EXERCISE ACTIONS
// =============================================================================

export async function createCustomExerciseAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createCustomExerciseInputSchema.parse(input);

  if (EXERCISE_MAP.has(parsed.key)) {
    throw new Error("That name matches a built-in exercise. Try a more specific custom name.");
  }

  const existingCustom = await prisma.gymCustomExercise.findUnique({
    where: { userId_key: { userId, key: parsed.key } },
    select: { id: true },
  });
  if (existingCustom) {
    throw new Error("You already have a custom exercise with that name.");
  }

  try {
    return prisma.gymCustomExercise.create({
      data: {
        userId,
        key: parsed.key,
        name: parsed.name,
        category: parsed.category,
        repMode: parsed.repMode,
        targets: parsed.targets.length
          ? {
              create: parsed.targets.map((target) => ({
                muscle: target.muscle,
                weight: target.weight,
              })),
            }
          : undefined,
        variationSupports: parsed.variationSupports.length
          ? {
              create: parsed.variationSupports.map((support) => ({
                templateId: support.templateId,
                labelOverride: support.labelOverride ?? null,
                defaultOptionKey: support.defaultOptionKey ?? null,
              })),
            }
          : undefined,
        optionOverrides: parsed.optionLabelOverrides.length
          ? {
              create: parsed.optionLabelOverrides.map((override) => ({
                templateId: override.templateId,
                optionKey: override.optionKey,
                labelOverride: override.labelOverride,
              })),
            }
          : undefined,
        effects: parsed.variationEffects.length
          ? {
              create: parsed.variationEffects.map((effect) => ({
                templateId: effect.templateId,
                optionKey: effect.optionKey,
                multipliers: effect.multipliers ?? undefined,
                deltas: effect.deltas ?? undefined,
              })),
            }
          : undefined,
      },
    });
  } catch (error) {
    // Guard against race conditions where another request inserts the same key.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("You already have a custom exercise with that name.");
    }
    throw error;
  }
}

// =============================================================================
// EXERCISE DEFAULTS ACTIONS
// =============================================================================

const exerciseDefaultsInputSchema = z.object({
  exerciseKey: z.string().min(1),
  defaults: z.record(z.string(), z.string()),
});

export async function getExerciseDefaultsAction(exerciseKey: string) {
  const userId = await requireUserId();
  if (!exerciseKey) throw new Error("Exercise key is required.");
  return getExerciseDefaults(userId, exerciseKey);
}

export async function saveExerciseDefaultsAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = exerciseDefaultsInputSchema.parse(input);
  return saveExerciseDefaults(userId, parsed.exerciseKey, parsed.defaults);
}

// =============================================================================
// USER PREFERENCES ACTIONS
// =============================================================================

export async function getGymUserPreferencesAction() {
  const userId = await requireUserId();
  return getUserPreferences(userId);
}

export async function updateGymUserPreferencesAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = updateGymPreferencesSchema.parse(input);
  return updateUserPreferences(userId, parsed);
}

// =============================================================================
// WORKOUT DAY SUMMARY (for home screen)
// =============================================================================

export async function getWorkoutDaySummaryAction(dateStr: string) {
  const userId = await requireUserId();
  return getWorkoutDaySummary(userId, dateStr);
}
