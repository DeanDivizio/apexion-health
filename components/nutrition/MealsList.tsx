"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui_primitives/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui_primitives/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import { Input } from "@/components/ui_primitives/input";
import { Label } from "@/components/ui_primitives/label";
import { useToast } from "@/hooks/use-toast";
import {
  deleteMealSessionAction,
  updateMealSessionAction,
} from "@/actions/nutrition";
import type { NutritionMealSessionView, MealItemViewEntry } from "@/lib/nutrition";
import { isoDateToCompactDateStr } from "@/lib/dates/dateStr";

const MEAL_LABELS = ["Breakfast", "Lunch", "Dinner", "Snack"];

interface MealsListProps {
  initialSessions: NutritionMealSessionView[];
}

function groupByDate(sessions: NutritionMealSessionView[]) {
  const map = new Map<string, NutritionMealSessionView[]>();
  for (const session of sessions) {
    const group = map.get(session.dateStr) ?? [];
    group.push(session);
    map.set(session.dateStr, group);
  }
  return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
}

function formatDateStr(dateStr: string): string {
  try {
    const y = dateStr.slice(0, 4);
    const m = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    return format(new Date(`${y}-${m}-${d}T12:00:00`), "MMMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function sessionTotals(items: MealItemViewEntry[]) {
  let cal = 0, pro = 0, carb = 0, fat = 0;
  for (const item of items) {
    cal += item.snapshotCalories;
    pro += item.snapshotProtein;
    carb += item.snapshotCarbs;
    fat += item.snapshotFat;
  }
  return { cal: Math.round(cal), pro: Math.round(pro), carb: Math.round(carb), fat: Math.round(fat) };
}

export function MealsList({ initialSessions }: MealsListProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = React.useState(initialSessions);
  const [editSession, setEditSession] = React.useState<NutritionMealSessionView | null>(null);
  const [deleteSessionId, setDeleteSessionId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Edit state
  const [editLabel, setEditLabel] = React.useState<string | null>(null);
  const [editDate, setEditDate] = React.useState("");
  const [editTime, setEditTime] = React.useState("");
  const [editItems, setEditItems] = React.useState<MealItemViewEntry[]>([]);

  function openEdit(session: NutritionMealSessionView) {
    setEditSession(session);
    setEditLabel(session.mealLabel);
    const loggedDate = parseISO(session.loggedAtIso);
    setEditDate(format(loggedDate, "yyyy-MM-dd"));
    setEditTime(format(loggedDate, "HH:mm"));
    setEditItems([...session.items]);
  }

  async function handleSaveEdit() {
    if (!editSession || editItems.length === 0) return;
    setSubmitting(true);
    try {
      const [h, m] = editTime.split(":").map(Number);
      const d = new Date(editDate + "T12:00:00");
      d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
      const dateStr = isoDateToCompactDateStr(editDate);

      await updateMealSessionAction(editSession.id, {
        loggedAtIso: d.toISOString(),
        dateStr,
        mealLabel: editLabel,
        notes: null,
        items: editItems.map((item) => ({
          foodSource: item.foodSource,
          sourceFoodId: item.sourceFoodId,
          foundationFoodId: item.foundationFoodId,
          snapshotName: item.snapshotName,
          snapshotBrand: item.snapshotBrand,
          servings: item.servings,
          portionLabel: item.portionLabel,
          portionGramWeight: item.portionGramWeight,
          nutrients: {
            calories: item.snapshotCalories / item.servings,
            protein: item.snapshotProtein / item.servings,
            carbs: item.snapshotCarbs / item.servings,
            fat: item.snapshotFat / item.servings,
          },
        })),
      });

      setSessions((prev) =>
        prev.map((s) =>
          s.id === editSession.id
            ? {
                ...s,
                mealLabel: editLabel,
                loggedAtIso: d.toISOString(),
                dateStr,
                items: editItems,
              }
            : s,
        ),
      );
      setEditSession(null);
      toast({ title: "Meal updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update meal.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteSessionId) return;
    setSubmitting(true);
    try {
      await deleteMealSessionAction(deleteSessionId);
      setSessions((prev) => prev.filter((s) => s.id !== deleteSessionId));
      setDeleteSessionId(null);
      toast({ title: "Meal deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete meal.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const grouped = groupByDate(sessions);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 md:pt-6 pb-20 space-y-6">
      <h1 className="text-2xl font-semibold">Your Meals</h1>

      {sessions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          No meals logged yet.
        </p>
      )}

      {grouped.map(([dateStr, daySessions]) => (
        <div key={dateStr} className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {formatDateStr(dateStr)}
          </h2>
          {daySessions.map((session) => {
            const totals = sessionTotals(session.items);
            let timeStr = "";
            try {
              timeStr = format(parseISO(session.loggedAtIso), "h:mm a");
            } catch { /* fallback */ }

            return (
              <div
                key={session.id}
                className="rounded-lg border border-border/40 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {session.mealLabel ?? "Meal"}
                    {timeStr && <span className="text-muted-foreground font-normal"> · {timeStr}</span>}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(session)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteSessionId(session.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {session.items.map((item, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">
                      {item.snapshotName}
                      {item.servings !== 1 && ` (${item.servings})`}
                      {item.portionLabel && ` · ${item.portionLabel}`}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cal: {totals.cal} · P: {totals.pro}g · C: {totals.carb}g · F: {totals.fat}g
                </p>
              </div>
            );
          })}
        </div>
      ))}

      {/* Edit dialog */}
      <Dialog open={editSession !== null} onOpenChange={(open) => { if (!open) setEditSession(null); }}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
            <DialogDescription>Update meal details and items.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-1">
            <div className="space-y-1">
              <Label>Meal Label</Label>
              <Select value={editLabel ?? "none"} onValueChange={(v) => setEditLabel(v === "none" ? null : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No label</SelectItem>
                  {MEAL_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time</Label>
                <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Items</Label>
              {editItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-md border border-border/40 px-2 py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.snapshotName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      disabled={item.servings <= 0.25}
                      onClick={() => {
                        const newServings = Math.max(0.25, item.servings - 0.5);
                        setEditItems((prev) => prev.map((it, i) => i === idx ? { ...it, servings: newServings } : it));
                      }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-xs w-6 text-center">{item.servings}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        const newServings = item.servings + 0.5;
                        setEditItems((prev) => prev.map((it, i) => i === idx ? { ...it, servings: newServings } : it));
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <X className="h-3 w-3 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setEditSession(null)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSaveEdit} disabled={submitting || editItems.length === 0}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteSessionId !== null} onOpenChange={(open) => { if (!open) setDeleteSessionId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this meal?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
