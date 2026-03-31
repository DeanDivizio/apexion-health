import { prisma } from "@/lib/db/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { connection } from "next/server";
import { FeedbackAdmin } from "./FeedbackAdmin";

type UserInfo = { name: string; email: string };

async function getUserMap(userIds: string[]): Promise<Map<string, UserInfo>> {
  const unique = [...new Set(userIds)];
  const client = await clerkClient();
  const map = new Map<string, UserInfo>();

  await Promise.all(
    unique.map(async (id) => {
      try {
        const user = await client.users.getUser(id);
        const email =
          user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId,
          )?.emailAddress ?? "—";
        const name =
          [user.firstName, user.lastName].filter(Boolean).join(" ") || email;
        map.set(id, { name, email });
      } catch (err) {
        console.error(`[Feedback] Failed to fetch Clerk user ${id}:`, err);
        map.set(id, { name: "Unknown", email: "—" });
      }
    }),
  );

  return map;
}

export default async function AdminFeedbackPage() {
  await connection();

  const feedbackEntries = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const userMap = await getUserMap(feedbackEntries.map((f) => f.userId));

  const entries = feedbackEntries.map((entry) => ({
    id: entry.id,
    message: entry.message,
    status: entry.status,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    userName: userMap.get(entry.userId)?.name ?? "Unknown",
    userEmail: userMap.get(entry.userId)?.email ?? "—",
  }));

  return <FeedbackAdmin entries={entries} />;
}
