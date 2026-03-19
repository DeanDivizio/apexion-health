"use client";

import { cn } from "@/lib/utils";
import { Utensils } from "lucide-react";

interface MacroSummarySmallProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}

function getBarColor(pct: number, overOkay = false): string {
  if (pct > 100) {
    return overOkay
      ? "bg-gradient-to-r from-green-500 to-green-300"
      : "bg-gradient-to-r from-destructive to-red-400";
  }
  if (pct > 85) return "bg-gradient-to-r from-green-500 to-green-400";
  if (pct > 50) return "bg-blue-500";
  if (pct > 25) return "bg-amber-500";
  return "bg-red-500/70";
}

function MacroBar({
  label,
  current,
  goal,
  unit,
  overOkay = false,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  overOkay?: boolean;
}) {
  const pct = goal > 0 ? Math.round((current / goal) * 100) : 0;
  const displayPct = Math.min(pct, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-neutral-500">{label}</span>
        <span className="font-mono text-neutral-100 tabular-nums">
          {Math.round(current)} / {Math.round(goal)}
          {unit} <span className="text-neutral-500">{pct}%</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-neutral-500/50 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            getBarColor(pct, overOkay),
          )}
          style={{ width: `${displayPct}%` }}
        />
      </div>
    </div>
  );
}

export function MacroSummarySmall({
  calories,
  protein,
  carbs,
  fat,
  calorieGoal,
  proteinGoal,
  carbGoal,
  fatGoal,
}: MacroSummarySmallProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4 transition-colors hover:bg-neutral-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-amber-400 opacity-80">Today&apos;s Macros</span>
        <Utensils className="h-3.5 w-3.5 text-amber-200 opacity-50 shrink-0" aria-hidden />
      </div>
      <div className="space-y-3">
        <MacroBar label="Calories" current={calories} goal={calorieGoal} unit=" kcal" />
        <MacroBar label="Protein" current={protein} goal={proteinGoal} unit="g" overOkay />
        <MacroBar label="Carbs" current={carbs} goal={carbGoal} unit="g" />
        <MacroBar label="Fat" current={fat} goal={fatGoal} unit="g" />
      </div>
    </div>
  );
}
