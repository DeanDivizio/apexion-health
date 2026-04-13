"use client";

import { MoreHorizontal, Pin, PinOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu";
import type { ActivityLogView, ActivityTypeView } from "@/lib/activity";
import { ACTIVITY_ICON_MAP } from "./activityIconMap";

interface ActivityTrackerStripProps {
  type: ActivityTypeView;
  logs: ActivityLogView[];
  pinnedToHome?: boolean;
  onTogglePin?: (typeId: string, pinned: boolean) => void;
}

const FALLBACK_COLOR = "#10b981";
const DAY_LABELS = ["", "M", "", "W", "", "F", ""];
const WEEKS_TO_SHOW = 16;
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function formatDateLabel(ds: string): string {
  const d = new Date(
    Number(ds.slice(0, 4)),
    Number(ds.slice(4, 6)) - 1,
    Number(ds.slice(6, 8)),
  );
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityTrackerStrip({ type, logs, pinnedToHome, onTogglePin }: ActivityTrackerStripProps) {
  const color = type.color ?? FALLBACK_COLOR;
  const IconComp = type.icon ? ACTIVITY_ICON_MAP[type.icon] : null;

  const activeDates = new Set(
    logs
      .filter((l) => l.activityTypeId === type.id)
      .map((l) => l.dateStr),
  );

  const today = new Date();
  const todayDow = today.getDay();
  const endOfGrid = new Date(today);
  endOfGrid.setDate(today.getDate() + (6 - todayDow));

  const startOfGrid = new Date(endOfGrid);
  startOfGrid.setDate(endOfGrid.getDate() - WEEKS_TO_SHOW * 7 + 1);

  const weeks: Array<Array<{ dateStr: string; active: boolean; future: boolean }>> = [];
  const cursor = new Date(startOfGrid);
  let currentWeek: Array<{ dateStr: string; active: boolean; future: boolean }> = [];

  while (cursor <= endOfGrid) {
    const ds = toDateStr(cursor);
    currentWeek.push({
      dateStr: ds,
      active: activeDates.has(ds),
      future: cursor > today,
    });
    if (cursor.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const totalActive = activeDates.size;

  // Build month header spans aligned to the week columns.
  // Each entry: { label, colSpan } where colSpan = how many week columns belong to that month.
  const monthSpans: Array<{ label: string; colSpan: number }> = [];
  for (const week of weeks) {
    const firstDay = week[0];
    const d = new Date(
      Number(firstDay.dateStr.slice(0, 4)),
      Number(firstDay.dateStr.slice(4, 6)) - 1,
      Number(firstDay.dateStr.slice(6, 8)),
    );
    const label = SHORT_MONTHS[d.getMonth()];
    const last = monthSpans[monthSpans.length - 1];
    if (last && last.label === label) {
      last.colSpan++;
    } else {
      monthSpans.push({ label, colSpan: 1 });
    }
  }

  const cellSize = 13;
  const gap = 3;
  const monthGap = 6;
  const dowLabelWidth = 20;

  // Track which week index starts a new month (excluding the very first week).
  const monthBreaks = new Set<number>();
  for (let wi = 1; wi < weeks.length; wi++) {
    const prevFirst = weeks[wi - 1][0].dateStr;
    const currFirst = weeks[wi][0].dateStr;
    const prevMonth = Number(prevFirst.slice(4, 6));
    const currMonth = Number(currFirst.slice(4, 6));
    if (currMonth !== prevMonth) {
      monthBreaks.add(wi);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-emerald-950/20 to-neutral-900/40 p-4 space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-2">
        {IconComp ? (
          <IconComp className="h-4 w-4 shrink-0" style={{ color }} />
        ) : (
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="text-sm font-medium truncate">{type.name}</span>
        <span className="text-xs text-muted-foreground ml-auto shrink-0">
          {totalActive} day{totalActive === 1 ? "" : "s"} logged
        </span>
        {onTogglePin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label="Activity options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem
                onClick={() => onTogglePin(type.id, !pinnedToHome)}
              >
                {pinnedToHome ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin from Home
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin to Home
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Grid with month headers */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col">
          {/* Month labels row */}
          <div className="relative" style={{ marginLeft: dowLabelWidth, height: 14 }}>
            {(() => {
              const labels: React.ReactNode[] = [];
              let weekIdx = 0;
              for (let si = 0; si < monthSpans.length; si++) {
                const span = monthSpans[si];
                // Compute left offset: sum of (margin + cellSize) for all preceding weeks.
                // First week (wi=0) has gap as its margin-left via the flex layout.
                let x = 0;
                for (let w = 0; w < weekIdx; w++) {
                  x += (monthBreaks.has(w) ? monthGap : gap) + cellSize;
                }
                // Add the current column's own left margin
                x += weekIdx === 0 ? gap : (monthBreaks.has(weekIdx) ? monthGap : gap);
                if (span.colSpan >= 2) {
                  labels.push(
                    <div
                      key={`month-${si}`}
                      className="absolute text-[9px] text-muted-foreground"
                      style={{ left: x }}
                    >
                      {span.label}
                    </div>
                  );
                }
                weekIdx += span.colSpan;
              }
              return labels;
            })()}
          </div>

          {/* Day labels + week columns */}
          <div className="flex">
            <div className="flex flex-col gap-[3px] shrink-0" style={{ width: dowLabelWidth }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={`dow-${i}`}
                  className="h-[13px] text-[9px] text-muted-foreground flex items-center justify-end pr-1"
                >
                  {label}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div
                key={wi}
                className="flex flex-col gap-[3px]"
                style={{ marginLeft: monthBreaks.has(wi) ? monthGap : gap }}
              >
                {week.map((day) => (
                  <div
                    key={day.dateStr}
                    className={[
                      "h-[13px] w-[13px] rounded-[2px] transition-colors",
                      day.future
                        ? "bg-neutral-800/30"
                        : day.active
                          ? ""
                          : "bg-neutral-800/70",
                    ].join(" ")}
                    style={
                      !day.future && day.active
                        ? { backgroundColor: color }
                        : undefined
                    }
                    title={`${formatDateLabel(day.dateStr)}${day.active ? " - logged" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
