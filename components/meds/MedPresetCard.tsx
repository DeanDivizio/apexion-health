"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import type { MedicationPresetView } from "@/lib/medication";

function summarizeDose(item: MedicationPresetView["items"][number]): string {
  if (item.doseValue != null) {
    return `${item.doseValue}${item.doseUnit ? ` ${item.doseUnit}` : ""}`;
  }
  if (item.compoundServings != null) {
    return `${item.compoundServings} serving${item.compoundServings === 1 ? "" : "s"}`;
  }
  return "";
}

interface MedPresetCardProps {
  preset: MedicationPresetView;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MedPresetCard({
  preset,
  onEdit,
  onDelete,
}: MedPresetCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-blue-950/20 to-blue-950/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-md font-medium text-white truncate">{preset.name}</p>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="mt-1 space-y-0.5">
        {preset.items.map((item, idx) => {
          const dose = summarizeDose(item);
          return (
            <div
              key={`${item.substanceId}-${idx}`}
              className="flex items-baseline gap-1.5"
            >
              <span className="text-sm text-neutral-200/90">{item.snapshotName}</span>
              {dose && (
                <span className="text-xs text-muted-foreground">{dose}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
