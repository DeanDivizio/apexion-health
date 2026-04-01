"use client";

import * as React from "react";
import { useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Textarea } from "@/components/ui_primitives/textarea";
import { Label } from "@/components/ui_primitives/label";
import { Checkbox } from "@/components/ui_primitives/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui_primitives/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { AddSubstance } from "./AddSubstance";
import { SubstanceLogger } from "./SubstanceLogger";
import { MedicationOverviewSheet } from "./MedicationOverviewSheet";
import {
  createMedicationLogSessionAction,
  createMedicationPresetAction,
  createSubstanceAction,
} from "@/actions/medication";
import type {
  MedicationBootstrap,
  MedicationDraftItem,
  MedicationPresetView,
  SubstanceCatalogItemView,
  SubstanceLogValues,
} from "@/lib/medication";
import { captureClientEvent } from "@/lib/posthog-client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nowTimeInputValue(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function combineDateAndTime(date: Date, time: string): string {
  const [h, m] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return next.toISOString();
}

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

const DOSE_UNITS = ["mg", "mcg", "g", "IU", "ml"] as const;

// ─── Persistence ─────────────────────────────────────────────────────────────

interface PersistedMedicationState {
  version: number;
  selectedSubstanceId: string | null;
  logValues: SubstanceLogValues;
  stagedItems: MedicationDraftItem[];
  sessionDateIso: string;
  sessionTime: string;
  useManualTimestamp: boolean;
}

const STORAGE_KEY = "apexion-medication-session";
const STORAGE_VERSION = 1;

function loadPersistedState(): PersistedMedicationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed as PersistedMedicationState;
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedMedicationState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function clearPersistedState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Component ───────────────────────────────────────────────────────────────

interface MedicationFlowProps {
  bootstrap: MedicationBootstrap;
}

