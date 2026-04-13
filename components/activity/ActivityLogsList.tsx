"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui_primitives/alert-dialog";
import type { ActivityLogView, ActivityTypeView } from "@/lib/activity";
import { deleteActivityLogAction } from "@/actions/activity";
import { useToast } from "@/hooks/use-toast";
import { summarizeActivityValue } from "@/lib/activity/summary";

interface ActivityLogsListProps {
  initialLogs: ActivityLogView[];
  activityTypes?: ActivityTypeView[];
  onDeleted?: () => Promise<void> | void;
}

const FALLBACK_COLOR = "#10b981";

function formatDayHeader(dateStr: string): string {
  const [year, month, day] = [
    Number(dateStr.slice(0, 4)),
    Number(dateStr.slice(4, 6)),
    Number(dateStr.slice(6, 8)),
  ];
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  });

  if (target.getTime() === today.getTime()) return `Today — ${formatted}`;
  if (target.getTime() === yesterday.getTime()) return `Yesterday — ${formatted}`;
  return formatted;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityLogsList({ initialLogs, activityTypes, onDeleted }: ActivityLogsListProps) {
  const { toast } = useToast();
  const [logs, setLogs] = React.useState(initialLogs);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const colorMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const t of activityTypes ?? []) {
      m.set(t.id, t.color ?? FALLBACK_COLOR);
    }
    return m;
  }, [activityTypes]);

  const groupedDays = React.useMemo(() => {
    const sorted = [...logs].sort(
      (a, b) => new Date(b.loggedAtIso).getTime() - new Date(a.loggedAtIso).getTime(),
    );
    const map = new Map<string, ActivityLogView[]>();
    for (const log of sorted) {
      const group = map.get(log.dateStr) ?? [];
      group.push(log);
      map.set(log.dateStr, group);
    }
    return Array.from(map.entries());
  }, [logs]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteActivityLogAction(deleteId);
      setLogs((prev) => prev.filter((log) => log.id !== deleteId));
      setDeleteId(null);
      toast({ title: "Activity deleted" });
      await onDeleted?.();
    } catch {
      toast({ title: "Error", description: "Failed to delete this activity log.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
        No activity logs yet.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {groupedDays.map(([dateStr, dayLogs]) => (
          <div key={dateStr} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {formatDayHeader(dateStr)}
            </h3>
            <div className="rounded-xl border border-emerald-300/20 divide-y divide-white/5 bg-gradient-to-br from-blue-950/30 via-slate-900/40 to-blackoverflow-hidden">
              {dayLogs.map((log) => {
                const logColor = log.activityColor ?? colorMap.get(log.activityTypeId) ?? FALLBACK_COLOR;
                return (
                  <div key={log.id} className="px-4 py-3 ">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: logColor }}
                        />
                        <span className="text-muted-foreground">{formatTime(log.loggedAtIso)}</span>
                        <span className="mx-0.5">·</span>
                        {log.activityName}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeleteId(log.id)}
                        aria-label={`Delete ${log.activityName} log`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                    <ul className="mt-1 space-y-0.5 pl-4">
                      {log.values
                        .map(summarizeActivityValue)
                        .filter((line): line is string => Boolean(line))
                        .map((line, i) => (
                          <li key={`${log.id}-${i}`} className="text-xs text-muted-foreground">
                            {line}
                          </li>
                        ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this activity log?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
