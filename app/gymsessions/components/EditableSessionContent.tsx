"use client"

import { useState } from "react"
import { CalendarDays, Plus, Save, SplitSquareHorizontal, StickyNote, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui_primitives/button"
import { Calendar } from "@/components/ui_primitives/calendar"
import { Input } from "@/components/ui_primitives/input"
import { Textarea } from "@/components/ui_primitives/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui_primitives/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select"
import { capitalize } from "@/lib/utils"
import type { ExerciseEntry, StrengthSet } from "@/lib/gym"
import { EXERCISE_MAP, generateSessionName, MUSCLE_GROUP_LABELS } from "@/lib/gym"
import { inputValueToDateStr, inputValueToTimeStr, spellOutDateShortYear, timeStrToInputValue } from "./helpers"
import type { SessionWithId } from "./types"
import { VariationChips } from "./VariationChips"

interface EditableSessionContentProps {
  initialSession: SessionWithId
  onSave: (updated: SessionWithId) => Promise<void>
  onCancel: () => void
  saving: boolean
  isOpen: boolean
}

const NUMBER_INPUT_NO_SPIN_CLASS =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

function buildEditFailureModeOptions(
  exerciseKey: string,
): { value: string; label: string }[] {
  const muscleOptions: { value: string; label: string }[] = [];
  const def = EXERCISE_MAP.get(exerciseKey);
  if (def) {
    const seen = new Set<string>();
    for (const t of def.baseTargets) {
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
    { value: "cardio", label: "Cardio / Conditioning" },
    { value: "grip", label: "Grip" },
    { value: "general_fatigue", label: "General Fatigue / Energy" },
  ];
}

function EditableSetRow({
  set,
  index,
  setKey,
  exerciseKey,
  onUpdate,
  onDelete,
}: {
  set: StrengthSet
  index: number
  setKey: string
  exerciseKey: string
  onUpdate: (updated: StrengthSet) => void
  onDelete: () => void
}) {
  const isUnilateral = set.reps.left !== undefined && set.reps.right !== undefined

  const commitWeight = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.valueAsNumber
    onUpdate({ ...set, weight: isNaN(v) || v < 0 ? 0 : v })
  }

  const commitBilateralReps = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Math.max(0, parseInt(e.target.value) || 0)
    onUpdate({ ...set, reps: { bilateral: v } })
  }

  const commitLeftReps = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Math.max(0, parseInt(e.target.value) || 0)
    onUpdate({ ...set, reps: { left: v, right: set.reps.right ?? 0 } })
  }

  const commitRightReps = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = Math.max(0, parseInt(e.target.value) || 0)
    onUpdate({ ...set, reps: { left: set.reps.left ?? 0, right: v } })
  }

  const commitEffort = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value)
    onUpdate({ ...set, effort: isNaN(v) || v <= 0 ? undefined : Math.min(v, 10) })
  }

  const commitDuration = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value)
    onUpdate({ ...set, duration: isNaN(v) || v <= 0 ? undefined : v })
  }

  const failureModeOptions = buildEditFailureModeOptions(exerciseKey)
  const commitFailureMode = (val: string) => {
    onUpdate({ ...set, failureMode: val === "untracked" ? undefined : val })
  }

  const commitName = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value.trim()
    onUpdate({ ...set, name: v || undefined })
  }

  const commitNotes = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = e.target.value.trim()
    onUpdate({ ...set, notes: v || undefined })
  }

  const toggleSplitReps = () => {
    if (isUnilateral) {
      const bilateral = Math.max(set.reps.left ?? 0, set.reps.right ?? 0)
      onUpdate({ ...set, reps: { bilateral } })
    } else {
      const val = set.reps.bilateral ?? 0
      onUpdate({ ...set, reps: { left: val, right: val } })
    }
  }

  return (
    <div className="flex items-start gap-1.5 py-2 border-b border-white/5 last:border-b-0">
      <span className="text-[10px] text-muted-foreground/60 font-mono pt-2.5 h-fit my-auto -translate-x-1 w-4 shrink-0 text-center">
        {index + 1}
      </span>
      <div className="flex-1 grid grid-cols-2 gap-1.5">
        <div>
          <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Weight</label>
          <Input
            key={`${setKey}-w`}
            type="number"
            inputMode="decimal"
            step="any"
            defaultValue={set.weight > 0 ? set.weight : ""}
            onBlur={commitWeight}
            placeholder="lbs"
            className={`h-8 text-xs ${NUMBER_INPUT_NO_SPIN_CLASS}`}
          />
        </div>
        {isUnilateral ? (
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Reps (L // R)</label>
              <button
                type="button"
                onClick={toggleSplitReps}
                className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
                aria-label="Merge left and right reps"
              >
                <SplitSquareHorizontal className="h-3 w-3" />
                Merge
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Input
                key={`${setKey}-rl`}
                type="number"
                inputMode="numeric"
                defaultValue={(set.reps.left ?? 0) > 0 ? set.reps.left : ""}
                onBlur={commitLeftReps}
                placeholder="L"
                className={`h-8 text-xs ${NUMBER_INPUT_NO_SPIN_CLASS}`}
              />
              <Input
                key={`${setKey}-rr`}
                type="number"
                inputMode="numeric"
                defaultValue={(set.reps.right ?? 0) > 0 ? set.reps.right : ""}
                onBlur={commitRightReps}
                placeholder="R"
                className={`h-8 text-xs ${NUMBER_INPUT_NO_SPIN_CLASS}`}
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Reps</label>
              <button
                type="button"
                onClick={toggleSplitReps}
                className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
                aria-label="Split left and right reps"
              >
                <SplitSquareHorizontal className="h-3 w-3" />
                Split
              </button>
            </div>
            <Input
              key={`${setKey}-r`}
              type="number"
              inputMode="numeric"
              defaultValue={(set.reps.bilateral ?? 0) > 0 ? set.reps.bilateral : ""}
              onBlur={commitBilateralReps}
              placeholder="Reps"
              className={`h-8 text-xs ${NUMBER_INPUT_NO_SPIN_CLASS}`}
            />
          </div>
        )}
        <div>
          <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Effort</label>
          <Input
            key={`${setKey}-e`}
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            defaultValue={set.effort && set.effort > 0 ? set.effort : ""}
            onBlur={commitEffort}
            placeholder="1-10"
            className={`h-8 text-xs ${NUMBER_INPUT_NO_SPIN_CLASS}`}
          />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Duration</label>
          <Input
            key={`${setKey}-d`}
            type="number"
            inputMode="numeric"
            defaultValue={set.duration && set.duration > 0 ? set.duration : ""}
            onBlur={commitDuration}
            placeholder="sec"
            className={`h-8 text-xs ${NUMBER_INPUT_NO_SPIN_CLASS}`}
          />
        </div>
        <div className="col-span-2">
          <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Limiting Factor</label>
          <Select
            value={set.failureMode ?? "untracked"}
            onValueChange={commitFailureMode}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
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
        <div className="col-span-2 space-y-1">
          <Input
            key={`${setKey}-name`}
            type="text"
            defaultValue={set.name ?? ""}
            onBlur={commitName}
            placeholder="Set name..."
            className="h-7 text-[11px] text-muted-foreground"
            maxLength={100}
          />
          <Input
            key={`${setKey}-n`}
            type="text"
            defaultValue={set.notes ?? ""}
            onBlur={commitNotes}
            placeholder="Set note..."
            className="h-7 text-[11px] text-muted-foreground"
            maxLength={2000}
          />
        </div>
      </div>
      <div className="shrink-0 w-7 self-stretch flex items-end">
        <button
          type="button"
          onClick={onDelete}
          className="h-4/5 w-full rounded-md border border-red-500/40 text-red-400/70 hover:border-red-500/70 hover:text-red-300 active:text-red-200 transition-colors flex items-center justify-center"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function EditableCardioBlock({
  entry,
  entryKey,
  onUpdate,
  onRemove,
}: {
  entry: ExerciseEntry & { type: "cardio" }
  entryKey: string
  onUpdate: (updated: ExerciseEntry) => void
  onRemove: () => void
}) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-foreground/90 leading-tight">{capitalize(entry.exerciseType)}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-red-400/60 hover:text-red-400 active:text-red-300 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <VariationChips variations={entry.variations} />
      <div className="grid grid-cols-3 gap-1.5 mt-2">
        <div>
          <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Duration (min)</label>
          <Input
            key={`${entryKey}-dur`}
            type="number"
            inputMode="numeric"
            defaultValue={entry.duration > 0 ? entry.duration : ""}
            onBlur={(e) => {
              const v = parseInt(e.target.value) || 0
              onUpdate({ ...entry, duration: v })
            }}
            placeholder="min"
            className={`h-8 text-xs ${NUMBER_INPUT_NO_SPIN_CLASS}`}
          />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Distance</label>
          <Input
            key={`${entryKey}-dist`}
            type="number"
            inputMode="decimal"
            step="any"
            defaultValue={entry.distance ?? ""}
            onBlur={(e) => {
              const v = e.target.valueAsNumber
              onUpdate({ ...entry, distance: isNaN(v) ? undefined : v })
            }}
            placeholder="-"
            className={`h-8 text-xs ${NUMBER_INPUT_NO_SPIN_CLASS}`}
          />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Unit</label>
          <Input
            key={`${entryKey}-unit`}
            type="text"
            defaultValue={entry.unit ?? ""}
            onBlur={(e) => {
              const v = e.target.value.trim()
              onUpdate({ ...entry, unit: (v || undefined) as "km" | "mi" | undefined })
            }}
            placeholder="mi/km"
            className="h-8 text-xs"
          />
        </div>
      </div>
    </div>
  )
}

