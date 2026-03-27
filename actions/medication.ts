"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import {
  createMedicationLogSessionInputSchema,
  createMedicationPresetInputSchema,
  createSubstanceInputSchema,
} from "@/lib/medication";
import {
  createMedicationLogSession,
  createMedicationPreset,
  createSubstance,
  deleteMedicationLogSession,
  getMedsDaySummary,
  getMedicationBootstrap,
  listMedicationLogSessions,
  updateMedicationLogSession,
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
  const result = await createMedicationLogSession(userId, parsed);
  updateTag(`medsSummary:${userId}`);
  updateTag(`microSummary:${userId}`);
  updateTag(`hydrationSummary:${userId}`);
  return result;
}

export async function listMedicationLogSessionsAction() {
  const userId = await requireUserId();
  return listMedicationLogSessions(userId);
}

export async function updateMedicationLogSessionAction(
  sessionId: string,
  input: unknown,
) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  const parsed = createMedicationLogSessionInputSchema.parse(input);
  const result = await updateMedicationLogSession(userId, sessionId, parsed);
  updateTag(`medsSummary:${userId}`);
  updateTag(`microSummary:${userId}`);
  updateTag(`hydrationSummary:${userId}`);
  return result;
}

export async function deleteMedicationLogSessionAction(sessionId: string) {
  const userId = await requireUserId();
  if (!sessionId) throw new Error("Session ID is required.");
  const result = await deleteMedicationLogSession(userId, sessionId);
  updateTag(`medsSummary:${userId}`);
  updateTag(`microSummary:${userId}`);
  updateTag(`hydrationSummary:${userId}`);
  return result;
}

export async function getMedsDaySummaryAction(
  dateStr: string,
  timezoneOffsetMinutes = 0,
) {
  const userId = await requireUserId();
  return getMedsDaySummary(userId, dateStr, timezoneOffsetMinutes);
}
