"use client";

import * as React from "react";
import { CalendarDays, Clock, ClipboardList, Trash2, X } from "lucide-react";
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
import { INJECTION_DEPTHS } from "@/lib/medication/catalog";
import type {
  MedicationDraftItem,
  SubstanceCatalogItemView,
  SubstanceDeliveryMethodView,
} from "@/lib/medication";

interface MedicationOverviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MedicationDraftItem[];
  substances: SubstanceCatalogItemView[];
  deliveryMethods: SubstanceDeliveryMethodView[];
  sessionDate: Date;
  onSessionDateChange: (date: Date) => void;
  sessionTime: string;
  onSessionTimeChange: (time: string) => void;
  onRemoveItem: (index: number) => void;
  onSavePreset: () => void;
  onSaveSession: () => void;
  submitting: boolean;
}

function describeItem(
  item: MedicationDraftItem,
  substances: SubstanceCatalogItemView[],
  deliveryMethods: SubstanceDeliveryMethodView[],
): string {
  const bits: string[] = [];

  if (item.doseValue !== null) {
    bits.push(`${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ""}`);
  }
  if (item.compoundServings !== null) {
    bits.push(
      `${item.compoundServings} serving${item.compoundServings === 1 ? "" : "s"}`,
    );
  }
  if (item.deliveryMethodId) {
    const method = deliveryMethods.find((m) => m.id === item.deliveryMethodId);
    if (method) bits.push(method.label);
  }
  if (item.injectionDepth) {
    const depth = INJECTION_DEPTHS.find((d) => d.key === item.injectionDepth);
    if (depth) bits.push(depth.label);
  }
  if (item.variantId) {
    const substance = substances.find((s) => s.id === item.substanceId);
    const variant = substance?.variants.find((v) => v.id === item.variantId);
    if (variant) bits.push(variant.label);
  }

  return bits.join(" · ");
}

export function MedicationOverviewSheet({
  open,
  onOpenChange,
  items,
  substances,
  deliveryMethods,
  sessionDate,
  onSessionDateChange,
  sessionTime,
  onSessionTimeChange,
  onRemoveItem,
  onSavePreset,
  onSaveSession,
  submitting,
}: MedicationOverviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[85vw] sm:max-w-md flex flex-col p-0 [&>button:last-child]:hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-base font-medium">
            Medication Sheet
          </SheetTitle>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        </div>

        <Separator />

        {/* ── Date / time ────────────────────────────────────────── */}
        <div className="px-4 py-3 space-y-3">
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
                  onSelect={(date) => date && onSessionDateChange(date)}
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
        </div>

        <Separator />

        {/* ── Staged items ───────────────────────────────────────── */}
        <ScrollArea className="flex-1 px-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No items staged.
            </p>
          ) : (
            <div className="space-y-2 py-3">
              {items.map((item, index) => (
                <div
                  key={`${item.substanceId}-${index}`}
                  className="rounded-lg border border-border/40 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {item.snapshotName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {describeItem(item, substances, deliveryMethods) ||
                          "No details"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div className="px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSavePreset}
              disabled={items.length === 0 || submitting}
            >
              Save Preset
            </Button>
            <Button
              type="button"
              onClick={onSaveSession}
              disabled={items.length === 0 || submitting}
            >
              Save Log
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
