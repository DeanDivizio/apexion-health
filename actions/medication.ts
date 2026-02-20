"use server";

import { auth } from "@clerk/nextjs/server";
import {
  createMedicationLogSessionInputSchema,
  createMedicationPresetInputSchema,
  createSubstanceInputSchema,
} from "@/lib/medication";
import {
  createMedicationLogSession,
  createMedicationPreset,
  createSubstance,
  getMedicationBootstrap,
} from "@/lib/medication/server/medicationService";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

export async function getMedicationBootstrapAction() {
  const userId = await requireUserId();
  return getMedicationBootstrap(userId);
}

export async function createSubstanceAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createSubstanceInputSchema.parse(input);
  return createSubstance(userId, parsed);
}

export async function createMedicationPresetAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createMedicationPresetInputSchema.parse(input);
  return createMedicationPreset(userId, parsed);
}

export async function createMedicationLogSessionAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createMedicationLogSessionInputSchema.parse(input);
  return createMedicationLogSession(userId, parsed);
}
