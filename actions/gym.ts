"use server";

import { auth } from "@clerk/nextjs/server";
import { workoutSessionSchema } from "@/lib/gym";
import { createWorkoutSession, getGymMeta, listWorkoutSessions } from "@/lib/gym/server/gymService";
import { prisma } from "@/lib/db/prisma";

export async function createWorkoutSessionAction(session: unknown) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }

  const parsed = workoutSessionSchema.parse(session);
  return createWorkoutSession(userId, parsed);
}

export async function listWorkoutSessionsAction(options?: { startDate?: string; endDate?: string }) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }

  return listWorkoutSessions(userId, options);
}

export async function getGymMetaAction() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }

  return getGymMeta(userId);
}

export async function createCustomExerciseAction(input: {
  key: string;
  name: string;
  category: string;
  repMode?: "bilateral" | "dualUnilateral";
  targets?: Array<{ muscle: string; weight: number }>;
  variationSupports?: Array<{ templateId: string; labelOverride?: string }>;
  optionLabelOverrides?: Array<{
    templateId: string;
    optionKey: string;
    labelOverride: string;
  }>;
  variationEffects?: Array<{
    templateId: string;
    optionKey: string;
    multipliers?: Record<string, number>;
    deltas?: Record<string, number>;
  }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not signed in.");
  }

  const {
    key,
    name,
    category,
    repMode = "bilateral",
    targets = [],
    variationSupports = [],
    optionLabelOverrides = [],
    variationEffects = [],
  } = input;
  if (!key || !name || !category) {
    throw new Error("Missing custom exercise fields.");
  }

  return prisma.gymCustomExercise.create({
    data: {
      userId,
      key,
      name,
      category,
      repMode,
      targets: targets.length
        ? {
            create: targets.map((target) => ({
              muscle: target.muscle,
              weight: target.weight,
            })),
          }
        : undefined,
      variationSupports: variationSupports.length
        ? {
            create: variationSupports.map((support) => ({
              templateId: support.templateId,
              labelOverride: support.labelOverride ?? null,
            })),
          }
        : undefined,
      optionOverrides: optionLabelOverrides.length
        ? {
            create: optionLabelOverrides.map((override) => ({
              templateId: override.templateId,
              optionKey: override.optionKey,
              labelOverride: override.labelOverride,
            })),
          }
        : undefined,
      effects: variationEffects.length
        ? {
            create: variationEffects.map((effect) => ({
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
