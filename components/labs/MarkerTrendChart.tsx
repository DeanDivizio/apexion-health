"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";
import { Skeleton } from "@/components/ui_primitives/skeleton";
import { Button } from "@/components/ui_primitives/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui_primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui_primitives/popover";
import { ArrowLeft, ChevronsUpDown } from "lucide-react";
import {
  getMarkerHistoryAction,
  listMarkersAction,
} from "@/actions/labs";
import type { MarkerHistoryPoint, MarkerCatalogView } from "@/lib/labs/types";

interface MarkerTrendChartProps {
  initialMarkerKey: string;
  onBack: () => void;
}

interface ChartPoint {
  date: string;
  dateLabel: string;
  value: number;
  unit: string;
  rangeLow: number | null;
  rangeHigh: number | null;
  flag: string | null;
  institution: string | null;
  unitMismatch: boolean;
}

function prepareChartData(history: MarkerHistoryPoint[]): ChartPoint[] {
  if (history.length === 0) return [];

  const primaryUnit =
    history[history.length - 1].normalizedUnit ??
    history[history.length - 1].unit;

  return history.map((p) => {
    const useNormalized = p.normalizedValue != null;
    const pointUnit = useNormalized ? p.normalizedUnit! : p.unit;
    const pointValue = useNormalized ? p.normalizedValue! : p.value;

    return {
      date: p.reportDate,
      dateLabel: new Date(p.reportDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
        timeZone: "UTC",
      }),
      value: Math.round(pointValue * 100) / 100,
      unit: pointUnit,
      rangeLow: p.rangeLow,
      rangeHigh: p.rangeHigh,
      flag: p.flag,
      institution: p.institution,
      unitMismatch: pointUnit !== primaryUnit,
    };
  });
}

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;

  let fill = "var(--color-green, #22c55e)";
  let strokeDash = "";
  if (payload.flag === "H") fill = "#ef4444";
  else if (payload.flag === "L") fill = "#f59e0b";

  if (payload.unitMismatch) {
    return (
      <rect
        x={cx - 4}
        y={cy - 4}
        width={8}
        height={8}
        fill={fill}
        stroke="white"
        strokeWidth={1}
        opacity={0.9}
      />
    );
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={fill}
      stroke="white"
      strokeWidth={1}
      opacity={0.9}
    />
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const p = payload[0].payload as ChartPoint;
  return (
    <div className="rounded-lg border border-white/10 bg-black/90 px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-white/90">{p.dateLabel}</p>
      <p className="text-white/70">
        {p.value} {p.unit}
      </p>
      {p.rangeLow != null && p.rangeHigh != null && (
        <p className="text-white/40">
          Range: {p.rangeLow} – {p.rangeHigh}
        </p>
      )}
      {p.flag && (
        <p className={p.flag === "H" ? "text-red-400" : "text-amber-400"}>
          {p.flag === "H" ? "Above range" : "Below range"}
        </p>
      )}
      {p.institution && (
        <p className="text-white/30">{p.institution}</p>
      )}
      {p.unitMismatch && (
        <p className="mt-1 text-amber-400">
          Different unit — may not be directly comparable
        </p>
      )}
    </div>
  );
}

export function MarkerTrendChart({
  initialMarkerKey,
  onBack,
}: MarkerTrendChartProps) {
  const [markerKey, setMarkerKey] = useState(initialMarkerKey);
  const [history, setHistory] = useState<MarkerHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<MarkerCatalogView[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    listMarkersAction().then(setMarkers);
  }, []);

  useEffect(() => {
    setLoading(true);
    getMarkerHistoryAction(markerKey).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [markerKey]);

  const selectedMarker = markers.find((m) => m.key === markerKey);
  const chartData = useMemo(() => prepareChartData(history), [history]);

  const refLow = chartData.length > 0 ? chartData[chartData.length - 1].rangeLow : null;
  const refHigh = chartData.length > 0 ? chartData[chartData.length - 1].rangeHigh : null;

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    const vals = chartData.map((d) => d.value);
    const allNums = [...vals];
    if (refLow != null) allNums.push(refLow);
    if (refHigh != null) allNums.push(refHigh);
    const min = Math.min(...allNums);
    const max = Math.max(...allNums);
    const pad = (max - min) * 0.15 || 1;
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  }, [chartData, refLow, refHigh]);

  const displayUnit =
    chartData.length > 0 ? chartData[chartData.length - 1].unit : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>

        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[200px] justify-between"
            >
              {selectedMarker?.canonicalName ?? markerKey}
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search markers..." />
              <CommandList>
                <CommandEmpty>No markers found.</CommandEmpty>
                <CommandGroup>
                  {markers.map((m) => (
                    <CommandItem
                      key={m.key}
                      value={m.canonicalName}
                      onSelect={() => {
                        setMarkerKey(m.key);
                        setPickerOpen(false);
                      }}
                    >
                      <span className="flex-1">{m.canonicalName}</span>
                      <span className="text-xs text-white/30">{m.unit}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {displayUnit && (
          <span className="text-xs text-white/40">({displayUnit})</span>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-[300px] w-full rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/30">
          No results found for this marker.
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
              />
              <YAxis
                domain={yDomain}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />

              {refLow != null && refHigh != null && (
                <ReferenceArea
                  y1={refLow}
                  y2={refHigh}
                  fill="url(#rangeGrad)"
                  strokeOpacity={0}
                />
              )}
              {refLow != null && (
                <ReferenceLine
                  y={refLow}
                  stroke="rgba(34,197,94,0.3)"
                  strokeDasharray="4 4"
                />
              )}
              {refHigh != null && (
                <ReferenceLine
                  y={refHigh}
                  stroke="rgba(34,197,94,0.3)"
                  strokeDasharray="4 4"
                />
              )}

              <Area
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#valueGrad)"
                dot={<CustomDot />}
                activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {chartData.some((d) => d.unitMismatch) && (
            <p className="mt-2 text-center text-xs text-amber-400/80">
              Some points use a different unit and may not be directly
              comparable (shown as squares).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