export function EditableSessionContent({
  initialSession,
  onSave,
  onCancel,
  saving,
  isOpen,
}: EditableSessionContentProps) {
  const [draft, setDraft] = useState<SessionWithId>(() => structuredClone(initialSession))
  const [setKeys, setSetKeys] = useState<string[][]>(() =>
    initialSession.exercises.map((ex) => (ex.type === "strength" ? ex.sets.map(() => crypto.randomUUID()) : [])),
  )
  const selectedDate =
    /^\d{8}$/.test(draft.date)
      ? new Date(
          Number.parseInt(draft.date.slice(0, 4), 10),
          Number.parseInt(draft.date.slice(4, 6), 10) - 1,
          Number.parseInt(draft.date.slice(6, 8), 10),
          12,
          0,
          0,
        )
      : undefined

  const updateSet = (exIndex: number, setIndex: number, updated: StrengthSet) => {
    setDraft((prev) => {
      const exercises = [...prev.exercises]
      const exercise = exercises[exIndex]
      if (exercise.type !== "strength") return prev
      const sets = [...exercise.sets]
      sets[setIndex] = updated
      exercises[exIndex] = { ...exercise, sets }
      return { ...prev, exercises }
    })
  }

  const removeSet = (exIndex: number, setIndex: number) => {
    setDraft((prev) => {
      const exercises = [...prev.exercises]
      const exercise = exercises[exIndex]
      if (exercise.type !== "strength" || exercise.sets.length <= 1) return prev
      exercises[exIndex] = { ...exercise, sets: exercise.sets.filter((_, i) => i !== setIndex) }
      return { ...prev, exercises }
    })
    setSetKeys((prev) => prev.map((keys, i) => (i === exIndex ? keys.filter((_, j) => j !== setIndex) : keys)))
  }

  const addSet = (exIndex: number) => {
    setDraft((prev) => {
      const exercises = [...prev.exercises]
      const exercise = exercises[exIndex]
      if (exercise.type !== "strength") return prev
      const lastSet = exercise.sets[exercise.sets.length - 1]
      const lastIsSplit = lastSet && (lastSet.reps.left !== undefined || lastSet.reps.right !== undefined)
      const emptyReps = lastIsSplit ? { left: 0, right: 0 } : { bilateral: 0 }
      exercises[exIndex] = { ...exercise, sets: [...exercise.sets, { weight: 0, reps: emptyReps }] }
      return { ...prev, exercises }
    })
    setSetKeys((prev) => prev.map((keys, i) => (i === exIndex ? [...keys, crypto.randomUUID()] : keys)))
  }

  const updateExercise = (exIndex: number, updated: ExerciseEntry) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => (i === exIndex ? updated : ex)),
    }))
  }

  const removeExercise = (exIndex: number) => {
    if (draft.exercises.length <= 1) return
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== exIndex),
    }))
    setSetKeys((prev) => prev.filter((_, i) => i !== exIndex))
  }

  const canSave = draft.exercises.length > 0 && draft.date.length === 8 && draft.startTime.length > 0

  return (
    <div
      className={`rounded-xl border border-blue-500/50 bg-gradient-to-br from-blue-950/30 via-card/60 to-emerald-950/15 overflow-hidden transition-[opacity,transform] ease-out ${
        isOpen ? "duration-300" : "duration-200"
      } ${
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-[0.99]"
      }`}
    >
      <div className="px-4 pt-4 pb-3 border-b border-border/30 space-y-2.5">
        <div>
          <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Session Name</label>
          <Input
            value={draft.sessionName ?? ""}
            onChange={(e) => setDraft((prev) => ({ ...prev, sessionName: e.target.value || undefined }))}
            placeholder={generateSessionName(draft.exercises)}
            maxLength={100}
            className="h-9 text-sm"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs sm:text-sm text-foreground inline-flex items-center justify-between"
                >
                  <span className="truncate">{spellOutDateShortYear(draft.date)}</span>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-xl border-white/20 bg-gradient-to-br from-blue-950/18 via-card/45 to-emerald-950/14 backdrop-blur-2xl"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return
                    const dateInputValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
                      date.getDate(),
                    ).padStart(2, "0")}`
                    setDraft((prev) => ({ ...prev, date: inputValueToDateStr(dateInputValue) }))
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Start</label>
            <input
              type="time"
              defaultValue={timeStrToInputValue(initialSession.startTime)}
              onChange={(e) => setDraft((prev) => ({ ...prev, startTime: inputValueToTimeStr(e.target.value) }))}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">End</label>
            <input
              type="time"
              defaultValue={timeStrToInputValue(initialSession.endTime)}
              onChange={(e) => setDraft((prev) => ({ ...prev, endTime: inputValueToTimeStr(e.target.value) }))}
              className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            />
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
          <Textarea
            value={draft.notes ?? ""}
            onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Session notes..."
            className="min-h-[2.5rem] h-auto resize-none text-sm"
            rows={2}
          />
        </div>
      </div>

      <div className="px-4 pb-2 divide-y divide-white/5">
        {draft.exercises.map((exercise, exIndex) => (
          <div key={`ex-${exIndex}`} className="py-3 first:pt-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground/90 leading-tight">
                  {capitalize(exercise.exerciseType)}
                </h4>
                <VariationChips variations={exercise.variations} />
              </div>
              <button
                type="button"
                onClick={() => removeExercise(exIndex)}
                disabled={draft.exercises.length <= 1}
                className="shrink-0 p-1.5 text-red-400/50 hover:text-red-400 active:text-red-300 disabled:opacity-20 disabled:pointer-events-none transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {exercise.type === "strength" && (
              <>
                {exercise.sets.map((set, setIndex) => (
                  <EditableSetRow
                    key={setKeys[exIndex]?.[setIndex] ?? `s-${exIndex}-${setIndex}`}
                    set={set}
                    index={setIndex}
                    setKey={setKeys[exIndex]?.[setIndex] ?? `s-${exIndex}-${setIndex}`}
                    exerciseKey={exercise.exerciseType}
                    onUpdate={(updated) => updateSet(exIndex, setIndex, updated)}
                    onDelete={() => removeSet(exIndex, setIndex)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => addSet(exIndex)}
                  className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 text-[11px] text-blue-400/70 hover:text-blue-400 border border-dashed border-blue-500/20 rounded-md active:bg-blue-500/5 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add Set
                </button>
              </>
            )}

            {exercise.type === "cardio" && (
              <EditableCardioBlock
                entry={exercise}
                entryKey={`cardio-${exIndex}`}
                onUpdate={(updated) => updateExercise(exIndex, updated)}
                onRemove={() => removeExercise(exIndex)}
              />
            )}

            <Input
              defaultValue={exercise.notes ?? ""}
              onBlur={(e) => {
                const v = e.target.value.trim()
                updateExercise(exIndex, { ...exercise, notes: v || undefined })
              }}
              placeholder="Exercise note for this session..."
              className="mt-2 h-8 text-xs text-muted-foreground"
            />
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border/40 flex gap-2">
        <Button variant="outline" className="flex-1 h-10 text-muted-foreground" onClick={onCancel} disabled={saving}>
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white"
          onClick={() => onSave(draft)}
          disabled={saving || !canSave}
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  )
}
