import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DatabaseZap, MessageSquareText, Shield } from "lucide-react";

const ADMIN_EMAIL = "dean@deandivizio.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (email !== ADMIN_EMAIL) redirect("/");

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-neutral-950 to-neutral-900 pt-16 md:pt-0">
      <aside className="fixed bottom-0 left-0 top-16 hidden w-56 border-r border-neutral-800 bg-neutral-950/80 backdrop-blur-sm md:block">
        <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-4">
          <Shield className="h-4 w-4 text-neutral-400" />
          <span className="text-sm font-medium tracking-wide text-neutral-300">
            Admin
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          <Link
            href="/admin/nutrition/sources"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800/60 hover:text-neutral-200"
          >
            <DatabaseZap className="h-4 w-4" />
            Nutrition Sources
          </Link>
          <Link
            href="/admin/nutrition/runs"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800/60 hover:text-neutral-200"
          >
            <DatabaseZap className="h-4 w-4" />
            Nutrition Runs
          </Link>
          <Link
            href="/admin/feedback"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800/60 hover:text-neutral-200"
          >
            <MessageSquareText className="h-4 w-4" />
            Feedback
          </Link>
        </nav>
      </aside>

      <div className="w-full px-4 pb-24 pt-6 md:ml-56 md:px-8">
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}
