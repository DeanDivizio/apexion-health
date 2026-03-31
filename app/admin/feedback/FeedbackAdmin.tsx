"use client";

import { useMemo, useState, useTransition } from "react";
import { FeedbackStatus } from "@prisma/client";
import { updateFeedbackStatus, createAdminFeedback } from "@/actions/feedback";
import {
  MessageSquareText,
  Plus,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

type FeedbackEntry = {
  id: string;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
};

type SortKey = "status" | "createdAt" | "updatedAt" | "userName" | "message";
type SortDir = "asc" | "desc";

const STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; color: string; bgActive: string; bgInactive: string; order: number }
> = {
  NEW: {
    label: "New",
    color: "text-blue-300",
    bgActive: "bg-blue-500/20 border-blue-500/40 text-blue-300",
    bgInactive: "bg-neutral-800/40 border-neutral-700 text-neutral-500",
    order: 0,
  },
  PRIORITY: {
    label: "Priority",
    color: "text-amber-300",
    bgActive: "bg-amber-500/20 border-amber-500/40 text-amber-300",
    bgInactive: "bg-neutral-800/40 border-neutral-700 text-neutral-500",
    order: 1,
  },
  DEFERRED: {
    label: "Deferred",
    color: "text-neutral-300",
    bgActive: "bg-neutral-600/20 border-neutral-500/40 text-neutral-300",
    bgInactive: "bg-neutral-800/40 border-neutral-700 text-neutral-500",
    order: 2,
  },
  IGNORED: {
    label: "Ignored",
    color: "text-red-400",
    bgActive: "bg-red-500/20 border-red-500/40 text-red-400",
    bgInactive: "bg-neutral-800/40 border-neutral-700 text-neutral-500",
    order: 3,
  },
  COMPLETE: {
    label: "Complete",
    color: "text-emerald-300",
    bgActive: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
    bgInactive: "bg-neutral-800/40 border-neutral-700 text-neutral-500",
    order: 4,
  },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as FeedbackStatus[];

function StatusBadge({ status }: { status: FeedbackStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bgActive}`}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusSelect({
  entryId,
  currentStatus,
  onUpdate,
}: {
  entryId: string;
  currentStatus: FeedbackStatus;
  onUpdate: (id: string, status: FeedbackStatus) => void;
}) {
  return (
    <select
      value={currentStatus}
      onChange={(e) => onUpdate(entryId, e.target.value as FeedbackStatus)}
      className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 outline-none transition-colors focus:border-neutral-500"
    >
      {ALL_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_CONFIG[s].label}
        </option>
      ))}
    </select>
  );
}

function SortIcon({ column, activeKey, activeDir }: { column: SortKey; activeKey: SortKey | null; activeDir: SortDir }) {
  if (activeKey !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return activeDir === "asc"
    ? <ArrowUp className="h-3 w-3" />
    : <ArrowDown className="h-3 w-3" />;
}

function compareFeedback(a: FeedbackEntry, b: FeedbackEntry, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  switch (key) {
    case "status":
      cmp = STATUS_CONFIG[a.status].order - STATUS_CONFIG[b.status].order;
      break;
    case "createdAt":
    case "updatedAt":
      cmp = a[key].localeCompare(b[key]);
      break;
    case "userName":
      cmp = a.userName.localeCompare(b.userName, undefined, { sensitivity: "base" });
      break;
    case "message":
      cmp = a.message.localeCompare(b.message, undefined, { sensitivity: "base" });
      break;
  }
  return dir === "asc" ? cmp : -cmp;
}

export function FeedbackAdmin({ entries }: { entries: FeedbackEntry[] }) {
  const [visibleStatuses, setVisibleStatuses] = useState<
    Set<FeedbackStatus>
  >(() => new Set(ALL_STATUSES));
  const [localEntries, setLocalEntries] = useState(entries);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === "desc") {
        setSortDir("asc");
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleStatus = (status: FeedbackStatus) => {
    setVisibleStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const handleStatusUpdate = (id: string, status: FeedbackStatus) => {
    setLocalEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status, updatedAt: new Date().toISOString() } : e,
      ),
    );
    startTransition(async () => {
      const result = await updateFeedbackStatus(id, status);
      if (!result.success) {
        setLocalEntries((prev) =>
          prev.map((e) => {
            const original = entries.find((o) => o.id === e.id);
            return e.id === id && original ? { ...e, status: original.status } : e;
          }),
        );
      }
    });
  };

  const handleCreate = () => {
    if (!newMessage.trim()) return;
    setCreateError(null);
    startTransition(async () => {
      const result = await createAdminFeedback(newMessage.trim());
      if (result.success) {
        setNewMessage("");
        setShowCreateForm(false);
      } else {
        setCreateError(result.error ?? "Failed to create.");
      }
    });
  };

  const filtered = useMemo(() => {
    const visible = localEntries.filter((e) => visibleStatuses.has(e.status));
    if (!sortKey) return visible;
    return [...visible].sort((a, b) => compareFeedback(a, b, sortKey, sortDir));
  }, [localEntries, visibleStatuses, sortKey, sortDir]);

  const statusCounts = localEntries.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    },
    {} as Record<FeedbackStatus, number>,
  );

  const thClass =
    "px-4 py-3 font-medium text-neutral-400 select-none cursor-pointer transition-colors hover:text-neutral-200";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquareText className="h-5 w-5 text-neutral-400" />
          <h1 className="text-xl font-medium tracking-wide text-neutral-100">
            User Feedback
          </h1>
          <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400">
            {filtered.length} / {localEntries.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-neutral-100"
        >
          {showCreateForm ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {showCreateForm ? "Cancel" : "Add Entry"}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Enter feedback or a note..."
            rows={3}
            maxLength={2000}
            className="w-full resize-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none transition-colors focus:border-neutral-500"
          />
          {createError && (
            <p className="mt-1 text-xs text-red-400">{createError}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              {newMessage.length} / 2000
            </span>
            <button
              onClick={handleCreate}
              disabled={isPending || !newMessage.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Status filter toggles */}
      <div className="mb-4 flex flex-wrap gap-2">
        {ALL_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status];
          const active = visibleStatuses.has(status);
          const count = statusCounts[status] || 0;
          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                active ? cfg.bgActive : cfg.bgInactive
              }`}
            >
              {cfg.label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-6 py-12 text-center">
          <p className="text-sm text-neutral-500">
            {localEntries.length === 0
              ? "No feedback yet."
              : "No feedback matches the selected filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/60">
                  <th className={thClass} onClick={() => toggleSort("status")}>
                    <span className="flex items-center gap-1.5">
                      Status
                      <SortIcon column="status" activeKey={sortKey} activeDir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("createdAt")}>
                    <span className="flex items-center gap-1.5">
                      Created
                      <SortIcon column="createdAt" activeKey={sortKey} activeDir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("updatedAt")}>
                    <span className="flex items-center gap-1.5">
                      Updated
                      <SortIcon column="updatedAt" activeKey={sortKey} activeDir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("userName")}>
                    <span className="flex items-center gap-1.5">
                      User
                      <SortIcon column="userName" activeKey={sortKey} activeDir={sortDir} />
                    </span>
                  </th>
                  <th className={thClass} onClick={() => toggleSort("message")}>
                    <span className="flex items-center gap-1.5">
                      Message
                      <SortIcon column="message" activeKey={sortKey} activeDir={sortDir} />
                    </span>
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-neutral-800/50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                      {formatDate(entry.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-neutral-200">
                          {entry.userName}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {entry.userEmail}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-md px-4 py-3 text-neutral-300">
                      {entry.message}
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect
                        entryId={entry.id}
                        currentStatus={entry.status}
                        onUpdate={handleStatusUpdate}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
