"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getUserHomePreferencesAction,
  upsertUserHomePreferencesAction,
} from "@/actions/settings";
import type { UserHomePreferencesView } from "@/lib/settings/server/settingsService";
import { Switch } from "@/components/ui_primitives/switch";
import { Button } from "@/components/ui_primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { ChevronUp, ChevronDown, GripVertical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SECTION_LABELS: Record<string, string> = {
  macroSummary: "Macro Summary",
  hydrationSummary: "Hydration Summary",
  workoutSummary: "Workout Summary",
  medsSummary: "Meds & Supplements",
  microNutrientSummary: "Micro Nutrients",
};

const VISIBILITY_KEYS: Record<string, keyof UserHomePreferencesView> = {
  macroSummary: "showMacroSummary",
  hydrationSummary: "showHydrationSummary",
  workoutSummary: "showWorkoutSummary",
  medsSummary: "showMedsSummary",
  microNutrientSummary: "showMicroNutrientSummary",
};

export default function HomeSettingsPage() {
  const [prefs, setPrefs] = useState<UserHomePreferencesView | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    getUserHomePreferencesAction().then(setPrefs);
  }, []);

  if (!prefs) return <HomeSettingsSkeleton />;

  function toggleVisibility(key: string) {
    if (!prefs) return;
    const field = VISIBILITY_KEYS[key];
    if (!field) return;
    setPrefs({ ...prefs, [field]: !prefs[field] });
  }

  function moveUp(index: number) {
    if (!prefs || index <= 0) return;
    const order = [...prefs.componentOrder];
    [order[index - 1], order[index]] = [order[index], order[index - 1]];
    setPrefs({ ...prefs, componentOrder: order });
  }

  function moveDown(index: number) {
    if (!prefs || index >= prefs.componentOrder.length - 1) return;
    const order = [...prefs.componentOrder];
    [order[index], order[index + 1]] = [order[index + 1], order[index]];
    setPrefs({ ...prefs, componentOrder: order });
  }

  function handleSave() {
    if (!prefs) return;
    startTransition(async () => {
      try {
        await upsertUserHomePreferencesAction(prefs);
        toast({ title: "Home screen settings saved" });
      } catch {
        toast({ title: "Failed to save settings", variant: "destructive" });
      }
    });
  }

  return (
    <div className="w-full max-w-lg space-y-4">
      <p className="text-sm text-muted-foreground">
        Reorder and toggle home screen sections.
      </p>

      <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 p-3">
          {prefs.componentOrder.map((key, index) => {
            const visKey = VISIBILITY_KEYS[key];
            const isVisible = visKey ? (prefs[visKey] as boolean) : false;

            return (
              <div
                key={key}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-neutral-900/50"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                <span className="flex-1 text-sm font-medium">
                  {SECTION_LABELS[key] ?? key}
                </span>

                {key === "macroSummary" && isVisible && (
                  <Select
                    value={prefs.macroSummarySize}
                    onValueChange={(val) =>
                      setPrefs({ ...prefs, macroSummarySize: val as "large" | "small" })
                    }
                  >
                    <SelectTrigger className="w-24 h-7 text-xs bg-neutral-800 border-neutral-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Switch
                  checked={isVisible}
                  onCheckedChange={() => toggleVisibility(key)}
                />

                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={index === 0}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    onClick={() => moveUp(index)}
                    aria-label={`Move ${SECTION_LABELS[key]} up`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === prefs.componentOrder.length - 1}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    onClick={() => moveDown(index)}
                    aria-label={`Move ${SECTION_LABELS[key]} down`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        disabled={isPending}
        onClick={handleSave}
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save
      </Button>
    </div>
  );
}

function HomeSettingsSkeleton() {
  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      <div className="rounded-xl bg-neutral-800/50 p-3 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-neutral-900/50 animate-pulse"
          />
        ))}
      </div>
      <div className="h-11 rounded-md bg-muted animate-pulse" />
    </div>
  );
}
