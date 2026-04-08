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
import type { RepInputStyle, StrengthSet, ExerciseDefinition, ExerciseStats } from "@/lib/gym";
import { VARIATION_TEMPLATE_MAP, calculateSetVolume } from "@/lib/gym";

interface ExerciseLoggerProps {
  exercise: ExerciseDefinition;
  sets: StrengthSet[];
  onSetsChange: (sets: StrengthSet[]) => void;
  onSaveExercise: () => void;
  onDiscardExercise: () => void;
  onEditVariations?: () => void;
  variations?: Record<string, string>;
  stats?: ExerciseStats | null;
  presetName?: string | null;
  repInputStyle?: RepInputStyle;
  carryOverWeight?: boolean;
  carryOverReps?: boolean;
  sessionExerciseNotes?: string;
  onSessionExerciseNotesChange?: (notes: string) => void;
  onPersistentNoteChange?: (notes: string | null) => void;
}

function makeEmptySet(): StrengthSet {
  return { weight: 0, reps: { bilateral: 0 } };
}

function makeSetId(): string {
  return `set-${Math.random().toString(36).slice(2, 10)}`;
}

const MOCK_EXERCISE_STATS: ExerciseStats = {
  exerciseKey: "mockExercise",
  displayName: "Mock Exercise",
  category: "upperBody",
  mostRecentSession: {
    date: "20260210",
    sets: [
      { weight: 115, reps: { bilateral: 8 }, effort: 7 },
      { weight: 125, reps: { bilateral: 6 }, effort: 8 },
      { weight: 135, reps: { bilateral: 4 }, effort: 9 },
    ],
  },
  recordSet: {
    date: "20260130",
    weight: 145,
    reps: { bilateral: 5 },
    totalVolume: 725,
  },
  // Sum of mostRecentSession set volumes:
  // 115*8 = 920, 125*6 = 750, 135*4 = 540 => 2210
  bestSessionVolume: 2210,
};