export function MedicationFlow({ bootstrap }: MedicationFlowProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setHeaderInnerRight } = useContext(MobileHeaderContext);

  // ── State ────────────────────────────────────────────────────────────
  const [substances, setSubstances] = React.useState(bootstrap.substances);
  const [presets, setPresets] = React.useState(bootstrap.presets);
  const [selectedSubstanceId, setSelectedSubstanceId] = React.useState<
    string | null
  >(null);
  const [logValues, setLogValues] = React.useState<SubstanceLogValues>(
    emptyLogValues(),
  );
  const [stagedItems, setStagedItems] = React.useState<MedicationDraftItem[]>(
    [],
  );
  const [sessionDate, setSessionDate] = React.useState<Date>(new Date());
  const [sessionTime, setSessionTime] = React.useState(nowTimeInputValue());
  const [useManualTimestamp, setUseManualTimestamp] = React.useState(false);
  const [overviewOpen, setOverviewOpen] = React.useState(false);
  const [selectedPresetId, setSelectedPresetId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newIsCompound, setNewIsCompound] = React.useState(false);
  const [newDoseUnit, setNewDoseUnit] = React.useState("mg");
  const [newBrand, setNewBrand] = React.useState("");
  const [newNotes, setNewNotes] = React.useState("");
  const [newMethodIds, setNewMethodIds] = React.useState<string[]>(() => {
    const oral = bootstrap.deliveryMethods.find((m) => m.key === "oral");
    return oral ? [oral.id] : [];
  });
  const [newIngredients, setNewIngredients] = React.useState<
    Array<{ name: string; amountPerServing: string; unit: string }>
  >([]);

  // Preset dialog state
  const [presetNameDialogOpen, setPresetNameDialogOpen] =
    React.useState(false);
  const [presetNameValue, setPresetNameValue] = React.useState("");
  const [confirmPresetApplyOpen, setConfirmPresetApplyOpen] =
    React.useState(false);

  const activeSubstance = useMemo(() => {
    if (!selectedSubstanceId) return null;
    return substances.find((s) => s.id === selectedSubstanceId) ?? null;
  }, [selectedSubstanceId, substances]);

  const logDialogOpen = activeSubstance !== null;

  // ── Persistence ──────────────────────────────────────────────────────
  const hasRestored = React.useRef(false);
  React.useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    const saved = loadPersistedState();
    if (!saved) return;
    setSelectedSubstanceId(saved.selectedSubstanceId);
    setLogValues(saved.logValues);
    setStagedItems(saved.stagedItems);
    setSessionDate(new Date(saved.sessionDateIso));
    setSessionTime(saved.sessionTime);
    setUseManualTimestamp(saved.useManualTimestamp === true);
  }, []);

  React.useEffect(() => {
    savePersistedState({
      version: STORAGE_VERSION,
      selectedSubstanceId,
      logValues,
      stagedItems,
      sessionDateIso: sessionDate.toISOString(),
      sessionTime,
      useManualTimestamp,
    });
  }, [
    selectedSubstanceId,
    logValues,
    stagedItems,
    sessionDate,
    sessionTime,
    useManualTimestamp,
  ]);

  // ── Header ───────────────────────────────────────────────────────────
  const overviewButton = useMemo(
    () => (
      <button
        onClick={() => setOverviewOpen(true)}
        className="relative p-2 hover:bg-accent rounded-md transition-colors"
        aria-label="Medication overview"
      >
        <ClipboardList className="h-5 w-5 text-muted-foreground" />
        {stagedItems.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 text-[10px] text-white flex items-center justify-center font-medium">
            {stagedItems.length}
          </span>
        )}
      </button>
    ),
    [stagedItems.length],
  );

  React.useEffect(() => {
    setHeaderInnerRight(overviewButton);
    return () => {
      setHeaderInnerRight(null);
    };
  }, [overviewButton, setHeaderInnerRight]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const resetActiveEntry = React.useCallback(() => {
    setSelectedSubstanceId(null);
    setLogValues(emptyLogValues());
  }, []);

  const handleSelectSubstance = React.useCallback(
    (substanceId: string) => {
      const substance =
        substances.find((s) => s.id === substanceId) ?? null;
      setSelectedSubstanceId(substanceId);
      setLogValues(emptyLogValues(substance));
    },
    [substances],
  );

  const validateAndBuildDraftItem =
    React.useCallback((): MedicationDraftItem | null => {
      if (!activeSubstance) {
        toast({
          title: "No substance selected",
          description: "Select a substance first.",
          variant: "destructive",
        });
        return null;
      }

      if (activeSubstance.isCompound) {
        if (!logValues.compoundServings || logValues.compoundServings <= 0) {
          toast({
            title: "Enter servings",
            description: "A serving count is required for compounds.",
            variant: "destructive",
          });
          return null;
        }
      } else {
        if (!logValues.doseValue || logValues.doseValue <= 0) {
          toast({
            title: "Enter dose",
            description: "A dose value is required.",
            variant: "destructive",
          });
          return null;
        }
      }

      return {
        substanceId: activeSubstance.id,
        snapshotName: activeSubstance.displayName,
        doseValue: activeSubstance.isCompound ? null : logValues.doseValue,
        doseUnit: activeSubstance.isCompound ? null : logValues.doseUnit,
        compoundServings: activeSubstance.isCompound
          ? logValues.compoundServings
          : null,
        deliveryMethodId: logValues.deliveryMethodId,
        variantId: logValues.variantId,
        injectionDepth: logValues.injectionDepth,
      };
    }, [activeSubstance, logValues, toast]);

  const handleAddAnother = React.useCallback(() => {
    const item = validateAndBuildDraftItem();
    if (!item) return;
    setStagedItems((prev) => [...prev, item]);
    captureClientEvent("medication_item_staged", {
      substance_name: item.snapshotName,
      has_delivery_method: !!item.deliveryMethodId,
    });
    resetActiveEntry();
    toast({
      title: "Item staged",
      description: `${item.snapshotName} added to the sheet.`,
    });
  }, [resetActiveEntry, toast, validateAndBuildDraftItem]);

  const handleAddAndReview = React.useCallback(() => {
    const item = validateAndBuildDraftItem();
    if (!item) return;
    setStagedItems((prev) => [...prev, item]);
    captureClientEvent("medication_item_staged", {
      substance_name: item.snapshotName,
      has_delivery_method: !!item.deliveryMethodId,
    });
    resetActiveEntry();
    setOverviewOpen(true);
    toast({
      title: "Item staged",
      description: `${item.snapshotName} added to the sheet.`,
    });
  }, [resetActiveEntry, toast, validateAndBuildDraftItem]);

  const handleSaveSession = React.useCallback(
    async (
      items: MedicationDraftItem[],
      presetId?: string | null,
      loggedAtIsoOverride?: string,
    ) => {
      if (!items.length) {
        toast({
          title: "No items",
          description: "Add at least one substance before saving.",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);
      try {
        await createMedicationLogSessionAction({
          loggedAtIso:
            loggedAtIsoOverride ??
            (useManualTimestamp
              ? combineDateAndTime(sessionDate, sessionTime)
              : new Date().toISOString()),
          presetId: presetId ?? null,
          items,
        });
        // Clear in-memory flow state before navigation in case this route is cached.
        resetActiveEntry();
        setStagedItems([]);
        setSelectedPresetId("");
        setOverviewOpen(false);
        setUseManualTimestamp(false);
        setSessionDate(new Date());
        setSessionTime(nowTimeInputValue());
        clearPersistedState();
        captureClientEvent("medication_logged", {
          item_count: items.length,
          used_preset: !!presetId,
        });
        toast({
          title: "Medication log saved",
          description: `${items.length} item${items.length === 1 ? "" : "s"} recorded.`,
        });
        router.push("/");
      } catch {
        toast({
          title: "Error",
          description: "Unable to save medication log. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [resetActiveEntry, router, sessionDate, sessionTime, toast, useManualTimestamp],
  );

  const handleSavePreset = React.useCallback(() => {
    if (!stagedItems.length) return;
    setPresetNameValue("");
    setPresetNameDialogOpen(true);
  }, [stagedItems.length]);

  const handleConfirmSavePreset = React.useCallback(async () => {
    const name = presetNameValue.trim();
    if (!name) return;

    setSubmitting(true);
    try {
      const created = await createMedicationPresetAction({
        name,
        items: stagedItems,
      });
      setPresets((prev) => [
        { id: created.id, name: created.name, items: stagedItems },
        ...prev,
      ]);
      setPresetNameDialogOpen(false);
      setPresetNameValue("");
      captureClientEvent("medication_preset_saved", {
        preset_name: name,
        item_count: stagedItems.length,
      });
      toast({
        title: "Preset saved",
        description: `${name} is now available in presets.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Unable to save preset.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [presetNameValue, stagedItems, toast]);

  const applyPresetItems = React.useCallback(
    (preset: MedicationPresetView) => {
      setStagedItems(preset.items);
      captureClientEvent("medication_preset_applied", {
        preset_name: preset.name,
        item_count: preset.items.length,
      });
      setConfirmPresetApplyOpen(false);
      toast({
        title: "Preset applied",
        description: `${preset.items.length} item${preset.items.length === 1 ? "" : "s"} staged from ${preset.name}.`,
      });
    },
    [toast],
  );

  const handleApplyPreset = React.useCallback(() => {
    if (!selectedPresetId) return;
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) return;
    if (stagedItems.length > 0) {
      setConfirmPresetApplyOpen(true);
      return;
    }
    applyPresetItems(preset);
  }, [applyPresetItems, presets, selectedPresetId, stagedItems.length]);

  const handleLogPreset = React.useCallback(async () => {
    if (!selectedPresetId) return;
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) return;
    captureClientEvent("medication_preset_logged", {
      preset_name: preset.name,
      item_count: preset.items.length,
    });
    await handleSaveSession(preset.items, preset.id, new Date().toISOString());
  }, [handleSaveSession, presets, selectedPresetId]);

  const handleConfirmApplyPreset = React.useCallback(() => {
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) return;
    applyPresetItems(preset);
  }, [applyPresetItems, presets, selectedPresetId]);

  const handleCreateSubstance = React.useCallback(async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (newIsCompound && newIngredients.length === 0) {
      toast({
        title: "No ingredients",
        description: "Add at least one ingredient for a compound substance.",
        variant: "destructive",
      });
      return;
    }

    const parsedIngredients = newIsCompound
      ? newIngredients
          .filter((i) => i.name.trim() && Number(i.amountPerServing) > 0)
          .map((i) => ({
            name: i.name.trim(),
            amountPerServing: Number(i.amountPerServing),
            unit: i.unit || "mg",
          }))
      : [];

    if (newIsCompound && parsedIngredients.length === 0) {
      toast({
        title: "Invalid ingredients",
        description:
          "Each ingredient needs a name and a positive amount per serving.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await createSubstanceAction({
        displayName: trimmed,
        isCompound: newIsCompound,
        defaultDoseUnit: newIsCompound ? null : newDoseUnit,
        brand: newBrand.trim() || null,
        notes: newNotes.trim() || null,
        methodIds: newMethodIds,
        ingredients: parsedIngredients,
      });
      setSubstances((prev) =>
        [...prev, created].sort((a, b) =>
          a.displayName.localeCompare(b.displayName),
        ),
      );
      setCreateDialogOpen(false);
      setNewName("");
      setNewIsCompound(false);
      setNewDoseUnit("mg");
      setNewBrand("");
      setNewNotes("");
      const oral = bootstrap.deliveryMethods.find((m) => m.key === "oral");
      setNewMethodIds(oral ? [oral.id] : []);
      setNewIngredients([]);
      setSelectedSubstanceId(created.id);
      setLogValues(emptyLogValues(created));
      captureClientEvent("substance_created", {
        substance_name: created.displayName,
        is_compound: created.isCompound,
      });
      toast({
        title: "Substance created",
        description: `${created.displayName} was added to your catalog.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Unable to create substance.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [newName, newIsCompound, newDoseUnit, newBrand, newNotes, newMethodIds, newIngredients, bootstrap.deliveryMethods, toast]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="relative px-2 pt-2 flex flex-col items-center justify-center w-full">
      <AddSubstance
        substances={substances}
        selectedSubstanceId={selectedSubstanceId ?? ""}
        onSelectSubstance={handleSelectSubstance}
        onCreateNewSubstance={() => setCreateDialogOpen(true)}
        stagedCount={stagedItems.length}
        presets={presets}
        selectedPresetId={selectedPresetId}
        onSelectedPresetIdChange={setSelectedPresetId}
        onApplyPreset={handleApplyPreset}
        onLogPreset={handleLogPreset}
        submitting={submitting}
      />

      {/* ── Log substance dialog ──────────────────────────── */}
      <Dialog
        open={logDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetActiveEntry();
        }}
      >
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              {activeSubstance?.displayName}
            </DialogTitle>
            <DialogDescription>
              {activeSubstance?.isCompound
                ? "Log servings"
                : "Enter your dose"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-1">
            {activeSubstance && (
              <SubstanceLogger
                substance={activeSubstance}
                values={logValues}
                onChange={(partial) =>
                  setLogValues((prev) => ({ ...prev, ...partial }))
                }
              />
            )}
          </div>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              onClick={handleAddAnother}
              variant="outline"
              className="flex-1 h-11"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add and continue
            </Button>
            <Button
              onClick={handleAddAndReview}
              className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
              disabled={submitting}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Add and review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MedicationOverviewSheet
        open={overviewOpen}
        onOpenChange={setOverviewOpen}
        items={stagedItems}
        substances={substances}
        deliveryMethods={bootstrap.deliveryMethods}
        sessionDate={sessionDate}
        onSessionDateChange={setSessionDate}
        sessionTime={sessionTime}
        onSessionTimeChange={setSessionTime}
        useManualTimestamp={useManualTimestamp}
        onUseManualTimestampChange={setUseManualTimestamp}
        onRemoveItem={(index) =>
          setStagedItems((prev) => prev.filter((_, i) => i !== index))
        }
        onSavePreset={handleSavePreset}
        onSaveSession={() => handleSaveSession(stagedItems)}
        submitting={submitting}
      />

      {/* ── Create substance dialog ────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Substance</DialogTitle>
            <DialogDescription>
              Add a new substance to your personal catalog.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Vitamin D3"
              />
            </div>

            <div className="space-y-1">
              <Label>Brand <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="e.g., Thorne, Nature Made"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="compound-toggle" className="cursor-pointer">
                Multi-ingredient compound
              </Label>
              <Checkbox
                id="compound-toggle"
                checked={newIsCompound}
                onCheckedChange={(v) => setNewIsCompound(v === true)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Delivery Methods</Label>
              <div className="flex flex-wrap gap-2">
                {bootstrap.deliveryMethods.map((method) => {
                  const active = newMethodIds.includes(method.id);
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() =>
                        setNewMethodIds((prev) =>
                          active
                            ? prev.filter((id) => id !== method.id)
                            : [...prev, method.id],
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                        active
                          ? "border-green-500 bg-green-500/15 text-green-400"
                          : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {newIsCompound ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ingredients</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setNewIngredients((prev) => [
                        { name: "", amountPerServing: "", unit: "mg" },
                        ...prev,
                      ])
                    }
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>

                {newIngredients.length === 0 && (
                  <p className="text-sm text-muted-foreground border border-dashed rounded-md p-3 text-center">
                    No ingredients yet. Add each ingredient and its amount per
                    serving so doses can be tracked individually.
                  </p>
                )}

                <div className="space-y-2">
                  {newIngredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-md border p-2.5 pr-8 space-y-2"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setNewIngredients((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-2 right-2 p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Input
                        value={ing.name}
                        onChange={(e) =>
                          setNewIngredients((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, name: e.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Ingredient name"
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Per serving
                          </Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={ing.amountPerServing}
                            onChange={(e) =>
                              setNewIngredients((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        amountPerServing: e.target.value,
                                      }
                                    : item,
                                ),
                              )
                            }
                            placeholder="300"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Unit
                          </Label>
                          <Select
                            value={ing.unit}
                            onValueChange={(val) =>
                              setNewIngredients((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, unit: val } : item,
                                ),
                              )
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DOSE_UNITS.map((u) => (
                                <SelectItem key={u} value={u}>
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Dose unit</Label>
                <Select value={newDoseUnit} onValueChange={setNewDoseUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOSE_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g., take with food, prescribed by Dr. Smith"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleCreateSubstance}
              disabled={submitting || !newName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Save preset name dialog ──────────────────────────── */}
      <Dialog
        open={presetNameDialogOpen}
        onOpenChange={setPresetNameDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogDescription>
              Give your preset a name so you can reuse it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Preset Name</Label>
            <Input
              value={presetNameValue}
              onChange={(e) => setPresetNameValue(e.target.value)}
              placeholder="e.g., Morning vitamins"
              onKeyDown={(e) => {
                if (e.key === "Enter" && presetNameValue.trim()) {
                  handleConfirmSavePreset();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPresetNameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSavePreset}
              disabled={submitting || !presetNameValue.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm preset apply dialog ──────────────────────── */}
      <Dialog
        open={confirmPresetApplyOpen}
        onOpenChange={setConfirmPresetApplyOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace Staged Items?</DialogTitle>
            <DialogDescription>
              You have {stagedItems.length} item
              {stagedItems.length === 1 ? "" : "s"} staged. Applying this preset
              will replace them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmPresetApplyOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmApplyPreset}>
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
