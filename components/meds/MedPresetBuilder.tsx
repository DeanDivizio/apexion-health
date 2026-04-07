"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui_primitives/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui_primitives/sheet";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import { Input } from "@/components/ui_primitives/input";
import { Button } from "@/components/ui_primitives/button";
import { Label } from "@/components/ui_primitives/label";
import { cn } from "@/lib/utils";
import { SubstanceCombobox } from "./SubstanceCombobox";
import { SubstanceLogger } from "./SubstanceLogger";
import {
  createMedicationPresetAction,
  updateMedicationPresetAction,
} from "@/actions/medication";
import { useToast } from "@/hooks/use-toast";
import type {
  MedicationDraftItem,
  MedicationPresetView,
  SubstanceCatalogItemView,
  SubstanceLogValues,
} from "@/lib/medication";

const AccordionTriggerCompact = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center gap-1.5 text-left transition-all [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200" />
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTriggerCompact.displayName = "AccordionTriggerCompact";

function emptyLogValues(
  substance?: SubstanceCatalogItemView | null,
): SubstanceLogValues {
  return {
    doseValue: null,
    doseUnit: substance?.defaultDoseUnit ?? "mg",
    compoundServings: null,
    deliveryMethodId:
      substance?.methods.length === 1 ? substance.methods[0].id : null,
    variantId: null,
    injectionDepth: null,
  };
}

function toLogValues(
  item: MedicationDraftItem,
  substance: SubstanceCatalogItemView | null,
): SubstanceLogValues {
  return {
    doseValue: item.doseValue,
    doseUnit: item.doseUnit ?? substance?.defaultDoseUnit ?? "mg",
    compoundServings: item.compoundServings,
    deliveryMethodId: item.deliveryMethodId,
    variantId: item.variantId,
    injectionDepth: item.injectionDepth,
  };
}

function applyValues(
  source: MedicationDraftItem,
  substance: SubstanceCatalogItemView,
  values: SubstanceLogValues,
): MedicationDraftItem {
  if (substance.isCompound) {
    return {
      ...source,
      doseValue: null,
      doseUnit: null,
      compoundServings: values.compoundServings,
      deliveryMethodId: values.deliveryMethodId,
      variantId: values.variantId,
      injectionDepth: values.injectionDepth,
    };
  }
  return {
    ...source,
    doseValue: values.doseValue,
    doseUnit: values.doseUnit,
    compoundServings: null,
    deliveryMethodId: values.deliveryMethodId,
    variantId: values.variantId,
    injectionDepth: values.injectionDepth,
  };
}

function summarizeDose(item: MedicationDraftItem): string {
  if (item.doseValue != null) {
    return `${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ""}`;
  }
  if (item.compoundServings != null) {
    return `${item.compoundServings} serving${item.compoundServings === 1 ? "" : "s"}`;
  }
  return "No dose set";
}

interface MedPresetBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPreset?: MedicationPresetView | null;
  onSaved: (preset: MedicationPresetView) => void;
  substances: SubstanceCatalogItemView[];
  onCreateNewSubstance: () => void;
}

