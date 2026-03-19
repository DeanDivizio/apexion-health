"use client";

import { useState } from "react";
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
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4 transition-colors hover:bg-neutral-800/50">
      <div
        className="flex items-center justify-between mb-2 cursor-pointer select-none gap-2"
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
      >
        <span className="text-xs text-yellow-400 opacity-80">Micro Nutrients</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-500">
            {filtered.length} tracked today
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-yellow-200 opacity-40 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {expanded && (
        <div className="space-y-3">
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
            <p className="text-xs text-neutral-500 text-center py-2">
              No micronutrient data logged today.
            </p>
          )}
        </div>
      )}
    </div>
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
      <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((n) => (
          <div
            key={n.nutrientKey}
            className="flex items-center justify-between text-xs py-0.5"
          >
            <span className="text-neutral-500">{n.nutrientName}</span>
            <span className="font-mono text-neutral-100 tabular-nums">
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
