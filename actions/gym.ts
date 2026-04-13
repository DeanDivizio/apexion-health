"use server";

import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";
import {
  workoutSessionSchema,
  createCustomExerciseInputSchema,
  updateCustomExerciseInputSchema,
  listSessionsOptionsSchema,
  updateGymPreferencesSchema,
  updatePersistentExerciseNoteSchema,
  createSupersetTemplateInputSchema,
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
  updatePersistentExerciseNote,
  updateUserPreferences,
  updateWorkoutSession,
  updateWorkoutSessionName,
  createSupersetTemplate,
  deleteSupersetTemplate,
  getSupersetTemplates,
  getRecentSupersetPairings,
} from "@/lib/gym/server/gymService";
import { prisma } from "@/lib/db/prisma";
import { getPostHogClient } from "@/lib/posthog-server";
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

export async function updateWorkoutSessionNameAction(sessionId: string, sessionName: string | null) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  await updateWorkoutSessionName(userId, sessionId, sessionName);
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
// PERSISTENT EXERCISE NOTE ACTIONS
// =============================================================================

export async function updatePersistentExerciseNoteAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = updatePersistentExerciseNoteSchema.parse(input);
  await updatePersistentExerciseNote(
    userId,
    parsed.exerciseKey,
    parsed.presetName,
    parsed.notes,
  );
  updateTag(`gymMeta:${userId}`);
  return { success: true };
}

// =============================================================================
// CUSTOM EXERCISE ACTIONS
// =============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function generateExerciseKey(name: string): string {
  return `custom_${slugify(name)}_${nanoid(6)}`;
}

export async function createCustomExerciseAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createCustomExerciseInputSchema.parse(input);

  const key = generateExerciseKey(parsed.name);

  if (EXERCISE_MAP.has(key)) {
    throw new Error("Generated key collides with a built-in exercise. Try a different name.");
  }

  try {
    const exercise = await prisma.gymCustomExercise.create({
      data: {
        userId,
        key,
        name: parsed.name,
        category: parsed.category,
        repMode: parsed.repMode,
        presetId: parsed.presetId ?? null,
        movementPattern: parsed.movementPattern ?? null,
        bodyRegion: parsed.bodyRegion ?? null,
        movementPlane: parsed.movementPlane ?? null,
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

    if (parsed.requestCanonicalization) {
      await prisma.gymCanonRequest.create({
        data: {
          userId,
          customExerciseId: exercise.id,
          userNote: parsed.canonicalizationNote ?? null,
          snapshotPayload: {
            name: parsed.name,
            category: parsed.category,
            repMode: parsed.repMode,
            presetId: parsed.presetId,
            targets: parsed.targets,
            variationSupports: parsed.variationSupports,
          },
        },
      });

      getPostHogClient().capture({
        distinctId: userId,
        event: "gym_custom_exercise_canonicalization_requested",
        properties: {
          exercise_key: key,
          category: parsed.category,
          preset_id: parsed.presetId ?? null,
          has_user_note: !!parsed.canonicalizationNote,
        },
      });
    }

    updateTag(`gymMeta:${userId}`);

    getPostHogClient().capture({
      distinctId: userId,
      event: "gym_custom_exercise_created",
      properties: {
        exercise_key: key,
        is_custom: true,
        category: parsed.category,
        preset_id: parsed.presetId ?? null,
        movement_pattern: parsed.movementPattern ?? null,
        body_region: parsed.bodyRegion ?? null,
        movement_plane: parsed.movementPlane ?? null,
        variation_template_count: parsed.variationSupports.length,
        has_variation_effects: false,
        requested_canonicalization: parsed.requestCanonicalization,
        source_surface: "search_empty_state",
      },
    });

    return { key, id: exercise.id, name: exercise.name };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("You already have a custom exercise with that name.");
    }

    getPostHogClient().capture({
      distinctId: userId,
      event: "gym_custom_exercise_create_failed",
      properties: {
        error: error instanceof Error ? error.message : "Unknown error",
        category: parsed.category,
        preset_id: parsed.presetId ?? null,
      },
    });

    throw error;
  }
}

export async function updateCustomExerciseAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = updateCustomExerciseInputSchema.parse(input);

  const existing = await prisma.gymCustomExercise.findUnique({
    where: { userId_key: { userId, key: parsed.exerciseKey } },
    select: { id: true },
  });
  if (!existing) {
    throw new Error("Custom exercise not found.");
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.name) {
      await tx.gymCustomExercise.update({
        where: { id: existing.id },
        data: { name: parsed.name },
      });
    }

    if (parsed.targets) {
      const sum = parsed.targets.reduce((acc, t) => acc + t.weight, 0);
      if (parsed.targets.length === 0 || Math.abs(sum - 1) >= 1e-6) {
        throw new Error("Targets must sum to 1.0");
      }
      await tx.gymCustomExerciseTarget.deleteMany({
        where: { exerciseId: existing.id },
      });
      await tx.gymCustomExerciseTarget.createMany({
        data: parsed.targets.map((t) => ({
          exerciseId: existing.id,
          muscle: t.muscle,
          weight: t.weight,
        })),
      });
    }

    if (parsed.variationSupports) {
      await tx.gymExerciseVariationSupport.deleteMany({
        where: { exerciseId: existing.id },
      });
      if (parsed.variationSupports.length > 0) {
        await tx.gymExerciseVariationSupport.createMany({
          data: parsed.variationSupports.map((s) => ({
            exerciseId: existing.id,
            templateId: s.templateId,
            labelOverride: s.labelOverride ?? null,
            defaultOptionKey: s.defaultOptionKey ?? null,
          })),
        });
      }
    }
  });

  updateTag(`gymMeta:${userId}`);
}

