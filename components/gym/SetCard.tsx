"use client";

import * as React from "react";
import { MoreVertical, Info, SplitSquareHorizontal, Trash2, StickyNote, Pencil, Check, X } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui_primitives/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui_primitives/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu";
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
import { Label } from "@/components/ui_primitives/label";
import { Textarea } from "@/components/ui_primitives/textarea";
import type { MuscleTargets, RepInputStyle, StrengthRepMode, StrengthSet } from "@/lib/gym";
import { MUSCLE_GROUP_LABELS } from "@/lib/gym";

// ---------------------------------------------------------------------------
// RPE labels per the spec
// ---------------------------------------------------------------------------
const EFFORT_OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: "Untracked" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7 (4-5 from fail)" },
  { value: "8", label: "8 (2-3 from fail)" },
  { value: "9", label: "9 (1 from failure)" },
  { value: "10", label: "10 (Failure)" },
];

// ---------------------------------------------------------------------------
// Field descriptions
// ---------------------------------------------------------------------------
const WEIGHT_TOOLTIP =
  "The weight being moved per rep. If lift is unilateral, record the weight per side (i.e. if doing bicep curls, record the weight each arm is lifting). If lift is bilateral, record the total weight (i.e. if doing preacher curls, record the weight loaded/weight of the barbell).";

const REPS_TOOLTIP =
  'The number of reps this set (including failure if applicable). For bilateral (uses both sides at the same time) movements, just log reps normally. For unilateral (one side at a time) movements, if both sides are the same, you can log that number here and Apexion will do the math automatically. If unilateral but sides are different (full 10 on right but failed at 9 on left, for instance), click the three dots next to the drop down and select "Split L/R Reps", then input the numbers appropriately.';

const EFFORT_TOOLTIP =
  "Effort is an optional metric that gives Apexion more insight into your performance. It allows for tracking progress even when weight/rep count is fixed, and lets Apexion calculate your optimal pacing/set structure. This is highly recommended.";

const DURATION_TOOLTIP =
  "The amount of time you took to finish your set. This is an optional metric that allows Apexion to calculate your optimal rep pacing, as well as understand discrepancies in your data (like if you did the same reps and load twice but recorded a lower effort the second time. That's unexpected if duration is the same, but reasonable if you took your time on the second set.)";

const LIMITING_FACTOR_TOOLTIP =
  "Track what limited your performance on this set. This improves your analytics and helps Apexion recommend smarter programming adjustments. This can be disabled in settings.";

const FIXED_MODE_OPTIONS: { value: string; label: string }[] = [
  { value: "cardio", label: "Cardio / Conditioning" },
  { value: "grip", label: "Grip" },
  { value: "general_fatigue", label: "General Fatigue / Energy" },
];

