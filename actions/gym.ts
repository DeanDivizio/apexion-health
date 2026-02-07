"use server";

import { auth } from "@clerk/nextjs/server";
import {
  workoutSessionSchema,
  createCustomExerciseInputSchema,
  listSessionsOptionsSchema,
  updateGymPreferencesSchema,
} from "@/lib/gym";
import {
  createWorkoutSession,
  deleteWorkoutSession,
  getGymMeta,
  getWorkoutSession,
  getUserPreferences,
  listWorkoutSessions,
  updateUserPreferences,
  updateWorkoutSession,
} from "@/lib/gym/server/gymService";
import { prisma } from "@/lib/db/prisma";

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
  const parsed = workoutSessionSchema.parse(session);
  return createWorkoutSession(userId, parsed);
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
  return updateWorkoutSession(userId, sessionId, parsed);
}

export async function deleteWorkoutSessionAction(sessionId: string) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  return deleteWorkoutSession(userId, sessionId);
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
