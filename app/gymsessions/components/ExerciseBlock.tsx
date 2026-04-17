"use client"

import { Clock, FileText, StickyNote, Target, Timer } from "lucide-react"
import { capitalize } from "@/lib/utils"
import type { ExerciseEntry, StrengthSet } from "@/lib/gym"
import { calcExerciseVolume, formatRepCount, formatVolume } from "./helpers"
import { VariationChips } from "./VariationChips"

const FAILURE_MODE_SHORT: Record<string, string> = {
  cardio: "Cardio",
  grip: "Grip",
  general_fatigue: "Fatigue",
}

function SetChip({ set, index }: { set: StrengthSet; index: number }) {
  const hasRir = set.repsInReserve !== undefined
  const hasDuration = set.duration !== undefined && set.duration > 0
  const hasFailureMode = !!set.failureMode && set.failureMode !== "untracked"
  const hasNotes = !!set.notes

  return (
    <div className="flex flex-col gap-0.5">
      <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
        <span className="text-[10px] text-muted-foreground/70 font-mono">{set.name || `#${index + 1}`}</span>
        <span className="font-medium tabular-nums text-foreground/90">
          {set.weight}
          <span className="text-[10px] text-muted-foreground ml-0.5">lbs</span>
        </span>
        <span className="text-muted-foreground/30">×</span>
        <span className="font-medium tabular-nums text-foreground/90">
          {formatRepCount(set.reps)}
          <span className="text-[10px] text-muted-foreground ml-0.5">reps</span>
        </span>
        {hasRir && (
          <>
            <span className="text-muted-foreground/30">•</span>
            <span className="inline-flex items-center gap-0.5 text-amber-400/90">
              <span className="tabular-nums">{set.repsInReserve} RIR</span>
            </span>
          </>
        )}
        {hasDuration && (
          <>
            <span className="text-muted-foreground/30">•</span>
            <span className="inline-flex items-center gap-0.5 text-blue-400/80">
              <Timer className="h-3 w-3" />
              <span className="tabular-nums">{set.duration}s</span>
            </span>
          </>
        )}
        {hasFailureMode && (
          <>
            <span className="text-muted-foreground/30">•</span>
            <span className="inline-flex items-center gap-0.5 text-purple-400/80">
              <Target className="h-3 w-3" />
              <span className="text-[10px]">{FAILURE_MODE_SHORT[set.failureMode!] ?? set.failureMode}</span>
            </span>
          </>
        )}
        {hasNotes && (
          <>
            <span className="text-muted-foreground/30">•</span>
            <StickyNote className="h-3 w-3 text-muted-foreground/70" />
          </>
        )}
      </div>
      {hasNotes && (
        <p className="text-[10px] text-muted-foreground/60 pl-2 whitespace-pre-wrap leading-tight">{set.notes}</p>
      )}
    </div>
  )
}

export function ExerciseBlock({ entry }: { entry: ExerciseEntry }) {
  const isStrength = entry.type === "strength"
  const volume = calcExerciseVolume(entry)

  return (
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-blue-950/20 via-card/60 to-emerald-950/10 px-3 py-3 overflow-hidden">
      <div className="w-full mb-4">
        <div className="flex items-start justify-between gap-2 w-full mb-2">
          <h4 className="min-w-0 flex-1 text-sm font-semibold text-foreground/95 leading-tight">
            {capitalize(entry.exerciseType)}
          </h4>
          {isStrength && volume > 0 && (
            <span className="shrink-0 text-[11px] text-emerald-400/90 font-medium tabular-nums whitespace-nowrap pt-0.5">
              {formatVolume(volume)}
            </span>
          )}
        </div>
        <div className="w-full">
          <VariationChips variations={entry.variations} />
        </div>
      </div>

      {isStrength && entry.sets && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {entry.sets.map((set, i) => (
            <SetChip key={i} set={set} index={i} />
          ))}
        </div>
      )}

      {entry.type === "cardio" && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
            <Clock className="h-3.5 w-3.5" />
            {entry.duration} min
          </span>
          {entry.distance && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1">
              {entry.distance} {entry.unit ?? ""}
            </span>
          )}
        </div>
      )}

      {entry.notes && (
        <div className="mt-2.5 flex items-start gap-1.5 text-xs text-muted-foreground/70">
          <FileText className="h-3 w-3 mt-0.5 shrink-0" />
          <p className="whitespace-pre-wrap">{entry.notes}</p>
        </div>
      )}
    </div>
  )
}
