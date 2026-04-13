"use client";

import { CheckSquare } from "lucide-react";
import type { ActivityContributionDay } from "@/lib/activity";

interface ActivitySummaryProps {
  contributions: ActivityContributionDay[];
  activityTypesCount: number;
}

export function ActivitySummary({
  contributions,
  activityTypesCount,
}: ActivitySummaryProps) {
  const totalLogs = contributions.reduce((sum, day) => sum + day.count, 0);
  const activeDays = contributions.filter((day) => day.count > 0).length;

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4 transition-colors hover:bg-neutral-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-emerald-400 opacity-80">
          Habits &amp; Activities
        </span>
        <CheckSquare
          className="h-3.5 w-3.5 text-emerald-200 opacity-40 shrink-0"
          aria-hidden
        />
      </div>
      <div>
        {totalLogs === 0 ? (
          <p className="text-sm text-neutral-500">
            {activityTypesCount > 0
              ? "No activity logs this month"
              : "No activity types created yet"}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-100">
              {totalLogs} total log{totalLogs === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-neutral-400">
              {activeDays} active day{activeDays === 1 ? "" : "s"} this month
            </p>
            <p className="text-xs text-neutral-300">
              {activityTypesCount} tracked activit{activityTypesCount === 1 ? "y" : "ies"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
