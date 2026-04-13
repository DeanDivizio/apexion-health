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
import type { ActivityLogView } from "@/lib/activity";
import { deleteActivityLogAction } from "@/actions/activity";
import { useToast } from "@/hooks/use-toast";
import { summarizeActivityValue } from "@/lib/activity/summary";

interface ActivityLogsListProps {
  initialLogs: ActivityLogView[];
  onDeleted?: () => Promise<void> | void;
}

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

export function ActivityLogsList({ initialLogs, onDeleted }: ActivityLogsListProps) {
  const { toast } = useToast();
  const [logs, setLogs] = React.useState(initialLogs);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

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
      toast({
        title: "Error",
        description: "Failed to delete this activity log.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
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
            <div className="rounded-xl border border-white/10 bg-gradient-to-b from-emerald-950/20 to-emerald-950/5 divide-y divide-white/5 overflow-hidden">
              {dayLogs.map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {formatTime(log.loggedAtIso)} · {log.activityName}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDeleteId(log.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {log.values
                      .map(summarizeActivityValue)
                      .filter((line): line is string => Boolean(line))
                      .map((line, index) => (
                      <li key={`${log.id}-${index}`} className="text-xs text-muted-foreground">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
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
