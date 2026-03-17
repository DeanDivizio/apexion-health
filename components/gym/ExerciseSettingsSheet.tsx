"use client";

import * as React from "react";
import { Info, Plus, Save } from "lucide-react";
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
import { Separator } from "@/components/ui_primitives/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui_primitives/dialog";
import { useToast } from "@/hooks/use-toast";
import { saveExerciseDefaultsAction } from "@/actions/gym";
import type { ExerciseDefinition, VariationTemplate } from "@/lib/gym";
import { VARIATION_TEMPLATE_MAP, VARIATION_TEMPLATES } from "@/lib/gym";

interface ExerciseSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: ExerciseDefinition | null;
  variations: Record<string, string>;
  onVariationsChange: (variations: Record<string, string>) => void;
}

export function ExerciseSettingsSheet({
  open,
  onOpenChange,
  exercise,
  variations,
  onVariationsChange,
}: ExerciseSettingsSheetProps) {
  const HALF_WIDTH_CHAR_BUDGET = 14;
  const { toast } = useToast();
  const [addVariationOpen, setAddVariationOpen] = React.useState(false);
  const [savingDefault, setSavingDefault] = React.useState(false);

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

  const selectorConfigs = activeTemplateIds.flatMap((templateId) => {
    const template = VARIATION_TEMPLATE_MAP.get(templateId);
    if (!template) return [];

    const override = exercise.variationTemplates?.[templateId];
    const label = override?.labelOverride ?? template.label;
    const longestOptionLabelLength = template.options.reduce((maxLength, option) => {
      const optionLabel = override?.optionLabelOverrides?.[option.key] ?? option.label;
      return Math.max(maxLength, optionLabel.length);
    }, 0);

    const shouldUseHalfWidth =
      label.length <= HALF_WIDTH_CHAR_BUDGET &&
      longestOptionLabelLength <= HALF_WIDTH_CHAR_BUDGET;

    return [
      {
        templateId,
        template,
        override,
        label,
        shouldUseHalfWidth,
      },
    ];
  });

  const hasFullWidthSelector = selectorConfigs.some(
    (selector) => !selector.shouldUseHalfWidth,
  );
  const orderedSelectorConfigs = [
    ...selectorConfigs.filter((selector) => selector.shouldUseHalfWidth),
    ...selectorConfigs.filter((selector) => !selector.shouldUseHalfWidth),
  ];

  const handleVariationChange = (templateId: string, optionKey: string) => {
    onVariationsChange({ ...variations, [templateId]: optionKey });
  };

  const handleAdoptVariation = (template: VariationTemplate) => {
    // Adopt with the first option as default
    const firstKey = template.options[0]?.key;
    if (firstKey) {
      onVariationsChange({ ...variations, [template.id]: firstKey });
    }
    setAddVariationOpen(false);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-screen sm:max-w-md flex flex-col overflow-y-auto bg-gradient-to-br from-blue-800/10 to-emerald-950/20 backdrop-blur-sm">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Exercise Settings</SheetTitle>
          <SheetDescription>{exercise.name}</SheetDescription>
        </SheetHeader>

        {/* Variation Selectors */}
        <div className="flex-1 ">
          {activeTemplateIds.length === 0 && (
            <p className="text-sm text-muted-foreground/60 italic py-4">
              No variations configured for this exercise.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {orderedSelectorConfigs.map((selector, index) => {
              const forceFullWidth = !hasFullWidthSelector && index === 0;
              const spanClass =
                selector.shouldUseHalfWidth && !forceFullWidth
                  ? "col-span-1"
                  : "col-span-2";

              return (
                <div key={selector.templateId} className={`${spanClass} space-y-1.5`}>
                  <label className="text-xs text-muted-foreground">{selector.label}</label>
                  <Select
                    value={
                      variations[selector.templateId] ??
                      selector.override?.defaultOptionKey ??
                      selector.template.options[0]?.key
                    }
                    onValueChange={(val) =>
                      handleVariationChange(selector.templateId, val)
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selector.template.options.map((opt) => {
                        const optLabel =
                          selector.override?.optionLabelOverrides?.[opt.key] ?? opt.label;
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
          </div>

          {/* Adopt new variation */}
          <div className="mt-8 space-y-2">
            <Dialog open={addVariationOpen} onOpenChange={setAddVariationOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  role="combobox"
                  aria-expanded={addVariationOpen}
                  disabled={availableTemplates.length === 0}
                  className="w-full justify-center text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add variation dimension
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[98vw] max-w-[98vw] sm:max-w-[98vw] rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-emerald-500/5 to-transparent backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-1">
                  <DialogTitle className="text-base">Add variation dimension</DialogTitle>
                  <DialogDescription>
                    Select a variation to add to this exercise.
                  </DialogDescription>
                </DialogHeader>
                <div className="border-t">
                  <div className="max-h-64 overflow-y-auto overscroll-contain p-2">
                    {availableTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleAdoptVariation(template)}
                        className="w-full rounded-sm px-2 py-2 text-left hover:bg-accent transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{template.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        </div>
                      </button>
                    ))}
                    {availableTemplates.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No variation available.
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {availableTemplates.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                All available variations are already active.
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Save Section */}
        <div className="space-y-6 py-4 pb-6">
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

        </div>
      </SheetContent>
    </Sheet>
  );
}
