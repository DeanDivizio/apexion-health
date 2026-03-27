import { prisma } from "@/lib/db/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { MessageSquareText } from "lucide-react";
import { connection } from "next/server";

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
      } catch {
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
    take: 100,
  });

  const userMap = await getUserMap(feedbackEntries.map((f) => f.userId));

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <MessageSquareText className="h-5 w-5 text-neutral-400" />
        <h1 className="text-xl font-medium tracking-wide text-neutral-100">
          User Feedback
        </h1>
        <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400">
          {feedbackEntries.length}
        </span>
      </div>

      {feedbackEntries.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-6 py-12 text-center">
          <p className="text-sm text-neutral-500">No feedback yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                <th className="px-4 py-3 font-medium text-neutral-400">
                  Date
                </th>
                <th className="px-4 py-3 font-medium text-neutral-400">
                  User
                </th>
                <th className="px-4 py-3 font-medium text-neutral-400">
                  Message
                </th>
              </tr>
            </thead>
            <tbody>
              {feedbackEntries.map((entry) => {
                const user = userMap.get(entry.userId);
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-neutral-800/50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                      {entry.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-neutral-200">
                          {user?.name}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {user?.email}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-md px-4 py-3 text-neutral-300">
                      {entry.message}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
