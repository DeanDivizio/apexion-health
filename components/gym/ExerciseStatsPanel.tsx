"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, Trophy, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { VolumeProgressBar } from "./VolumeProgressBar";
import type { ExerciseStats, StrengthSet } from "@/lib/gym";
import { calculateSetVolume, getTotalReps } from "@/lib/gym";

interface ExerciseStatsInlineProps {
  stats: ExerciseStats | null;
  /** Current session sets for this exercise (live-updating) */
  currentSets: StrengthSet[];
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
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

function getStatsMetrics(stats: ExerciseStats | null, currentSets: StrengthSet[]) {
  const currentVolume = currentSets.reduce((sum, s) => sum + calculateSetVolume(s), 0);
  const prevSession = stats?.mostRecentSession;
  const prevSets = prevSession?.sets ?? [];
  const prevSessionVolume = prevSets.reduce((sum, s) => sum + calculateSetVolume(s), 0);
  const bestSessionVolume = stats?.bestSessionVolume ?? 0;
  const bestSessionVolumeForDisplay = Math.max(bestSessionVolume, prevSessionVolume);

  return {
    currentVolume,
    prevSession,
    prevSets,
    prevSessionVolume,
    bestSessionVolumeForDisplay,
  };
}

function CollapsedStatsPreview({
  stats,
  currentSets,
}: {
  stats: ExerciseStats | null;
  currentSets: StrengthSet[];
}) {
  if (!stats) return null;

  const { currentVolume, prevSession, prevSets, prevSessionVolume } = getStatsMetrics(stats, currentSets);

  // When collapsed, only show the "vs previous session" comparison.
  if (!prevSession) return null;

  return (
    <div className="pb-1 space-y-2">
      {prevSession && (
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Previous Session
            </span>
            <span className="text-xs text-muted-foreground">{formatDate(prevSession.date)}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-y-0.5 rounded-md border border-border/40 bg-card/30">
            {prevSets.map((set, i) => (
              <div
                key={i}
                className="w-[32.5%] rounded border border-blue-600/80 px-1 bg-neutral-700/60 py-0.5 text-[10px] leading-tight whitespace-nowrap text-muted-foreground"
              >
                {set.weight}lbs x {formatReps(set)}
                {set.effort !== undefined ? ` RPE ${set.effort}` : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {prevSessionVolume > 0 && (
          <VolumeProgressBar
            label="Session Volume vs Previous Session"
            current={Math.round(currentVolume)}
            record={Math.round(prevSessionVolume)}
          />
        )}
      </div>
    </div>
  );
}

function ExerciseStatsContent({
  stats,
  currentSets,
}: {
  stats: ExerciseStats | null;
  currentSets: StrengthSet[];
}) {
  // Compute current session volume
  const { currentVolume, prevSession, prevSets, prevSessionVolume, bestSessionVolumeForDisplay } =
    getStatsMetrics(stats, currentSets);
  const currentMaxWeight = currentSets.reduce(
    (max, s) => Math.max(max, s.weight),
    0,
  );

  // Find current session best single-set volume
  let currentBestSetVolume = 0;
  for (const s of currentSets) {
    const v = calculateSetVolume(s);
    if (v > currentBestSetVolume) currentBestSetVolume = v;
  }

  // Records from stats
  const recordWeight = stats?.recordSet?.weight ?? 0;
  const recordSetVolume = stats?.recordSet?.totalVolume ?? 0;
  const prevBestSetVolume = prevSets.reduce(
    (max, s) => Math.max(max, calculateSetVolume(s)),
    0,
  );
  const bestSetVolumeForDisplay = Math.max(recordSetVolume, prevBestSetVolume);

  if (!stats) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No previous data for this exercise.
      </p>
    );
  }

  return (
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
                  {Math.round(recordSetVolume).toLocaleString()} lbs ({stats.recordSet.weight}lbs
                  x {getTotalReps(stats.recordSet.reps)})
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Max Weight</span>
                <span>{recordWeight} lbs</span>
              </div>
            </>
          )}
          {!stats.recordSet && bestSetVolumeForDisplay > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Best Set Volume</span>
              <span>{Math.round(bestSetVolumeForDisplay).toLocaleString()} lbs</span>
            </div>
          )}
          {bestSessionVolumeForDisplay > 0 ? (
            <div className="flex justify-between text-muted-foreground">
              <span>Best Session Volume</span>
              <span>{Math.round(bestSessionVolumeForDisplay).toLocaleString()} lbs</span>
            </div>
          ) : (
            <div className="text-muted-foreground">No PRs yet.</div>
          )}
        </div>
      </div>

      {/* Volume Progress Bars */}
      {(prevSessionVolume > 0 || bestSessionVolumeForDisplay > 0 || currentVolume > 0) && (
        <div className="space-y-3">
          {prevSessionVolume > 0 && (
            <VolumeProgressBar
              label="Session Volume vs Previous"
              current={Math.round(currentVolume)}
              record={Math.round(prevSessionVolume)}
            />
          )}
          <VolumeProgressBar
            label="Session Volume vs Best"
            current={Math.round(currentVolume)}
            record={Math.round(bestSessionVolumeForDisplay)}
          />
          {bestSetVolumeForDisplay > 0 && (
            <VolumeProgressBar
              label="Set Volume vs Best"
              current={Math.round(currentBestSetVolume)}
              record={Math.round(bestSetVolumeForDisplay)}
            />
          )}
          {currentMaxWeight > 0 && recordWeight > 0 && (
            <VolumeProgressBar
              label="Max Weight vs Best"
              current={currentMaxWeight}
              record={recordWeight}
            />
          )}
        </div>
      )}
    </>
  );
}

export function ExerciseStatsInline({
  stats,
  currentSets,
  defaultCollapsed = true,
  onCollapsedChange,
  className,
}: ExerciseStatsInlineProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  React.useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  return (
    <div
      className={cn(
        "mt-3",
        className,
      )}
    >
      {!collapsed && (
        <div className="px-3 pt-2 pb-1 space-y-4">
          <ExerciseStatsContent stats={stats} currentSets={currentSets} />
        </div>
      )}

      {collapsed && <CollapsedStatsPreview stats={stats} currentSets={currentSets} />}

      <button
        className="w-full h-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/30"
        onClick={() => setCollapsed(!collapsed)}
        type="button"
      >
        {collapsed ? (
          <>
            <ChevronDown className="h-4 w-4" />
            Show More
          </>
        ) : (
          <>
            <ChevronUp className="h-4 w-4" />
            Show Less
          </>
        )}
      </button>
    </div>
  );
}

