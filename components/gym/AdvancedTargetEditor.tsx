"use client";

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { Slider } from "@/components/ui_primitives/slider";
import { cn } from "@/lib/utils";
import { captureClientEvent } from "@/lib/posthog-client";
import type { MuscleTarget } from "@/lib/gym";
import { muscleGroupSchema } from "@/lib/gym";

interface AdvancedTargetEditorProps {
  targets: MuscleTarget[];
  presetTargets?: MuscleTarget[];
  bodyRegion?: string;
  onChange: (targets: MuscleTarget[]) => void;
  showAnalyticsWarning?: boolean;
}

const MUSCLE_LABELS: Record<string, string> = {
  chestUpper: "Chest (Upper)",
  chestMid: "Chest (Mid)",
  chestLower: "Chest (Lower)",
  lats: "Lats",
  trapsUpper: "Traps (Upper)",
  trapsMid: "Traps (Mid)",
  trapsLower: "Traps (Lower)",
  rhomboids: "Rhomboids",
  lowerBack: "Lower Back",
  deltsFront: "Delts (Front)",
  deltsSide: "Delts (Side)",
  deltsRear: "Delts (Rear)",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  absUpper: "Abs (Upper)",
  absLower: "Abs (Lower)",
  obliques: "Obliques",
  transverseAbs: "Deep Core",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  hipFlexors: "Hip Flexors",
  adductors: "Adductors",
  abductors: "Abductors",
  calves: "Calves",
};

const REGION_MUSCLES: Record<string, string[]> = {
  upperBody: [
    "chestUpper", "chestMid", "chestLower",
    "lats", "trapsUpper", "trapsMid", "trapsLower", "rhomboids", "lowerBack",
    "deltsFront", "deltsSide", "deltsRear",
    "biceps", "triceps", "forearms",
  ],
  lowerBody: [
    "quads", "hamstrings", "glutes", "hipFlexors",
    "adductors", "abductors", "calves",
  ],
  core: [
    "absUpper", "absLower", "obliques", "transverseAbs",
    "lowerBack", "glutes", "hipFlexors",
  ],
};

const ALL_MUSCLES = muscleGroupSchema.options;

function getMusclesForRegion(bodyRegion?: string): string[] {
  if (bodyRegion && REGION_MUSCLES[bodyRegion]) {
    return REGION_MUSCLES[bodyRegion];
  }
  return [...ALL_MUSCLES];
}

export function AdvancedTargetEditor({
  targets,
  presetTargets,
  bodyRegion,
  onChange,
  showAnalyticsWarning = false,
}: AdvancedTargetEditorProps) {
  const [hasEdited, setHasEdited] = useState(false);
  const availableMuscles = useMemo(
    () => getMusclesForRegion(bodyRegion),
    [bodyRegion],
  );

  const targetMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of targets) map.set(t.muscle, t.weight);
    return map;
  }, [targets]);

  const totalWeight = useMemo(
    () => targets.reduce((sum, t) => sum + t.weight, 0),
    [targets],
  );

  const remaining = Math.max(0, 1 - totalWeight);
  const isOverAllocated = totalWeight > 1.001;

  const handleSliderChange = useCallback(
    (muscle: string, newWeight: number) => {
      if (!hasEdited) {
        setHasEdited(true);
        captureClientEvent("gym_custom_exercise_targets_edited", {
          body_region: bodyRegion,
        });
      }

      const clamped = Math.round(newWeight * 100) / 100;
      const existing = targets.find((t) => t.muscle === muscle);

      let updated: MuscleTarget[];
      if (clamped <= 0) {
        updated = targets.filter((t) => t.muscle !== muscle);
      } else if (existing) {
        updated = targets.map((t) =>
          t.muscle === muscle
            ? { ...t, weight: clamped }
            : t,
        );
      } else {
        updated = [
          ...targets,
          { muscle: muscle as MuscleTarget["muscle"], weight: clamped },
        ];
      }

      onChange(updated);
    },
    [targets, onChange, hasEdited, bodyRegion],
  );

  const handleResetToPreset = useCallback(() => {
    if (presetTargets) {
      onChange([...presetTargets]);
      captureClientEvent("gym_custom_exercise_reset_to_preset", {
        body_region: bodyRegion,
      });
    }
  }, [presetTargets, onChange, bodyRegion]);

  const remainingPct = Math.round(remaining * 100);
  const totalPct = Math.round(totalWeight * 100);

  return (
    <div className="space-y-4">
      {showAnalyticsWarning && hasEdited && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-200/90">
            Changing targets will update historical analytics for this exercise.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-mono font-medium tabular-nums",
              isOverAllocated
                ? "text-red-400"
                : remainingPct === 0
                  ? "text-green-400"
                  : "text-muted-foreground",
            )}
          >
            {totalPct}%
          </span>
          <span className="text-xs text-muted-foreground/60">allocated</span>
          {remainingPct > 0 && !isOverAllocated && (
            <span className="text-xs text-muted-foreground/50">
              ({remainingPct}% remaining)
            </span>
          )}
          {isOverAllocated && (
            <span className="text-xs text-red-400">
              (over by {totalPct - 100}%)
            </span>
          )}
        </div>
        {presetTargets && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleResetToPreset}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-200",
            isOverAllocated
              ? "bg-red-500"
              : totalPct >= 100
                ? "bg-green-500"
                : "bg-blue-500",
          )}
          style={{ width: `${Math.min(totalPct, 100)}%` }}
        />
      </div>

      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
        {availableMuscles.map((muscle) => {
          const weight = targetMap.get(muscle) ?? 0;
          const pct = Math.round(weight * 100);

          return (
            <div key={muscle} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {MUSCLE_LABELS[muscle] ?? muscle}
                </span>
                <span
                  className={cn(
                    "text-xs font-mono tabular-nums",
                    pct > 0 ? "text-foreground" : "text-muted-foreground/40",
                  )}
                >
                  {pct}%
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[pct]}
                onValueChange={([v]) =>
                  handleSliderChange(muscle, v / 100)
                }
                className="w-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
