"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getGymUserPreferencesAction,
  updateGymUserPreferencesAction,
} from "@/actions/gym";
import type { RepInputStyle } from "@/lib/gym";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Label } from "@/components/ui_primitives/label";
import { Switch } from "@/components/ui_primitives/switch";
import { Button } from "@/components/ui_primitives/button";
import { Loader2, SlidersHorizontal, Repeat2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GymPrefsState {
  repInputStyle: RepInputStyle;
  carryOverWeight: boolean;
  carryOverReps: boolean;
  showFailureMode: boolean;
}

const DEFAULT_PREFS: GymPrefsState = {
  repInputStyle: "dropdown",
  carryOverWeight: true,
  carryOverReps: false,
  showFailureMode: true,
};

function toRepInputStyle(value: string | undefined | null): RepInputStyle {
  return value === "freeform" ? "freeform" : "dropdown";
}

export default function GymSettingsPage() {
  const [prefs, setPrefs] = useState<GymPrefsState | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    getGymUserPreferencesAction().then((data) => {
      setPrefs({
        repInputStyle: toRepInputStyle(data?.repInputStyle),
        carryOverWeight: data?.carryOverWeight ?? DEFAULT_PREFS.carryOverWeight,
        carryOverReps: data?.carryOverReps ?? DEFAULT_PREFS.carryOverReps,
        showFailureMode: data?.showFailureMode ?? DEFAULT_PREFS.showFailureMode,
      });
    });
  }, []);

  if (!prefs) return <GymSettingsSkeleton />;

  function handleSave() {
    if (!prefs) return;
    startTransition(async () => {
      try {
        await updateGymUserPreferencesAction({
          repInputStyle: prefs.repInputStyle,
          carryOverWeight: prefs.carryOverWeight,
          carryOverReps: prefs.carryOverReps,
          showFailureMode: prefs.showFailureMode,
        });
        toast({ title: "Gym settings saved" });
      } catch {
        toast({ title: "Failed to save settings", variant: "destructive" });
      }
    });
  }

  return (
    <div className="w-full max-w-lg space-y-4">
      <Card className="bg-gradient-to-br from-emerald-900/10 to-neutral-950 backdrop-blur-xl border-emerald-950/80 !rounded-xl ring-1 ring-emerald-950/30">
        <CardHeader className="px-4 pt-4 pb-4 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-emerald-400/90 shrink-0" />
            UI Preferences
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            Customize how you interact with the workout logging interface.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Rep Input Style</Label>
            <Select
              value={prefs.repInputStyle ?? DEFAULT_PREFS.repInputStyle}
              onValueChange={(val) =>
                setPrefs({ ...prefs, repInputStyle: toRepInputStyle(val) })
              }
            >
              <SelectTrigger className="w-36 bg-neutral-900 border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="freeform">Freeform</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-900/10 to-neutral-950 backdrop-blur-xl border-blue-950/80 !rounded-xl ring-1 ring-blue-950/30">
        <CardHeader className="px-4 pt-4 pb-4 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Repeat2 className="h-5 w-5 text-blue-400/90 shrink-0" />
            Set Behavior
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            Control how weight and reps are pre-filled when you add new sets.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Carry over weight</Label>
              <p className="text-xs text-muted-foreground">
                Pre-fill weight from the previous set when adding a new one.
              </p>
            </div>
            <Switch
              checked={prefs.carryOverWeight}
              onCheckedChange={(checked) =>
                setPrefs({ ...prefs, carryOverWeight: checked })
              }
              className="data-[state=checked]:bg-green-500 [&_span]:bg-gray-400 [&_span]:data-[state=checked]:bg-white"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Carry over reps</Label>
              <p className="text-xs text-muted-foreground">
                Pre-fill reps from the previous set when adding a new one.
              </p>
            </div>
            <Switch
              checked={prefs.carryOverReps}
              onCheckedChange={(checked) =>
                setPrefs({ ...prefs, carryOverReps: checked })
              }
              className="data-[state=checked]:bg-green-500 [&_span]:bg-gray-400 [&_span]:data-[state=checked]:bg-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-900/10 to-neutral-950 backdrop-blur-xl border-purple-950/80 !rounded-xl ring-1 ring-purple-950/30">
        <CardHeader className="px-4 pt-4 pb-4 space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400/90 shrink-0" />
            Set Tracking
          </CardTitle>
          <p className="text-xs text-muted-foreground font-normal leading-relaxed">
            Control which optional metrics appear on each set.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show failure mode</Label>
              <p className="text-xs text-muted-foreground">
                Track what limited your performance on each set (primary muscle, grip, cardio, etc.).
              </p>
            </div>
            <Switch
              checked={prefs.showFailureMode}
              onCheckedChange={(checked) =>
                setPrefs({ ...prefs, showFailureMode: checked })
              }
              className="data-[state=checked]:bg-green-500 [&_span]:bg-gray-400 [&_span]:data-[state=checked]:bg-white"
            />
          </div>
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

function GymSettingsSkeleton() {
  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
      <div className="rounded-xl bg-neutral-800/50 p-4 space-y-3">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 rounded-md bg-neutral-900/50 animate-pulse" />
      </div>
      <div className="h-11 rounded-md bg-muted animate-pulse" />
    </div>
  );
}
