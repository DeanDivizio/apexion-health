"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import {
  createActivityLogInputSchema,
  createActivityTypeInputSchema,
  listActivityLogsOptionsSchema,
  updateActivityDimensionsInputSchema,
  updateActivityTypeInputSchema,
} from "@/lib/activity";
import {
  archiveActivityType,
  createActivityLog,
  createActivityType,
  deleteActivityLog,
  getActivityBootstrap,
  getActivityContribution,
  listActivityLogs,
  listActivityTypes,
  replaceActivityDimensions,
  updateActivityType,
} from "@/lib/activity/server/activityService";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

function invalidateActivityCaches(userId: string) {
  updateTag(`activitySummary:${userId}`);
}

export async function getActivityBootstrapAction() {
  const userId = await requireUserId();
  return getActivityBootstrap(userId);
}

export async function listActivityTypesAction() {
  const userId = await requireUserId();
  return listActivityTypes(userId);
}

export async function createActivityTypeAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createActivityTypeInputSchema.parse(input);
  const result = await createActivityType(userId, parsed);
  invalidateActivityCaches(userId);
  return result;
}

export async function updateActivityTypeAction(
  activityTypeId: string,
  input: unknown,
) {
  const userId = await requireUserId();
  if (!activityTypeId) throw new Error("Activity type ID is required.");
  const parsed = updateActivityTypeInputSchema.parse(input);
  const result = await updateActivityType(userId, activityTypeId, parsed);
  invalidateActivityCaches(userId);
  return result;
}

export async function replaceActivityDimensionsAction(
  activityTypeId: string,
  input: unknown,
) {
  const userId = await requireUserId();
  if (!activityTypeId) throw new Error("Activity type ID is required.");
  const parsed = updateActivityDimensionsInputSchema.parse(input);
  const result = await replaceActivityDimensions(userId, activityTypeId, parsed);
  invalidateActivityCaches(userId);
  return result;
}

export async function archiveActivityTypeAction(activityTypeId: string) {
  const userId = await requireUserId();
  if (!activityTypeId) throw new Error("Activity type ID is required.");
  const result = await archiveActivityType(userId, activityTypeId);
  invalidateActivityCaches(userId);
  return result;
}

export async function createActivityLogAction(input: unknown) {
  const userId = await requireUserId();
  const parsed = createActivityLogInputSchema.parse(input);
  const result = await createActivityLog(userId, parsed);
  invalidateActivityCaches(userId);
  return result;
}

export async function listActivityLogsAction(options?: unknown) {
  const userId = await requireUserId();
  const parsed = options ? listActivityLogsOptionsSchema.parse(options) : undefined;
  return listActivityLogs(userId, parsed);
}

export async function deleteActivityLogAction(logId: string) {
  const userId = await requireUserId();
  if (!logId) throw new Error("Activity log ID is required.");
  const result = await deleteActivityLog(userId, logId);
  invalidateActivityCaches(userId);
  return result;
}

export async function getActivityContributionAction(
  startDate: string,
  endDate: string,
  activityTypeId?: string,
) {
  const userId = await requireUserId();
  return getActivityContribution(userId, startDate, endDate, activityTypeId);
}
