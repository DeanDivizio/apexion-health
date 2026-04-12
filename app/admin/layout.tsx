import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, BrainCircuit, DatabaseZap, Dumbbell, Mail, MessageSquareText, Shield } from "lucide-react";
import { requireAdminUserId } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminUserId();
  } catch {
    redirect("/");
  }

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
          <Link
            href="/admin/gym/canonicalization"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800/60 hover:text-neutral-200"
          >
            <Dumbbell className="h-4 w-4" />
            Canonicalization
          </Link>
          <Link
            href="/admin/emails"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800/60 hover:text-neutral-200"
          >
            <Mail className="h-4 w-4" />
            Emails
          </Link>

          <div className="my-2 border-t border-neutral-800" />

          <Link
            href="/admin/knowledge"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800/60 hover:text-neutral-200"
          >
            <BrainCircuit className="h-4 w-4" />
            Knowledge Base
          </Link>
          <Link
            href="/admin/knowledge/channels"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800/60 hover:text-neutral-200"
          >
            <BookOpen className="h-4 w-4" />
            Channels
          </Link>
        </nav>
      </aside>

      <div className="w-full px-4 pb-24 pt-6 md:ml-56 md:px-8">
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}
