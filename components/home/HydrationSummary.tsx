"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
import { Droplets } from "lucide-react";

interface HydrationSummaryProps {
  waterOz: number;
  waterGoalOz?: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
}

export function HydrationSummary({
  waterOz,
  waterGoalOz = 80,
  sodiumMg,
  potassiumMg,
  magnesiumMg,
}: HydrationSummaryProps) {
  const waterPct = waterGoalOz > 0 ? Math.min(Math.round((waterOz / waterGoalOz) * 100), 100) : 0;

  return (
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Droplets className="w-4 h-4 text-teal-400" />
          Hydration & Electrolytes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Water</span>
            <span className="font-mono text-foreground tabular-nums">
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
          <ElectrolyteCell label="Sodium" amount={sodiumMg} adequate={2300} />
          <ElectrolyteCell label="Potassium" amount={potassiumMg} adequate={3000} />
          <ElectrolyteCell label="Magnesium" amount={magnesiumMg} adequate={400} />
        </div>
      </CardContent>
    </Card>
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
    pct >= 80 ? "text-teal-400" : pct >= 40 ? "text-amber-400" : "text-muted-foreground";

  return (
    <div className="text-center space-y-0.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${color}`}>
        {Math.round(amount)} <span className="text-[10px] font-normal">mg</span>
      </p>
    </div>
  );
}
