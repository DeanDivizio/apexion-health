"use client"

import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui_primitives/sheet"
import { Button } from "@/components/ui_primitives/button"
import { Input } from "@/components/ui_primitives/input"
import { Label } from "@/components/ui_primitives/label"
import { ScrollArea } from "@/components/ui_primitives/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { updateCustomExerciseAction } from "@/actions/gym"
import {
  CATEGORY_DISPLAY_NAMES,
  VARIATION_TEMPLATE_MAP,
  VARIATION_TEMPLATES,
  type CustomExerciseDefinition,
  type MuscleGroup,
  type MuscleTarget,
  type VariationTemplateOverride,
} from "@/lib/gym"
import { getPreset } from "@/lib/gym/presets"
import { AdvancedTargetEditor } from "@/components/gym/AdvancedTargetEditor"
import { DimensionAddPicker } from "@/components/gym/DimensionAddPicker"
import {
  DimensionLabelWithTooltip,
  VariationOptionSelect,
} from "@/components/gym/variationEditorControls"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariationRow {
  templateId: string
  defaultOptionKey: string
}

interface EditCustomExerciseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: CustomExerciseDefinition | null
  onSaved: (updated: CustomExerciseDefinition) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seedVariationsFromDef(
  def: CustomExerciseDefinition | null,
): VariationRow[] {
  if (!def?.variationTemplates) return []
  return Object.values(def.variationTemplates).map((v) => {
    const template = VARIATION_TEMPLATE_MAP.get(v.templateId)
    return {
      templateId: v.templateId,
      defaultOptionKey:
        v.defaultOptionKey ?? template?.options[0]?.key ?? "",
    }
  })
}

/**
 * Reconstructs the VariationTemplateOverride map from editor rows while
 * preserving any labelOverride / optionLabelOverrides from the original
 * definition (the editor doesn't mutate those).
 */
function buildVariationTemplatesFromRows(
  rows: VariationRow[],
  original?: Record<string, VariationTemplateOverride>,
): Record<string, VariationTemplateOverride> | undefined {
  if (rows.length === 0) return undefined
  const result: Record<string, VariationTemplateOverride> = {}
  for (const row of rows) {
    const prior = original?.[row.templateId]
    result[row.templateId] = {
      templateId: row.templateId,
      labelOverride: prior?.labelOverride,
      defaultOptionKey: row.defaultOptionKey || undefined,
      optionLabelOverrides: prior?.optionLabelOverrides,
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditCustomExerciseSheet({
  open,
  onOpenChange,
  exercise,
  onSaved,
}: EditCustomExerciseSheetProps) {
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [targets, setTargets] = useState<MuscleTarget[]>([])
  const [variations, setVariations] = useState<VariationRow[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !exercise) return
    setName(exercise.name)
    setTargets(
      exercise.baseTargets.map((t) => ({ muscle: t.muscle, weight: t.weight })),
    )
    setVariations(seedVariationsFromDef(exercise))
    setSaving(false)
  }, [open, exercise])

  const presetTargets = useMemo(() => {
    if (!exercise?.presetId) return undefined
    const preset = getPreset(exercise.presetId)
    return preset?.baseTargets.map((t) => ({ muscle: t.muscle, weight: t.weight }))
  }, [exercise?.presetId])

  const addVariation = useCallback((templateId: string) => {
    const template = VARIATION_TEMPLATE_MAP.get(templateId)
    if (!template) return
    setVariations((prev) => [
      ...prev,
      {
        templateId,
        defaultOptionKey: template.options[0]?.key ?? "",
      },
    ])
  }, [])

  const removeVariation = useCallback((templateId: string) => {
    setVariations((prev) => prev.filter((v) => v.templateId !== templateId))
  }, [])

  const updateVariationDefault = useCallback(
    (templateId: string, optionKey: string) => {
      setVariations((prev) =>
        prev.map((v) =>
          v.templateId === templateId
            ? { ...v, defaultOptionKey: optionKey }
            : v,
        ),
      )
    },
    [],
  )

  const adoptedTemplateIds = useMemo(
    () => new Set(variations.map((v) => v.templateId)),
    [variations],
  )

  const availableTemplates = useMemo(
    () => VARIATION_TEMPLATES.filter((t) => !adoptedTemplateIds.has(t.id)),
    [adoptedTemplateIds],
  )

  const handleSave = useCallback(async () => {
    if (!exercise) return

    const trimmed = name.trim()
    if (!trimmed) {
      toast({
        title: "Name required",
        description: "Enter a name for this exercise.",
        variant: "destructive",
      })
      return
    }

    const sum = targets.reduce((s, t) => s + t.weight, 0)
    if (targets.length === 0 || Math.abs(sum - 1) > 1e-6) {
      toast({
        title: "Targets must sum to 100%",
        description: `Current total: ${(sum * 100).toFixed(0)}%`,
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      await updateCustomExerciseAction({
        exerciseKey: exercise.key,
        name: trimmed !== exercise.name ? trimmed : undefined,
        targets,
        variationSupports: variations.map((v) => ({
          templateId: v.templateId,
          defaultOptionKey: v.defaultOptionKey || undefined,
        })),
      })

      onSaved({
        ...exercise,
        name: trimmed,
        baseTargets: targets.map((t) => ({
          muscle: t.muscle as MuscleGroup,
          weight: t.weight,
        })) as CustomExerciseDefinition["baseTargets"],
        variationTemplates: buildVariationTemplatesFromRows(
          variations,
          exercise.variationTemplates,
        ),
      })
      onOpenChange(false)
      toast({ title: "Exercise updated" })
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save changes.",
        variant: "destructive",
      })
      setSaving(false)
    }
  }, [exercise, name, targets, variations, onSaved, onOpenChange, toast])

  if (!exercise) return null

  const repModeLabel =
    exercise.repMode === "dualUnilateral" ? "Unilateral (L/R)" : "Bilateral"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[85vh] flex flex-col rounded-t-xl"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-blue-400" />
            Edit Custom Exercise
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-exercise-name">Name</Label>
              <Input
                id="edit-exercise-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="flex gap-2 text-xs">
              <div className="flex-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Category</p>
                <p className="font-medium">
                  {CATEGORY_DISPLAY_NAMES[exercise.category]}
                </p>
              </div>
              <div className="flex-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground">Rep Mode</p>
                <p className="font-medium">{repModeLabel}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Muscle Targets</Label>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <AdvancedTargetEditor
                  targets={targets}
                  presetTargets={presetTargets}
                  bodyRegion={exercise.bodyRegion}
                  onChange={(next) =>
                    setTargets(
                      next.map((t) => ({ muscle: t.muscle, weight: t.weight })),
                    )
                  }
                />
              </div>
            </div>

            {/* TODO: consider extracting this variation-dimensions editor into a
                shared component reused by CreateCustomExerciseSheet. */}
            <div className="space-y-3">
              <Label>Variation Dimensions</Label>
              <p className="text-xs text-muted-foreground">
                Which variation dimensions to track for this exercise.
              </p>

              <div className="space-y-3">
                {variations.map((v) => {
                  const template = VARIATION_TEMPLATE_MAP.get(v.templateId)
                  if (!template) return null
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
                  )
                })}
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
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 pt-4 shrink-0 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
