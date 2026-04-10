"use client";

import { Droplets, Info } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui_primitives/popover";

interface HydrationSummaryProps {
  waterOz: number;
  coffeeOz: number;
  teaOz: number;
  waterGoalOz: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  sodiumGoalMg: number;
  potassiumGoalMg: number;
  magnesiumGoalMg: number;
}

const FLUID_SEGMENTS = [
  { key: "water", label: "Water", hexFrom: "#60a5fa", hexTo: "#3b82f6", dotColor: "bg-blue-600" },
  { key: "coffee", label: "Coffee", hexFrom: "#c084fc", hexTo: "#a855f7", dotColor: "bg-purple-600" },
  { key: "tea", label: "Tea", hexFrom: "#34d399", hexTo: "#10b981", dotColor: "bg-emerald-600" },
] as const;

const FADE_PCT = 4;

export function HydrationSummary({
  waterOz,
  coffeeOz,
  teaOz,
  waterGoalOz,
  sodiumMg,
  potassiumMg,
  magnesiumMg,
  sodiumGoalMg,
  potassiumGoalMg,
  magnesiumGoalMg,
}: HydrationSummaryProps) {
  const amounts: Record<string, number> = {
    water: waterOz,
    coffee: coffeeOz,
    tea: teaOz,
  };

  const totalOz = waterOz + coffeeOz + teaOz;
  const barMax = Math.max(waterGoalOz, totalOz);
  const otherOz = coffeeOz + teaOz;

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4 transition-colors hover:bg-neutral-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-green-300 opacity-75">Hydration &amp; Electrolytes</span>
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

          {/* Segmented fluid bar with soft gradient transitions */}
          <div className="h-2 rounded-full bg-neutral-500/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: barMax > 0 ? `${Math.min((totalOz / barMax) * 100, 100)}%` : "0%",
                background: buildFluidGradient(amounts, totalOz),
              }}
            />
          </div>

          {otherOz > 0 && (
            <p className="text-[10px] text-white/30">
              +{Math.round(otherOz)} oz other
            </p>
          )}

          {/* Legend (only show types with > 0 oz) */}
          {(coffeeOz > 0 || teaOz > 0) && (
            <div className="flex gap-3 pt-0.5">
              {FLUID_SEGMENTS.filter(({ key }) => amounts[key] > 0).map(
                ({ key, label, dotColor }) => (
                  <span key={key} className="flex items-center gap-1 text-[9px] text-neutral-500">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotColor}`} />
                    {label} {Math.round(amounts[key])} oz
                  </span>
                ),
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 pt-1">
          <div className="grid grid-cols-3 gap-3 flex-1 min-w-0">
            <ElectrolyteCell label="Sodium" amount={sodiumMg} adequate={sodiumGoalMg} />
            <ElectrolyteCell label="Potassium" amount={potassiumMg} adequate={potassiumGoalMg} />
            <ElectrolyteCell label="Magnesium" amount={magnesiumMg} adequate={magnesiumGoalMg} />
          </div>
          <NaKRatioRing sodiumMg={sodiumMg} potassiumMg={potassiumMg} />
        </div>
      </div>
    </div>
  );
}

function buildFluidGradient(
  amounts: Record<string, number>,
  total: number,
): string {
  const active = FLUID_SEGMENTS.filter(({ key }) => amounts[key] > 0);
  if (active.length === 0) return "transparent";
  if (active.length === 1) {
    const s = active[0];
    return `linear-gradient(to right, ${s.hexTo}, ${s.hexFrom} 50%, ${s.hexTo})`;
  }

  const stops: string[] = [];
  let cursor = 0;

  for (let i = 0; i < active.length; i++) {
    const seg = active[i];
    const segPct = (amounts[seg.key] / total) * 100;
    const start = cursor;
    const end = cursor + segPct;

    const mid = (start + end) / 2;

    if (i === 0) {
      stops.push(`${seg.hexTo} ${start}%`);
      stops.push(`${seg.hexFrom} ${mid}%`);
      stops.push(`${seg.hexTo} ${end - FADE_PCT}%`);
    } else if (i === active.length - 1) {
      stops.push(`${seg.hexTo} ${start + FADE_PCT}%`);
      stops.push(`${seg.hexFrom} ${mid}%`);
      stops.push(`${seg.hexTo} ${end}%`);
    } else {
      stops.push(`${seg.hexTo} ${start + FADE_PCT}%`);
      stops.push(`${seg.hexFrom} ${mid}%`);
      stops.push(`${seg.hexTo} ${end - FADE_PCT}%`);
    }

    cursor = end;
  }

  return `linear-gradient(to right, ${stops.join(", ")})`;
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

const TARGET_RATIO = 3 / 2;
const RING_SIZE = 48;
const RING_STROKE = 5;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

function gcd(a: number, b: number): number {
  a = Math.round(a);
  b = Math.round(b);
  if (b === 0) return a;
  return gcd(b, a % b);
}

function formatRatio(na: number, k: number): string {
  if (na === 0 && k === 0) return "—";
  if (k === 0) return `${Math.round(na)}:0`;
  if (na === 0) return `0:${Math.round(k)}`;

  const ratio = na / k;
  const scale = ratio >= 5 || ratio <= 0.2 ? 1 : 10;
  const sNa = Math.round(ratio * scale);
  const sK = scale;
  const d = gcd(sNa, sK);
  return `${sNa / d}:${sK / d}`;
}

function ratioAccuracyColor(na: number, k: number): {
  ring: string;
  text: string;
  naShadeTo: string;
  naShadeFrom: string;
  kShadeTo: string;
  kShadeFrom: string;
} {
  if (na === 0 && k === 0) {
    return {
      ring: "text-neutral-600",
      text: "text-neutral-500",
      naShadeTo: "#525252",
      naShadeFrom: "#737373",
      kShadeTo: "#525252",
      kShadeFrom: "#737373",
    };
  }

  const actual = k > 0 ? na / k : Infinity;
  const deviation = Math.abs(actual - TARGET_RATIO) / TARGET_RATIO;

  if (deviation <= 0.15) {
    return {
      ring: "text-teal-400",
      text: "text-teal-400",
      naShadeTo: "#0d9488",
      naShadeFrom: "#2dd4bf",
      kShadeTo: "#115e59",
      kShadeFrom: "#14b8a6",
    };
  }
  if (deviation <= 0.4) {
    return {
      ring: "text-amber-400",
      text: "text-amber-400",
      naShadeTo: "#d97706",
      naShadeFrom: "#fbbf24",
      kShadeTo: "#92400e",
      kShadeFrom: "#f59e0b",
    };
  }
  return {
    ring: "text-neutral-500",
    text: "text-neutral-500",
    naShadeTo: "#525252",
    naShadeFrom: "#737373",
    kShadeTo: "#404040",
    kShadeFrom: "#525252",
  };
}

function NaKRatioRing({
  sodiumMg,
  potassiumMg,
}: {
  sodiumMg: number;
  potassiumMg: number;
}) {
  const total = sodiumMg + potassiumMg;
  const naFrac = total > 0 ? sodiumMg / total : 0.5;
  const kFrac = total > 0 ? potassiumMg / total : 0.5;
  const colors = ratioAccuracyColor(sodiumMg, potassiumMg);

  const naLen = naFrac * RING_C;
  const kLen = kFrac * RING_C;
  const halfCenter = RING_SIZE / 2;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer"
        >
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            className="block"
          >
            <defs>
              <linearGradient id="naGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={colors.naShadeFrom} />
                <stop offset="100%" stopColor={colors.naShadeTo} />
              </linearGradient>
              <linearGradient id="kGrad" x1="1" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={colors.kShadeFrom} />
                <stop offset="100%" stopColor={colors.kShadeTo} />
              </linearGradient>
            </defs>
            {/* Sodium arc */}
            <circle
              cx={halfCenter}
              cy={halfCenter}
              r={RING_R}
              fill="none"
              stroke="url(#naGrad)"
              strokeWidth={RING_STROKE}
              strokeDasharray={`${naLen} ${RING_C}`}
              strokeDashoffset={RING_C * 0.25}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            {/* Potassium arc */}
            <circle
              cx={halfCenter}
              cy={halfCenter}
              r={RING_R}
              fill="none"
              stroke="url(#kGrad)"
              strokeWidth={RING_STROKE}
              strokeDasharray={`${kLen} ${RING_C}`}
              strokeDashoffset={RING_C * 0.25 - naLen}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <text
              x={halfCenter}
              y={halfCenter}
              textAnchor="middle"
              dominantBaseline="central"
              className={`text-[9px] font-semibold tabular-nums fill-current ${colors.text}`}
            >
              {formatRatio(sodiumMg, potassiumMg)}
            </text>
          </svg>
          <span className="flex items-center gap-0.5 text-[8px] text-neutral-600">
            Na:K <Info className="h-2 w-2 text-neutral-600" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-64 p-3">
        <p className="text-xs font-medium text-neutral-200 mb-1.5">
          Sodium : Potassium Ratio
        </p>
        <p className="text-[11px] leading-relaxed text-neutral-400 mb-2">
          The Na+/K+-ATPase pump moves 3 sodium ions out and
          2 potassium ions in per ATP cycle. Maintaining a dietary
          intake near this 3:2 ratio supports cellular ion balance and
          cardiovascular health.
        </p>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-400" />
            <span className="text-teal-400 font-medium">Teal</span>
            <span className="text-neutral-500">— within 15% of 3:2 target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-amber-400 font-medium">Amber</span>
            <span className="text-neutral-500">— within 40% of target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-neutral-500" />
            <span className="text-neutral-400 font-medium">Gray</span>
            <span className="text-neutral-500">— far from target or no data</span>
          </div>
        </div>
        <p className="text-[9px] text-neutral-600 mt-2">
          Target: 3:2 (Na:K) &middot; Based on Na+/K+-ATPase stoichiometry
        </p>
      </PopoverContent>
    </Popover>
  );
}
