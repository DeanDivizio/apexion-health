"use client";

import * as React from "react";
import { X, Clock, CalendarDays, Dumbbell, Flame, Weight } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui_primitives/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui_primitives/accordion";
import { Button } from "@/components/ui_primitives/button";
import { Calendar } from "@/components/ui_primitives/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui_primitives/popover";
import { Input } from "@/components/ui_primitives/input";
import { Separator } from "@/components/ui_primitives/separator";
import { ScrollArea } from "@/components/ui_primitives/scroll-area";
import type {
  ExerciseEntry,
  ExerciseDefinition,
} from "@/lib/gym";
import { calculateSetVolume, EXERCISE_MAP } from "@/lib/gym";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SessionOverviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: ExerciseEntry[];
  sessionDate: Date;
  onSessionDateChange: (date: Date) => void;
  startTime: string; // e.g. "5:10 AM"
  onStartTimeChange: (time: string) => void;
  endTimeLabel: string; // "now" or a specific time
  onEndTimeChange: (time: string | null) => void; // null = use "now"
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getExerciseName(key: string): string {
  return EXERCISE_MAP.get(key)?.name ?? key;
}

function formatReps(entry: ExerciseEntry): string {
  if (entry.type !== "strength") return "";
  return entry.sets
    .map((s) => {
      if (s.reps.bilateral !== undefined) return String(s.reps.bilateral);
      return `L${s.reps.left ?? 0}/R${s.reps.right ?? 0}`;
    })
    .join(", ");
}

function computeTotalVolume(exercises: ExerciseEntry[]): number {
  let total = 0;
  for (const ex of exercises) {
    if (ex.type === "strength") {
      for (const set of ex.sets) {
        total += calculateSetVolume(set);
      }
    }
  }
  return Math.round(total);
}

function computeTotalSets(exercises: ExerciseEntry[]): number {
  let count = 0;
  for (const ex of exercises) {
    if (ex.type === "strength") count += ex.sets.length;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SessionOverviewSheet({
  open,
  onOpenChange,
  exercises,
  sessionDate,
  onSessionDateChange,
  startTime,
  onStartTimeChange,
  endTimeLabel,
  onEndTimeChange,
}: SessionOverviewSheetProps) {
  const [editingStartTime, setEditingStartTime] = React.useState(false);
  const [editingEndTime, setEditingEndTime] = React.useState(false);
  const [startTimeInput, setStartTimeInput] = React.useState(startTime);
  const [endTimeInput, setEndTimeInput] = React.useState("");

  const totalVolume = computeTotalVolume(exercises);
  const totalSets = computeTotalSets(exercises);

  const handleStartTimeSave = () => {
    onStartTimeChange(startTimeInput);
    setEditingStartTime(false);
  };

  const handleEndTimeSave = () => {
    if (endTimeInput.trim()) {
      onEndTimeChange(endTimeInput.trim());
    } else {
      onEndTimeChange(null);
    }
    setEditingEndTime(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[85vw] sm:max-w-md flex flex-col p-0 [&>button:last-child]:hidden"
      >
        {/* Custom Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-base font-medium">Session Overview</SheetTitle>
          <UserButton
            appearance={{
              elements: { avatarBox: "h-8 w-8" },
            }}
          />
        </div>

        <Separator />

        {/* Date & Time */}
        <div className="px-4 py-3 space-y-3">
          {/* Date picker */}
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-sm hover:text-blue-400 transition-colors">
                  {sessionDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={(d) => d && onSessionDateChange(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-1 text-sm">
              {/* Start time */}
              {editingStartTime ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                    className="h-7 w-24 text-xs"
                    placeholder="5:10 AM"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleStartTimeSave()}
                    onBlur={handleStartTimeSave}
                  />
                </div>
              ) : (
                <button
                  className="hover:text-blue-400 transition-colors"
                  onClick={() => {
                    setStartTimeInput(startTime);
                    setEditingStartTime(true);
                  }}
                >
                  {startTime}
                </button>
              )}

              <span className="text-muted-foreground mx-1">-</span>

              {/* End time */}
              {editingEndTime ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={endTimeInput}
                    onChange={(e) => setEndTimeInput(e.target.value)}
                    className="h-7 w-24 text-xs"
                    placeholder="6:30 PM"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleEndTimeSave()}
                    onBlur={handleEndTimeSave}
                  />
                </div>
              ) : (
                <button
                  className="hover:text-blue-400 transition-colors"
                  onClick={() => {
                    setEndTimeInput(endTimeLabel === "now" ? "" : endTimeLabel);
                    setEditingEndTime(true);
                  }}
                >
                  {endTimeLabel}
                </button>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Exercise List */}
        <ScrollArea className="flex-1 px-4">
          {exercises.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No exercises logged yet.
            </p>
          ) : (
            <Accordion type="multiple" className="py-2">
              {exercises.map((entry, i) => (
                <AccordionItem
                  key={i}
                  value={`ex-${i}`}
                  className="border border-border/40 rounded-lg mb-2 px-3"
                >
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <div className="flex items-center gap-2 flex-1 text-left">
                      <span className="text-xs text-muted-foreground font-mono">
                        {i + 1}.
                      </span>
                      <span>{getExerciseName(entry.exerciseType)}</span>
                      {entry.type === "strength" && (
                        <span className="text-xs text-muted-foreground ml-auto mr-2">
                          {entry.sets.length} set{entry.sets.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {entry.type === "strength" && (
                      <div className="space-y-1.5 pb-1">
                        {entry.sets.map((set, si) => {
                          const reps =
                            set.reps.bilateral !== undefined
                              ? `${set.reps.bilateral} reps`
                              : `L${set.reps.left}/R${set.reps.right}`;
                          return (
                            <div
                              key={si}
                              className="flex justify-between text-xs text-muted-foreground px-1"
                            >
                              <span>Set {si + 1}</span>
                              <span>
                                {set.weight}lbs x {reps}
                                {set.effort ? ` @ RPE ${set.effort}` : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {entry.type === "cardio" && (
                      <div className="text-xs text-muted-foreground px-1 pb-1">
                        {entry.duration} min
                        {entry.distance ? `, ${entry.distance} ${entry.unit ?? "mi"}` : ""}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>

        <Separator />

        {/* Pinned Stats */}
        <div className="px-4 py-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <Dumbbell className="h-4 w-4 mx-auto text-blue-400 mb-1" />
            <p className="text-lg font-semibold">{exercises.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Exercises
            </p>
          </div>
          <div>
            <Flame className="h-4 w-4 mx-auto text-green-400 mb-1" />
            <p className="text-lg font-semibold">{totalSets}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sets</p>
          </div>
          <div>
            <Weight className="h-4 w-4 mx-auto text-amber-400 mb-1" />
            <p className="text-lg font-semibold">
              {totalVolume > 999
                ? `${(totalVolume / 1000).toFixed(1)}k`
                : totalVolume}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Volume (lbs)
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
