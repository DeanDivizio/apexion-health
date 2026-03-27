"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { getPostHogClient } from "@/lib/posthog-server";
import { z } from "zod";

const feedbackSchema = z.object({
  message: z.string().min(1, "Feedback cannot be empty").max(2000),
});

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
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
