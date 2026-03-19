"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NutrientEntry {
  nutrientKey: string;
  nutrientName: string;
  amount: number;
  unit: string;
  category: "vitamin" | "mineral" | "other";
}

interface MicroNutrientSummaryProps {
  nutrients: NutrientEntry[];
}

export function MicroNutrientSummary({ nutrients }: MicroNutrientSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const filtered = nutrients.filter((n) => n.amount > 0);
  const vitamins = filtered.filter((n) => n.category === "vitamin");
  const minerals = filtered.filter((n) => n.category === "mineral");
  const others = filtered.filter((n) => n.category === "other");

  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <CardTitle className="text-base flex items-center justify-between">
          <span>Micro Nutrients</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-normal">
              {filtered.length} tracked today
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </div>
        </CardTitle>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {vitamins.length > 0 && (
            <NutrientGroup label="Vitamins" items={vitamins} />
          )}
          {minerals.length > 0 && (
            <NutrientGroup label="Minerals" items={minerals} />
          )}
          {others.length > 0 && (
            <NutrientGroup label="Other" items={others} />
          )}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No micronutrient data logged today.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function NutrientGroup({
  label,
  items,
}: {
  label: string;
  items: NutrientEntry[];
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((n) => (
          <div
            key={n.nutrientKey}
            className="flex items-center justify-between text-xs py-0.5"
          >
            <span className="text-muted-foreground">{n.nutrientName}</span>
            <span className="font-mono text-foreground tabular-nums">
              {formatAmount(n.amount)} {n.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatAmount(val: number): string {
  if (val >= 1000) return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (val >= 10) return val.toFixed(0);
  if (val >= 1) return val.toFixed(1);
  return val.toFixed(2);
}
