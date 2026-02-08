"use client";

import * as React from "react";
import { Dumbbell, Activity, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import { ExerciseCombobox, type ExerciseGroupOption } from "./ExerciseCombobox";
import type { ExerciseEntry } from "@/lib/gym";

interface AddExerciseProps {
  strengthGroups: ExerciseGroupOption[];
  onSelectExercise: (exerciseKey: string) => void;
  sessionExercises: ExerciseEntry[];
  onEndSession: () => void;
}

export function AddExercise({
  strengthGroups,
  onSelectExercise,
  sessionExercises,
  onEndSession,
}: AddExerciseProps) {
  const hasExercises = sessionExercises.length > 0;

  return (
    <div className="flex flex-col items-center justify-center px-2 py-8 space-y-8">
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
          placeholder="Search exercises..."
        />
      </div>

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

      {/* Save and End Session */}
      {hasExercises && (
        <Button
          onClick={onEndSession}
          className="w-full h-14 text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-900/30"
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Save and End Session
        </Button>
      )}
    </div>
  );
}
