"use client"

import { ChevronDown, Pencil, Settings, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu"
import { calcSessionVolume, formatVolume, spellOutDateShortYear } from "./helpers"
import { ExerciseBlock } from "./ExerciseBlock"
import type { SessionWithId } from "./types"

interface SessionCardProps {
  session: SessionWithId
  isOpen: boolean
  onToggle: () => void
  onEdit: () => void
  onRequestDelete: () => void
}

export function SessionCard({
  session,
  isOpen,
  onToggle,
  onEdit,
  onRequestDelete,
}: SessionCardProps) {
  const sessionVolume = calcSessionVolume(session)

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
          <button
            type="button"
            onClick={onToggle}
            className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity"
          >
            <p className="text-[15px] font-semibold text-foreground leading-tight">
              {spellOutDateShortYear(session.date)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {session.startTime} – {session.endTime}
            </p>
          </button>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
