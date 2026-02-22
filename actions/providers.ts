"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { revokeConnection } from "@/lib/providers/token-service";
import type { Provider } from "@/lib/providers/types";

export async function getProviderConnection(provider: Provider) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const connection = await prisma.providerConnection.findUnique({
    where: { userId_provider: { userId, provider } },
    select: {
      id: true,
      provider: true,
      status: true,
      scopes: true,
      lastSyncAt: true,
      syncCursor: true,
      errorMessage: true,
      createdAt: true,
    },
  });

  return connection;
}

export async function disconnectProvider(provider: Provider) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const connection = await prisma.providerConnection.findUnique({
    where: { userId_provider: { userId, provider } },
  });

  if (!connection) throw new Error(`No ${provider} connection found`);

  await revokeConnection(connection.id);
  return { success: true };
}
