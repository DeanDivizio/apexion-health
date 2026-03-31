"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui_primitives/badge";
import { Button } from "@/components/ui_primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui_primitives/dropdown-menu";
import type { FoodPresetView, NutrientProfile } from "@/lib/nutrition";

const MAX_CHIPS = 3;
const MAX_CHIP_LENGTH = 12;

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "\u2026" : str;
}

function sumCalories(preset: FoodPresetView): number {
  let total = 0;
  for (const item of preset.items) {
    const nutrients = item.nutrients as NutrientProfile;
    const scale =
      item.foodSource === "foundation" && item.portionGramWeight != null
        ? (item.portionGramWeight / 100) * item.servings
        : item.servings;
    total += nutrients.calories * scale;
  }
  return Math.round(total);
}

interface PresetCardProps {
  preset: FoodPresetView;
  onUse?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PresetCard({ preset, onUse, onEdit, onDelete }: PresetCardProps) {
  const calories = sumCalories(preset);
  const visibleItems = preset.items.slice(0, MAX_CHIPS);
  const overflowCount = preset.items.length - MAX_CHIPS;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onUse}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onUse?.();
        }
      }}
      className="rounded-lg border border-border/40 p-3 space-y-1.5 cursor-pointer hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{preset.name}</p>
          <p className="text-xs text-muted-foreground">
            {calories} cal &middot; {preset.items.length} item{preset.items.length !== 1 ? "s" : ""}
          </p>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-400"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {visibleItems.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
            {truncate(item.snapshotName, MAX_CHIP_LENGTH)}
          </Badge>
        ))}
        {overflowCount > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
            +{overflowCount}
          </Badge>
        )}
      </div>
    </div>
  );
}
