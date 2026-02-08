"use client";

import * as React from "react";
import { MoreHorizontal, Info, SplitSquareHorizontal } from "lucide-react";
import {
  Accordion,
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
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import type { StrengthSet } from "@/lib/gym";

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
  isOpen: boolean;
  splitReps: boolean;
  onUpdate: (set: StrengthSet) => void;
  onSplitRepsToggle: () => void;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function FieldPopover({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="inline-flex">
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
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
  isOpen,
  splitReps,
  onUpdate,
  onSplitRepsToggle,
}: SetCardProps) {
  const hasData = set.weight > 0 || (set.reps.bilateral ?? 0) > 0;

  // ---- weight ----
  const [weightStr, setWeightStr] = React.useState(set.weight > 0 ? String(set.weight) : "");

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // Allow intermediate typing: empty, digits, or digits with one decimal
    if (v === "" || /^\d+\.?(\d)?$/.test(v)) {
      setWeightStr(v);
      if (v === "" || v.endsWith(".")) return;
      if (isValidWeight(v)) {
        onUpdate({ ...set, weight: parseFloat(v) });
      }
    }
  };

  // ---- reps (bilateral) ----
  const handleRepsBilateral = (val: string) => {
    if (val === "custom") return; // handled below
    const n = parseInt(val, 10);
    onUpdate({ ...set, reps: { bilateral: n } });
  };

  // custom reps bilateral
  const [customRepsBilateral, setCustomRepsBilateral] = React.useState("");
  const handleCustomRepsBilateralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setCustomRepsBilateral(v);
    if (v) onUpdate({ ...set, reps: { bilateral: parseInt(v, 10) } });
  };

  // ---- reps (split L/R) ----
  const [leftStr, setLeftStr] = React.useState(String(set.reps.left ?? ""));
  const [rightStr, setRightStr] = React.useState(String(set.reps.right ?? ""));

  const handleLeftReps = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setLeftStr(v);
    if (v) {
      onUpdate({ ...set, reps: { left: parseInt(v, 10), right: set.reps.right ?? 0 } });
    }
  };
  const handleRightReps = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setRightStr(v);
    if (v) {
      onUpdate({ ...set, reps: { left: set.reps.left ?? 0, right: parseInt(v, 10) } });
    }
  };

  // ---- effort ----
  const handleEffort = (val: string) => {
    const n = parseInt(val, 10);
    onUpdate({ ...set, effort: n === 0 ? undefined : n });
  };

  // ---- duration ----
  const [durationStr, setDurationStr] = React.useState(
    set.duration !== undefined ? String(set.duration) : "",
  );
  const handleDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setDurationStr(v);
    onUpdate({ ...set, duration: v ? parseInt(v, 10) : undefined });
  };

  // Determine if custom reps are in use
  const bilateralVal = set.reps.bilateral;
  const isCustomReps = bilateralVal !== undefined && bilateralVal > 20;
  const repsSelectVal =
    splitReps
      ? undefined
      : isCustomReps
        ? "custom"
        : bilateralVal !== undefined
          ? String(bilateralVal)
          : undefined;

  return (
    <AccordionItem
      value={`set-${index}`}
      className="border border-border/50 rounded-lg bg-card/40 px-4"
    >
      <AccordionTrigger className="text-sm hover:no-underline">
        <span className="text-muted-foreground text-xs mr-2">#{index + 1}</span>
        <span className="flex-1 text-left">
          {!isOpen && hasData ? formatTitle(index, set, hasData) : `Set ${index + 1}`}
        </span>
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
                <Label className="text-xs text-muted-foreground">Reps</Label>
                <FieldPopover text={REPS_TOOLTIP} />
              </div>

              {splitReps ? (
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Left
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={leftStr}
                      onChange={handleLeftReps}
                      className="h-10"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Right
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={rightStr}
                      onChange={handleRightReps}
                      className="h-10"
                    />
                  </div>
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

                  {/* Three-dot menu for split reps */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-10 w-10 flex items-center justify-center rounded-md border border-input hover:bg-accent shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onSplitRepsToggle}>
                        <SplitSquareHorizontal className="mr-2 h-4 w-4" />
                        Split L/R Reps
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {/* Custom rep input when "Custom" selected */}
              {!splitReps && repsSelectVal === "custom" && (
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
                value={set.effort !== undefined ? String(set.effort) : "0"}
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
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
