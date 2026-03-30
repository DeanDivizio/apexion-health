"use client";

import { useEffect, useState, useTransition } from "react";
import { getUserGoalsAction, upsertUserGoalsAction } from "@/actions/nutrition";
import { useCoupledMacroSliders } from "@/hooks/useCoupledMacroSliders";
import { Slider } from "@/components/ui_primitives/slider";
import { Button } from "@/components/ui_primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import { Switch } from "@/components/ui_primitives/switch";
import { Droplets, Flame, Loader2, Link2, Link2Off } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_CALORIES,
  DEFAULT_PROTEIN,
  DEFAULT_CARBS,
  DEFAULT_FAT,
  DEFAULT_WATER_GOAL_OZ,
  DEFAULT_SODIUM_GOAL_MG,
  DEFAULT_POTASSIUM_GOAL_MG,
  DEFAULT_MAGNESIUM_GOAL_MG,
} from "@/lib/nutrition/defaults";

type InitialGoals = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  waterGoalOz: number | null;
  sodiumGoalMg: number | null;
  potassiumGoalMg: number | null;
  magnesiumGoalMg: number | null;
};

export default function NutritionSettingsPage() {
  const [loaded, setLoaded] = useState(false);
  const [initialGoals, setInitialGoals] = useState<InitialGoals | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    getUserGoalsAction().then((goals) => {
      setInitialGoals(
        goals
          ? {
              calories: goals.calories,
              protein: goals.protein,
              carbs: goals.carbs,
              fat: goals.fat,
              waterGoalOz: goals.waterGoalOz,
              sodiumGoalMg: goals.sodiumGoalMg,
              potassiumGoalMg: goals.potassiumGoalMg,
              magnesiumGoalMg: goals.magnesiumGoalMg,
            }
          : {
              calories: DEFAULT_CALORIES,
              protein: DEFAULT_PROTEIN,
              carbs: DEFAULT_CARBS,
              fat: DEFAULT_FAT,
              waterGoalOz: null,
              sodiumGoalMg: null,
              potassiumGoalMg: null,
              magnesiumGoalMg: null,
            },
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
      onSave={(payload) => {
        startTransition(async () => {
          try {
            await upsertUserGoalsAction(payload);
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
  initialGoals: InitialGoals;
  isPending: boolean;
  onSave: (payload: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    waterGoalOz: number;
    sodiumGoalMg: number;
    potassiumGoalMg: number;
    magnesiumGoalMg: number;
  }) => void;
}) {
  const sliders = useCoupledMacroSliders(
    initialGoals.calories,
    initialGoals.protein,
    initialGoals.carbs,
    initialGoals.fat,
  );

  const [waterGoalOz, setWaterGoalOz] = useState(
    initialGoals.waterGoalOz ?? DEFAULT_WATER_GOAL_OZ,
  );
  const [sodiumGoalMg, setSodiumGoalMg] = useState(
    initialGoals.sodiumGoalMg ?? DEFAULT_SODIUM_GOAL_MG,
  );
  const [potassiumGoalMg, setPotassiumGoalMg] = useState(
    initialGoals.potassiumGoalMg ?? DEFAULT_POTASSIUM_GOAL_MG,
  );
  const [magnesiumGoalMg, setMagnesiumGoalMg] = useState(
    initialGoals.magnesiumGoalMg ?? DEFAULT_MAGNESIUM_GOAL_MG,
  );

  return (
    <div className="w-full max-w-lg space-y-6">
      <Card className="bg-gradient-to-br from-blue-900/10 to-neutral-950 backdrop-blur-xl border-green-950/80 !rounded-xl ring-1 ring-orange-950/30">
        <CardHeader className="pb-2 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400/90 shrink-0" />
            Calories &amp; macros
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            Set your daily calorie target and macro split. These feed the ring charts on the home
            screen and contribute to your analytics.
          </p>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-orange-100/90">Calorie target</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {sliders.calories.toLocaleString()} kcal / day
              </span>
            </div>
            <Slider
              value={[sliders.calories]}
              min={1200}
              max={5000}
              step={50}
              onValueChange={([v]) => sliders.setCalories(v)}
              className="[&>span>span]:!bg-gradient-to-r [&>span>span]:!from-orange-500 [&>span>span]:!to-amber-400"
            />
          </div>

          <div className="h-px bg-white/10" />

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Macro ratio
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                {sliders.coupled ? (
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Link2Off className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">Auto-balance</span>
                <Switch
                  checked={sliders.coupled}
                  onCheckedChange={sliders.setCoupled}
                />
              </label>
            </div>

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
            <p className="text-xs text-center text-muted-foreground">
              {sliders.proteinPct}% protein · {sliders.carbPct}% carbs · {sliders.fatPct}% fat
            </p>
            <MacroValidationMessage
              calories={sliders.calories}
              macroCalTotal={sliders.macroCalTotal}
              coupled={sliders.coupled}
            />
          </div>

          <div className="space-y-5">
            <MacroSlider
              label="Protein"
              grams={sliders.proteinGrams}
              cal={sliders.proteinCal}
              pct={sliders.proteinPct}
              min={10}
              max={sliders.proteinMax}
              step={5}
              onChange={sliders.setProtein}
              rangeClass="[&>span>span]:!bg-blue-500"
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
              rangeClass="[&>span>span]:!bg-green-500"
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
              rangeClass="[&>span>span]:!bg-amber-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-900/10 to-neutral-950 backdrop-blur-xl border-green-950/80 !rounded-xl ring-1 ring-cyan-950/30">
        <CardHeader className="pb-2 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-400/90 shrink-0" />
            Hydration &amp; electrolytes
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            Daily targets for the home hydration card. Water is tracked from logs; electrolytes from
            meals and supplements.
          </p>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-cyan-100/90">Water goal</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(waterGoalOz)} oz / day
              </span>
            </div>
            <Slider
              value={[waterGoalOz]}
              min={40}
              max={200}
              step={2}
              onValueChange={([v]) => setWaterGoalOz(v)}
              className="[&>span>span]:!bg-gradient-to-r [&>span>span]:!from-teal-500 [&>span>span]:!to-cyan-400"
            />
          </div>

          <div className="h-px bg-white/10" />

          <div className="space-y-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Electrolyte targets (mg / day)
            </p>
            <MgTargetSlider
              label="Sodium"
              value={sodiumGoalMg}
              min={500}
              max={6000}
              step={50}
              onChange={setSodiumGoalMg}
              rangeClass="[&>span>span]:!bg-amber-500"
            />
            <MgTargetSlider
              label="Potassium"
              value={potassiumGoalMg}
              min={500}
              max={6000}
              step={50}
              onChange={setPotassiumGoalMg}
              rangeClass="[&>span>span]:!bg-violet-500"
            />
            <MgTargetSlider
              label="Magnesium"
              value={magnesiumGoalMg}
              min={100}
              max={900}
              step={10}
              onChange={setMagnesiumGoalMg}
              rangeClass="[&>span>span]:!bg-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={isPending}
        onClick={() =>
          onSave({
            calories: sliders.calories,
            protein: sliders.proteinGrams,
            carbs: sliders.carbGrams,
            fat: sliders.fatGrams,
            waterGoalOz,
            sodiumGoalMg,
            potassiumGoalMg,
            magnesiumGoalMg,
          })
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
  rangeClass,
}: {
  label: string;
  grams: number;
  cal: number;
  pct: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  rangeClass: string;
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
        className={rangeClass}
      />
    </div>
  );
}

function MgTargetSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  rangeClass,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  rangeClass: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(value)} mg
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className={rangeClass}
      />
    </div>
  );
}

function MacroValidationMessage({
  calories,
  macroCalTotal,
  coupled,
}: {
  calories: number;
  macroCalTotal: number;
  coupled: boolean;
}) {
  if (coupled) return null;

  const delta = macroCalTotal - calories;
  const absDelta = Math.abs(delta);

  if (absDelta < 10) return null;

  const direction = delta > 0 ? "over" : "under";

  return (
    <p className="text-xs text-amber-400/90 pt-2">
      Macros total {macroCalTotal.toLocaleString()} kcal — {absDelta.toLocaleString()} {direction} your {calories.toLocaleString()} kcal target
    </p>
  );
}

function NutritionSettingsSkeleton() {
  return (
    <div className="w-full max-w-lg space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-neutral-800/50 animate-pulse h-28" />
      ))}
    </div>
  );
}
