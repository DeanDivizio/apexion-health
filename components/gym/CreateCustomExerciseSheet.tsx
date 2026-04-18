"use client";

import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui_primitives/sheet";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import { Checkbox } from "@/components/ui_primitives/checkbox";
import { Textarea } from "@/components/ui_primitives/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import { cn } from "@/lib/utils";
import { captureClientEvent } from "@/lib/posthog-client";
import {
  CATEGORY_DISPLAY_NAMES,
  VARIATION_TEMPLATE_MAP,
  VARIATION_TEMPLATES,
  type ExerciseCategory,
  type CreateCustomExerciseInput,
} from "@/lib/gym";
import {
  getPresetsForCategory,
  getPreset,
  type MovementPreset,
} from "@/lib/gym/presets";
import { AdvancedTargetEditor } from "./AdvancedTargetEditor";
import { DimensionAddPicker } from "./DimensionAddPicker";
import {
  DimensionLabelWithTooltip,
  VariationOptionSelect,
} from "./variationEditorControls";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "basics" | "variations" | "review";

interface VariationRow {
  templateId: string;
  defaultOptionKey: string;
}

interface CreateCustomExerciseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSearchQuery?: string;
  onSubmit: (input: CreateCustomExerciseInput) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CREATION_CATEGORIES: ExerciseCategory[] = [
  "upperBody",
  "lowerBody",
  "core",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateCustomExerciseSheet({
  open,
  onOpenChange,
  initialSearchQuery = "",
  onSubmit,
}: CreateCustomExerciseSheetProps) {
  const [step, setStep] = useState<Step>("basics");
  const [submitting, setSubmitting] = useState(false);

  // Step 1 - Basics
  const [name, setName] = useState(initialSearchQuery);
  const [category, setCategory] = useState<ExerciseCategory | "">("");
  const [selectedPresetId, setSelectedPresetId] = useState("");

  // Step 2 - Variations
  const [variations, setVariations] = useState<VariationRow[]>([]);

  // Step 3 - Review
  const [requestCanonicalization, setRequestCanonicalization] = useState(false);
  const [canonNote, setCanonNote] = useState("");

  // Advanced target editing
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customTargets, setCustomTargets] = useState<Array<{ muscle: string; weight: number }> | null>(null);

  // Derived
  const selectedPreset = useMemo(
    () => (selectedPresetId ? getPreset(selectedPresetId) : undefined),
    [selectedPresetId],
  );

  const presetsForCategory = useMemo(
    () => (category ? getPresetsForCategory(category as ExerciseCategory) : []),
    [category],
  );

  // Reset form when sheet opens/closes
  React.useEffect(() => {
    if (open) {
      setStep("basics");
      setRequestCanonicalization(false);
      setCanonNote("");
      setSubmitting(false);
      setAdvancedMode(false);
      setCustomTargets(null);
      setName(initialSearchQuery);
      setCategory("");
      setSelectedPresetId("");
      setVariations([]);
      captureClientEvent("gym_custom_exercise_create_started", {
        source_surface: "search_empty_state",
      });
    }
  }, [open, initialSearchQuery]);

  // When preset changes, reset variations to preset defaults
  const handlePresetChange = useCallback(
    (presetId: string) => {
      setSelectedPresetId(presetId);
      setCustomTargets(null);
      setAdvancedMode(false);
      const preset = getPreset(presetId);
      if (preset) {
        setVariations(
          preset.defaultVariationSupports.map((s) => ({
            templateId: s.templateId,
            defaultOptionKey: s.defaultOptionKey,
          })),
        );
      }
    },
    [],
  );

  // Variation management
  const removeVariation = useCallback((templateId: string) => {
    setVariations((prev) => prev.filter((v) => v.templateId !== templateId));
  }, []);

  const addVariation = useCallback((templateId: string) => {
    const template = VARIATION_TEMPLATE_MAP.get(templateId);
    if (!template) return;
    setVariations((prev) => [
      ...prev,
      {
        templateId,
        defaultOptionKey: template.options[0]?.key ?? "",
      },
    ]);
  }, []);

  const updateVariationDefault = useCallback(
    (templateId: string, optionKey: string) => {
      setVariations((prev) =>
        prev.map((v) =>
          v.templateId === templateId
            ? { ...v, defaultOptionKey: optionKey }
            : v,
        ),
      );
    },
    [],
  );

  const adoptedTemplateIds = useMemo(
    () => new Set(variations.map((v) => v.templateId)),
    [variations],
  );

  const availableTemplates = useMemo(
    () => VARIATION_TEMPLATES.filter((t) => !adoptedTemplateIds.has(t.id)),
    [adoptedTemplateIds],
  );

  // Step validation
  const canProceedFromBasics =
    name.trim().length > 0 && category !== "" && selectedPresetId !== "";

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!selectedPreset || !category) return;

    setSubmitting(true);
    captureClientEvent("gym_custom_exercise_create_submitted", {
      category,
      preset_id: selectedPresetId,
      variation_template_count: variations.length,
      requested_canonicalization: requestCanonicalization,
      used_advanced_mode: customTargets !== null,
      source_surface: "search_empty_state",
    });

    const effectiveTargets = customTargets ?? selectedPreset.baseTargets.map((t) => ({
      muscle: t.muscle,
      weight: t.weight,
    }));

    try {
      await onSubmit({
        name: name.trim(),
        category: category as CreateCustomExerciseInput["category"],
        repMode: selectedPreset.repMode,
        presetId: selectedPreset.id,
        movementPattern: selectedPreset.movementPattern,
        bodyRegion: selectedPreset.bodyRegion,
        movementPlane: selectedPreset.movementPlane,
        targets: effectiveTargets as CreateCustomExerciseInput["targets"],
        variationSupports: variations.map((v) => ({
          templateId: v.templateId,
          defaultOptionKey: v.defaultOptionKey,
        })),
        optionLabelOverrides: [],
        variationEffects: [],
        requestCanonicalization,
        canonicalizationNote: requestCanonicalization
          ? canonNote.trim() || undefined
          : undefined,
      });
      onOpenChange(false);
    } catch {
      setSubmitting(false);
    }
  }, [
    selectedPreset,
    category,
    selectedPresetId,
    variations,
    requestCanonicalization,
    canonNote,
    name,
    onSubmit,
    onOpenChange,
  ]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderStepIndicator = () => {
    const steps: { key: Step; label: string }[] = [
      { key: "basics", label: "Basics" },
      { key: "variations", label: "Variations" },
      { key: "review", label: "Review" },
    ];
    const currentIdx = steps.findIndex((s) => s.key === step);

    return (
      <div className="flex items-center gap-2 px-1 pb-4">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium transition-colors",
                i <= currentIdx
                  ? "text-blue-400"
                  : "text-muted-foreground/50",
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors",
                  i < currentIdx
                    ? "bg-blue-500 border-blue-500 text-white"
                    : i === currentIdx
                      ? "border-blue-400 text-blue-400"
                      : "border-muted-foreground/30 text-muted-foreground/50",
                )}
              >
                {i + 1}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px transition-colors",
                  i < currentIdx ? "bg-blue-500" : "bg-border",
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderBasicsStep = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="exercise-name">Exercise Name</Label>
        <Input
          id="exercise-name"
          placeholder="e.g. Reverse Pec Deck"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={category}
          onValueChange={(val) => {
            setCategory(val as ExerciseCategory);
            setSelectedPresetId("");
            setVariations([]);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CREATION_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_DISPLAY_NAMES[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category && (
        <div className="space-y-2">
          <Label>Movement Type</Label>
          <Select
            value={selectedPresetId}
            onValueChange={handlePresetChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select movement type" />
            </SelectTrigger>
            <SelectContent>
              {presetsForCategory.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPreset && (
            <p className="text-xs text-muted-foreground pl-1">
              {selectedPreset.description}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderVariationsStep = () => (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Customize which variation dimensions to track for this exercise. Remove
        any you don&apos;t need, or add new ones.
      </p>

      <div className="overflow-y-auto max-h-[40vh] pr-1">
        <div className="space-y-3">
          {variations.map((v) => {
            const template = VARIATION_TEMPLATE_MAP.get(v.templateId);
            if (!template) return null;
            return (
              <div
                key={v.templateId}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <DimensionLabelWithTooltip
                    label={template.label}
                    description={template.description}
                  />
                  <VariationOptionSelect
                    template={template}
                    value={v.defaultOptionKey}
                    onChange={(val) =>
                      updateVariationDefault(v.templateId, val)
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeVariation(v.templateId)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {availableTemplates.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Add dimension
          </Label>
          <DimensionAddPicker
            availableTemplates={availableTemplates}
            onAdd={addVariation}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground/70 pt-2">
        Variation effects (how options shift muscle targets) are not supported
        for custom exercises yet. You can request canonicalization to have us add
        research-backed effects.
      </p>
    </div>
  );

  const activeTargets = useMemo(() => {
    if (customTargets) return customTargets;
    if (selectedPreset) return selectedPreset.baseTargets.map((t) => ({ muscle: t.muscle, weight: t.weight }));
    return [];
  }, [customTargets, selectedPreset]);

  const handleToggleAdvanced = useCallback(() => {
    const next = !advancedMode;
    setAdvancedMode(next);
    captureClientEvent("gym_custom_exercise_advanced_mode_toggled", {
      opened: next,
      preset_id: selectedPresetId,
    });
    if (next && !customTargets && selectedPreset) {
      setCustomTargets(
        selectedPreset.baseTargets.map((t) => ({ muscle: t.muscle, weight: t.weight })),
      );
    }
  }, [advancedMode, customTargets, selectedPreset, selectedPresetId]);

  const renderReviewStep = () => {
    if (!selectedPreset) return null;

    const displayTargets = activeTargets;
    const targetDisplay = [...displayTargets]
      .sort((a, b) => b.weight - a.weight)
      .map((t) => ({
        muscle: t.muscle
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase()),
        pct: Math.round(t.weight * 100),
      }));

    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{name.trim()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">
                {CATEGORY_DISPLAY_NAMES[category as ExerciseCategory]}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Movement</span>
              <span className="font-medium">{selectedPreset.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rep Mode</span>
              <span className="font-medium capitalize">
                {selectedPreset.repMode === "dualUnilateral"
                  ? "Unilateral (L/R)"
                  : "Bilateral"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Muscle Targets
            </p>
            <div className="space-y-1.5">
              {targetDisplay.map((t) => (
                <div key={t.muscle} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right truncate">
                    {t.muscle}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                    {t.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleToggleAdvanced}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              <SlidersHorizontal className="h-3 w-3" />
              {advancedMode ? "Hide target editor" : "Edit muscle targets"}
            </button>

            {advancedMode && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <AdvancedTargetEditor
                  targets={activeTargets as Array<{ muscle: import("@/lib/gym").MuscleGroup; weight: number }>}
                  presetTargets={selectedPreset.baseTargets}
                  bodyRegion={selectedPreset.bodyRegion}
                  onChange={(newTargets) => setCustomTargets(newTargets.map((t) => ({ muscle: t.muscle, weight: t.weight })))}
                />
              </div>
            )}
          </div>

          {variations.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Variation Dimensions ({variations.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {variations.map((v) => {
                  const tpl = VARIATION_TEMPLATE_MAP.get(v.templateId);
                  return (
                    <span
                      key={v.templateId}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tpl?.label ?? v.templateId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="canon-request"
              checked={requestCanonicalization}
              onCheckedChange={(checked) =>
                setRequestCanonicalization(checked === true)
              }
            />
            <label
              htmlFor="canon-request"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Request canonicalization
            </label>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Submit this exercise for review. We&apos;ll research EMG studies to
            set accurate muscle targets and variation effects, then add it to
            the built-in exercise library.
          </p>
          {requestCanonicalization && (
            <div className="space-y-1.5">
              <Label htmlFor="canon-note" className="text-xs">
                Note (optional)
              </Label>
              <Textarea
                id="canon-note"
                placeholder="Describe the exercise or link a video..."
                value={canonNote}
                onChange={(e) => setCanonNote(e.target.value)}
                maxLength={500}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const goNext = () => {
    if (step === "basics") setStep("variations");
    else if (step === "variations") setStep("review");
  };

  const goBack = () => {
    if (step === "review") setStep("variations");
    else if (step === "variations") setStep("basics");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[85vh] flex flex-col rounded-t-xl"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Create Custom Exercise
          </SheetTitle>
        </SheetHeader>

        {renderStepIndicator()}

        <ScrollArea className="flex-1 -mx-6 px-6">
          {step === "basics" && renderBasicsStep()}
          {step === "variations" && renderVariationsStep()}
          {step === "review" && renderReviewStep()}
        </ScrollArea>

        <div className="flex items-center gap-2 pt-4 shrink-0 border-t border-border/40">
          {step !== "basics" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={submitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}
          <div className="flex-1" />
          {step !== "review" ? (
            <Button
              size="sm"
              onClick={goNext}
              disabled={step === "basics" && !canProceedFromBasics}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !canProceedFromBasics}
              className="bg-white text-black hover:bg-zinc-200"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1.5" />
              )}
              Create Exercise
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
