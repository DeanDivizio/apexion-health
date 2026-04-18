"use client"

import { useCallback, useEffect, useState } from "react"
import { Archive, Dumbbell, MoreVertical, Pencil, Type } from "lucide-react"
import {
  archiveCustomExerciseAction,
  getGymMetaAction,
  renameCustomExerciseAction,
} from "@/actions/gym"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui_primitives/alert-dialog"
import { Button } from "@/components/ui_primitives/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu"
import { Input } from "@/components/ui_primitives/input"
import { Skeleton } from "@/components/ui_primitives/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  CATEGORY_DISPLAY_NAMES,
  type CustomExerciseDefinition,
} from "@/lib/gym"
import { EditCustomExerciseSheet } from "./EditCustomExerciseSheet"

function humanizeMuscle(muscle: string): string {
  return muscle
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
}

function topTargetsSummary(def: CustomExerciseDefinition): string {
  const sorted = [...def.baseTargets].sort((a, b) => b.weight - a.weight)
  return sorted
    .slice(0, 2)
    .map((t) => humanizeMuscle(t.muscle))
    .join(", ")
}

export function CustomExercisesList() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [defs, setDefs] = useState<CustomExerciseDefinition[]>([])
  const [editing, setEditing] = useState<CustomExerciseDefinition | null>(null)
  const [renamingKey, setRenamingKey] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [archiveConfirmKey, setArchiveConfirmKey] = useState<string | null>(
    null,
  )
  const [busyKey, setBusyKey] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const meta = await getGymMetaAction()
        setDefs(
          Object.values(meta.customExerciseDefinitions).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        )
      } catch {
        toast({
          title: "Error",
          description: "Failed to load custom exercises.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  const startRename = useCallback((def: CustomExerciseDefinition) => {
    setRenamingKey(def.key)
    setRenameValue(def.name)
  }, [])

  const cancelRename = useCallback(() => {
    setRenamingKey(null)
    setRenameValue("")
  }, [])

  const commitRename = useCallback(
    async (def: CustomExerciseDefinition) => {
      const trimmed = renameValue.trim()
      setRenamingKey(null)
      setRenameValue("")
      if (!trimmed || trimmed === def.name) return

      const previousName = def.name
      setDefs((prev) =>
        prev
          .map((d) => (d.key === def.key ? { ...d, name: trimmed } : d))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      setBusyKey(def.key)
      try {
        await renameCustomExerciseAction(def.key, trimmed)
        toast({ title: "Renamed" })
      } catch (error) {
        setDefs((prev) =>
          prev
            .map((d) => (d.key === def.key ? { ...d, name: previousName } : d))
            .sort((a, b) => a.name.localeCompare(b.name)),
        )
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to rename.",
          variant: "destructive",
        })
      } finally {
        setBusyKey(null)
      }
    },
    [renameValue, toast],
  )

  const handleArchive = useCallback(async () => {
    if (!archiveConfirmKey) return
    const key = archiveConfirmKey
    setBusyKey(key)
    try {
      await archiveCustomExerciseAction(key)
      setDefs((prev) => prev.filter((d) => d.key !== key))
      toast({ title: "Exercise archived" })
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to archive.",
        variant: "destructive",
      })
    } finally {
      setBusyKey(null)
      setArchiveConfirmKey(null)
    }
  }, [archiveConfirmKey, toast])

  const handleEditSaved = useCallback((updated: CustomExerciseDefinition) => {
    setDefs((prev) =>
      prev
        .map((d) => (d.key === updated.key ? updated : d))
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="w-full h-[64px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (defs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Dumbbell className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm">
          No custom exercises yet.
        </p>
        <p className="text-muted-foreground/70 text-xs mt-1 max-w-xs">
          Create one from the exercise search while logging a workout.
        </p>
      </div>
    )
  }

  const archiveTarget = archiveConfirmKey
    ? defs.find((d) => d.key === archiveConfirmKey)
    : null

  return (
    <>
      <div className="flex flex-col gap-3">
        {defs.map((def) => {
          const summary = topTargetsSummary(def)
          const variationCount = def.variationTemplates
            ? Object.keys(def.variationTemplates).length
            : 0
          const isRenaming = renamingKey === def.key
          const isBusy = busyKey === def.key

          return (
            <div
              key={def.key}
              className="rounded-xl border border-white/10 bg-card/40 p-3 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(def)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        commitRename(def)
                      } else if (e.key === "Escape") {
                        e.preventDefault()
                        cancelRename()
                      }
                    }}
                    maxLength={100}
                    className="h-8 text-sm"
                  />
                ) : (
                  <p className="font-medium truncate">{def.name}</p>
                )}
                <p className="text-xs text-muted-foreground truncate">
                  {CATEGORY_DISPLAY_NAMES[def.category]}
                  {summary && ` · ${summary}`}
                  {variationCount > 0 &&
                    ` · ${variationCount} variation${variationCount === 1 ? "" : "s"}`}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={isBusy}
                    aria-label={`Actions for ${def.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(def)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => startRename(def)}>
                    <Type className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setArchiveConfirmKey(def.key)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      <EditCustomExerciseSheet
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        exercise={editing}
        onSaved={handleEditSaved}
      />

      <AlertDialog
        open={archiveConfirmKey !== null}
        onOpenChange={(open) => {
          if (!open) setArchiveConfirmKey(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl border-white/20 bg-gradient-to-br from-blue-950/18 via-card/45 to-emerald-950/14 backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget
                ? `"${archiveTarget.name}" will be hidden from exercise search. Past sessions that reference it remain intact.`
                : "This exercise will be hidden from exercise search."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyKey === archiveConfirmKey}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={busyKey === archiveConfirmKey}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {busyKey === archiveConfirmKey ? "Archiving…" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
