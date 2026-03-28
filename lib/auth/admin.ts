import { auth, clerkClient } from "@clerk/nextjs/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
if (!ADMIN_EMAIL) {
  throw new Error("ADMIN_EMAIL is not set.");
}

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not signed in.");
  return userId;
}

export async function requireAdminUserId(): Promise<string> {
  const userId = await requireUserId();
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses.find(
    (entry) => entry.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (email !== ADMIN_EMAIL) {
    throw new Error("Admin access required.");
  }

  return userId;
}