export function ExerciseLogger({
  exercise,
  sets,
  onSetsChange,
  onSaveExercise,
  onDiscardExercise,
  onEditVariations,
  variations,
  stats,
  presetName,
  repInputStyle,
  carryOverWeight = true,
  carryOverReps = false,
  sessionExerciseNotes,
  onSessionExerciseNotesChange,
  onPersistentNoteChange,
}: ExerciseLoggerProps) {
  const repMode =
    exercise.repMode ?? (exercise.isUnilateral ? "dualUnilateral" : "bilateral");

  // Track which sets have split L/R reps enabled
  const [splitMap, setSplitMap] = React.useState<Record<number, boolean>>({});
  // Stable per-set IDs so each card keeps identity across insert/delete
  const [setIds, setSetIds] = React.useState<string[]>(() => sets.map(() => makeSetId()));
  // Track which accordion item is open (new sets start open)
  const [openItem, setOpenItem] = React.useState<string>(() =>
    sets.length > 0 ? `set-${sets.length - 1}` : "",
  );
  const [statsCollapsed, setStatsCollapsed] = React.useState(true);

  React.useEffect(() => {
    setSetIds((prev) => {
      if (prev.length === sets.length) return prev;
      if (prev.length < sets.length) {
        const toAdd = Array.from({ length: sets.length - prev.length }, () => makeSetId());
        return [...prev, ...toAdd];
      }
      return prev.slice(0, sets.length);
    });
  }, [sets.length]);

  const handleOpenChange = React.useCallback((next: string) => {
    // Radix sets `""` when collapsible + fully closed
    setOpenItem(next);
  }, []);

  const handleUpdateSet = (index: number, updated: StrengthSet) => {
    const next = [...sets];
    next[index] = updated;
    onSetsChange(next);
  };

  const handleDeleteSet = (setId: string) => {
    const index = setIds.indexOf(setId);
    if (index === -1) return;

    const nextSets = sets.filter((_, i) => i !== index);
    onSetsChange(nextSets);
    setSetIds((prev) => prev.filter((id) => id !== setId));

    // Reindex splitMap so it continues to align with set indices
    setSplitMap((prev) => {
      const next: Record<number, boolean> = {};
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k);
        if (Number.isNaN(idx) || idx === index) continue;
        next[idx > index ? idx - 1 : idx] = v;
      }
      return next;
    });

    // Keep the accordion open item stable after deletion
    setOpenItem((prev) => {
      if (!prev) return "";
      const match = /^set-(\d+)$/.exec(prev);
      const prevIdx = match ? Number(match[1]) : undefined;
      if (prevIdx === undefined || Number.isNaN(prevIdx)) return prev;

      if (nextSets.length === 0) return "";

      if (prevIdx === index) {
        const nextOpenIdx = Math.min(index, nextSets.length - 1);
        return `set-${nextOpenIdx}`;
      }

      if (prevIdx > index) return `set-${prevIdx - 1}`;
      return prev;
    });
  };

  const handleAddSet = () => {
    const nextIndex = sets.length;
    const lastSet = sets[sets.length - 1];
    const newSet: StrengthSet = {
      weight: carryOverWeight && lastSet ? lastSet.weight : 0,
      reps: carryOverReps && lastSet ? { ...lastSet.reps } : { bilateral: 0 },
    };
    onSetsChange([...sets, newSet]);
    setSetIds((prev) => [...prev, makeSetId()]);
    setOpenItem(`set-${nextIndex}`);
  };

  const handleSplitToggle = (index: number) => {
    const isSplit = !!splitMap[index];
    setSplitMap((prev) => ({ ...prev, [index]: !isSplit }));

    // Convert reps format when toggling
    const s = sets[index];
    if (isSplit) {
      // merge back to bilateral: keep left, discard right
      const bilateral = s.reps.left ?? 0;
      handleUpdateSet(index, { ...s, reps: { bilateral } });
    } else {
      // split: copy bilateral to both sides
      const val = s.reps.bilateral ?? 0;
      handleUpdateSet(index, { ...s, reps: { left: val, right: val } });
    }
  };

  // Validate that exercise can be saved (at least one set with weight and reps)
  const canSave = sets.some((s) => {
    const hasWeight = s.weight > 0;
    const hasReps =
      (s.reps.bilateral !== undefined && s.reps.bilateral > 0) ||
      ((s.reps.left ?? 0) > 0 && (s.reps.right ?? 0) > 0);
    return hasWeight && hasReps;
  });

  const variationChips = React.useMemo(() => {
    if (!variations || Object.keys(variations).length === 0) return [];

    const templateOrder = Object.keys(exercise.variationTemplates ?? {});
    const templateOrderIndex = new Map(templateOrder.map((id, index) => [id, index]));

    const chips = Object.entries(variations)
      .map(([templateId, optionKey]) => {
        const template = VARIATION_TEMPLATE_MAP.get(templateId);
        const override = exercise.variationTemplates?.[templateId];
        const option = template?.options.find((opt) => opt.key === optionKey);

        const label = override?.labelOverride ?? template?.label ?? templateId;
        const value = override?.optionLabelOverrides?.[optionKey] ?? option?.label ?? optionKey;

        return {
          key: `${templateId}:${optionKey}`,
          label,
          value,
          templateId,
          optionKey,
          isUntracked: optionKey === "untracked",
        };
      });

    const hasAnyUntracked = chips.some((chip) => chip.isUntracked);

    return chips.sort((a, b) => {
      if (hasAnyUntracked && a.isUntracked !== b.isUntracked) {
        return a.isUntracked ? -1 : 1;
      }
      const aIndex = templateOrderIndex.get(a.templateId) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = templateOrderIndex.get(b.templateId) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex || a.templateId.localeCompare(b.templateId);
    });
  }, [exercise.variationTemplates, variations]);

  const MAX_VISIBLE_CHIPS = 2;
  const visibleVariationChips = statsCollapsed
    ? variationChips.slice(0, MAX_VISIBLE_CHIPS)
    : variationChips;
  const hiddenVariationChipCount = Math.max(variationChips.length - visibleVariationChips.length, 0);
  const statsForDisplay =
    stats ?? (process.env.NODE_ENV === "development" ? MOCK_EXERCISE_STATS : null);
  const historicalRecordWeight = statsForDisplay?.recordSet?.weight ?? 0;
  const historicalBestSetVolume = React.useMemo(() => {
    if (!statsForDisplay) return 0;
    const recordSetVolume = statsForDisplay.recordSet?.totalVolume ?? 0;
    const prevBestSetVolume = (statsForDisplay.mostRecentSession?.sets ?? []).reduce(
      (max, s) => Math.max(max, calculateSetVolume(s)),
      0,
    );
    return Math.max(recordSetVolume, prevBestSetVolume);
  }, [statsForDisplay]);

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Exercise Header */}
      <div className="relative w-[calc(100vw-0.5rem)] -translate-x-1 align-self-start px-3 pt-3 pb-1 bg-gradient-to-br from-blue-950/35 to-emerald-950/60 rounded-xl border border-blue-400">
        <h2 className="text-xl font-semibold text-foreground">
          {exercise.name}
          {presetName && (
            <span className="text-base font-normal text-blue-400"> · {presetName}</span>
          )}
        </h2>
        {visibleVariationChips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {visibleVariationChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={onEditVariations}
                className={`inline-flex shrink-0 items-center border px-2 py-0.5 text-[11px] ${
                  chip.isUntracked
                    ? "rounded-lg border-red-500/70 bg-red-500/10 text-red-200"
                    : "rounded-lg border-white/10 bg-white/5 text-muted-foreground"
                }`}
              >
                <span className={chip.isUntracked ? "text-red-100" : "text-foreground/90"}>
                  {chip.label}
                </span>
                <span className={`mx-1 ${chip.isUntracked ? "text-red-300/70" : "text-muted-foreground/60"}`}>
                  :
                </span>
                <span>{chip.value}</span>
              </button>
            ))}
            {hiddenVariationChipCount > 0 && (
              <button
                type="button"
                onClick={onEditVariations}
                className="inline-flex shrink-0 items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-white/10"
              >
                +{hiddenVariationChipCount} more
              </button>
            )}
          </div>
        )}
        <ExerciseStatsInline
          stats={statsForDisplay}
          currentSets={sets}
          onCollapsedChange={setStatsCollapsed}
          sessionExerciseNotes={sessionExerciseNotes}
          onSessionExerciseNotesChange={onSessionExerciseNotesChange}
          onPersistentNoteChange={onPersistentNoteChange}
        />
      </div>

      {/* Set Cards */}
      <div className="flex flex-col flex-wrap h-fit pb-4 mt-2">
        <Accordion
          type="single"
          collapsible
          className="flex flex-col gap-2"
          value={openItem}
          onValueChange={handleOpenChange}
        >
          {sets.map((set, i) => (
            <SetCard
              key={setIds[i] ?? `set-fallback-${i}`}
              index={i}
              set={set}
              isPr={
                !!statsForDisplay &&
                ((historicalRecordWeight > 0 && set.weight > historicalRecordWeight) ||
                  (historicalBestSetVolume > 0 &&
                    calculateSetVolume(set) > historicalBestSetVolume))
              }
              splitReps={!!splitMap[i]}
              repMode={repMode}
              repInputStyle={repInputStyle ?? "dropdown"}
              onUpdate={(updated) => handleUpdateSet(i, updated)}
              onSplitRepsToggle={() => handleSplitToggle(i)}
              onDelete={() => {
                const setId = setIds[i];
                if (setId) handleDeleteSet(setId);
              }}
            />
          ))}
        </Accordion>
      </div>

      {/* Action Buttons */}
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
                <AlertDialogTitle>Discard this exercise?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will discard {exercise.name} and all sets you&apos;ve entered. You&apos;ll return to the exercise selection screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep logging</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDiscardExercise}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="outline"
            className="col-span-2 h-12 border-dashed border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            onClick={handleAddSet}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Set
          </Button>
          <Button
            className="col-span-2 h-12 bg-green-600 hover:bg-green-700 text-white"
            disabled={!canSave}
            onClick={onSaveExercise}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Exercise
          </Button>
        </div>
      </div>
    </div>
  );
}
