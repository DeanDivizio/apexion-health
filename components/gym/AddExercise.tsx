"use client";

import * as React from "react";
import { Dumbbell, Activity, ClipboardCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { ExerciseCombobox, type ExerciseGroupOption } from "./ExerciseCombobox";
import { CreateCustomExerciseSheet } from "./CreateCustomExerciseSheet";
import { CreateSupersetSheet } from "./CreateSupersetSheet";
import type {
  ExerciseEntry,
  ExerciseDefinition,
  CreateCustomExerciseInput,
  SupersetTemplateSummary,
} from "@/lib/gym";

interface AddExerciseProps {
  strengthGroups: ExerciseGroupOption[];
  onSelectExercise: (exerciseKey: string) => void;
  sessionExercises: ExerciseEntry[];
  onReviewSession: () => void;
  onCreateCustomExercise: (input: CreateCustomExerciseInput) => Promise<void>;
  exerciseMap?: Map<string, ExerciseDefinition>;
  savedSupersetTemplates?: SupersetTemplateSummary[];
  onStartSuperset?: (exerciseAKey: string, exerciseBKey: string, templateId?: string) => void;
}

export function AddExercise({
  strengthGroups,
  onSelectExercise,
  sessionExercises,
  onReviewSession,
  onCreateCustomExercise,
  exerciseMap,
  savedSupersetTemplates,
  onStartSuperset,
}: AddExerciseProps) {
  const hasExercises = sessionExercises.length > 0;
  const [createSheetOpen, setCreateSheetOpen] = React.useState(false);
  const [supersetSheetOpen, setSupersetSheetOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleCreateCustom = React.useCallback((query: string) => {
    setSearchQuery(query);
    setCreateSheetOpen(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center px-2 py-8 space-y-8 w-full">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Add Exercise
        </h2>
        <p className="text-sm text-muted-foreground">
          {hasExercises
            ? `${sessionExercises.length} exercise${sessionExercises.length > 1 ? "s" : ""} logged`
            : "Select an exercise to start logging"}
        </p>
      </div>

      {/* Strength Dropdown */}
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Dumbbell className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-muted-foreground">Strength / Resistance</span>
        </div>
        <ExerciseCombobox
          groups={strengthGroups}
          value=""
          onSelect={onSelectExercise}
          onCreateCustom={handleCreateCustom}
          placeholder="Search exercises..."
          className="border-green-500/50 text-white hover:bg-green-500/10"
          icon={<Dumbbell className="h-4 w-4 text-green-400" />}
        />
      </div>

      {/* Create Superset */}
      {onStartSuperset && exerciseMap && (
        <div className="w-full">
          <Button
            variant="outline"
            onClick={() => setSupersetSheetOpen(true)}
            className="w-full h-12 border-purple-500/50 text-white hover:bg-purple-500/10"
          >
            <Zap className="mr-2 h-4 w-4 text-purple-400" />
            Create Superset
          </Button>
        </div>
      )}

      {/* Cardio Dropdown (placeholder) */}
      <div className="w-full space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Activity className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-muted-foreground">Cardio</span>
        </div>
        <ExerciseCombobox
          groups={[]}
          value=""
          onSelect={() => {}}
          placeholder="Coming soon..."
          disabled
        />
      </div>

      {/* Review and Save */}
      {hasExercises && (
        <div className="w-full">
          <Button
            onClick={onReviewSession}
            className="w-full h-14 text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-900/30"
          >
            <ClipboardCheck className="mr-2 h-5 w-5" />
            Review and Save
          </Button>
        </div>
      )}

      {/* Create Custom Exercise Sheet */}
      <CreateCustomExerciseSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        initialSearchQuery={searchQuery}
        onSubmit={onCreateCustomExercise}
      />

      {/* Create Superset Sheet */}
      {onStartSuperset && exerciseMap && (
        <CreateSupersetSheet
          open={supersetSheetOpen}
          onOpenChange={setSupersetSheetOpen}
          strengthGroups={strengthGroups}
          exerciseMap={exerciseMap}
          savedTemplates={savedSupersetTemplates ?? []}
          onStartSuperset={onStartSuperset}
        />
      )}
    </div>
  );
}
