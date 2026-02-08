"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, Trophy, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { VolumeProgressBar } from "./VolumeProgressBar";
import type { ExerciseStats, StrengthSet } from "@/lib/gym";
import { calculateSetVolume, getTotalReps } from "@/lib/gym";

interface ExerciseStatsPanelProps {
  stats: ExerciseStats | null;
  /** Current session sets for this exercise (live-updating) */
  currentSets: StrengthSet[];
  visible: boolean;
}

function formatDate(dateStr: string): string {
  if (dateStr.length !== 8) return dateStr;
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return `${m}/${d}/${y}`;
}

function formatReps(set: StrengthSet): string {
  if (set.reps.bilateral !== undefined) return `${set.reps.bilateral}`;
  return `L${set.reps.left ?? 0}/R${set.reps.right ?? 0}`;
}

export function ExerciseStatsPanel({
  stats,
  currentSets,
  visible,
}: ExerciseStatsPanelProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  if (!visible) return null;

  // Compute current session volume
  const currentVolume = currentSets.reduce((sum, s) => sum + calculateSetVolume(s), 0);
  const currentMaxWeight = currentSets.reduce(
    (max, s) => Math.max(max, s.weight),
    0,
  );

  // Find current session best single-set volume
  let currentBestSetVolume = 0;
  let currentBestSetDesc = "";
  for (const s of currentSets) {
    const v = calculateSetVolume(s);
    if (v > currentBestSetVolume) {
      currentBestSetVolume = v;
      const reps = getTotalReps(s.reps);
      currentBestSetDesc = `${s.weight}lbs x ${reps}`;
    }
  }

  // Records from stats
  const recordTotalVolume = stats?.recordSet?.totalVolume ?? 0;
  const recordWeight = stats?.recordSet?.weight ?? 0;
  const recordSetVolume = stats?.recordSet?.totalVolume ?? 0;

  // Previous session
  const prevSession = stats?.mostRecentSession;
  const prevSets = prevSession?.sets ?? [];
  const prevSessionVolume = prevSets.reduce((sum, s) => sum + calculateSetVolume(s), 0);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-t border-border transition-all duration-300",
        collapsed ? "h-10" : "max-h-[50vh]",
      )}
    >
      {/* Toggle bar */}
      <button
        className="w-full h-10 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Exercise Stats
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Collapse
          </>
        )}
      </button>

      {!collapsed && (
        <div className="overflow-y-auto px-4 pb-4 space-y-4" style={{ maxHeight: "calc(50vh - 2.5rem)" }}>
          {!stats ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No previous data for this exercise.
            </p>
          ) : (
            <>
              {/* Previous Session */}
              {prevSession && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-blue-400" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Previous Session
                    </h4>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDate(prevSession.date)}
                    </span>
                  </div>
                  <div className="space-y-1 bg-card/40 rounded-lg p-2.5">
                    {prevSets.map((set, i) => {
                      const vol = calculateSetVolume(set);
                      return (
                        <div
                          key={i}
                          className="flex justify-between text-xs text-muted-foreground"
                        >
                          <span>Set {i + 1}</span>
                          <span>
                            {set.weight}lbs x {formatReps(set)}
                            {set.effort ? ` @ RPE ${set.effort}` : ""}
                            <span className="text-muted-foreground/60 ml-1.5">
                              ({Math.round(vol)} vol)
                            </span>
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-xs font-medium pt-1 border-t border-border/30">
                      <span>Total Volume</span>
                      <span>{Math.round(prevSessionVolume).toLocaleString()} lbs</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Records */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Personal Records
                  </h4>
                </div>

                <div className="space-y-1 bg-card/40 rounded-lg p-2.5 text-xs">
                  {stats.recordSet && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Best Set Volume</span>
                        <span>
                          {Math.round(recordSetVolume).toLocaleString()} lbs
                          ({stats.recordSet.weight}lbs x{" "}
                          {getTotalReps(stats.recordSet.reps)})
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Max Weight</span>
                        <span>{recordWeight} lbs</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Volume Progress Bars */}
              {(recordTotalVolume > 0 || currentVolume > 0) && (
                <div className="space-y-3">
                  <VolumeProgressBar
                    label="Session Volume vs Record"
                    current={Math.round(currentVolume)}
                    record={Math.round(prevSessionVolume > 0 ? prevSessionVolume : recordTotalVolume)}
                  />
                  {currentBestSetVolume > 0 && recordSetVolume > 0 && (
                    <VolumeProgressBar
                      label="Best Set vs PR"
                      current={Math.round(currentBestSetVolume)}
                      record={Math.round(recordSetVolume)}
                    />
                  )}
                  {currentMaxWeight > 0 && recordWeight > 0 && (
                    <VolumeProgressBar
                      label="Max Weight vs PR"
                      current={currentMaxWeight}
                      record={recordWeight}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
