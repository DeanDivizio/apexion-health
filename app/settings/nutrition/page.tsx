"use client";

import { useEffect, useState, useTransition } from "react";
import { getUserGoalsAction, upsertUserGoalsAction } from "@/actions/nutrition";
import { useCoupledMacroSliders } from "@/hooks/useCoupledMacroSliders";
import { Slider } from "@/components/ui_primitives/slider";
import { Button } from "@/components/ui_primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NutritionSettingsPage() {
  const [loaded, setLoaded] = useState(false);
  const [initialGoals, setInitialGoals] = useState<{
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    getUserGoalsAction().then((goals) => {
      setInitialGoals(
        goals
          ? { calories: goals.calories, protein: goals.protein, carbs: goals.carbs, fat: goals.fat }
          : { calories: 2000, protein: 150, carbs: 200, fat: 67 },
      );
      setLoaded(true);
    });
  }, []);

  if (!loaded || !initialGoals) {
    return <NutritionSettingsSkeleton />;
  }

  return (
    <NutritionSettingsForm
      initialGoals={initialGoals}
      isPending={isPending}
      onSave={(cal, protein, carbs, fat) => {
        startTransition(async () => {
          try {
            await upsertUserGoalsAction({ calories: cal, protein, carbs, fat });
            toast({ title: "Nutrition goals saved" });
          } catch {
            toast({ title: "Failed to save goals", variant: "destructive" });
          }
        });
      }}
    />
  );
}

function NutritionSettingsForm({
  initialGoals,
  isPending,
  onSave,
}: {
  initialGoals: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null };
  isPending: boolean;
  onSave: (cal: number, protein: number, carbs: number, fat: number) => void;
}) {
  const sliders = useCoupledMacroSliders(
    initialGoals.calories,
    initialGoals.protein,
    initialGoals.carbs,
    initialGoals.fat,
  );

  return (
    <div className="w-full max-w-lg space-y-6">
      <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daily Calories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={[sliders.calories]}
            min={1200}
            max={5000}
            step={50}
            onValueChange={([v]) => sliders.setCalories(v)}
          />
          <p className="text-center text-2xl font-semibold tabular-nums">
            {sliders.calories.toLocaleString()} <span className="text-sm text-muted-foreground">kcal</span>
          </p>
        </CardContent>
      </Card>

      <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Macro Ratio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex h-6 rounded-full overflow-hidden text-xs font-medium">
            <div
              className="flex items-center justify-center bg-blue-500 transition-all duration-300"
              style={{ flexBasis: `${sliders.proteinPct}%` }}
            >
              {sliders.proteinPct >= 10 && `P ${sliders.proteinPct}%`}
            </div>
            <div
              className="flex items-center justify-center bg-green-500 transition-all duration-300"
              style={{ flexBasis: `${sliders.carbPct}%` }}
            >
              {sliders.carbPct >= 10 && `C ${sliders.carbPct}%`}
            </div>
            <div
              className="flex items-center justify-center bg-amber-500 transition-all duration-300"
              style={{ flexBasis: `${sliders.fatPct}%` }}
            >
              {sliders.fatPct >= 10 && `F ${sliders.fatPct}%`}
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground pt-1">
            {sliders.proteinPct}% protein · {sliders.carbPct}% carbs · {sliders.fatPct}% fat
          </p>
        </CardContent>
      </Card>

      <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
        <CardContent className="space-y-6 pt-6">
          <MacroSlider
            label="Protein"
            grams={sliders.proteinGrams}
            cal={sliders.proteinCal}
            pct={sliders.proteinPct}
            min={10}
            max={sliders.proteinMax}
            step={5}
            onChange={sliders.setProtein}
            color="bg-blue-500"
          />
          <MacroSlider
            label="Carbs"
            grams={sliders.carbGrams}
            cal={sliders.carbCal}
            pct={sliders.carbPct}
            min={20}
            max={sliders.carbMax}
            step={5}
            onChange={sliders.setCarbs}
            color="bg-green-500"
          />
          <MacroSlider
            label="Fat"
            grams={sliders.fatGrams}
            cal={sliders.fatCal}
            pct={sliders.fatPct}
            min={15}
            max={sliders.fatMax}
            step={1}
            onChange={sliders.setFat}
            color="bg-amber-500"
          />
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={isPending}
        onClick={() =>
          onSave(sliders.calories, sliders.proteinGrams, sliders.carbGrams, sliders.fatGrams)
        }
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save
      </Button>
    </div>
  );
}

function MacroSlider({
  label,
  grams,
  cal,
  pct,
  min,
  max,
  step,
  onChange,
  color,
}: {
  label: string;
  grams: number;
  cal: number;
  pct: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {grams}g · {cal} kcal · {pct}%
        </span>
      </div>
      <Slider
        value={[grams]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className={`[&_[data-slot=range]]:${color}`}
      />
    </div>
  );
}

function NutritionSettingsSkeleton() {
  return (
    <div className="w-full max-w-lg space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-neutral-800/50 animate-pulse h-28"
        />
      ))}
    </div>
  );
}
