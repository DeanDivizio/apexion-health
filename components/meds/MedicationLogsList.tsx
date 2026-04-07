"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { ClipboardList, Pencil, Pill, Plus, Trash2 } from "lucide-react";
import {
  deleteMedicationLogSessionAction,
  updateMedicationLogSessionAction,
} from "@/actions/medication";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui_primitives/alert-dialog";
import { SubstanceLogger } from "@/components/meds/SubstanceLogger";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Textarea } from "@/components/ui_primitives/textarea";
import { useToast } from "@/hooks/use-toast";
import { INJECTION_DEPTHS } from "@/lib/medication/catalog";
import type {
  MedicationDraftItem,
  MedicationLogSessionView,
  SubstanceCatalogItemView,
  SubstanceDeliveryMethodView,
  SubstanceLogValues,
} from "@/lib/medication";

const EDIT_TRANSITION_MS = 200;

interface EditableSessionState {
  id: string;
  presetId: string | null;
  loggedAtDate: string;
  loggedAtTime: string;
  notes: string;
  items: MedicationDraftItem[];
  addingSubstanceId: string | null;
  addingValues: SubstanceLogValues;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInputValue(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoFromInputs(dateValue: string, timeValue: string): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  const next = new Date(
    Number.isFinite(year) ? year : 1970,
    Number.isFinite(month) ? month - 1 : 0,
    Number.isFinite(day) ? day : 1,
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );
  return next.toISOString();
}

function toDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayHeader(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" as const } : {}),
  });

  if (target.getTime() === today.getTime()) return `Today — ${formatted}`;
  if (target.getTime() === yesterday.getTime())
    return `Yesterday — ${formatted}`;
  return formatted;
}

function formatLoggedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function toEditorValues(
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

function applyValuesToItem(
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

function describeItem(
  item: MedicationDraftItem,
  substancesById: Map<string, SubstanceCatalogItemView>,
  methodsById: Map<string, SubstanceDeliveryMethodView>,
): string {
  const bits: string[] = [];

  if (item.doseValue !== null) {
    bits.push(`${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ""}`);
  }
  if (item.compoundServings !== null) {
    bits.push(
      `${item.compoundServings} serving${item.compoundServings === 1 ? "" : "s"}`,
    );
  }
  if (item.deliveryMethodId) {
    const method = methodsById.get(item.deliveryMethodId);
    if (method) bits.push(method.label);
  }
  if (item.injectionDepth) {
    const depth = INJECTION_DEPTHS.find(
      (entry) => entry.key === item.injectionDepth,
    );
    if (depth) bits.push(depth.label);
  }
  if (item.variantId) {
    const substance = substancesById.get(item.substanceId);
    const variant = substance?.variants.find((v) => v.id === item.variantId);
    if (variant) bits.push(variant.label);
  }

  return bits.join(" · ");
}

function validateItem(
  item: MedicationDraftItem,
  substancesById: Map<string, SubstanceCatalogItemView>,
): string | null {
  const substance = substancesById.get(item.substanceId);
  if (!substance)
    return `${item.snapshotName} is no longer in your active catalog.`;

  if (substance.isCompound) {
    if (!item.compoundServings || item.compoundServings <= 0) {
      return `${item.snapshotName} needs a serving count above 0.`;
    }
    return null;
  }

  if (!item.doseValue || item.doseValue <= 0) {
    return `${item.snapshotName} needs a dose above 0.`;
  }
  return null;
}

function buildEditableState(
  session: MedicationLogSessionView,
): EditableSessionState {
  return {
    id: session.id,
    presetId: session.presetId,
    loggedAtDate: toDateInputValue(session.loggedAtIso),
    loggedAtTime: toTimeInputValue(session.loggedAtIso),
    notes: session.notes ?? "",
    items: session.items.map((item) => ({ ...item })),
    addingSubstanceId: null,
    addingValues: emptyLogValues(),
  };
}

interface MedicationLogsListProps {
  initialSessions: MedicationLogSessionView[];
  substances: SubstanceCatalogItemView[];
  deliveryMethods: SubstanceDeliveryMethodView[];
}

export function MedicationLogsList({
  initialSessions,
  substances,
  deliveryMethods,
}: MedicationLogsListProps) {
  const [sessions, setSessions] =
    useState<MedicationLogSessionView[]>(initialSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editable, setEditable] = useState<EditableSessionState | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const closeEditTimeoutRef = useRef<number | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  useEffect(
    () => () => {
      if (closeEditTimeoutRef.current !== null) {
        window.clearTimeout(closeEditTimeoutRef.current);
      }
    },
    [],
  );

  const substancesById = useMemo(
    () => new Map(substances.map((substance) => [substance.id, substance])),
    [substances],
  );
  const methodsById = useMemo(
    () => new Map(deliveryMethods.map((method) => [method.id, method])),
    [deliveryMethods],
  );

  const groupedDays = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) =>
        new Date(b.loggedAtIso).getTime() - new Date(a.loggedAtIso).getTime(),
    );

    const map = new Map<string, MedicationLogSessionView[]>();
    for (const s of sorted) {
      const key = toDayKey(s.loggedAtIso);
      const group = map.get(key) ?? [];
      group.push(s);
      map.set(key, group);
    }

    return Array.from(map.entries()).map(
      ([key, daySessions]) =>
        [key, [...daySessions].reverse()] as [
          string,
          MedicationLogSessionView[],
        ],
    );
  }, [sessions]);

  const closeEditor = () => {
    setIsEditOpen(false);
    if (closeEditTimeoutRef.current !== null) {
      window.clearTimeout(closeEditTimeoutRef.current);
    }
    closeEditTimeoutRef.current = window.setTimeout(() => {
      setEditingId(null);
      setEditable(null);
      closeEditTimeoutRef.current = null;
    }, EDIT_TRANSITION_MS);
  };

  const openEditor = (session: MedicationLogSessionView) => {
    if (closeEditTimeoutRef.current !== null) {
      window.clearTimeout(closeEditTimeoutRef.current);
      closeEditTimeoutRef.current = null;
    }
    setEditingId(session.id);
    setEditable(buildEditableState(session));
    requestAnimationFrame(() => setIsEditOpen(true));
  };

  const handleSave = async () => {
    if (!editable) return;
    if (!editable.loggedAtDate) {
      toast({
        title: "Date required",
        description: "Choose a date before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!editable.loggedAtTime) {
      toast({
        title: "Time required",
        description: "Choose a time before saving.",
        variant: "destructive",
      });
      return;
    }
    if (editable.items.length === 0) {
      toast({
        title: "No items",
        description: "Add at least one item before saving.",
        variant: "destructive",
      });
      return;
    }

    for (const item of editable.items) {
      const validationError = validateItem(item, substancesById);
      if (validationError) {
        toast({
          title: "Invalid item",
          description: validationError,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        loggedAtIso: toIsoFromInputs(
          editable.loggedAtDate,
          editable.loggedAtTime,
        ),
        presetId: editable.presetId,
        notes: editable.notes.trim() || null,
        items: editable.items,
      };
      await updateMedicationLogSessionAction(editable.id, payload);
      setSessions((prev) =>
        prev.map((session) =>
          session.id === editable.id
            ? {
                ...session,
                loggedAtIso: payload.loggedAtIso,
                notes: payload.notes,
                presetId: payload.presetId,
                items: payload.items,
              }
            : session,
        ),
      );
      closeEditor();
      toast({
        title: "Log updated",
        description: "Medication session changes have been saved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await deleteMedicationLogSessionAction(deleteConfirmId);
      setSessions((prev) =>
        prev.filter((session) => session.id !== deleteConfirmId),
      );
      if (editingId === deleteConfirmId) {
        if (closeEditTimeoutRef.current !== null) {
          window.clearTimeout(closeEditTimeoutRef.current);
          closeEditTimeoutRef.current = null;
        }
        setIsEditOpen(false);
        setEditingId(null);
        setEditable(null);
      }
      toast({ title: "Log deleted" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete this log. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleAddCurrentSubstance = () => {
    if (!editable?.addingSubstanceId) return;
    const substance = substancesById.get(editable.addingSubstanceId);
    if (!substance) return;

    const nextItem = applyValuesToItem(
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
      editable.addingValues,
    );
    const validationError = validateItem(nextItem, substancesById);
    if (validationError) {
      toast({
        title: "Invalid item",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setEditable((prev) =>
      prev
        ? {
            ...prev,
            items: [...prev.items, nextItem],
            addingSubstanceId: null,
            addingValues: emptyLogValues(),
          }
        : prev,
    );
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-center">
          No medication or supplement logs yet.
        </p>
      </div>
    );
  }

  const deleteSession = deleteConfirmId
    ? sessions.find((session) => session.id === deleteConfirmId) ?? null
    : null;

  return (
    <>
      <div className="flex flex-col gap-6">
        {groupedDays.map(([dayKey, daySessions]) => (
          <div key={dayKey} className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {formatDayHeader(dayKey)}
            </h3>
            <div className="rounded-xl border border-white/10 bg-gradient-to-b from-blue-950/20 to-blue-950/5 divide-y divide-white/5 overflow-hidden">
              {daySessions.map((session) =>
                editingId === session.id && editable ? (
                  <div
                    key={`edit-${session.id}`}
                    className={`p-4 transition-all duration-200 ${isEditOpen ? "opacity-100" : "opacity-0"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-medium">Edit Log</h2>
                      <Pill className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="space-y-1">
                        <Label htmlFor="meds-edit-date">Date</Label>
                        <Input
                          id="meds-edit-date"
                          type="date"
                          value={editable.loggedAtDate}
                          onChange={(event) =>
                            setEditable((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    loggedAtDate: event.target.value,
                                  }
                                : prev,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="meds-edit-time">Time</Label>
                        <Input
                          id="meds-edit-time"
                          type="time"
                          value={editable.loggedAtTime}
                          onChange={(event) =>
                            setEditable((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    loggedAtTime: event.target.value,
                                  }
                                : prev,
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <Label htmlFor="meds-edit-notes">Notes</Label>
                      <Textarea
                        id="meds-edit-notes"
                        rows={2}
                        value={editable.notes}
                        placeholder="Optional notes"
                        onChange={(event) =>
                          setEditable((prev) =>
                            prev
                              ? { ...prev, notes: event.target.value }
                              : prev,
                          )
                        }
                      />
                    </div>

                    <div className="space-y-3 mb-4">
                      {editable.items.map((item, itemIndex) => {
                        const substance =
                          substancesById.get(item.substanceId) ?? null;
                        return (
                          <div
                            key={`${item.substanceId}-${itemIndex}`}
                            className="rounded-lg border border-white/10 p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium">
                                {item.snapshotName}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  setEditable((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          items: prev.items.filter(
                                            (_, i) => i !== itemIndex,
                                          ),
                                        }
                                      : prev,
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                            {substance ? (
                              <SubstanceLogger
                                substance={substance}
                                values={toEditorValues(item, substance)}
                                onChange={(partial) =>
                                  setEditable((prev) => {
                                    if (!prev) return prev;
                                    const nextItems = [...prev.items];
                                    const current = nextItems[itemIndex];
                                    nextItems[itemIndex] = applyValuesToItem(
                                      current,
                                      substance,
                                      {
                                        ...toEditorValues(current, substance),
                                        ...partial,
                                      },
                                    );
                                    return { ...prev, items: nextItems };
                                  })
                                }
                              />
                            ) : (
                              <p className="text-sm text-yellow-500">
                                This substance is no longer active in your
                                catalog. Remove it to save this log.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-lg border border-dashed border-white/20 p-3 mb-4">
                      <Label className="mb-1 block">Add item</Label>
                      <Select
                        value={editable.addingSubstanceId ?? ""}
                        onValueChange={(value) => {
                          const substance =
                            substancesById.get(value) ?? null;
                          setEditable((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  addingSubstanceId: value,
                                  addingValues: emptyLogValues(substance),
                                }
                              : prev,
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a substance" />
                        </SelectTrigger>
                        <SelectContent>
                          {substances.map((substance) => (
                            <SelectItem
                              key={substance.id}
                              value={substance.id}
                            >
                              {substance.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {editable.addingSubstanceId ? (
                        <div className="mt-3 space-y-3">
                          <SubstanceLogger
                            substance={
                              substancesById.get(
                                editable.addingSubstanceId,
                              )!
                            }
                            values={editable.addingValues}
                            onChange={(partial) =>
                              setEditable((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      addingValues: {
                                        ...prev.addingValues,
                                        ...partial,
                                      },
                                    }
                                  : prev,
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleAddCurrentSubstance}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add item
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={closeEditor}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={session.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {formatTime(session.loggedAtIso)}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditor(session)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setDeleteConfirmId(session.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {session.items.map((item, idx) => {
                        const detail = describeItem(
                          item,
                          substancesById,
                          methodsById,
                        );
                        return (
                          <div
                            key={`${item.substanceId}-${idx}`}
                            className="flex items-baseline gap-1.5"
                          >
                            <span className="text-sm">
                              {item.snapshotName}
                            </span>
                            {detail && (
                              <span className="text-xs text-muted-foreground">
                                {detail}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {session.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-1.5 italic">
                        {session.notes}
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this medication log?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSession
                ? `This permanently deletes your ${formatLoggedAt(deleteSession.loggedAtIso)} medication/supplement log. This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
