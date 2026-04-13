"use client";

import Link from "next/link";
import { Flame, CheckSquare } from "lucide-react";
import type { ActivityContributionDay } from "@/lib/activity";
import { computeStreaks } from "@/lib/activity";

interface ActivitySummaryProps {
  contributions: ActivityContributionDay[];
  activityTypesCount: number;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function getIntensityClass(count: number): string {
  if (count <= 0) return "bg-neutral-700/50";
  if (count === 1) return "bg-emerald-900";
  if (count === 2) return "bg-emerald-700";
  return "bg-emerald-500";
}

function getLast7Days(): string[] {
  const days: string[] = [];
  const cursor = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
}

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export function ActivitySummary({
  contributions,
  activityTypesCount,
}: ActivitySummaryProps) {
  const totalLogs = contributions.reduce((sum, day) => sum + day.count, 0);
  const { currentStreak } = computeStreaks(contributions);

  const countMap = new Map(contributions.map((d) => [d.dateStr, d.count]));
  const last7 = getLast7Days();

  const todayStr = toDateStr(new Date());
  const todayCount = countMap.get(todayStr) ?? 0;

  return (
    <Link href="/activities" className="block">
      <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4 transition-colors hover:bg-neutral-800/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-emerald-400 opacity-80">
            Habits & Activities
          </span>
          <CheckSquare
            className="h-3.5 w-3.5 text-emerald-200 opacity-40 shrink-0"
            aria-hidden
          />
        </div>

        {totalLogs === 0 && activityTypesCount === 0 ? (
          <p className="text-sm text-neutral-500">
            No activity types created yet
          </p>
        ) : totalLogs === 0 ? (
          <p className="text-sm text-neutral-500">
            No activity logs this month
          </p>
        ) : (
          <div className="space-y-3">
            {/* Streak + today hero */}
            <div className="flex items-center gap-3">
              {currentStreak > 0 && (
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-lg font-bold text-neutral-100">{currentStreak}</span>
                  <span className="text-xs text-neutral-400">day streak</span>
                </div>
              )}
              {todayCount > 0 && (
                <div className="text-xs text-neutral-400">
                  {todayCount} logged today
                </div>
              )}
            </div>

            {/* Mini 7-day strip */}
            <div className="flex gap-1">
              {last7.map((ds, i) => {
                const count = countMap.get(ds) ?? 0;
                const d = new Date(
                  Number(ds.slice(0, 4)),
                  Number(ds.slice(4, 6)) - 1,
                  Number(ds.slice(6, 8)),
                );
                return (
                  <div key={ds} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className={`w-full h-5 rounded-sm ${getIntensityClass(count)}`}
                      title={`${count} log${count === 1 ? "" : "s"}`}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {DAY_INITIALS[d.getDay()]}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-neutral-400">
              {totalLogs} total · {activityTypesCount} tracked
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
