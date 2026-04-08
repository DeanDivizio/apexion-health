"use client";

import * as React from "react";
import {
  Archive,
  Bookmark,
  Info,
  Pencil,
  Save,
  X,
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui_primitives/alert-dialog";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Separator } from "@/components/ui_primitives/separator";
import { Switch } from "@/components/ui_primitives/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui_primitives/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  saveExerciseDefaultsAction,
  createVariationPresetAction,
  renameCustomExerciseAction,
  archiveCustomExerciseAction,
} from "@/actions/gym";
import type { ExerciseDefinition, VariationTemplate } from "@/lib/gym";
import { VARIATION_TEMPLATE_MAP, VARIATION_TEMPLATES } from "@/lib/gym";

interface ExerciseSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: ExerciseDefinition | null;
  variations: Record<string, string>;
  onVariationsChange: (variations: Record<string, string>) => void;
  onExerciseArchived?: () => void;
  onExerciseRenamed?: (newName: string) => void;
  onPresetCreated?: (preset: { id: string; exerciseKey: string; name: string; variations: Record<string, string> }) => void;
}

export function ExerciseSettingsSheet({
  open,
  onOpenChange,
  exercise,
  variations,
  onVariationsChange,
  onExerciseArchived,
  onExerciseRenamed,
  onPresetCreated,
}: ExerciseSettingsSheetProps) {
  const HALF_WIDTH_CHAR_BUDGET = 14;
  const { toast } = useToast();
  const [savingDefault, setSavingDefault] = React.useState(false);

  // Preset save state
  const [showPresetInput, setShowPresetInput] = React.useState(false);
  const [presetName, setPresetName] = React.useState("");
  const [savingPreset, setSavingPreset] = React.useState(false);

  // Rename state (custom exercises only)
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const [renameSaving, setRenameSaving] = React.useState(false);

  // Archive state
  const [archiving, setArchiving] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setShowPresetInput(false);
      setPresetName("");
      setIsRenaming(false);
      setRenameValue("");
    }
  }, [open]);

  if (!exercise) return null;

  const adoptedTemplateIds = Object.keys(exercise.variationTemplates ?? {});
  const activeTemplateIds = [
    ...new Set([...adoptedTemplateIds, ...Object.keys(variations)]),
  ];

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

    const isDefault = adoptedTemplateIds.includes(templateId);
    return [{ templateId, template, override, label, shouldUseHalfWidth, isDefault }];
  });

  const nonDefaultTemplates = VARIATION_TEMPLATES.filter(
    (t) => !adoptedTemplateIds.includes(t.id),
  );
  const activeNonDefaultIds = new Set(
    activeTemplateIds.filter((id) => !adoptedTemplateIds.includes(id)),
  );

  const hasFullWidthSelector = selectorConfigs.some((s) => !s.shouldUseHalfWidth);
  const orderedSelectorConfigs = [
    ...selectorConfigs.filter((s) => s.shouldUseHalfWidth),
    ...selectorConfigs.filter((s) => !s.shouldUseHalfWidth),
  ];

  const handleVariationChange = (templateId: string, optionKey: string) => {
    onVariationsChange({ ...variations, [templateId]: optionKey });
  };

  const handleToggleDimension = (template: VariationTemplate, enabled: boolean) => {
    if (enabled) {
      const firstKey = template.options[0]?.key;
      if (firstKey) {
        onVariationsChange({ ...variations, [template.id]: firstKey });
      }
    } else {
      const next = { ...variations };
      delete next[template.id];
      onVariationsChange(next);
    }
  };

  const handleRemoveVariation = (templateId: string) => {
    const next = { ...variations };
    delete next[templateId];
    onVariationsChange(next);
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
      toast({ title: "Error", description: "Failed to save defaults.", variant: "destructive" });
    } finally {
      setSavingDefault(false);
    }
  };

  const handleSavePreset = async () => {
    if (!exercise || !presetName.trim()) return;
    setSavingPreset(true);
    try {
      const result = await createVariationPresetAction({
        exerciseKey: exercise.key,
        name: presetName.trim(),
        variations,
      });
      toast({
        title: "Preset saved",
        description: `"${exercise.name} · ${presetName.trim()}" will now appear in your exercise list.`,
      });
      setShowPresetInput(false);
      setPresetName("");
      onPresetCreated?.({
        id: result.id,
        exerciseKey: exercise.key,
        name: result.name,
        variations,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save preset.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSavingPreset(false);
    }
  };

  const handleRename = async () => {
    if (!exercise || !renameValue.trim()) return;
    setRenameSaving(true);
    try {
      await renameCustomExerciseAction(exercise.key, renameValue.trim());
      toast({
        title: "Exercise renamed",
        description: `Renamed to "${renameValue.trim()}"`,
      });
      setIsRenaming(false);
      onExerciseRenamed?.(renameValue.trim());
    } catch {
      toast({ title: "Error", description: "Failed to rename exercise.", variant: "destructive" });
    } finally {
      setRenameSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!exercise) return;
    setArchiving(true);
    try {
      await archiveCustomExerciseAction(exercise.key);
      toast({
        title: "Exercise archived",
        description: `"${exercise.name}" has been archived. It won't appear in your exercise list.`,
      });
      onOpenChange(false);
      onExerciseArchived?.();
    } catch {
      toast({ title: "Error", description: "Failed to archive exercise.", variant: "destructive" });
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-screen sm:max-w-md flex flex-col overflow-y-auto bg-gradient-to-br from-blue-800/10 to-emerald-950/20 backdrop-blur-sm">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg">Exercise Settings</SheetTitle>
          <SheetDescription>{exercise.name}</SheetDescription>
        </SheetHeader>

        {/* Variation Dimensions */}
        <Tabs defaultValue="active" className="flex-1">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="active" className="flex-1">
              Active
            </TabsTrigger>
            {nonDefaultTemplates.length > 0 && (
              <TabsTrigger value="manage" className="flex-1">
                Add / Remove
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab 1: Active variation selectors */}
          <TabsContent value="active">
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
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">{selector.label}</label>
                      {!selector.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariation(selector.templateId)}
                          className="rounded p-0.5 text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          aria-label={`Remove ${selector.label}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
          </TabsContent>

          {/* Tab 2: Toggle dimensions on/off */}
          {nonDefaultTemplates.length > 0 && (
            <TabsContent value="manage" className="space-y-0.5">
              <p className="text-xs text-muted-foreground/70 mb-2">
                Toggle additional dimensions. Built-in dimensions are always shown.
              </p>
              {nonDefaultTemplates.map((template) => {
                const isActive = activeNonDefaultIds.has(template.id);
                return (
                  <label
                    key={template.id}
                    className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) =>
                        handleToggleDimension(template, checked)
                      }
                      className="shrink-0 data-[state=checked]:bg-green-500 [&_span]:bg-gray-400 [&_span]:data-[state=checked]:bg-white"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm">{template.label}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </TabsContent>
          )}
        </Tabs>

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

          {/* Save as Preset */}
          {activeTemplateIds.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Save as a named preset</h4>
              <p className="text-xs text-muted-foreground/70">
                Create a quick-select variation that shows up in your exercise list.
              </p>
              {showPresetInput ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Incline Supinated"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    maxLength={60}
                    className="h-10 flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && presetName.trim()) handleSavePreset();
                      if (e.key === "Escape") setShowPresetInput(false);
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-10 shrink-0"
                    onClick={handleSavePreset}
                    disabled={savingPreset || !presetName.trim()}
                  >
                    {savingPreset ? "Saving..." : "Save"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-11 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  onClick={() => setShowPresetInput(true)}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Save as Preset
                </Button>
              )}
            </div>
          )}

          {/* Custom Exercise Management */}
          {exercise.isCustom && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Manage Custom Exercise</h4>

                {/* Rename */}
                {isRenaming ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      maxLength={100}
                      className="h-9 flex-1 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && renameValue.trim()) handleRename();
                        if (e.key === "Escape") setIsRenaming(false);
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={handleRename}
                      disabled={renameSaving || !renameValue.trim()}
                    >
                      {renameSaving ? "..." : "Save"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={() => setIsRenaming(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setRenameValue(exercise.name);
                      setIsRenaming(true);
                    }}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Rename exercise
                  </Button>
                )}

                {/* Archive */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Archive className="mr-2 h-3.5 w-3.5" />
                      Archive exercise
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive &ldquo;{exercise.name}&rdquo;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This exercise will be removed from your exercise list. Historical workout data will be preserved. You can unarchive it later.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleArchive}
                        disabled={archiving}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {archiving ? "Archiving..." : "Archive"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
