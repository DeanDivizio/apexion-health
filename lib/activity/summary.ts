import type { ActivityContributionDay, ActivityLogValueView } from "@/lib/activity";

export function summarizeActivityValue(value: ActivityLogValueView): string | null {
  if (value.kind === "text") {
    return value.textValue ? `${value.label}: ${value.textValue}` : null;
  }
  if (value.kind === "number_with_unit") {
    if (value.numberValue == null) return null;
    return `${value.label}: ${value.numberValue}${value.unitValue ? ` ${value.unitValue}` : ""}`;
  }
  if (value.kind === "number") {
    return value.numberValue == null ? null : `${value.label}: ${value.numberValue}`;
  }
  if (value.kind === "date") {
    return value.dateValue ? `${value.label}: ${value.dateValue}` : null;
  }
  if (value.kind === "time") {
    return value.timeValue ? `${value.label}: ${value.timeValue}` : null;
  }
  if (value.kind === "datetime") {
    return value.dateTimeValueIso ? `${value.label}: ${value.dateTimeValueIso}` : null;
  }
  if (value.kind === "scale_1_5") {
    return value.intValue == null ? null : `${value.label}: ${value.intValue}/5`;
  }
  return null;
}

export function summarizeActivityLogLine(values: ActivityLogValueView[]): string[] {
  return values
    .map(summarizeActivityValue)
    .filter((line): line is string => Boolean(line));
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/**
 * Compute current streak and best streak from contribution data.
 * A "streak" is consecutive days with count > 0, counting backwards from today.
 */
export function computeStreaks(contributions: ActivityContributionDay[]): {
  currentStreak: number;
  bestStreak: number;
} {
  if (contributions.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const activeSet = new Set(
    contributions.filter((d) => d.count > 0).map((d) => d.dateStr),
  );

  const today = new Date();
  const todayStr = toDateStr(today);

  // Current streak: count consecutive days backwards from today (or yesterday if today has no logs)
  let currentStreak = 0;
  const cursor = new Date(today);
  if (!activeSet.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (activeSet.has(toDateStr(cursor))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak: scan all days in the contribution range
  const sortedDates = [...activeSet].sort();
  let bestStreak = 0;
  let run = 0;
  let prevDate: Date | null = null;

  for (const ds of sortedDates) {
    const d = new Date(
      Number(ds.slice(0, 4)),
      Number(ds.slice(4, 6)) - 1,
      Number(ds.slice(6, 8)),
    );
    if (prevDate) {
      const diffMs = d.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / 86400000);
      run = diffDays === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    bestStreak = Math.max(bestStreak, run);
    prevDate = d;
  }

  return { currentStreak, bestStreak };
}
