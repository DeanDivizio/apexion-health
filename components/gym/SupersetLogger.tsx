"use client";

import * as React from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Accordion } from "@/components/ui_primitives/accordion";
import { Button } from "@/components/ui_primitives/button";
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
import { SetCard } from "./SetCard";
import { ExerciseStatsInline } from "./ExerciseStatsPanel";
import type {
  RepInputStyle,
  StrengthSet,
  ExerciseDefinition,
  ExerciseStats,
  StrengthRepMode,
} from "@/lib/gym";
import { VARIATION_TEMPLATE_MAP, calculateSetVolume } from "@/lib/gym";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SupersetLoggerProps {
  exerciseA: ExerciseDefinition;
  exerciseB: ExerciseDefinition;
  setsA: StrengthSet[];
  setsB: StrengthSet[];
  onSetsAChange: (sets: StrengthSet[]) => void;
  onSetsBChange: (sets: StrengthSet[]) => void;
  onSaveSuperset: () => void;
  onDiscardSuperset: () => void;
  onEditVariationsA?: () => void;
  onEditVariationsB?: () => void;
  variationsA?: Record<string, string>;
  variationsB?: Record<string, string>;
  statsA?: ExerciseStats | null;
  statsB?: ExerciseStats | null;
  presetNameA?: string | null;
  presetNameB?: string | null;
  repInputStyle?: RepInputStyle;
  carryOverWeight?: boolean;
  carryOverReps?: boolean;
  showFailureMode?: boolean;
}

function makeEmptySet(repMode?: StrengthRepMode): StrengthSet {
  if (repMode === "dualUnilateral") {
    return { weight: 0, reps: { left: 0, right: 0 } };
  }
  return { weight: 0, reps: { bilateral: 0 } };
}

function makeSetId(): string {
  return `set-${Math.random().toString(36).slice(2, 10)}`;
}

