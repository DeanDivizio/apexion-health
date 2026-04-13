"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Check, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import { Textarea } from "@/components/ui_primitives/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui_primitives/sheet";
import type { ActivityDimensionView, ActivityTypeView } from "@/lib/activity";
import type { CreateActivityLogInput } from "@/lib/activity";
import {
  createActivityLogAction,
  createActivityTypeAction,
  listActivityTypesAction,
} from "@/actions/activity";
import { useToast } from "@/hooks/use-toast";
import { toCompactDateStr } from "@/lib/dates/dateStr";
import { captureClientEvent } from "@/lib/posthog-client";
import { ACTIVITY_ICON_MAP } from "./activityIconMap";
import { ActivityTypeForm } from "./ActivityTypeForm";

interface ActivityLoggerProps {
  activityTypes: ActivityTypeView[];
  onLogged?: () => Promise<void> | void;
  navigateOnSuccess?: boolean;
}

interface ValueDraft {
  textValue: string;
  numberValue: string;
  unitValue: string;
  dateValue: string;
  timeValue: string;
  dateTimeValueIso: string;
  intValue: string;
}

const FALLBACK_COLOR = "#10b981";

function emptyValuePayload(base: {
  key: string;
  label: string;
  kind: ActivityDimensionView["kind"];
}) {
  return {
    ...base,
    textValue: null as string | null,
    numberValue: null as number | null,
    unitValue: null as string | null,
    dateValue: null as string | null,
    timeValue: null as string | null,
    dateTimeValueIso: null as string | null,
    intValue: null as number | null,
    jsonValue: null as unknown,
  };
}

function initialValueForDimension(dimension: ActivityDimensionView): ValueDraft {
  return {
    textValue: "",
    numberValue: "",
    unitValue: dimension.config?.defaultUnit ?? "",
    dateValue: "",
    timeValue: "",
    dateTimeValueIso: "",
    intValue: "",
  };
}

