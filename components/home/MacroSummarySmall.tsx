"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";

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
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground tabular-nums">
          {Math.round(current)} / {Math.round(goal)}
          {unit} <span className="text-muted-foreground">{pct}%</span>
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
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Today&apos;s Macros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <MacroBar label="Calories" current={calories} goal={calorieGoal} unit=" kcal" />
        <MacroBar label="Protein" current={protein} goal={proteinGoal} unit="g" overOkay />
        <MacroBar label="Carbs" current={carbs} goal={carbGoal} unit="g" />
        <MacroBar label="Fat" current={fat} goal={fatGoal} unit="g" />
      </CardContent>
    </Card>
  );
}
