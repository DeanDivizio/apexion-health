"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, Trophy, History, StickyNote, BookOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui_primitives/popover";
import { Textarea } from "@/components/ui_primitives/textarea";
import { Button } from "@/components/ui_primitives/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui_primitives/drawer";
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
  sessionExerciseNotes?: string;
  onSessionExerciseNotesChange?: (notes: string) => void;
  onPersistentNoteChange?: (notes: string | null) => void;
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
                {set.repsInReserve !== undefined ? ` w/ ${set.repsInReserve} RIR` : ""}
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
            beatLabel="Beat Previous!"
          />
        )}
      </div>
    </div>
  );
}

function NoteDisplay({ label, icon, content }: { label: string; icon: React.ReactNode; content: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground/80 bg-card/40 rounded-lg p-2.5 whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function NoteEditPopover({
  stats,
  sessionExerciseNotes,
  onSessionExerciseNotesChange,
  onPersistentNoteChange,
}: {
  stats: ExerciseStats | null;
  sessionExerciseNotes?: string;
  onSessionExerciseNotesChange?: (notes: string) => void;
  onPersistentNoteChange?: (notes: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [persistentDraft, setPersistentDraft] = React.useState(stats?.notes ?? "");
  const [sessionDrawerOpen, setSessionDrawerOpen] = React.useState(false);
  const [persistentDrawerOpen, setPersistentDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPersistentDraft(stats?.notes ?? "");
    }
  }, [open, stats?.notes]);

  const hasAnyNotes = !!(sessionExerciseNotes?.trim() || stats?.notes?.trim());

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="p-1 rounded-md hover:bg-white/10 transition-colors relative"
            aria-label="Exercise notes"
          >
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            {hasAnyNotes && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-2 rounded-xl border-white/20 bg-gradient-to-br from-blue-950/20 via-emerald-950/35 to-slate-950/50 backdrop-blur-2xl"
          align="end"
          side="bottom"
        >
          <div className="space-y-1">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-left hover:bg-white/10 transition-colors"
              onClick={() => {
                setOpen(false);
                setSessionDrawerOpen(true);
              }}
            >
              <FileText className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground/90">Today&apos;s Note</p>
                <p className="text-xs text-muted-foreground truncate">
                  {sessionExerciseNotes?.trim() || "Note for this exercise in this session"}
                </p>
              </div>
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-left hover:bg-white/10 transition-colors"
              onClick={() => {
                setPersistentDraft(stats?.notes ?? "");
                setOpen(false);
                setPersistentDrawerOpen(true);
              }}
            >
              <BookOpen className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground/90">Exercise Note</p>
                <p className="text-xs text-muted-foreground truncate">
                  {stats?.notes?.trim() || "Persistent note for this exercise"}
                </p>
              </div>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Drawer open={sessionDrawerOpen} onOpenChange={setSessionDrawerOpen}>
        <DrawerContent className="rounded-t-2xl border-white/20 bg-gradient-to-br from-blue-950/20 via-emerald-950/35 to-slate-950/50 backdrop-blur-2xl">
          <DrawerHeader>
            <DrawerTitle>Today&apos;s Note</DrawerTitle>
            <DrawerDescription>Saved with this session only.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <Textarea
              value={sessionExerciseNotes ?? ""}
              onChange={(e) => onSessionExerciseNotesChange?.(e.target.value)}
              placeholder="Notes for this exercise today..."
              className="min-h-[7rem] resize-none text-sm"
              rows={4}
            />
          </div>
          <DrawerFooter>
            <Button onClick={() => setSessionDrawerOpen(false)}>Done</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={persistentDrawerOpen} onOpenChange={setPersistentDrawerOpen}>
        <DrawerContent className="rounded-t-2xl border-white/20 bg-gradient-to-br from-blue-950/18 via-card/45 to-emerald-950/14 backdrop-blur-2xl">
          <DrawerHeader>
            <DrawerTitle>Exercise Note</DrawerTitle>
            <DrawerDescription>Shown every time you log this exercise.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <Textarea
              value={persistentDraft}
              onChange={(e) => setPersistentDraft(e.target.value)}
              placeholder="Form cues, tips, reminders..."
              className="min-h-[7rem] resize-none text-sm"
              rows={4}
            />
          </div>
          <DrawerFooter>
            <Button
              onClick={() => {
                const trimmed = persistentDraft.trim();
                onPersistentNoteChange?.(trimmed || null);
                setPersistentDrawerOpen(false);
              }}
            >
              Save
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function ExerciseStatsContent({
  stats,
  currentSets,
  sessionExerciseNotes,
  onSessionExerciseNotesChange,
  onPersistentNoteChange,
}: {
  stats: ExerciseStats | null;
  currentSets: StrengthSet[];
  sessionExerciseNotes?: string;
  onSessionExerciseNotesChange?: (notes: string) => void;
  onPersistentNoteChange?: (notes: string | null) => void;
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
                    {set.repsInReserve !== undefined ? ` w/ ${set.repsInReserve} RIR` : ""}
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
              beatLabel="Beat Previous!"
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

      {/* Notes display in expanded state */}
      {(stats?.notes || sessionExerciseNotes?.trim()) && (
        <div className="space-y-3">
          {stats?.notes && (
            <NoteDisplay
              label="Exercise Note"
              icon={<BookOpen className="h-3.5 w-3.5 text-amber-400" />}
              content={stats.notes}
            />
          )}
          {sessionExerciseNotes?.trim() && (
            <NoteDisplay
              label="Today's Note"
              icon={<FileText className="h-3.5 w-3.5 text-blue-400" />}
              content={sessionExerciseNotes}
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
  sessionExerciseNotes,
  onSessionExerciseNotesChange,
  onPersistentNoteChange,
}: ExerciseStatsInlineProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  React.useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  return (
    <div
      className={cn(
        "mt-4",
        className,
      )}
    >
      {/* Note button in upper-right */}
      <div className="absolute top-3 right-3 z-20">
        <NoteEditPopover
          stats={stats}
          sessionExerciseNotes={sessionExerciseNotes}
          onSessionExerciseNotesChange={onSessionExerciseNotesChange}
          onPersistentNoteChange={onPersistentNoteChange}
        />
      </div>

      {!collapsed && (
        <div className="px-3 pt-1 pb-1 space-y-4">
          <ExerciseStatsContent
            stats={stats}
            currentSets={currentSets}
            sessionExerciseNotes={sessionExerciseNotes}
            onSessionExerciseNotesChange={onSessionExerciseNotesChange}
            onPersistentNoteChange={onPersistentNoteChange}
          />
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

