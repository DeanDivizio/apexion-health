"use client";

import { memo, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui_primitives/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { UniversalRingChart } from "@/utils/types";

const SHADE_CARD: Record<string, string> = {
  indigo: "from-indigo-900/10 to-neutral-950",
  blue: "from-blue-900/10 to-neutral-950",
  green: "from-green-900/10 to-neutral-950",
};

function ringColorForPct(pct: number, overOkay?: boolean): string {
  if (pct > 100) {
    return overOkay ? "hsl(var(--chart-2))" : "hsl(var(--destructive))";
  }
  if (pct > 85) return "hsl(var(--chart-2))";
  if (pct > 50) return "hsl(var(--chart-1))";
  if (pct > 25) return "hsl(var(--chart-3))";
  return "hsl(var(--destructive))";
}

type MacroRingGaugeCoreProps = UniversalRingChart & { isMobile: boolean };

function MacroRingGaugeCore({
  title,
  shortTitle,
  description,
  subtext,
  subtextOrder,
  unit,
  goal,
  value,
  shade,
  overOkay,
  isMobile,
}: MacroRingGaugeCoreProps) {
  const { strokeColor, displayArcPct } = useMemo(() => {
    const g = goal && goal > 0 ? goal : 0;
    const rawPct = g > 0 ? (value / g) * 100 : 0;
    const color = ringColorForPct(rawPct, overOkay);
    const displayArcPct = Math.min(Math.max(rawPct, 0), 100);
    return { strokeColor: color, displayArcPct };
  }, [goal, value, overOkay]);

  const { stroke, viewBox, normalizedRadius } = useMemo(() => {
    const r = isMobile ? 38 : 52;
    const s = isMobile ? 10 : 12;
    const vb = r * 2 + s * 2;
    return {
      stroke: s,
      viewBox: vb,
      normalizedRadius: r,
    };
  }, [isMobile]);

  const circumference = useMemo(
    () => normalizedRadius * 2 * Math.PI,
    [normalizedRadius],
  );

  const strokeDashoffset = useMemo(
    () => circumference - (displayArcPct / 100) * circumference,
    [circumference, displayArcPct],
  );

  const cardGradient = SHADE_CARD[shade] ?? SHADE_CARD.indigo;

  return (
    <Card
      className={cn(
        "flex flex-col align-center w-full mb-4 rounded-xl bg-gradient-to-br",
        cardGradient,
      )}
    >
      <CardHeader className="items-center w-full">
        <CardTitle className="mb-1 leading-snug">
          {isMobile ? shortTitle : title}
        </CardTitle>
        <CardDescription className="hidden md:block">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center">
        <div
          className="relative mx-auto mb-4 flex aspect-square w-full max-w-[250px] items-center justify-center"
          role="img"
          aria-label={`${shortTitle}: ${Math.round(value)} ${unit}, goal ${goal ?? "not set"}`}
        >
          <svg
            height={viewBox}
            width={viewBox}
            className="-rotate-90"
            viewBox={`0 0 ${viewBox} ${viewBox}`}
          >
            <circle
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={viewBox / 2}
              cy={viewBox / 2}
              className="opacity-40"
              style={{ stroke: "hsl(var(--muted))" }}
            />
            <circle
              fill="transparent"
              strokeWidth={stroke}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={viewBox / 2}
              cy={viewBox / 2}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset, stroke: strokeColor }}
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-foreground md:text-4xl tabular-nums">
              {Math.round(value)}
            </span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-center text-sm">
        <div className="leading-none text-neutral-500">
          {goal != null &&
            goal > 0 &&
            (subtextOrder === "unit first"
              ? `${goal - value} ${subtext}`
              : `${subtext} ${goal} ${unit}`)}
        </div>
      </CardFooter>
    </Card>
  );
}

const MemoCore = memo(MacroRingGaugeCore);

/** Lightweight SVG rings for the home page (replaces Recharts for faster load & render). */
export function HomeMacroRingCharts({
  todayCalories,
  todayProtein,
  todayCarbs,
  todayFat,
  calorieLimit,
  proteinGoal,
  carbGoal,
  fatGoal,
}: {
  todayCalories: number;
  todayProtein: number;
  todayCarbs: number;
  todayFat: number;
  calorieLimit: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="mb-0 grid grid-cols-2 justify-around gap-4 xl:grid-cols-3 2xl:grid-cols-4">
      <MemoCore
        isMobile={isMobile}
        title="Today's Calorie Intake"
        shortTitle="Calories"
        subtext="Your maintenence calorie intake is"
        subtextOrder="unit last"
        description="Intake compared to maintenence"
        unit="Calories"
        value={Math.round(todayCalories)}
        goal={calorieLimit}
        shade="indigo"
      />
      <MemoCore
        isMobile={isMobile}
        title="Today's Protein Intake"
        shortTitle="Protein"
        subtext="Your daily protein goal is "
        subtextOrder="unit last"
        description="Intake compared to goal"
        unit="grams"
        value={Math.round(todayProtein)}
        goal={proteinGoal}
        shade="blue"
        overOkay
      />
      <MemoCore
        isMobile={isMobile}
        title="Today's Carb Intake"
        shortTitle="Carbs"
        subtext="Your daily carb goal is "
        subtextOrder="unit last"
        description="Intake compared to goal"
        unit="Grams"
        value={Math.round(todayCarbs)}
        goal={carbGoal}
        shade="green"
      />
      <MemoCore
        isMobile={isMobile}
        title="Today's Fat Intake"
        shortTitle="Fat"
        subtext="Your daily fat goal is "
        subtextOrder="unit last"
        description="Intake compared to goal"
        unit="Grams"
        value={Math.round(todayFat)}
        goal={fatGoal}
        shade="indigo"
      />
    </div>
  );
}