function buildFailureModeOptions(
  targets?: MuscleTargets,
): { value: string; label: string }[] {
  const muscleOptions: { value: string; label: string }[] = [];
  if (targets && targets.length > 0) {
    const seen = new Set<string>();
    for (const t of targets) {
      const label = MUSCLE_GROUP_LABELS[t.muscle] ?? t.muscle;
      if (!seen.has(label)) {
        seen.add(label);
        muscleOptions.push({ value: label, label });
      }
    }
  }
  return [
    { value: "untracked", label: "Untracked" },
    ...muscleOptions,
    ...FIXED_MODE_OPTIONS,
  ];
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SetCardProps {
  index: number;
  set: StrengthSet;
  isPr?: boolean;
  splitReps: boolean;
  repMode?: StrengthRepMode;
  repInputStyle?: RepInputStyle;
  showFailureMode?: boolean;
  /** Base muscle targets for the exercise — used to build dynamic failure mode options. */
  muscleTargets?: MuscleTargets;
  onUpdate: (set: StrengthSet) => void;
  onSplitRepsToggle: () => void;
  onDelete: () => void;
  /** Replaces the default "#N" prefix (e.g. "1a"). */
  labelOverride?: string;
  /** Replaces the default "Set N" empty-state title (e.g. exercise name). */
  titleOverride?: string;
  /** Extra class(es) appended to the AccordionItem (e.g. left border accent). */
  accentColorClass?: string;
  /** Overrides the AccordionItem value to avoid collisions in shared accordions. */
  accordionValue?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTitle(index: number, set: StrengthSet, hasData: boolean): string {
  if (!hasData) return `Set ${index + 1}`;
  const reps =
    set.reps.bilateral !== undefined
      ? set.reps.bilateral
      : `L${set.reps.left ?? 0}/R${set.reps.right ?? 0}`;
  const effort = set.effort !== undefined && set.effort > 0 ? `, RPE: ${set.effort}` : "";
  return `${reps} Reps, ${set.weight}lbs${effort}`;
}

function isValidWeight(value: string): boolean {
  return /^\d+(\.\d)?$/.test(value);
}

const TITLE_UPDATE_DEBOUNCE_MS = 200;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function FieldPopover({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex cursor-pointer">
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-xs text-xs">
        {text}
      </PopoverContent>
    </Popover>
  );
}

function InlineSetNameEditor({
  value,
  placeholder,
  onSave,
  onCancel,
}: {
  value: string;
  placeholder: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    onSave(draft.trim());
  };

  return (
    <div className="flex items-center gap-1 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder={placeholder}
        maxLength={100}
        className="flex-1 min-w-0 bg-white/5 border border-white/20 rounded-md px-2 py-0.5 text-sm font-medium text-foreground leading-tight outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/25"
      />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); commit(); }}
        className="p-0.5 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onCancel(); }}
        className="p-0.5 rounded text-muted-foreground hover:bg-white/5 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function SetCard({
  index,
  set,
  isPr = false,
  splitReps,
  repMode = "bilateral",
  repInputStyle = "dropdown",
  showFailureMode = true,
  muscleTargets,
  onUpdate,
  onSplitRepsToggle,
  onDelete,
  labelOverride,
  titleOverride,
  accentColorClass,
  accordionValue,
}: SetCardProps) {
  const isFreeform = (repInputStyle ?? "dropdown") === "freeform";
  const [draftSet, setDraftSet] = React.useState<StrengthSet>(set);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = React.useRef<StrengthSet>(set);

  const flushPendingUpdate = React.useCallback(() => {
    if (!debounceRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = null;
    onUpdate(latestDraftRef.current);
  }, [onUpdate]);

  const queueUpdate = React.useCallback(
    (nextSet: StrengthSet) => {
      latestDraftRef.current = nextSet;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        onUpdate(latestDraftRef.current);
      }, TITLE_UPDATE_DEBOUNCE_MS);
    },
    [onUpdate],
  );

  const applySetUpdate = React.useCallback(
    (updater: (prev: StrengthSet) => StrengthSet) => {
      setDraftSet((prev) => {
        const next = updater(prev);
        queueUpdate(next);
        return next;
      });
    },
    [queueUpdate],
  );

  React.useEffect(() => {
    setDraftSet(set);
    latestDraftRef.current = set;
  }, [set]);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        onUpdate(latestDraftRef.current);
      }
    };
  }, [onUpdate]);

  const hasData =
    draftSet.weight > 0 ||
    (draftSet.reps.bilateral ?? 0) > 0 ||
    (draftSet.reps.left ?? 0) > 0 ||
    (draftSet.reps.right ?? 0) > 0;
  const isUnilateral = repMode === "dualUnilateral";
  const repsLabel = splitReps
    ? "Reps (Left // Right)"
    : isUnilateral
      ? "Reps (unilateral)"
      : "Reps (bilateral)";

  // ---- weight ----
  const [weightStr, setWeightStr] = React.useState(
    draftSet.weight > 0 ? String(draftSet.weight) : "",
  );

  React.useEffect(() => {
    setWeightStr(draftSet.weight > 0 ? String(draftSet.weight) : "");
  }, [draftSet.weight]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // Allow intermediate typing: empty, digits, or digits with one decimal
    if (v === "" || /^\d+\.?(\d)?$/.test(v)) {
      setWeightStr(v);
      if (v === "") {
        applySetUpdate((prev) => ({ ...prev, weight: 0 }));
        return;
      }
      if (v.endsWith(".")) return;
      if (isValidWeight(v)) {
        const nextWeight = parseFloat(v);
        applySetUpdate((prev) => ({ ...prev, weight: nextWeight }));
      }
    }
  };

  // ---- reps (bilateral) ----
  const handleRepsBilateral = (val: string) => {
    if (val === "custom") return; // handled below
    const n = parseInt(val, 10);
    applySetUpdate((prev) => ({ ...prev, reps: { bilateral: n } }));
  };

  // custom reps bilateral (dropdown mode)
  const [customRepsBilateral, setCustomRepsBilateral] = React.useState("");
  const handleCustomRepsBilateralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setCustomRepsBilateral(v);
    if (v) {
      const n = parseInt(v, 10);
      applySetUpdate((prev) => ({ ...prev, reps: { bilateral: n } }));
    }
  };

  // ---- freeform reps ----
  const [freeformRepsBilateral, setFreeformRepsBilateral] = React.useState(
    draftSet.reps.bilateral !== undefined && draftSet.reps.bilateral > 0
      ? String(draftSet.reps.bilateral)
      : "",
  );
  const [freeformRepsLeft, setFreeformRepsLeft] = React.useState(
    draftSet.reps.left !== undefined && draftSet.reps.left > 0
      ? String(draftSet.reps.left)
      : "",
  );
  const [freeformRepsRight, setFreeformRepsRight] = React.useState(
    draftSet.reps.right !== undefined && draftSet.reps.right > 0
      ? String(draftSet.reps.right)
      : "",
  );

  React.useEffect(() => {
    setFreeformRepsBilateral(
      draftSet.reps.bilateral !== undefined && draftSet.reps.bilateral > 0
        ? String(draftSet.reps.bilateral)
        : "",
    );
    setFreeformRepsLeft(
      draftSet.reps.left !== undefined && draftSet.reps.left > 0
        ? String(draftSet.reps.left)
        : "",
    );
    setFreeformRepsRight(
      draftSet.reps.right !== undefined && draftSet.reps.right > 0
        ? String(draftSet.reps.right)
        : "",
    );
  }, [draftSet.reps.bilateral, draftSet.reps.left, draftSet.reps.right]);

  const handleFreeformRepsBilateral = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setFreeformRepsBilateral(v);
    applySetUpdate((prev) => ({ ...prev, reps: { bilateral: v ? parseInt(v, 10) : 0 } }));
  };

  const handleFreeformRepsLeft = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setFreeformRepsLeft(v);
    applySetUpdate((prev) => ({
      ...prev,
      reps: { left: v ? parseInt(v, 10) : 0, right: prev.reps.right ?? 0 },
    }));
  };

  const handleFreeformRepsRight = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setFreeformRepsRight(v);
    applySetUpdate((prev) => ({
      ...prev,
      reps: { left: prev.reps.left ?? 0, right: v ? parseInt(v, 10) : 0 },
    }));
  };

  // ---- reps (split L/R) ----
  const [leftSelectOverride, setLeftSelectOverride] = React.useState<string | undefined>(
    undefined,
  );
  const [rightSelectOverride, setRightSelectOverride] = React.useState<string | undefined>(
    undefined,
  );

  const [customRepsLeft, setCustomRepsLeft] = React.useState("");
  const [customRepsRight, setCustomRepsRight] = React.useState("");

  const leftVal = draftSet.reps.left;
  const rightVal = draftSet.reps.right;
  const isCustomLeft = leftVal !== undefined && leftVal > 20;
  const isCustomRight = rightVal !== undefined && rightVal > 20;

  React.useEffect(() => {
    if (isCustomLeft) setCustomRepsLeft(String(leftVal));
  }, [isCustomLeft, leftVal]);

  React.useEffect(() => {
    if (isCustomRight) setCustomRepsRight(String(rightVal));
  }, [isCustomRight, rightVal]);

  const leftRepsSelectVal =
    leftSelectOverride ??
    (isCustomLeft ? "custom" : leftVal !== undefined ? String(leftVal) : undefined);
  const rightRepsSelectVal =
    rightSelectOverride ??
    (isCustomRight ? "custom" : rightVal !== undefined ? String(rightVal) : undefined);

  const handleRepsLeft = (val: string) => {
    if (val === "custom") {
      setLeftSelectOverride("custom");
      return;
    }
    setLeftSelectOverride(undefined);
    const n = parseInt(val, 10);
    applySetUpdate((prev) => ({ ...prev, reps: { left: n, right: prev.reps.right ?? 0 } }));
  };

  const handleRepsRight = (val: string) => {
    if (val === "custom") {
      setRightSelectOverride("custom");
      return;
    }
    setRightSelectOverride(undefined);
    const n = parseInt(val, 10);
    applySetUpdate((prev) => ({ ...prev, reps: { left: prev.reps.left ?? 0, right: n } }));
  };

  const handleCustomRepsLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setCustomRepsLeft(v);
    if (v) {
      setLeftSelectOverride(undefined);
      const n = parseInt(v, 10);
      applySetUpdate((prev) => ({ ...prev, reps: { left: n, right: prev.reps.right ?? 0 } }));
    }
  };

  const handleCustomRepsRightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setCustomRepsRight(v);
    if (v) {
      setRightSelectOverride(undefined);
      const n = parseInt(v, 10);
      applySetUpdate((prev) => ({ ...prev, reps: { left: prev.reps.left ?? 0, right: n } }));
    }
  };

  // ---- effort ----
  const handleEffort = (val: string) => {
    const n = parseInt(val, 10);
    applySetUpdate((prev) => ({ ...prev, effort: n === 0 ? undefined : n }));
  };

  // ---- duration ----
  const [durationStr, setDurationStr] = React.useState(
    draftSet.duration !== undefined ? String(draftSet.duration) : "",
  );
  React.useEffect(() => {
    setDurationStr(draftSet.duration !== undefined ? String(draftSet.duration) : "");
  }, [draftSet.duration]);
  const handleDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setDurationStr(v);
    applySetUpdate((prev) => ({ ...prev, duration: v ? parseInt(v, 10) : undefined }));
  };

  // ---- failure mode ----
  const failureModeOptions = React.useMemo(
    () => buildFailureModeOptions(muscleTargets),
    [muscleTargets],
  );
  const handleFailureMode = (val: string) => {
    applySetUpdate((prev) => ({
      ...prev,
      failureMode: val === "untracked" ? undefined : val,
    }));
  };

  // ---- name (inline rename) ----
  const [isEditingName, setIsEditingName] = React.useState(false);

  const handleNameSave = React.useCallback(
    (name: string) => {
      setIsEditingName(false);
      const defaultTitle = `Set ${index + 1}`;
      const newName = name === "" || name === defaultTitle ? undefined : name;
      applySetUpdate((prev) => ({ ...prev, name: newName }));
    },
    [applySetUpdate, index],
  );

  // ---- notes ----
  const [notesOpen, setNotesOpen] = React.useState(() => !!draftSet.notes);
  const [notesStr, setNotesStr] = React.useState(draftSet.notes ?? "");
  React.useEffect(() => {
    setNotesStr(draftSet.notes ?? "");
    if (draftSet.notes) setNotesOpen(true);
  }, [draftSet.notes]);
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setNotesStr(v);
    applySetUpdate((prev) => ({ ...prev, notes: v.trim() || undefined }));
  };

  // Determine if custom reps are in use
  const bilateralVal = draftSet.reps.bilateral;
  const isCustomReps = bilateralVal !== undefined && bilateralVal > 20;
  const repsSelectVal =
    splitReps
      ? undefined
      : isCustomReps
        ? "custom"
        : bilateralVal !== undefined
          ? String(bilateralVal)
          : undefined;

  React.useEffect(() => {
    if (isCustomReps && bilateralVal !== undefined) {
      setCustomRepsBilateral(String(bilateralVal));
    }
  }, [isCustomReps, bilateralVal]);

  return (
    <AccordionItem
      value={accordionValue ?? `set-${index}`}
      className={`border rounded-xl px-4 transition-colors ${
        isPr
          ? "border-emerald-600 bg-gradient-to-br from-emerald-950/50 to-teal-950/40"
          : "border-teal-800 bg-card/40"
      } ${accentColorClass ?? ""}`}
    >
      <AccordionTrigger className="text-sm hover:no-underline">
        <span className="text-muted-foreground text-xs mr-2">{labelOverride ?? `#${index + 1}`}</span>
        {isEditingName ? (
          <InlineSetNameEditor
            value={draftSet.name ?? (titleOverride ?? `Set ${index + 1}`)}
            placeholder={titleOverride ?? `Set ${index + 1}`}
            onSave={handleNameSave}
            onCancel={() => setIsEditingName(false)}
          />
        ) : (
          <>
            <span className="flex-1 text-left truncate">
              {draftSet.name
                ? draftSet.name
                : hasData
                  ? formatTitle(index, draftSet, hasData)
                  : (titleOverride ?? `Set ${index + 1}`)}
            </span>
            <div className="flex items-center gap-2 mr-2 shrink-0">
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setIsEditingName(true); } }}
                className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); setNotesOpen(true); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setNotesOpen(true); } }}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  draftSet.notes
                    ? "text-blue-400/70 hover:text-blue-400"
                    : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5"
                }`}
              >
                <StickyNote className="h-3 w-3" />
              </div>
            </div>
          </>
        )}
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 items-start">
            {/* Weight */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Weight (lbs)</Label>
                <FieldPopover text={WEIGHT_TOOLTIP} />
              </div>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={weightStr}
                onChange={handleWeightChange}
                className="h-10"
              />
            </div>

            {/* Reps */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">{repsLabel}</Label>
                <FieldPopover text={REPS_TOOLTIP} />
              </div>

              {isFreeform ? (
                /* ── Freeform mode ─────────────────────────────────────── */
                splitReps ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="L"
                      value={freeformRepsLeft}
                      onChange={handleFreeformRepsLeft}
                      className="flex-1 h-10 min-w-0"
                      aria-label="Left reps"
                    />
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="R"
                      value={freeformRepsRight}
                      onChange={handleFreeformRepsRight}
                      className="flex-1 h-10 min-w-0"
                      aria-label="Right reps"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-10 w-6 flex items-center justify-center rounded-md border border-input hover:bg-accent shrink-0"
                          aria-label="Reps options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            flushPendingUpdate();
                            onSplitRepsToggle();
                          }}
                        >
                          <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                          Merge L/R Reps
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Reps"
                      value={freeformRepsBilateral}
                      onChange={handleFreeformRepsBilateral}
                      className="flex-1 h-10 min-w-0"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-10 w-6 flex items-center justify-center rounded-md border border-input hover:bg-accent shrink-0"
                          aria-label="Reps options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            flushPendingUpdate();
                            onSplitRepsToggle();
                          }}
                        >
                          <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                          Split L/R Reps
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              ) : (
                /* ── Dropdown mode ─────────────────────────────────────── */
                splitReps ? (
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 space-y-2">
                      <Select value={leftRepsSelectVal} onValueChange={handleRepsLeft}>
                        <SelectTrigger className="h-10 min-w-0">
                          <SelectValue placeholder="L" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 21 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom...</SelectItem>
                        </SelectContent>
                      </Select>

                      {leftRepsSelectVal === "custom" && (
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Custom"
                          value={customRepsLeft}
                          onChange={handleCustomRepsLeftChange}
                          className="h-10"
                          aria-label="Left reps custom value"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <Select value={rightRepsSelectVal} onValueChange={handleRepsRight}>
                        <SelectTrigger className="h-10 min-w-0">
                          <SelectValue placeholder="R" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 21 }, (_, i) => (
                            <SelectItem key={i} value={String(i)}>
                              {i}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Custom...</SelectItem>
                        </SelectContent>
                      </Select>

                      {rightRepsSelectVal === "custom" && (
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="Custom"
                          value={customRepsRight}
                          onChange={handleCustomRepsRightChange}
                          className="h-10"
                          aria-label="Right reps custom value"
                        />
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-10 w-6 flex items-center justify-center rounded-md border border-input hover:bg-accent shrink-0"
                          aria-label="Reps options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            flushPendingUpdate();
                            onSplitRepsToggle();
                          }}
                        >
                          <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                          Merge L/R Reps
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Select value={repsSelectVal} onValueChange={handleRepsBilateral}>
                      <SelectTrigger className="flex-1 h-10 min-w-0">
                        <SelectValue placeholder="Reps" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 21 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {i}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom...</SelectItem>
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-10 w-6 flex items-center justify-center rounded-md border border-input hover:bg-accent shrink-0"
                          aria-label="Reps options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            flushPendingUpdate();
                            onSplitRepsToggle();
                          }}
                        >
                          <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                          Split L/R Reps
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              )}

              {/* Custom rep input when "Custom" selected (dropdown mode only) */}
              {!isFreeform && !splitReps && repsSelectVal === "custom" && (
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter rep count"
                  value={customRepsBilateral}
                  onChange={handleCustomRepsBilateralChange}
                  className="h-10 mt-2"
                  autoFocus
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-start">
            {/* Effort (RPE) */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Effort (RPE)</Label>
                <FieldPopover text={EFFORT_TOOLTIP} />
              </div>
              <Select
                value={draftSet.effort !== undefined ? String(draftSet.effort) : "0"}
                onValueChange={handleEffort}
              >
                <SelectTrigger className="h-10 min-w-0">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {EFFORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Duration (seconds)</Label>
                <FieldPopover text={DURATION_TOOLTIP} />
              </div>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Optional"
                value={durationStr}
                onChange={handleDuration}
                className="h-10"
              />
            </div>
          </div>

          {showFailureMode && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Limiting Factor</Label>
                <FieldPopover text={LIMITING_FACTOR_TOOLTIP} />
              </div>
              <Select
                value={draftSet.failureMode ?? "untracked"}
                onValueChange={handleFailureMode}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Untracked" />
                </SelectTrigger>
                <SelectContent>
                  {failureModeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {notesOpen && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Set Note</Label>
              </div>
              <Textarea
                value={notesStr}
                onChange={handleNotesChange}
                placeholder="Note for this set..."
                className="min-h-[2.5rem] resize-none text-sm"
                rows={2}
                maxLength={2000}
              />
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="w-full h-10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete set
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this set?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove {titleOverride ? `${labelOverride ?? `#${index + 1}`} ${titleOverride}` : `Set ${index + 1}`} from this exercise.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    flushPendingUpdate();
                    onDelete();
                  }}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
