"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import type { ActivityContributionDay } from "@/lib/activity";

interface ActivityContributionGridProps {
  contributions: ActivityContributionDay[];
  monthDate: Date;
  selectedDateStr: string | null;
  onSelectDate: (dateStr: string | null) => void;
}

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
}: ActivityContributionGridProps) {
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startGrid = new Date(firstOfMonth);
  startGrid.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  const endGrid = new Date(lastOfMonth);
  endGrid.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const countsByDate = new Map(contributions.map((entry) => [entry.dateStr, entry.count]));

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
    <Card className="border-white/10 bg-neutral-900/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Activity Heatmap · {monthLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const selected = selectedDateStr === cell.dateStr;
            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => onSelectDate(selected ? null : cell.dateStr)}
                title={`${cell.dateStr}: ${cell.count} log${cell.count === 1 ? "" : "s"}`}
                className={[
                  "h-8 rounded-sm border text-[10px] transition-colors",
                  cell.inMonth ? "border-white/5" : "border-transparent opacity-35",
                  getIntensityClass(cell.count),
                  selected ? "ring-2 ring-white/70" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {toDateFromDateStr(cell.dateStr).getDate()}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {totalLogs} log{totalLogs === 1 ? "" : "s"} this month
          </span>
          <span>{activeDays} active day{activeDays === 1 ? "" : "s"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
