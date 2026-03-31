"use server";

import { z } from "zod";
import { requireAdminUserId } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { getPostHogClient } from "@/lib/posthog-server";

const VALID_STATUSES = ["new", "in_review", "approved", "rejected"] as const;

const listCanonRequestsSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
});

const updateCanonRequestStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(VALID_STATUSES),
  adminNote: z.string().max(2000).optional(),
});

export async function listCanonRequestsAction(input?: unknown) {
  await requireAdminUserId();
  const parsed = input ? listCanonRequestsSchema.parse(input) : {};

  return prisma.gymCanonRequest.findMany({
    where: parsed.status ? { status: parsed.status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customExercise: {
        select: {
          id: true,
          key: true,
          name: true,
          category: true,
          presetId: true,
          movementPattern: true,
          bodyRegion: true,
        },
      },
    },
  });
}

export async function getCanonRequestDetailAction(id: string) {
  const adminUserId = await requireAdminUserId();
  if (!id) throw new Error("Request ID is required.");

  const request = await prisma.gymCanonRequest.findUnique({
    where: { id },
    include: {
      customExercise: {
        include: {
          targets: true,
          variationSupports: true,
          optionOverrides: true,
          effects: true,
        },
      },
    },
  });

  if (!request) throw new Error("Canonicalization request not found.");

  getPostHogClient().capture({
    distinctId: adminUserId,
    event: "gym_canonicalization_request_opened",
    properties: {
      request_id: id,
      status: request.status,
      exercise_key: request.customExercise.key,
    },
  });

  return request;
}

export async function updateCanonRequestStatusAction(input: unknown) {
  const adminUserId = await requireAdminUserId();
  const parsed = updateCanonRequestStatusSchema.parse(input);

  const existing = await prisma.gymCanonRequest.findUnique({
    where: { id: parsed.id },
    select: { status: true, customExercise: { select: { key: true } } },
  });
  if (!existing) throw new Error("Canonicalization request not found.");

  await prisma.gymCanonRequest.update({
    where: { id: parsed.id },
    data: {
      status: parsed.status,
      adminNote: parsed.adminNote ?? undefined,
    },
  });

  const eventMap: Record<string, string> = {
    in_review: "gym_canonicalization_marked_in_review",
    approved: "gym_canonicalization_approved",
    rejected: "gym_canonicalization_rejected",
  };

  const eventName = eventMap[parsed.status];
  if (eventName) {
    getPostHogClient().capture({
      distinctId: adminUserId,
      event: eventName,
      properties: {
        request_id: parsed.id,
        previous_status: existing.status,
        new_status: parsed.status,
        exercise_key: existing.customExercise.key,
        has_admin_note: !!parsed.adminNote,
      },
    });
  }

  return { success: true };
}
