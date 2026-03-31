"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getPostHogClient } from "@/lib/posthog-server";
import { FeedbackStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ADMIN_EMAIL = "dean@deandivizio.com";

const feedbackSchema = z.object({
  message: z.string().min(1, "Feedback cannot be empty").max(2000),
});

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

async function requireAdmin(): Promise<string> {
  const userId = await requireUserId();
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;
  if (email !== ADMIN_EMAIL) throw new Error("Unauthorized");
  return userId;
}

export async function submitFeedback(
  message: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await requireUserId();
    const parsed = feedbackSchema.safeParse({ message });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await prisma.feedback.create({
      data: { userId, message: parsed.data.message },
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userId,
      event: "feedback_submitted",
      properties: {
        message_length: parsed.data.message.length,
        message_preview: parsed.data.message.slice(0, 200),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
    });
    revalidatePath("/admin/feedback");
    return { success: true };
  } catch (error) {
    console.error("Failed to update feedback status:", error);
    return { success: false, error: "Failed to update status." };
  }
}

export async function createAdminFeedback(
  message: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await requireAdmin();
    const parsed = feedbackSchema.safeParse({ message });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await prisma.feedback.create({
      data: { userId, message: parsed.data.message },
    });
    revalidatePath("/admin/feedback");
    return { success: true };
  } catch (error) {
    console.error("Failed to create admin feedback:", error);
    return { success: false, error: "Failed to create feedback entry." };
  }
}
