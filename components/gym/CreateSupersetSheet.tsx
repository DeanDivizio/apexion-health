"use client";

import * as React from "react";
import { Zap, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui_primitives/sheet";
import { Button } from "@/components/ui_primitives/button";
import { Separator } from "@/components/ui_primitives/separator";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import { ExerciseCombobox, type ExerciseGroupOption } from "./ExerciseCombobox";
import type { SupersetTemplateSummary, ExerciseDefinition } from "@/lib/gym";

interface CreateSupersetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strengthGroups: ExerciseGroupOption[];
  exerciseMap: Map<string, ExerciseDefinition>;
  savedTemplates: SupersetTemplateSummary[];
  onStartSuperset: (exerciseAKey: string, exerciseBKey: string, templateId?: string) => void;
}

export function CreateSupersetSheet({
  open,
  onOpenChange,
  strengthGroups,
  exerciseMap,
  savedTemplates,
  onStartSuperset,
}: CreateSupersetSheetProps) {
  const [exerciseAKey, setExerciseAKey] = React.useState<string>("");
  const [exerciseBKey, setExerciseBKey] = React.useState<string>("");

  const resetState = React.useCallback(() => {
    setExerciseAKey("");
    setExerciseBKey("");
  }, []);

  React.useEffect(() => {
    if (open) resetState();
  }, [open, resetState]);

  const exerciseAName = exerciseAKey ? exerciseMap.get(exerciseAKey)?.name ?? exerciseAKey : "";
  const exerciseBName = exerciseBKey ? exerciseMap.get(exerciseBKey)?.name ?? exerciseBKey : "";

  const canStart = exerciseAKey && exerciseBKey && exerciseAKey !== exerciseBKey;

  const handleStart = () => {
    if (!canStart) return;
    onStartSuperset(exerciseAKey, exerciseBKey);
    onOpenChange(false);
  };

  const handleSelectTemplate = (template: SupersetTemplateSummary) => {
    onStartSuperset(template.exerciseAKey, template.exerciseBKey, template.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-white/20 bg-gradient-to-br from-purple-950/20 via-slate-950/40 to-blue-950/30 backdrop-blur-xl p-0 [&>button:last-child]:hidden"
      >
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-400" />
          <SheetTitle className="text-base font-medium">Create Superset</SheetTitle>
        </div>

        <Separator />

        <ScrollArea className="max-h-[70vh]">
          <div className="px-4 py-4 space-y-5">
            {/* Saved Templates */}
            {savedTemplates.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Saved Supersets
                </h3>
                <div className="space-y-1.5">
                  {savedTemplates.map((template) => {
                    const nameA = exerciseMap.get(template.exerciseAKey)?.name ?? template.exerciseAKey;
                    const nameB = exerciseMap.get(template.exerciseBKey)?.name ?? template.exerciseBKey;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 transition-colors text-left"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <Zap className="h-4 w-4 text-purple-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground/90 truncate">
                            {nameA} + {nameB}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    );
                  })}
                </div>
                <Separator className="mt-3" />
              </div>
            )}

            {/* New Superset Builder */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                New Superset
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Exercise A</label>
                <ExerciseCombobox
                  groups={strengthGroups}
                  value={exerciseAKey}
                  onSelect={(key) => setExerciseAKey(key)}
                  placeholder="Choose exercise A..."
                />
                {exerciseAName && (
                  <p className="text-xs text-purple-400 pl-1">{exerciseAName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Exercise B</label>
                <ExerciseCombobox
                  groups={strengthGroups}
                  value={exerciseBKey}
                  onSelect={(key) => setExerciseBKey(key)}
                  placeholder="Choose exercise B..."
                />
                {exerciseBName && (
                  <p className="text-xs text-purple-400 pl-1">{exerciseBName}</p>
                )}
              </div>

              {exerciseAKey && exerciseBKey && exerciseAKey === exerciseBKey && (
                <p className="text-xs text-red-400 pl-1">
                  Exercises A and B must be different.
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <div className="px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-900/30"
          >
            <Zap className="mr-2 h-5 w-5" />
            Start Superset
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
