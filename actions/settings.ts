"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
import {
  getUserHomePreferences,
  upsertUserHomePreferences,
} from "@/lib/settings/server/settingsService";
import type { UserHomePreferencesView } from "@/lib/settings/server/settingsService";

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

export async function getUserHomePreferencesAction() {
  const userId = await requireUserId();
  return getUserHomePreferences(userId);
}

export async function upsertUserHomePreferencesAction(
  input: Partial<UserHomePreferencesView>,
) {
  const userId = await requireUserId();
  const result = await upsertUserHomePreferences(userId, input);
  updateTag(`homePreferences:${userId}`);
  return result;
}

export async function toggleActivityCalendarPinAction(pinned: boolean) {
  const userId = await requireUserId();
  const result = await upsertUserHomePreferences(userId, {
    showActivityCalendar: pinned,
  });
  updateTag(`homePreferences:${userId}`);
  return result;
}

export async function toggleActivityTypePinAction(
  activityTypeId: string,
  pinned: boolean,
) {
  const userId = await requireUserId();
  const current = await getUserHomePreferences(userId);
  const ids = new Set(current.pinnedActivityTypeIds);
  if (pinned) {
    ids.add(activityTypeId);
  } else {
    ids.delete(activityTypeId);
  }
  const result = await upsertUserHomePreferences(userId, {
    pinnedActivityTypeIds: [...ids],
  });
  updateTag(`homePreferences:${userId}`);
  return result;
}
