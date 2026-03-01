"use client";

import * as React from "react";
import { CalendarDays, Clock, ClipboardList, Minus, Plus, Trash2, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui_primitives/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui_primitives/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui_primitives/alert-dialog";
import type { MealItemDraft } from "@/lib/nutrition";

interface MealOverviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MealItemDraft[];
  mealLabel: string | null;
  onMealLabelChange: (label: string | null) => void;
  sessionDate: string;
  onSessionDateChange: (date: string) => void;
  sessionTime: string;
  onSessionTimeChange: (time: string) => void;
  useManualTimestamp: boolean;
  onUseManualTimestampChange: (manual: boolean) => void;
  onRemoveItem: (index: number) => void;
  onUpdateServings: (index: number, servings: number) => void;
  onSaveSession: () => void;
  onDiscardSession: () => void;
  submitting: boolean;
}

const MEAL_LABELS = ["Breakfast", "Lunch", "Dinner", "Snack"];

function formatMacros(item: MealItemDraft) {
  const s = item.servings;
  const scale = item.foodSource === "foundation" && item.portionGramWeight != null
    ? (item.portionGramWeight / 100) * s
    : s;
  return {
    cal: Math.round(item.nutrients.calories * scale),
    pro: Math.round(item.nutrients.protein * scale),
    carb: Math.round(item.nutrients.carbs * scale),
    fat: Math.round(item.nutrients.fat * scale),
  };
}

function sourceBadge(item: MealItemDraft) {
  switch (item.foodSource) {
    case "foundation": return "Foundation";
    case "complex": return "My Food";
    case "retail": return item.snapshotBrand ?? "Restaurant";
  }
}

export function MealOverviewSheet({
  open,
  onOpenChange,
  items,
  mealLabel,
  onMealLabelChange,
  sessionDate,
  onSessionDateChange,
  sessionTime,
  onSessionTimeChange,
  useManualTimestamp,
  onUseManualTimestampChange,
  onRemoveItem,
  onUpdateServings,
  onSaveSession,
  onDiscardSession,
  submitting,
}: MealOverviewSheetProps) {
  const totals = React.useMemo(() => {
    let cal = 0, pro = 0, carb = 0, fat = 0;
    for (const item of items) {
      const m = formatMacros(item);
      cal += m.cal;
      pro += m.pro;
      carb += m.carb;
      fat += m.fat;
    }
    return { cal, pro, carb, fat };
  }, [items]);

  const dateObj = React.useMemo(() => {
    const d = new Date(sessionDate + "T12:00:00");
    return isNaN(d.getTime()) ? new Date() : d;
  }, [sessionDate]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[85vw] sm:max-w-md flex flex-col p-0 [&>button:last-child]:hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-base font-medium">Meal Sheet</SheetTitle>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        </div>

        <Separator />

        {/* Meal label */}
        <div className="px-4 py-3">
          <Select
            value={mealLabel ?? "none"}
            onValueChange={(v) => onMealLabelChange(v === "none" ? null : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Meal type (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No label</SelectItem>
              {MEAL_LABELS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Timestamp */}
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {useManualTimestamp ? "Manual time" : "Now"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-7 px-2 text-xs"
              onClick={() => onUseManualTimestampChange(!useManualTimestamp)}
            >
              {useManualTimestamp ? "Use now" : "Set manually"}
            </Button>
          </div>

          {useManualTimestamp && (
            <>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-sm hover:text-blue-400 transition-colors">
                      {dateObj.toLocaleDateString("en-US", {
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
                      selected={dateObj}
                      onSelect={(d) => {
                        if (d) {
                          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                          onSessionDateChange(iso);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  className="h-8 text-xs"
                  value={sessionTime}
                  onChange={(e) => onSessionTimeChange(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Staged items */}
        <ScrollArea className="flex-1 px-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No items staged. Add foods from the search tabs.
            </p>
          ) : (
            <div className="space-y-2 py-3">
              {items.map((item, index) => {
                const m = formatMacros(item);
                return (
                  <div
                    key={item.localId}
                    className="rounded-lg border border-border/40 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.snapshotName}</p>
                        <p className="text-xs text-muted-foreground">
                          {sourceBadge(item)}
                          {item.portionLabel ? ` · ${item.portionLabel}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => onRemoveItem(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          disabled={item.servings <= 0.25}
                          onClick={() => onUpdateServings(index, Math.max(0.25, item.servings - 0.5))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-medium w-8 text-center">{item.servings}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onUpdateServings(index, item.servings + 0.5)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {m.cal} cal · {m.pro}p · {m.carb}c · {m.fat}f
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Totals */}
        {items.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2 grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Calories</p>
                <p className="text-sm font-semibold">{totals.cal}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-sm font-semibold">{totals.pro}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="text-sm font-semibold">{totals.carb}g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fat</p>
                <p className="text-sm font-semibold">{totals.fat}g</p>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={items.length === 0}
                >
                  Discard
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Discard meal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all staged items. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDiscardSession}>
                    Discard
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="button"
              onClick={onSaveSession}
              disabled={items.length === 0 || submitting}
            >
              {submitting ? "Saving..." : "Save Meal"}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" />
            {items.length} staged item{items.length === 1 ? "" : "s"}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
