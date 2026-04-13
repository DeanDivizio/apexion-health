"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Pin, PinOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import type { ActivityContributionDay } from "@/lib/activity";

interface ActivityContributionGridProps {
  contributions: ActivityContributionDay[];
  monthDate: Date;
  selectedDateStr: string | null;
  onSelectDate: (dateStr: string | null) => void;
  onMonthChange?: (newMonth: Date) => void;
  pinnedToHome?: boolean;
  onTogglePin?: (pinned: boolean) => void;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function toDateFromDateStr(dateStr: string): Date {
  return new Date(
    Number(dateStr.slice(0, 4)),
    Number(dateStr.slice(4, 6)) - 1,
    Number(dateStr.slice(6, 8)),
  );
}

function formatDateForLabel(dateStr: string): string {
  const d = toDateFromDateStr(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getIntensityClass(count: number): string {
  if (count <= 0) return "bg-neutral-800/70";
  if (count === 1) return "bg-emerald-900";
  if (count === 2) return "bg-emerald-700";
  if (count === 3) return "bg-emerald-500";
  return "bg-emerald-300";
}

export function ActivityContributionGrid({
  contributions,
  monthDate,
  selectedDateStr,
  onSelectDate,
  onMonthChange,
  pinnedToHome,
  onTogglePin,
}: ActivityContributionGridProps) {
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const now = new Date();
  const isCurrentMonth =
    monthDate.getFullYear() === now.getFullYear() &&
    monthDate.getMonth() === now.getMonth();

  const goToPrevMonth = () => {
    onMonthChange?.(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    if (!isCurrentMonth) {
      onMonthChange?.(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1));
    }
  };

  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startGrid = new Date(firstOfMonth);
  startGrid.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  const endGrid = new Date(lastOfMonth);
  endGrid.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const countsByDate = new Map(contributions.map((e) => [e.dateStr, e.count]));

  const cells: Array<{ dateStr: string; inMonth: boolean; count: number }> = [];
  const cursor = new Date(startGrid);
  while (cursor <= endGrid) {
    const dateStr = toDateStr(cursor);
    cells.push({
      dateStr,
      inMonth: cursor.getMonth() === monthDate.getMonth(),
      count: countsByDate.get(dateStr) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const totalLogs = contributions.reduce((sum, day) => sum + day.count, 0);
  const activeDays = contributions.filter((day) => day.count > 0).length;

  return (
    <Card className="border-white/10 bg-gradient-to-br from-blue-950/20 via-slate-950/20 to-black">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="rounded-md p-1 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <CardTitle className="text-base font-medium">{monthLabel}</CardTitle>
          <div className="flex items-center gap-1">
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(!pinnedToHome)}
                className={[
                  "rounded-md p-1 transition-colors",
                  pinnedToHome
                    ? "text-emerald-400 hover:text-emerald-300 hover:bg-white/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/10",
                ].join(" ")}
                aria-label={pinnedToHome ? "Unpin from Home" : "Pin to Home"}
                title={pinnedToHome ? "Unpin from Home" : "Pin to Home"}
              >
                {pinnedToHome ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="rounded-md p-1 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors disabled:opacity-25 disabled:pointer-events-none"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={`day-label-${i}`}
              className="text-[10px] text-muted-foreground text-center font-medium"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const selected = selectedDateStr === cell.dateStr;
            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => onSelectDate(selected ? null : cell.dateStr)}
                aria-label={`${formatDateForLabel(cell.dateStr)}: ${cell.count} log${cell.count === 1 ? "" : "s"}`}
                aria-pressed={selected}
                className={[
                  "h-8 rounded-sm border text-[10px] transition-colors",
                  cell.inMonth ? "border-white/5" : "border-transparent opacity-35",
                  getIntensityClass(cell.count),
                  selected ? "ring-2 ring-white/70" : "",
                ].join(" ")}
              >
                {toDateFromDateStr(cell.dateStr).getDate()}
              </button>
            );
          })}
        </div>

        {/* Footer: stats + legend */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {totalLogs} log{totalLogs === 1 ? "" : "s"} · {activeDays} active day{activeDays === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] mr-1">Less</span>
            <span className="h-3 w-3 rounded-sm bg-neutral-800/70" />
            <span className="h-3 w-3 rounded-sm bg-emerald-900" />
            <span className="h-3 w-3 rounded-sm bg-emerald-700" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="h-3 w-3 rounded-sm bg-emerald-300" />
            <span className="text-[10px] ml-1">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
