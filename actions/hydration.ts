"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const logHydrationSchema = z.object({
  amount: z.number().positive(),
  unit: z.enum(["oz", "ml"]),
});

const ML_PER_OZ = 29.5735;

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

export async function logHydrationAction(input: unknown) {
  const userId = await requireUserId();
  const { amount, unit } = logHydrationSchema.parse(input);

  const amountOz = unit === "ml" ? amount / ML_PER_OZ : amount;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  return prisma.hydrationLog.create({
    data: {
      userId,
      amountOz,
      dateStr,
    },
  });
}
