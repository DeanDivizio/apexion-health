"use client";

import { Droplets } from "lucide-react";

interface HydrationSummaryProps {
  waterOz: number;
  waterGoalOz: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  sodiumGoalMg: number;
  potassiumGoalMg: number;
  magnesiumGoalMg: number;
}

export function HydrationSummary({
  waterOz,
  waterGoalOz,
  sodiumMg,
  potassiumMg,
  magnesiumMg,
  sodiumGoalMg,
  potassiumGoalMg,
  magnesiumGoalMg,
}: HydrationSummaryProps) {
  const waterPct = waterGoalOz > 0 ? Math.min(Math.round((waterOz / waterGoalOz) * 100), 100) : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4 transition-colors hover:bg-neutral-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-green-400 opacity-75">Hydration &amp; Electrolytes</span>
        <Droplets className="h-3.5 w-3.5 text-green-200 opacity-40 shrink-0" aria-hidden />
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Water</span>
            <span className="font-mono text-neutral-100 tabular-nums">
              {Math.round(waterOz)} / {waterGoalOz} oz
            </span>
          </div>
          <div className="h-2 rounded-full bg-neutral-500/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-400 transition-all duration-500"
              style={{ width: `${waterPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <ElectrolyteCell label="Sodium" amount={sodiumMg} adequate={sodiumGoalMg} />
          <ElectrolyteCell label="Potassium" amount={potassiumMg} adequate={potassiumGoalMg} />
          <ElectrolyteCell label="Magnesium" amount={magnesiumMg} adequate={magnesiumGoalMg} />
        </div>
      </div>
    </div>
  );
}

function ElectrolyteCell({
  label,
  amount,
  adequate,
}: {
  label: string;
  amount: number;
  adequate: number;
}) {
  const pct = adequate > 0 ? (amount / adequate) * 100 : 0;
  const color =
    pct >= 80 ? "text-teal-400" : pct >= 40 ? "text-amber-400" : "text-neutral-500";

  return (
    <div className="text-center space-y-0.5">
      <p className="text-[10px] text-neutral-500">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${color}`}>
        {Math.round(amount)} <span className="text-[10px] font-normal">mg</span>
      </p>
    </div>
  );
}