export function MedPresetBuilder({
  open,
  onOpenChange,
  editingPreset,
  onSaved,
  substances,
  onCreateNewSubstance,
}: MedPresetBuilderProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [items, setItems] = React.useState<MedicationDraftItem[]>([]);
  const [addingSubstanceId, setAddingSubstanceId] = React.useState("");
  const [addingValues, setAddingValues] = React.useState<SubstanceLogValues>(
    emptyLogValues(),
  );
  const [submitting, setSubmitting] = React.useState(false);

  const substancesById = React.useMemo(
    () => new Map(substances.map((s) => [s.id, s])),
    [substances],
  );

  React.useEffect(() => {
    if (!open) return;
    if (editingPreset) {
      setName(editingPreset.name);
      setItems(editingPreset.items.map((item) => ({ ...item })));
    } else {
      setName("");
      setItems([]);
    }
    setAddingSubstanceId("");
    setAddingValues(emptyLogValues());
  }, [open, editingPreset]);

  function handleAddItem() {
    if (!addingSubstanceId) return;
    const substance = substancesById.get(addingSubstanceId);
    if (!substance) return;

    const draft: MedicationDraftItem = applyValues(
      {
        substanceId: substance.id,
        snapshotName: substance.displayName,
        doseValue: null,
        doseUnit: null,
        compoundServings: null,
        deliveryMethodId: null,
        variantId: null,
        injectionDepth: null,
      },
      substance,
      addingValues,
    );

    if (substance.isCompound) {
      if (!draft.compoundServings || draft.compoundServings <= 0) {
        toast({
          title: "Invalid",
          description: `${substance.displayName} needs a serving count above 0.`,
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!draft.doseValue || draft.doseValue <= 0) {
        toast({
          title: "Invalid",
          description: `${substance.displayName} needs a dose above 0.`,
          variant: "destructive",
        });
        return;
      }
    }

    setItems((prev) => [...prev, draft]);
    setAddingSubstanceId("");
    setAddingValues(emptyLogValues());
    toast({ title: `${substance.displayName} added` });
  }

  async function handleSave() {
    if (!name.trim() || items.length === 0) return;
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), items };
      let result: MedicationPresetView;
      if (editingPreset) {
        result = await updateMedicationPresetAction(editingPreset.id, payload);
        toast({ title: "Preset updated" });
      } else {
        result = await createMedicationPresetAction(payload);
        toast({ title: "Preset created" });
      }
      onSaved(result);
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to save preset.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const addingSubstance = addingSubstanceId
    ? substancesById.get(addingSubstanceId) ?? null
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle>
            {editingPreset ? "Edit Preset" : "Create Preset"}
          </SheetTitle>
          <SheetDescription>
            {editingPreset
              ? "Update your preset name or items."
              : "Name your preset and add substances to it."}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            <div className="space-y-1">
              <Label>Preset Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. "Morning Stack"'
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label>Add Substance</Label>
              <SubstanceCombobox
                substances={substances}
                value={addingSubstanceId}
                onSelect={(id) => {
                  setAddingSubstanceId(id);
                  const sub = substancesById.get(id) ?? null;
                  setAddingValues(emptyLogValues(sub));
                }}
                onCreateNew={onCreateNewSubstance}
                placeholder="Select a substance..."
              />
              {addingSubstance && (
                <div className="space-y-3 pt-1">
                  <SubstanceLogger
                    substance={addingSubstance}
                    values={addingValues}
                    onChange={(partial) =>
                      setAddingValues((prev) => ({ ...prev, ...partial }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => {
                        setAddingSubstanceId("");
                        setAddingValues(emptyLogValues());
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleAddItem}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add item
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-1">
                <Label>Items ({items.length})</Label>
                <Accordion type="single" collapsible className="space-y-1">
                  {items.map((item, idx) => {
                    const substance =
                      substancesById.get(item.substanceId) ?? null;
                    return (
                      <AccordionItem
                        key={`${item.substanceId}-${idx}`}
                        value={`item-${idx}`}
                        className="rounded-lg border border-border/40 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-3 py-2">
                          <AccordionTriggerCompact className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-medium truncate">
                                {item.snapshotName}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {summarizeDose(item)}
                              </span>
                            </div>
                          </AccordionTriggerCompact>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() =>
                              setItems((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                        <AccordionContent className="px-3 pb-3 pt-0">
                          {substance ? (
                            <SubstanceLogger
                              substance={substance}
                              values={toLogValues(item, substance)}
                              onChange={(partial) =>
                                setItems((prev) => {
                                  const next = [...prev];
                                  const current = next[idx];
                                  next[idx] = applyValues(
                                    current,
                                    substance,
                                    {
                                      ...toLogValues(current, substance),
                                      ...partial,
                                    },
                                  );
                                  return next;
                                })
                              }
                            />
                          ) : (
                            <p className="text-sm text-yellow-500">
                              Substance no longer in catalog. Remove to save.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 px-4 py-4 border-t border-border/40">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={submitting || !name.trim() || items.length === 0 || !!addingSubstanceId}
          >
            {submitting
              ? "Saving..."
              : editingPreset
                ? "Save Changes"
                : "Create Preset"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
