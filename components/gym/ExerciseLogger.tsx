"use client";

import * as React from "react";
import { Plus, Save } from "lucide-react";
import { Accordion } from "@/components/ui_primitives/accordion";
import { Button } from "@/components/ui_primitives/button";
import { SetCard } from "./SetCard";
import type { StrengthSet, ExerciseDefinition } from "@/lib/gym";

interface ExerciseLoggerProps {
  exercise: ExerciseDefinition;
  sets: StrengthSet[];
  onSetsChange: (sets: StrengthSet[]) => void;
  onSaveExercise: () => void;
  variations?: Record<string, string>;
}

function makeEmptySet(): StrengthSet {
  return { weight: 0, reps: { bilateral: 0 } };
}

export function ExerciseLogger({
  exercise,
  sets,
  onSetsChange,
  onSaveExercise,
  variations,
}: ExerciseLoggerProps) {
  // Track which sets have split L/R reps enabled
  const [splitMap, setSplitMap] = React.useState<Record<number, boolean>>({});
  // Track which accordion items are open (all new sets start open)
  const [openItems, setOpenItems] = React.useState<string[]>(
    sets.length > 0 ? [`set-${sets.length - 1}`] : ["set-0"],
  );

  const handleUpdateSet = (index: number, updated: StrengthSet) => {
    const next = [...sets];
    next[index] = updated;
    onSetsChange(next);
  };

  const handleAddSet = () => {
    const nextIndex = sets.length;
    onSetsChange([...sets, makeEmptySet()]);
    setOpenItems([`set-${nextIndex}`]);
  };

  const handleSplitToggle = (index: number) => {
    const isSplit = !!splitMap[index];
    setSplitMap((prev) => ({ ...prev, [index]: !isSplit }));

    // Convert reps format when toggling
    const s = sets[index];
    if (isSplit) {
      // merge back to bilateral: take max of left/right
      const bilateral = Math.max(s.reps.left ?? 0, s.reps.right ?? 0);
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

  // Build variation summary for display
  const variationSummary = variations
    ? Object.values(variations).join(", ")
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Exercise Header */}
      <div className="px-1 pb-4">
        <h2 className="text-xl font-semibold text-foreground">{exercise.name}</h2>
        {variationSummary && (
          <p className="text-xs text-muted-foreground mt-0.5">{variationSummary}</p>
        )}
      </div>

      {/* Set Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
          {sets.map((set, i) => (
            <SetCard
              key={i}
              index={i}
              set={set}
              isOpen={openItems.includes(`set-${i}`)}
              splitReps={!!splitMap[i]}
              onUpdate={(updated) => handleUpdateSet(i, updated)}
              onSplitRepsToggle={() => handleSplitToggle(i)}
            />
          ))}
        </Accordion>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2 pb-4">
        <Button
          variant="outline"
          className="flex-1 h-12 border-dashed border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
          onClick={handleAddSet}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Set
        </Button>
        <Button
          className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
          disabled={!canSave}
          onClick={onSaveExercise}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Exercise
        </Button>
      </div>
    </div>
  );
}