function isSplitReps(set: StrengthSet): boolean {
  return set.reps.left !== undefined || set.reps.right !== undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SupersetLogger({
  exerciseA,
  exerciseB,
  setsA,
  setsB,
  onSetsAChange,
  onSetsBChange,
  onSaveSuperset,
  onDiscardSuperset,
  onEditVariationsA,
  onEditVariationsB,
  variationsA,
  variationsB,
  statsA,
  statsB,
  presetNameA,
  presetNameB,
  repInputStyle,
  carryOverWeight = true,
  carryOverReps = false,
  showFailureMode = true,
}: SupersetLoggerProps) {
  const repModeA: StrengthRepMode =
    exerciseA.repMode ?? (exerciseA.isUnilateral ? "dualUnilateral" : "bilateral");
  const repModeB: StrengthRepMode =
    exerciseB.repMode ?? (exerciseB.isUnilateral ? "dualUnilateral" : "bilateral");

  const roundCount = Math.max(setsA.length, setsB.length);

  // Header stats switcher
  const [statsTab, setStatsTab] = React.useState<"A" | "B">("A");
  const [statsCollapsed, setStatsCollapsed] = React.useState(true);

  // Stable IDs for set cards
  const [setIdsA, setSetIdsA] = React.useState<string[]>(() => setsA.map(() => makeSetId()));
  const [setIdsB, setSetIdsB] = React.useState<string[]>(() => setsB.map(() => makeSetId()));

  // Sync set IDs
  React.useEffect(() => {
    setSetIdsA((prev) => {
      if (prev.length === setsA.length) return prev;
      if (prev.length < setsA.length) {
        return [...prev, ...Array.from({ length: setsA.length - prev.length }, () => makeSetId())];
      }
      return prev.slice(0, setsA.length);
    });
  }, [setsA.length]);

  React.useEffect(() => {
    setSetIdsB((prev) => {
      if (prev.length === setsB.length) return prev;
      if (prev.length < setsB.length) {
        return [...prev, ...Array.from({ length: setsB.length - prev.length }, () => makeSetId())];
      }
      return prev.slice(0, setsB.length);
    });
  }, [setsB.length]);

  const handleUpdateSetA = (index: number, updated: StrengthSet) => {
    const next = [...setsA];
    next[index] = updated;
    onSetsAChange(next);
  };

  const handleUpdateSetB = (index: number, updated: StrengthSet) => {
    const next = [...setsB];
    next[index] = updated;
    onSetsBChange(next);
  };

  const handleDeleteRound = (roundIndex: number) => {
    if (roundCount <= 1) return;
    const nextA = setsA.filter((_, i) => i !== roundIndex);
    const nextB = setsB.filter((_, i) => i !== roundIndex);
    onSetsAChange(nextA);
    onSetsBChange(nextB);
    setSetIdsA((prev) => prev.filter((_, i) => i !== roundIndex));
    setSetIdsB((prev) => prev.filter((_, i) => i !== roundIndex));
  };

  const handleAddRound = () => {
    const lastA = setsA[setsA.length - 1];
    const lastB = setsB[setsB.length - 1];
    const lastAIsSplit = lastA ? isSplitReps(lastA) : repModeA === "dualUnilateral";
    const lastBIsSplit = lastB ? isSplitReps(lastB) : repModeB === "dualUnilateral";
    const zeroedA: StrengthSet["reps"] = lastAIsSplit ? { left: 0, right: 0 } : { bilateral: 0 };
    const zeroedB: StrengthSet["reps"] = lastBIsSplit ? { left: 0, right: 0 } : { bilateral: 0 };
    const carriedA: StrengthSet["reps"] | undefined =
      lastA && carryOverReps ? { ...lastA.reps } : undefined;
    const carriedB: StrengthSet["reps"] | undefined =
      lastB && carryOverReps ? { ...lastB.reps } : undefined;
    const newSetA: StrengthSet = {
      weight: carryOverWeight && lastA ? lastA.weight : 0,
      reps: carriedA ?? zeroedA,
    };
    const newSetB: StrengthSet = {
      weight: carryOverWeight && lastB ? lastB.weight : 0,
      reps: carriedB ?? zeroedB,
    };
    onSetsAChange([...setsA, newSetA]);
    onSetsBChange([...setsB, newSetB]);
    setSetIdsA((prev) => [...prev, makeSetId()]);
    setSetIdsB((prev) => [...prev, makeSetId()]);
  };

  const handleSplitToggleA = (index: number) => {
    if (repModeA === "dualUnilateral") return;
    const s = setsA[index];
    const isSplit = isSplitReps(s);
    if (isSplit) {
      const bilateral = Math.max(s.reps.left ?? 0, s.reps.right ?? 0);
      handleUpdateSetA(index, { ...s, reps: { bilateral } });
    } else {
      const val = s.reps.bilateral ?? 0;
      handleUpdateSetA(index, { ...s, reps: { left: val, right: val } });
    }
  };

  const handleSplitToggleB = (index: number) => {
    if (repModeB === "dualUnilateral") return;
    const s = setsB[index];
    const isSplit = isSplitReps(s);
    if (isSplit) {
      const bilateral = Math.max(s.reps.left ?? 0, s.reps.right ?? 0);
      handleUpdateSetB(index, { ...s, reps: { bilateral } });
    } else {
      const val = s.reps.bilateral ?? 0;
      handleUpdateSetB(index, { ...s, reps: { left: val, right: val } });
    }
  };

  // Validate: both exercises need at least one valid set
  const hasValidSetA = setsA.some(
    (s) =>
      s.weight > 0 &&
      ((s.reps.bilateral !== undefined && s.reps.bilateral > 0) ||
        ((s.reps.left ?? 0) > 0 && (s.reps.right ?? 0) > 0)),
  );
  const hasValidSetB = setsB.some(
    (s) =>
      s.weight > 0 &&
      ((s.reps.bilateral !== undefined && s.reps.bilateral > 0) ||
        ((s.reps.left ?? 0) > 0 && (s.reps.right ?? 0) > 0)),
  );
  const canSave = hasValidSetA && hasValidSetB;

  // Stats display
  const activeStats = statsTab === "A" ? statsA : statsB;
  const activeSets = statsTab === "A" ? setsA : setsB;
  const activeStatsExercise = statsTab === "A" ? exerciseA : exerciseB;
  const activeVariations = statsTab === "A" ? variationsA : variationsB;
  const activePresetName = statsTab === "A" ? presetNameA : presetNameB;

  const variationChips = React.useMemo(() => {
    if (!activeVariations || Object.keys(activeVariations).length === 0) return [];
    return Object.entries(activeVariations).map(([templateId, optionKey]) => {
      const template = VARIATION_TEMPLATE_MAP.get(templateId);
      const override = activeStatsExercise.variationTemplates?.[templateId];
      const option = template?.options.find((opt) => opt.key === optionKey);
      const label = override?.labelOverride ?? template?.label ?? templateId;
      const value = override?.optionLabelOverrides?.[optionKey] ?? option?.label ?? optionKey;
      return { key: `${templateId}:${optionKey}`, label, value, isUntracked: optionKey === "untracked" };
    });
  }, [activeStatsExercise.variationTemplates, activeVariations]);

  // PR detection helpers
  const historicalRecordWeightA = statsA?.recordSet?.weight ?? 0;
  const historicalRecordWeightB = statsB?.recordSet?.weight ?? 0;
  const historicalBestSetVolumeA = React.useMemo(() => {
    if (!statsA) return 0;
    const rv = statsA.recordSet?.totalVolume ?? 0;
    const pv = (statsA.mostRecentSession?.sets ?? []).reduce(
      (max, s) => Math.max(max, calculateSetVolume(s)),
      0,
    );
    return Math.max(rv, pv);
  }, [statsA]);
  const historicalBestSetVolumeB = React.useMemo(() => {
    if (!statsB) return 0;
    const rv = statsB.recordSet?.totalVolume ?? 0;
    const pv = (statsB.mostRecentSession?.sets ?? []).reduce(
      (max, s) => Math.max(max, calculateSetVolume(s)),
      0,
    );
    return Math.max(rv, pv);
  }, [statsB]);

  return (
    <div className="flex flex-col w-full pb-12">
      {/* ── Superset Header ─────────────────────────────────────────── */}
      <div className="relative w-[calc(100vw-0.5rem)] -translate-x-1 align-self-start px-3 pt-3 pb-1 bg-gradient-to-br from-purple-950/35 to-blue-950/60 rounded-xl border border-purple-400">
        <h2 className="text-lg font-semibold text-foreground leading-tight">
          {exerciseA.name}
          <span className="text-muted-foreground/60 mx-1.5">+</span>
          {exerciseB.name}
        </h2>

        {activePresetName && (
          <span className="text-sm text-purple-400 mt-0.5 block">Preset: {activePresetName}</span>
        )}

        {/* A/B stats switcher */}
        <div className="mt-2 mb-4">
          <div className="flex h-8 items-center rounded-xl bg-muted/60 p-0.5 text-xs w-full">
            <button
              type="button"
              className={`flex-1 min-w-0 px-3 py-1 rounded-[0.5rem] font-medium transition-colors truncate ${
                statsTab === "A"
                  ? "bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setStatsTab("A")}
            >
              A · {exerciseA.name}
            </button>
            <button
              type="button"
              className={`flex-1 min-w-0 px-3 py-1 rounded-[0.5rem] font-medium transition-colors truncate ${
                statsTab === "B"
                  ? "bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setStatsTab("B")}
            >
              B · {exerciseB.name}
            </button>
          </div>
        </div>

        {variationChips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {variationChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={statsTab === "A" ? onEditVariationsA : onEditVariationsB}
                className={`inline-flex shrink-0 items-center border px-2 py-0.5 text-[11px] ${
                  chip.isUntracked
                    ? "rounded-lg border-red-500/70 bg-red-500/10 text-red-200"
                    : "rounded-lg border-white/10 bg-white/5 text-muted-foreground"
                }`}
              >
                <span className={chip.isUntracked ? "text-red-100" : "text-foreground/90"}>
                  {chip.label}
                </span>
                <span className={`mx-1 ${chip.isUntracked ? "text-red-300/70" : "text-muted-foreground/60"}`}>:</span>
                <span>{chip.value}</span>
              </button>
            ))}
          </div>
        )}

        <ExerciseStatsInline
          stats={activeStats ?? null}
          currentSets={activeSets}
          onCollapsedChange={setStatsCollapsed}
        />
      </div>

      {/* ── Interleaved Set Cards ────────────────────────────────────── */}
      <Accordion type="single" collapsible className="flex flex-col gap-2 pb-4 mt-2">
        {Array.from({ length: roundCount }, (_, ri) => {
          const setA = setsA[ri] ?? makeEmptySet(repModeA);
          const setB = setsB[ri] ?? makeEmptySet(repModeB);
          const isPrA =
            !!statsA &&
            ((historicalRecordWeightA > 0 && setA.weight > historicalRecordWeightA) ||
              (historicalBestSetVolumeA > 0 && calculateSetVolume(setA) > historicalBestSetVolumeA));
          const isPrB =
            !!statsB &&
            ((historicalRecordWeightB > 0 && setB.weight > historicalRecordWeightB) ||
              (historicalBestSetVolumeB > 0 && calculateSetVolume(setB) > historicalBestSetVolumeB));

          return (
            <React.Fragment key={setIdsA[ri] ?? `round-${ri}`}>
              <div className={`flex items-center gap-2 px-1 ${ri > 0 ? "mt-2" : ""}`}>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                  Round {ri + 1}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <SetCard
                index={ri}
                set={setA}
                isPr={isPrA}
                splitReps={repModeA === "dualUnilateral" || isSplitReps(setA)}
                repMode={repModeA}
                repInputStyle={repInputStyle ?? "dropdown"}
                showFailureMode={showFailureMode}
                muscleTargets={exerciseA.baseTargets}
                onUpdate={(updated) => handleUpdateSetA(ri, updated)}
                onSplitRepsToggle={() => handleSplitToggleA(ri)}
                onDelete={() => handleDeleteRound(ri)}
                labelOverride={`${ri + 1}a`}
                titleOverride={exerciseA.name}
                accentColorClass="border-l-2 border-l-teal-500"
                accordionValue={`round-${ri}-a`}
              />
              <SetCard
                index={ri}
                set={setB}
                isPr={isPrB}
                splitReps={repModeB === "dualUnilateral" || isSplitReps(setB)}
                repMode={repModeB}
                repInputStyle={repInputStyle ?? "dropdown"}
                showFailureMode={showFailureMode}
                muscleTargets={exerciseB.baseTargets}
                onUpdate={(updated) => handleUpdateSetB(ri, updated)}
                onSplitRepsToggle={() => handleSplitToggleB(ri)}
                onDelete={() => handleDeleteRound(ri)}
                labelOverride={`${ri + 1}b`}
                titleOverride={exerciseB.name}
                accentColorClass="border-l-2 border-l-purple-500"
                accordionValue={`round-${ri}-b`}
              />
            </React.Fragment>
          );
        })}
      </Accordion>

      {/* ── Action Buttons ──────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 pb-8 z-30 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="mx-auto w-full px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] grid grid-cols-5 gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="col-span-1 h-12 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this superset?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will discard {exerciseA.name} + {exerciseB.name} and all rounds
                  you&apos;ve entered. You&apos;ll return to the exercise selection screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep logging</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDiscardSuperset}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            className="col-span-2 h-12 border-dashed border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
            onClick={handleAddRound}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Round
          </Button>
          <Button
            className="col-span-2 h-12 bg-green-600 hover:bg-green-700 text-white"
            disabled={!canSave}
            onClick={onSaveSuperset}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Superset
          </Button>
        </div>
      </div>
    </div>
  );
}
