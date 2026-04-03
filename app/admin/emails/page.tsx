import Link from "next/link";
import { Plus, Mail, CheckCircle, Clock } from "lucide-react";
import { listEmailBroadcasts } from "@/actions/emails";

export default async function AdminEmailsPage() {
  const emails = await listEmailBroadcasts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">
            Email Broadcasts
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Compose and send emails to all users.
          </p>
        </div>
        <Link
          href="/admin/emails/new"
          className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          New Email
        </Link>
      </div>

      {emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800 py-16 text-center">
          <Mail className="mb-3 h-8 w-8 text-neutral-600" />
          <p className="text-sm font-medium text-neutral-400">
            No emails yet
          </p>
          <p className="mt-1 text-xs text-neutral-600">
            Create your first broadcast to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/50">
                <th className="px-4 py-3 text-left font-medium text-neutral-400">
                  Subject
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">
                  Recipients
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email, i) => (
                <tr
                  key={email.id}
                  className={
                    i < emails.length - 1
                      ? "border-b border-neutral-800/60"
                      : ""
                  }
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/emails/${email.id}`}
                      className="font-medium text-neutral-200 hover:text-white hover:underline"
                    >
                      {email.subject || "(No subject)"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {email.sentAt ? (
                      <span className="flex items-center gap-1.5 text-green-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-neutral-500">
                        <Clock className="h-3.5 w-3.5" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {email.sentCount != null ? email.sentCount.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(email.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
