"use client";

import * as React from "react";
import { MoreVertical, Info, SplitSquareHorizontal, Trash2 } from "lucide-react";
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
import type { RepInputStyle, StrengthRepMode, StrengthSet } from "@/lib/gym";

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
  onUpdate: (set: StrengthSet) => void;
  onSplitRepsToggle: () => void;
  onDelete: () => void;
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

export function SetCard({
  index,
  set,
  isPr = false,
  splitReps,
  repMode = "bilateral",
  repInputStyle = "dropdown",
  onUpdate,
  onSplitRepsToggle,
  onDelete,
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
  const repsLabel = !isUnilateral
    ? "Reps (bilateral)"
    : splitReps
      ? "Reps (Left // Right)"
      : "Reps (unilateral)";

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
      value={`set-${index}`}
      className={`border rounded-xl px-4 transition-colors ${
        isPr
          ? "border-emerald-600 bg-gradient-to-br from-emerald-950/50 to-teal-950/40"
          : "border-teal-800 bg-card/40"
      }`}
    >
      <AccordionTrigger className="text-sm hover:no-underline">
        <span className="text-muted-foreground text-xs mr-2">#{index + 1}</span>
        <span className="flex-1 text-left">{hasData ? formatTitle(index, draftSet, hasData) : `Set ${index + 1}`}</span>
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
                    {isUnilateral && (
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
                    )}
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

                    {/* Context menu: only relevant for unilateral lifts */}
                    {isUnilateral && (
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
                    )}
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
                  This will permanently remove Set {index + 1} from this exercise.
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
