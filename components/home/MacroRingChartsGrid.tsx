"use client";

import { UniversalRingChart } from "@/components/charts/radialcharts/UniversalRingChart";

export interface MacroRingChartsGridProps {
  todayCalories: number;
  todayProtein: number;
  todayCarbs: number;
  todayFat: number;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}

/**
 * All four macro rings in one module so Recharts loads once (single dynamic import from the home page).
 */
export function MacroRingChartsGrid({
  todayCalories,
  todayProtein,
  todayCarbs,
  todayFat,
  calorieGoal,
  proteinGoal,
  carbGoal,
  fatGoal,
}: MacroRingChartsGridProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 justify-around mb-0">
      <UniversalRingChart
        title="Today's Calorie Intake"
        shortTitle="Calories"
        subtext="Your calorie target is"
        subtextOrder="unit last"
        description="Intake compared to maintenence"
        unit="Calories"
        value={Math.round(todayCalories)}
        goal={calorieGoal}
        shade="indigo"
      />
      <UniversalRingChart
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
      <UniversalRingChart
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
      <UniversalRingChart
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
