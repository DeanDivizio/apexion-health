"use client";

import type { NutrientProfile } from "@/lib/nutrition";

interface FoodResultCardProps {
  name: string;
  subtitle: string;
  calories: number;
  onClick: () => void;
}

export function FoodResultCard({ name, subtitle, calories, onClick }: FoodResultCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border/40 hover:border-border hover:bg-accent/50 transition-colors text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <span className="text-xs text-muted-foreground ml-2 shrink-0">
        {Math.round(calories)} cal
      </span>
    </button>
  );
}