function toIsoFromLocalDateTime(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function findMissingRequired(
  dimensions: ActivityDimensionView[],
  drafts: Record<string, ValueDraft>,
): ActivityDimensionView | null {
  for (const dim of dimensions) {
    if (!dim.required) continue;
    const draft = drafts[dim.key] ?? initialValueForDimension(dim);
    switch (dim.kind) {
      case "text":
        if (!draft.textValue.trim()) return dim;
        break;
      case "number":
      case "number_with_unit":
        if (!draft.numberValue) return dim;
        break;
      case "date":
        if (!draft.dateValue) return dim;
        break;
      case "time":
        if (!draft.timeValue) return dim;
        break;
      case "datetime":
        if (!draft.dateTimeValueIso) return dim;
        break;
      case "scale_1_5":
        if (!draft.intValue) return dim;
        break;
    }
  }
  return null;
}

function parseFiniteOrNull(raw: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function ScaleInput({
  value,
  onChange,
  accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
}) {
  const numValue = value ? Number(value) : null;
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const isSelected = numValue === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className={[
              "flex-1 h-10 rounded-lg text-sm font-medium transition-all",
              "border border-white/10",
              isSelected
                ? "text-white shadow-lg scale-105"
                : "bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700/60 hover:text-neutral-200",
            ].join(" ")}
            style={isSelected ? { backgroundColor: accentColor } : undefined}
            aria-pressed={isSelected}
            aria-label={`${n} out of 5`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

export function ActivityLogger({
  activityTypes: initialTypes,
  onLogged,
  navigateOnSuccess = false,
}: ActivityLoggerProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [types, setTypes] = React.useState<ActivityTypeView[]>(initialTypes);
  React.useEffect(() => { setTypes(initialTypes); }, [initialTypes]);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [useManualTime, setUseManualTime] = React.useState(false);
  const [loggedAtDate, setLoggedAtDate] = React.useState(todayDate());
  const [loggedAtTime, setLoggedAtTime] = React.useState(nowTime());
  const [saving, setSaving] = React.useState(false);
  const [justLogged, setJustLogged] = React.useState<string | null>(null);
  const [showNewDrawer, setShowNewDrawer] = React.useState(false);
  const [savingType, setSavingType] = React.useState(false);

  const selectedType = React.useMemo(
    () => types.find((t) => t.id === selectedId) ?? null,
    [types, selectedId],
  );

  const accentColor = selectedType?.color ?? FALLBACK_COLOR;

  const [valueDrafts, setValueDrafts] = React.useState<Record<string, ValueDraft>>({});

  React.useEffect(() => {
    if (!selectedType) return;
    setValueDrafts((prev) => {
      const next: Record<string, ValueDraft> = {};
      for (const dim of selectedType.dimensions) {
        next[dim.key] = prev[dim.key] ?? initialValueForDimension(dim);
      }
      return next;
    });
  }, [selectedType]);

  const updateDraft = React.useCallback(
    (key: string, patch: Partial<ValueDraft>) =>
      setValueDrafts((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? ({} as ValueDraft)), ...patch },
      })),
    [],
  );

  const formRef = React.useRef<HTMLDivElement>(null);

  const handleSelectCard = (id: string) => {
    const next = selectedId === id ? null : id;
    setSelectedId(next);
    if (next) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    }
  };

  const resetForm = React.useCallback(() => {
    setLoggedAtDate(todayDate());
    setLoggedAtTime(nowTime());
    setUseManualTime(false);
    if (selectedType) {
      const next: Record<string, ValueDraft> = {};
      for (const dim of selectedType.dimensions) {
        next[dim.key] = initialValueForDimension(dim);
      }
      setValueDrafts(next);
    }
  }, [selectedType]);

  const handleSave = async () => {
    if (!selectedType) return;

    const localDateTime = useManualTime
      ? new Date(`${loggedAtDate}T${loggedAtTime || "00:00"}`)
      : new Date();

    if (Number.isNaN(localDateTime.getTime())) {
      toast({ title: "Invalid date/time", description: "Please choose a valid date and time.", variant: "destructive" });
      return;
    }

    const missing = findMissingRequired(selectedType.dimensions, valueDrafts);
    if (missing) {
      toast({ title: "Missing required field", description: `${missing.label} is required.`, variant: "destructive" });
      return;
    }

    const values: CreateActivityLogInput["values"] = selectedType.dimensions.map((dim) => {
      const draft = valueDrafts[dim.key] ?? initialValueForDimension(dim);
      const base = { key: dim.key, label: dim.label, kind: dim.kind } as const;

      switch (dim.kind) {
        case "text":
          return { ...emptyValuePayload(base), textValue: draft.textValue.trim() || null };
        case "number":
          return { ...emptyValuePayload(base), numberValue: parseFiniteOrNull(draft.numberValue) };
        case "number_with_unit":
          return {
            ...emptyValuePayload(base),
            numberValue: parseFiniteOrNull(draft.numberValue),
            unitValue: draft.unitValue || null,
          };
        case "date":
          return { ...emptyValuePayload(base), dateValue: draft.dateValue || null };
        case "time":
          return { ...emptyValuePayload(base), timeValue: draft.timeValue || null };
        case "datetime":
          return { ...emptyValuePayload(base), dateTimeValueIso: toIsoFromLocalDateTime(draft.dateTimeValueIso) };
        case "scale_1_5": {
          const raw = draft.intValue ? Number(draft.intValue) : null;
          const clamped = raw != null && Number.isFinite(raw) ? Math.max(1, Math.min(5, Math.round(raw))) : null;
          return { ...emptyValuePayload(base), intValue: clamped };
        }
      }
    });

    const payload: CreateActivityLogInput = {
      activityTypeId: selectedType.id,
      loggedAtIso: localDateTime.toISOString(),
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      values,
    };

    setSaving(true);
    try {
      await createActivityLogAction(payload);
      captureClientEvent("activity_logged", {
        activity_type_name: selectedType.name,
        dimension_count: selectedType.dimensions.length,
      });

      setJustLogged(selectedType.name);
      resetForm();
      setTimeout(() => setJustLogged(null), 2000);

      if (navigateOnSuccess) {
        router.push("/");
      } else {
        await onLogged?.();
      }
    } catch {
      toast({ title: "Error", description: "Unable to save activity log.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateType = async (payload: {
    name: string;
    color: string | null;
    icon: string | null;
    dimensions: Array<{
      key: string;
      label: string;
      kind: ActivityTypeView["dimensions"][number]["kind"];
      required: boolean;
      sortOrder: number;
      config: ActivityTypeView["dimensions"][number]["config"];
    }>;
  }) => {
    setSavingType(true);
    try {
      await createActivityTypeAction(payload);
      const refreshed = await listActivityTypesAction();
      setTypes(refreshed);
      setShowNewDrawer(false);

      const newType = refreshed.find((t) => t.name === payload.name);
      if (newType) setSelectedId(newType.id);

      toast({ title: "Activity created", description: `${payload.name} is ready to log.` });
    } catch {
      toast({ title: "Error", description: "Failed to create activity.", variant: "destructive" });
    } finally {
      setSavingType(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success toast banner */}
      {justLogged && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-300">{justLogged} logged</p>
            <p className="text-xs text-emerald-400/70">Pick another activity or you&apos;re all set</p>
          </div>
        </div>
      )}

      {/* Activity cards grid */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">What did you do?</p>
        <div className="grid grid-cols-3 gap-2.5">
          {types.map((type) => {
            const color = type.color ?? FALLBACK_COLOR;
            const isActive = selectedId === type.id;
            const IconComp = type.icon ? ACTIVITY_ICON_MAP[type.icon] : null;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleSelectCard(type.id)}
                className={[
                  "relative flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-all",
                  "border text-center min-h-[88px]",
                  isActive
                    ? "border-2 shadow-lg scale-[1.02]"
                    : "border-white/10 bg-neutral-900/60 hover:bg-neutral-800/60 hover:border-white/20",
                ].join(" ")}
                style={
                  isActive
                    ? { borderColor: color }
                    : undefined
                }
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: color + "15" }}
                >
                  {IconComp ? (
                    <IconComp className="h-5 w-5" style={{ color }} />
                  ) : (
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                  )}
                </div>
                <span
                  className={[
                    "text-xs font-medium leading-tight truncate w-full",
                    isActive ? "text-white" : "text-neutral-300",
                  ].join(" ")}
                >
                  {type.name}
                </span>
              </button>
            );
          })}

          {/* New Activity card */}
          <button
            type="button"
            onClick={() => setShowNewDrawer(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-all border border-dashed border-white/15 text-center min-h-[88px] hover:border-white/30 hover:bg-neutral-800/30 group"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
              <Plus className="h-5 w-5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
            </div>
            <span className="text-xs font-medium text-neutral-500 group-hover:text-neutral-300 transition-colors">
              New
            </span>
          </button>
        </div>
      </div>

      {/* Expanded form for selected activity */}
      {selectedType && (
        <div
          ref={formRef}
          className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl border border-white/10 bg-neutral-900/40 p-5 space-y-5"
        >
          {/* Form header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {selectedType.icon && ACTIVITY_ICON_MAP[selectedType.icon] ? (
                React.createElement(ACTIVITY_ICON_MAP[selectedType.icon], {
                  className: "h-4.5 w-4.5",
                  style: { color: accentColor },
                })
              ) : (
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
              )}
              <h2 className="text-lg font-semibold text-white">
                {selectedType.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-xs text-muted-foreground hover:text-neutral-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              Cancel
            </button>
          </div>

          {/* Time picker */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseManualTime(false)}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  !useManualTime
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700/50",
                ].join(" ")}
              >
                <Clock className="h-3 w-3" />
                Now
              </button>
              <button
                type="button"
                onClick={() => setUseManualTime(true)}
                className={[
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  useManualTime
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700/50",
                ].join(" ")}
              >
                Custom time
              </button>
            </div>
            {useManualTime && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={loggedAtDate}
                  max={toCompactDateStr(new Date()).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}
                  onChange={(e) => setLoggedAtDate(e.target.value)}
                  onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                />
                <Input
                  type="time"
                  value={loggedAtTime}
                  onChange={(e) => setLoggedAtTime(e.target.value)}
                  onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                />
              </div>
            )}
          </div>

          {/* Dimension fields */}
          {selectedType.dimensions.length > 0 && (
            <div className="space-y-4">
              {selectedType.dimensions.map((dim) => {
                const draft = valueDrafts[dim.key] ?? initialValueForDimension(dim);
                const reqMark = dim.required ? " *" : "";

                switch (dim.kind) {
                  case "text":
                    return (
                      <div key={dim.key} className="space-y-1.5">
                        <Label className="text-sm">{dim.label}{reqMark}</Label>
                        <Textarea
                          value={draft.textValue}
                          onChange={(e) => updateDraft(dim.key, { textValue: e.target.value })}
                          rows={2}
                          placeholder={dim.config?.placeholder ?? undefined}
                        />
                      </div>
                    );

                  case "number":
                    return (
                      <div key={dim.key} className="space-y-1.5">
                        <Label className="text-sm">{dim.label}{reqMark}</Label>
                        <Input
                          type="number"
                          value={draft.numberValue}
                          onChange={(e) => updateDraft(dim.key, { numberValue: e.target.value })}
                          placeholder={dim.config?.placeholder ?? undefined}
                        />
                      </div>
                    );

                  case "number_with_unit": {
                    const units = dim.config?.allowedUnits ?? [];
                    return (
                      <div key={dim.key} className="space-y-1.5">
                        <Label className="text-sm">{dim.label}{reqMark}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            className="col-span-2"
                            value={draft.numberValue}
                            onChange={(e) => updateDraft(dim.key, { numberValue: e.target.value })}
                          />
                          {units.length > 0 ? (
                            <Select
                              value={draft.unitValue || units[0]}
                              onValueChange={(v) => updateDraft(dim.key, { unitValue: v })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {units.map((u) => (
                                  <SelectItem key={u} value={u}>{u}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={draft.unitValue}
                              onChange={(e) => updateDraft(dim.key, { unitValue: e.target.value })}
                              placeholder="unit"
                            />
                          )}
                        </div>
                      </div>
                    );
                  }

                  case "date":
                    return (
                      <div key={dim.key} className="space-y-1.5">
                        <Label className="text-sm">{dim.label}{reqMark}</Label>
                        <Input
                          type="date"
                          value={draft.dateValue}
                          onChange={(e) => updateDraft(dim.key, { dateValue: e.target.value })}
                          onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                        />
                      </div>
                    );

                  case "time":
                    return (
                      <div key={dim.key} className="space-y-1.5">
                        <Label className="text-sm">{dim.label}{reqMark}</Label>
                        <Input
                          type="time"
                          value={draft.timeValue}
                          onChange={(e) => updateDraft(dim.key, { timeValue: e.target.value })}
                          onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                        />
                      </div>
                    );

                  case "datetime":
                    return (
                      <div key={dim.key} className="space-y-1.5">
                        <Label className="text-sm">{dim.label}{reqMark}</Label>
                        <Input
                          type="datetime-local"
                          value={draft.dateTimeValueIso}
                          onChange={(e) => updateDraft(dim.key, { dateTimeValueIso: e.target.value })}
                          onClick={(e) => { try { e.currentTarget.showPicker(); } catch {} }}
                        />
                      </div>
                    );

                  case "scale_1_5":
                    return (
                      <div key={dim.key} className="space-y-1.5">
                        <Label className="text-sm">{dim.label}{reqMark}</Label>
                        <ScaleInput
                          value={draft.intValue}
                          onChange={(v) => updateDraft(dim.key, { intValue: v })}
                          accentColor={accentColor}
                        />
                      </div>
                    );
                }
              })}
            </div>
          )}

          {/* No-fields hint */}
          {selectedType.dimensions.length === 0 && (
            <p className="text-sm text-muted-foreground py-1">
              No extra fields — just tap log to record it.
            </p>
          )}

          {/* Save button */}
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 text-base font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: accentColor }}
          >
            {saving ? (
              "Saving..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="h-5 w-5" />
                Log {selectedType.name}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Empty state when no types and nothing selected */}
      {types.length === 0 && (
        <button
          type="button"
          onClick={() => setShowNewDrawer(true)}
          className="w-full rounded-xl border border-dashed border-white/15 p-8 flex flex-col items-center gap-3 hover:border-white/30 hover:bg-neutral-800/20 transition-all group"
        >
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-200">Create your first activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Track habits like reading, meditation, exercise, or anything you want
            </p>
          </div>
        </button>
      )}

      {/* New Activity Sheet */}
      <Sheet open={showNewDrawer} onOpenChange={setShowNewDrawer}>
        <SheetContent side="right" className="flex flex-col w-full max-w-full sm:max-w-full">
          <SheetHeader>
            <SheetTitle>New Activity</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pt-4">
            <ActivityTypeForm
              bare
              saving={savingType}
              onCancel={() => setShowNewDrawer(false)}
              onSave={handleCreateType}
              renderActions={({ onSubmit, onCancel: cancel, saving: s, disabled, accentColor }) => (
                <SheetFooter className="grid grid-cols-2 gap-3 pt-4 pb-2">
                  <Button type="button" variant="outline" onClick={cancel}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={s || disabled}
                    onClick={onSubmit}
                    style={{ backgroundColor: accentColor }}
                    className="text-white"
                  >
                    {s ? "Saving..." : "Save Activity"}
                  </Button>
                </SheetFooter>
              )}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
