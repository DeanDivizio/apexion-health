"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdminUserId } from "@/lib/auth/admin";

const emailBroadcastSchema = z.object({
  subject: z.string().max(200),
  body: z.string(),
});

export async function createEmailBroadcast(
  subject: string,
  body: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdminUserId();
    const parsed = emailBroadcastSchema.safeParse({ subject, body });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const email = await prisma.emailBroadcast.create({
      data: { subject: parsed.data.subject, body: parsed.data.body },
    });

    revalidatePath("/admin/emails");
    return { success: true, id: email.id };
  } catch (error) {
    console.error("Failed to create email broadcast:", error);
    return { success: false, error: "Failed to create email." };
  }
}

export async function updateEmailBroadcast(
  id: string,
  subject: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminUserId();
    const parsed = emailBroadcastSchema.safeParse({ subject, body });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    await prisma.emailBroadcast.update({
      where: { id },
      data: { subject: parsed.data.subject, body: parsed.data.body },
    });

    revalidatePath("/admin/emails");
    revalidatePath(`/admin/emails/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update email broadcast:", error);
    return { success: false, error: "Failed to save email." };
  }
}

export async function deleteEmailBroadcast(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminUserId();
    await prisma.emailBroadcast.delete({ where: { id } });
    revalidatePath("/admin/emails");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete email broadcast:", error);
    return { success: false, error: "Failed to delete email." };
  }
}

export async function listEmailBroadcasts() {
  await requireAdminUserId();
  return prisma.emailBroadcast.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      subject: true,
      sentAt: true,
      sentCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getEmailBroadcast(id: string) {
  await requireAdminUserId();
  return prisma.emailBroadcast.findUnique({ where: { id } });
}