export async function archiveCustomExerciseAction(exerciseKey: string) {
  const userId = await requireUserId();
  if (!exerciseKey) throw new Error("Exercise key is required.");

  const existing = await prisma.gymCustomExercise.findUnique({
    where: { userId_key: { userId, key: exerciseKey } },
    select: { id: true, archivedAt: true },
  });
  if (!existing) throw new Error("Custom exercise not found.");
  if (existing.archivedAt) throw new Error("Exercise is already archived.");

  await prisma.gymCustomExercise.update({
    where: { id: existing.id },
    data: { archivedAt: new Date() },
  });

  updateTag(`gymMeta:${userId}`);

  getPostHogClient().capture({
    distinctId: userId,
    event: "gym_custom_exercise_archived",
    properties: { exercise_key: exerciseKey },
  });

  return { success: true };
}

export async function unarchiveCustomExerciseAction(exerciseKey: string) {
  const userId = await requireUserId();
  if (!exerciseKey) throw new Error("Exercise key is required.");

  const existing = await prisma.gymCustomExercise.findUnique({
    where: { userId_key: { userId, key: exerciseKey } },
    select: { id: true, archivedAt: true },
  });
  if (!existing) throw new Error("Custom exercise not found.");
  if (!existing.archivedAt) throw new Error("Exercise is not archived.");

  await prisma.gymCustomExercise.update({
    where: { id: existing.id },
    data: { archivedAt: null },
  });

  updateTag(`gymMeta:${userId}`);
  return { success: true };
}

export async function renameCustomExerciseAction(exerciseKey: string, newName: string) {
  const userId = await requireUserId();
  if (!exerciseKey) throw new Error("Exercise key is required.");
  if (!newName || newName.trim().length === 0) throw new Error("Name is required.");
  if (newName.trim().length > 100) throw new Error("Name must be 100 characters or fewer.");

  const existing = await prisma.gymCustomExercise.findUnique({
    where: { userId_key: { userId, key: exerciseKey } },
    select: { id: true },
  });
  if (!existing) throw new Error("Custom exercise not found.");

  await prisma.gymCustomExercise.update({
    where: { id: existing.id },
    data: { name: newName.trim() },
  });

  updateTag(`gymMeta:${userId}`);

  getPostHogClient().capture({
    distinctId: userId,
    event: "gym_custom_exercise_renamed",
    properties: { exercise_key: exerciseKey },
  });

  return { success: true };
}

// =============================================================================
// VARIATION PRESET ACTIONS
// =============================================================================

const createVariationPresetSchema = z.object({
  exerciseKey: z.string().min(1),
  name: z.string().min(1).max(60),
  variations: z.record(z.string(), z.string()),
});

export async function createVariationPresetAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createVariationPresetSchema.parse(input);

  try {
    const preset = await prisma.gymExerciseVariationPreset.create({
      data: {
        userId,
        exerciseKey: parsed.exerciseKey,
        name: parsed.name,
        variations: parsed.variations,
      },
    });

    updateTag(`gymMeta:${userId}`);

    getPostHogClient().capture({
      distinctId: userId,
      event: "gym_variation_preset_created",
      properties: {
        exercise_key: parsed.exerciseKey,
        preset_name: parsed.name,
        variation_count: Object.keys(parsed.variations).length,
      },
    });

    return { id: preset.id, name: preset.name };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("You already have a preset with that name for this exercise.");
    }
    throw error;
  }
}

export async function deleteVariationPresetAction(presetId: string) {
  const userId = await requireUserId();
  if (!presetId) throw new Error("Preset ID is required.");

  const existing = await prisma.gymExerciseVariationPreset.findUnique({
    where: { id: presetId },
    select: { id: true, userId: true, exerciseKey: true, name: true },
  });
  if (!existing || existing.userId !== userId) {
    throw new Error("Preset not found.");
  }

  await prisma.gymExerciseVariationPreset.delete({ where: { id: presetId } });

  updateTag(`gymMeta:${userId}`);

  getPostHogClient().capture({
    distinctId: userId,
    event: "gym_variation_preset_deleted",
    properties: {
      exercise_key: existing.exerciseKey,
      preset_name: existing.name,
    },
  });

  return { success: true };
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

// =============================================================================
// SUPERSET TEMPLATE ACTIONS
// =============================================================================

export async function createSupersetTemplateAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createSupersetTemplateInputSchema.parse(input);
  const template = await createSupersetTemplate(userId, parsed.exerciseAKey, parsed.exerciseBKey);
  updateTag(`gymMeta:${userId}`);
  return template;
}

export async function deleteSupersetTemplateAction(templateId: string) {
  const userId = await requireUserId();
  if (!templateId) throw new Error("Template ID is required.");
  await deleteSupersetTemplate(userId, templateId);
  updateTag(`gymMeta:${userId}`);
  return { success: true };
}

export async function getSupersetTemplatesAction() {
  const userId = await requireUserId();
  return getSupersetTemplates(userId);
}

export async function getRecentSupersetPairingsAction() {
  const userId = await requireUserId();
  return getRecentSupersetPairings(userId);
}
