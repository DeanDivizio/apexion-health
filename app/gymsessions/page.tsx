"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Dumbbell } from "lucide-react"
import {
  deleteWorkoutSessionAction,
  listWorkoutSessionsAction,
  updateWorkoutSessionAction,
} from "@/actions/gym"
import { captureClientEvent } from "@/lib/posthog-client"
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
import { Skeleton } from "@/components/ui_primitives/skeleton"
import { useToast } from "@/hooks/use-toast"
import { EditableSessionContent } from "./components/EditableSessionContent"
import { parseSessionDateTime, spellOutDateShortYear } from "./components/helpers"
import { SessionCard } from "./components/SessionCard"
import type { SessionWithId } from "./components/types"

export default function GymSessions() {
  const EDIT_TRANSITION_MS = 200
  const [sessions, setSessions] = useState<SessionWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const closeEditTimeoutRef = useRef<number | null>(null)

  const { toast } = useToast()
  useEffect(() => {
    const load = async () => {
      const data = await listWorkoutSessionsAction()
      setSessions(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(
    () => () => {
      if (closeEditTimeoutRef.current !== null) {
        window.clearTimeout(closeEditTimeoutRef.current)
      }
    },
    [],
  )

  const openEditor = (sessionId: string) => {
    if (closeEditTimeoutRef.current !== null) {
      window.clearTimeout(closeEditTimeoutRef.current)
      closeEditTimeoutRef.current = null
    }
    setEditingId(sessionId)
    requestAnimationFrame(() => setIsEditOpen(true))
  }

  const closeEditor = () => {
    setIsEditOpen(false)
    if (closeEditTimeoutRef.current !== null) {
      window.clearTimeout(closeEditTimeoutRef.current)
    }
    closeEditTimeoutRef.current = window.setTimeout(() => {
      setEditingId(null)
      closeEditTimeoutRef.current = null
    }, EDIT_TRANSITION_MS)
  }

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => parseSessionDateTime(b) - parseSessionDateTime(a)),
    [sessions],
  )

  const handleSave = async (updated: SessionWithId) => {
    setSaving(true)
    try {
      const { id, ...sessionData } = updated
      await updateWorkoutSessionAction(id, sessionData)
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)))
      closeEditor()
      captureClientEvent("workout_session_updated", { session_id: id })
      toast({ title: "Session updated", description: "Your changes have been saved." })
    } catch {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    try {
      await deleteWorkoutSessionAction(deleteConfirmId)
      captureClientEvent("workout_session_deleted", { session_id: deleteConfirmId })
      setSessions((prev) => prev.filter((s) => s.id !== deleteConfirmId))
      if (editingId === deleteConfirmId) {
        if (closeEditTimeoutRef.current !== null) {
          window.clearTimeout(closeEditTimeoutRef.current)
          closeEditTimeoutRef.current = null
        }
        setIsEditOpen(false)
        setEditingId(null)
      }
      toast({ title: "Session deleted" })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteConfirmId(null)
    }
  }

  if (loading) {
    return (
      <main className="w-full min-h-screen pt-20 px-4 pb-16">
        <div className="flex flex-col gap-3 max-w-lg mx-auto">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="w-full h-[72px] rounded-xl" />
          ))}
        </div>
      </main>
    )
  }

  if (sortedSessions.length === 0) {
    return (
      <main className="w-full min-h-screen pt-20 px-4 pb-16 flex flex-col items-center justify-center">
        <Dumbbell className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-center">No sessions logged yet.</p>
      </main>
    )
  }

  const deleteSession = deleteConfirmId ? sortedSessions.find((s) => s.id === deleteConfirmId) : null

  return (
    <>
      <main className="w-full min-h-screen pt-20 pb-16 bg-gradient-to-b from-background to-background">
        <div className="flex flex-col gap-3 max-w-lg mx-auto px-2">
          <h1 className="text-2xl font-medium tracking-wide text-neutral-100 md:hidden">Gym Sessions</h1>
          {sortedSessions.map((session, i) =>
            editingId === session.id ? (
              <EditableSessionContent
                key={`edit-${session.id}`}
                initialSession={session}
                onSave={handleSave}
                onCancel={closeEditor}
                saving={saving}
                isOpen={isEditOpen}
              />
            ) : (
              <SessionCard
                key={session.id}
                session={session}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                onEdit={() => {
                  openEditor(session.id)
                  setOpenIndex(i)
                }}
                onRequestDelete={() => setDeleteConfirmId(session.id)}
              />
            ),
          )}
        </div>
      </main>

      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl border-white/20 bg-gradient-to-br from-blue-950/18 via-card/45 to-emerald-950/14 backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSession
                ? `This will permanently delete your ${spellOutDateShortYear(deleteSession.date)} session (${deleteSession.startTime} – ${deleteSession.endTime}) and all its data. This action cannot be undone.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
