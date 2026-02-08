"use client";

import * as React from "react";
import { Info, Plus, Save, BookmarkPlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui_primitives/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui_primitives/tooltip";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Separator } from "@/components/ui_primitives/separator";
import { useToast } from "@/hooks/use-toast";
import { saveExerciseDefaultsAction } from "@/actions/gym";
import { createCustomExerciseAction } from "@/actions/gym";
import type { ExerciseDefinition, VariationTemplate } from "@/lib/gym";
import { VARIATION_TEMPLATE_MAP, VARIATION_TEMPLATES } from "@/lib/gym";

interface ExerciseSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: ExerciseDefinition | null;
  variations: Record<string, string>;
  onVariationsChange: (variations: Record<string, string>) => void;
  onExerciseNameUpdate?: (name: string) => void;
}

export function ExerciseSettingsSheet({
  open,
  onOpenChange,
  exercise,
  variations,
  onVariationsChange,
  onExerciseNameUpdate,
}: ExerciseSettingsSheetProps) {
  const { toast } = useToast();
  const [showAdoptList, setShowAdoptList] = React.useState(false);
  const [savingDefault, setSavingDefault] = React.useState(false);
  const [savingCustom, setSavingCustom] = React.useState(false);
  const [customName, setCustomName] = React.useState("");
  const [showCustomInput, setShowCustomInput] = React.useState(false);

  if (!exercise) return null;

  // Get the templates this exercise currently supports
  const adoptedTemplateIds = Object.keys(exercise.variationTemplates ?? {});
  // Also include any that were added at runtime via variations
  const activeTemplateIds = [
    ...new Set([...adoptedTemplateIds, ...Object.keys(variations)]),
  ];

  // Templates available to adopt (not already active)
  const availableTemplates = VARIATION_TEMPLATES.filter(
    (t) => !activeTemplateIds.includes(t.id),
  );

  const handleVariationChange = (templateId: string, optionKey: string) => {
    onVariationsChange({ ...variations, [templateId]: optionKey });
  };

  const handleAdoptVariation = (template: VariationTemplate) => {
    // Adopt with the first option as default
    const firstKey = template.options[0]?.key;
    if (firstKey) {
      onVariationsChange({ ...variations, [template.id]: firstKey });
    }
    setShowAdoptList(false);
  };

  const handleSaveDefault = async () => {
    if (!exercise) return;
    setSavingDefault(true);
    try {
      await saveExerciseDefaultsAction({
        exerciseKey: exercise.key,
        defaults: variations,
      });
      toast({
        title: "Defaults saved",
        description: `Your preferred settings for ${exercise.name} have been saved.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save defaults. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingDefault(false);
    }
  };

  const handleSaveCustom = async () => {
    if (!exercise || !customName.trim()) return;
    setSavingCustom(true);
    try {
      const key = customName.trim().replace(/\s+/g, "").replace(/^./, (c) => c.toLowerCase());

      await createCustomExerciseAction({
        key,
        name: customName.trim(),
        category: exercise.category,
        repMode: exercise.repMode ?? "bilateral",
        targets: exercise.baseTargets,
        variationSupports: Object.entries(variations).map(([templateId]) => ({
          templateId,
        })),
        optionLabelOverrides: [],
        variationEffects: [],
      });

      toast({
        title: "Custom exercise created",
        description: `"${customName.trim()}" has been saved as a custom exercise.`,
      });

      onExerciseNameUpdate?.(customName.trim());
      setShowCustomInput(false);
      setCustomName("");
    } catch {
      toast({
        title: "Error",
        description: "Failed to create custom exercise. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] sm:max-w-md flex flex-col overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Exercise Settings</SheetTitle>
          <SheetDescription>{exercise.name}</SheetDescription>
        </SheetHeader>

        {/* Variation Selectors */}
        <div className="flex-1 space-y-4 py-4">
          <h3 className="text-sm font-medium text-muted-foreground">Active Variations</h3>

          {activeTemplateIds.length === 0 && (
            <p className="text-sm text-muted-foreground/60 italic">
              No variations configured for this exercise.
            </p>
          )}

          {activeTemplateIds.map((templateId) => {
            const template = VARIATION_TEMPLATE_MAP.get(templateId);
            if (!template) return null;

            // Check for exercise-specific label override
            const override = exercise.variationTemplates?.[templateId];
            const label = override?.labelOverride ?? template.label;

            return (
              <div key={templateId} className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{label}</label>
                <Select
                  value={variations[templateId] ?? override?.defaultOptionKey ?? template.options[0]?.key}
                  onValueChange={(val) => handleVariationChange(templateId, val)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {template.options.map((opt) => {
                      const optLabel =
                        override?.optionLabelOverrides?.[opt.key] ?? opt.label;
                      return (
                        <SelectItem key={opt.key} value={opt.key}>
                          {optLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          })}

          {/* Adopt new variation */}
          {!showAdoptList ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
              onClick={() => setShowAdoptList(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add variation dimension
            </Button>
          ) : (
            <div className="space-y-1 border border-border/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">
                Select a variation to add:
              </p>
              {availableTemplates.map((template) => (
                <button
                  key={template.id}
                  className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors"
                  onClick={() => handleAdoptVariation(template)}
                >
                  {template.label}
                  <span className="text-xs text-muted-foreground ml-2">
                    {template.description}
                  </span>
                </button>
              ))}
              {availableTemplates.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  All available variations are already active.
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-xs"
                onClick={() => setShowAdoptList(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Save Section */}
        <div className="space-y-6 py-4">
          {/* Save Default */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-medium">
                Is this how you do {exercise.name}?
              </h4>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    Saving defaults means next time you select {exercise.name}, these
                    variation settings will be pre-selected for you.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              variant="outline"
              className="w-full h-11 border-green-500/50 text-green-400 hover:bg-green-500/10"
              onClick={handleSaveDefault}
              disabled={savingDefault || activeTemplateIds.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              {savingDefault ? "Saving..." : "Save Default"}
            </Button>
          </div>

          {/* Save as Custom Exercise */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-medium">Mix it up but do this often?</h4>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    This creates a new custom exercise with these variation settings
                    baked in. It will show up in your exercise list as a separate option.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {showCustomInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Custom exercise name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-11"
                  autoFocus
                />
                <Button
                  className="h-11 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                  onClick={handleSaveCustom}
                  disabled={savingCustom || !customName.trim()}
                >
                  {savingCustom ? "..." : "Save"}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-11 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                onClick={() => setShowCustomInput(true)}
              >
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Save as Custom Exercise
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
