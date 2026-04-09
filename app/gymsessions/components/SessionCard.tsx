"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Activity, Check, ChevronDown, Pencil, Settings, StickyNote, Trash2, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu"
import { getMuscleGroupsForExercises, generateSessionName } from "@/lib/gym"
import { calcSessionVolume, formatVolume, spellOutDateShortYear } from "./helpers"
import { ExerciseBlock } from "./ExerciseBlock"
import { WhoopWorkoutData } from "./WhoopWorkoutData"
import type { SessionWithId } from "./types"

interface SessionCardProps {
  session: SessionWithId
  isOpen: boolean
  onToggle: () => void
  onEdit: () => void
  onRequestDelete: () => void
  onUpdateName: (name: string | null) => void
}

const BIOMETRIC_PROVIDER_BADGE_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  whoop: {
    label: "WHOOP",
    className: "border-cyan-400/40 bg-cyan-500/10 text-cyan-300",
  },
}

function getProviderBadge(provider: string): {
  label: string
  className: string
} {
  const normalized = provider.toLowerCase()
  return (
    BIOMETRIC_PROVIDER_BADGE_CONFIG[normalized] ?? {
      label: provider.toUpperCase(),
      className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
    }
  )
}

function InlineNameEditor({
  value,
  placeholder,
  onSave,
  onCancel,
}: {
  value: string
  placeholder: string
  onSave: (name: string) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const commit = () => {
    onSave(draft.trim())
  }

  return (
    <div className="flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") onCancel()
        }}
        placeholder={placeholder}
        maxLength={100}
        className="flex-1 min-w-0 bg-white/5 border border-white/20 rounded-md px-2 py-0.5 text-[15px] font-semibold text-foreground leading-tight outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/25"
      />
      <button
        type="button"
        onClick={commit}
        className="p-0.5 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-0.5 rounded text-muted-foreground hover:bg-white/5 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function SessionCard({
  session,
  isOpen,
  onToggle,
  onEdit,
  onRequestDelete,
  onUpdateName,
}: SessionCardProps) {
  const sessionVolume = calcSessionVolume(session)
  const [linkedProviders, setLinkedProviders] = useState<string[]>(
    session.linkedBiometricProviders ?? [],
  )
  const [isEditingName, setIsEditingName] = useState(false)

  const handleLinkChange = useCallback((providers: string[]) => {
    setLinkedProviders(providers);
  }, []);

  const uniqueLinkedProviders = useMemo(
    () => [...new Set(linkedProviders.map((provider) => provider.toLowerCase()))],
    [linkedProviders],
  )

  const muscleGroups = useMemo(
    () => getMuscleGroupsForExercises(session.exercises),
    [session.exercises],
  )

  const generatedName = useMemo(
    () => generateSessionName(session.exercises),
    [session.exercises],
  )

  const displayName = session.sessionName || generatedName

  const handleNameSave = (name: string) => {
    setIsEditingName(false)
    const newName = name === "" || name === generatedName ? null : name
    if (newName !== (session.sessionName ?? null)) {
      onUpdateName(newName)
    }
  }

  return (
    <div
      className="relative rounded-xl w-full border border-white/20 shadow-[0_1px_0_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.22)] ring-1 ring-white/10 overflow-hidden"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br from-blue-950/10 to-emerald-950/20 transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-br from-blue-950/20 to-emerald-950/35 transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 px-2 py-3.5">
          <div
            role="button"
            tabIndex={0}
            onClick={onToggle}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle() }}
            className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity cursor-pointer"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {isEditingName ? (
                <InlineNameEditor
                  value={session.sessionName ?? generatedName}
                  placeholder={generatedName}
                  onSave={handleNameSave}
                  onCancel={() => setIsEditingName(false)}
                />
              ) : (
                <>
                  <p className="text-[15px] font-semibold text-foreground leading-tight truncate">
                    {displayName}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditingName(true)
                    }}
                    className="p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5 transition-colors shrink-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
            <span className="text-neutral-400 font-medium">
              {spellOutDateShortYear(session.date)} </span>· {session.startTime} – {session.endTime}
            </p>
            {muscleGroups.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {muscleGroups.map((mg) => (
                  <span
                    key={mg}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300"
                  >
                    {mg}
                  </span>
                ))}
              </div>
            )}
            {uniqueLinkedProviders.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                  <Activity className="mr-1 h-2.5 w-2.5" />
                  Linked
                </span>
                {uniqueLinkedProviders.map((provider) => {
                  const badge = getProviderBadge(provider)
                  return (
                    <span
                      key={provider}
                      className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-white/5 active:bg-white/10 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Session
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRequestDelete} className="text-red-400 focus:text-red-400">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button type="button" onClick={onToggle} className="p-1 text-muted-foreground">
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ease-out ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div
              className={`px-2 pb-4 border-t border-border/30 transition-[transform,opacity] duration-300 ease-out ${
                isOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
              }`}
            >
              <div className="mt-3 space-y-2.5">
                {session.exercises.map((exercise, i) => (
                  <ExerciseBlock key={`${exercise.exerciseType}-${i}`} entry={exercise} />
                ))}
              </div>

              {session.notes && (
                <div className="mt-3 pt-2.5 border-t border-border/40">
                  <div className="flex items-center gap-1.5 mb-1">
                    <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                      Session Notes
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 whitespace-pre-wrap">{session.notes}</p>
                </div>
              )}

              {sessionVolume > 0 && (
                <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Session Volume
                  </span>
                  <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                    {formatVolume(sessionVolume)}
                  </span>
                </div>
              )}

              <WhoopWorkoutData
                sessionId={session.id}
                dateStr={session.date}
                startTimeStr={session.startTime}
                endTimeStr={session.endTime}
                onLinkChange={handleLinkChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
