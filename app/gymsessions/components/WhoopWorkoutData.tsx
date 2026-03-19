"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Link2, Unlink } from "lucide-react";
import {
  getWorkoutLinkState,
  associateWorkoutToSession,
  dissociateWorkoutFromSession,
  type WorkoutCandidate,
} from "@/actions/biometrics";

interface WhoopWorkoutDataProps {
  sessionId: string;
  dateStr: string;
  startTimeStr: string;
  endTimeStr: string;
  onLinkChange?: (providers: string[]) => void;
}

function formatDurationLabel(startIso: string, endIso: string): string | null {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const durationMs = end.getTime() - start.getTime();
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null;

  const totalMinutes = Math.round(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatZoneBar(workout: WorkoutCandidate) {
  const zones = [
    { label: "Z0", milli: workout.zoneZeroMilli ?? 0, color: "bg-neutral-500" },
    { label: "Z1", milli: workout.zoneOneMilli ?? 0, color: "bg-blue-400" },
    { label: "Z2", milli: workout.zoneTwoMilli ?? 0, color: "bg-green-400" },
    { label: "Z3", milli: workout.zoneThreeMilli ?? 0, color: "bg-yellow-400" },
    { label: "Z4", milli: workout.zoneFourMilli ?? 0, color: "bg-orange-400" },
    { label: "Z5", milli: workout.zoneFiveMilli ?? 0, color: "bg-red-400" },
  ];

  const total = zones.reduce((acc, z) => acc + z.milli, 0);
  if (total === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {zones.map((z) =>
          z.milli > 0 ? (
            <div
              key={z.label}
              className={z.color}
              style={{ width: `${(z.milli / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <div className="mt-1 flex gap-2 text-[9px] text-neutral-500">
        {zones
          .filter((z) => z.milli > 0)
          .map((z) => (
            <span key={z.label} className="flex items-center gap-0.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${z.color}`} />
              {z.label} {Math.round(z.milli / 60000)}m
            </span>
          ))}
      </div>
    </div>
  );
}

function WorkoutDisplay({
  workout,
  action,
}: {
  workout: WorkoutCandidate;
  action?: React.ReactNode;
}) {
  const durationLabel = formatDurationLabel(workout.start, workout.end);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <span className="text-neutral-300 font-medium truncate flex-1 min-w-0">
          {workout.sportName ?? "Workout"}
          {durationLabel && (
            <span className="text-neutral-500 ml-1.5">· {durationLabel}</span>
          )}
        </span>
        {action}
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {workout.averageHeartRate != null && (
          <div>
            <p className="text-neutral-500">Avg HR</p>
            <p className="text-neutral-200">{workout.averageHeartRate} bpm</p>
          </div>
        )}
        {workout.maxHeartRate != null && (
          <div>
            <p className="text-neutral-500">Max HR</p>
            <p className="text-neutral-200">{workout.maxHeartRate} bpm</p>
          </div>
        )}
        {workout.strain != null && (
          <div>
            <p className="text-neutral-500">Strain</p>
            <p className="text-neutral-200">{workout.strain.toFixed(1)}</p>
          </div>
        )}
        {workout.kilojoule != null && (
          <div>
            <p className="text-neutral-500">Energy</p>
            <p className="text-neutral-200">{Math.round(workout.kilojoule / 4.184)} Cal</p>
          </div>
        )}
      </div>
      {formatZoneBar(workout)}
    </div>
  );
}

export function WhoopWorkoutData({
  sessionId,
  dateStr,
  startTimeStr,
  endTimeStr,
  onLinkChange,
}: WhoopWorkoutDataProps) {
  const [linked, setLinked] = useState<WorkoutCandidate[]>([]);
  const [candidates, setCandidates] = useState<WorkoutCandidate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const onLinkChangeRef = useRef(onLinkChange);
  onLinkChangeRef.current = onLinkChange;

  function notifyLinkChange(linkedWorkouts: WorkoutCandidate[]) {
    const providers = [...new Set(linkedWorkouts.map((w) => w.provider))];
    onLinkChangeRef.current?.(providers);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const state = await getWorkoutLinkState(
          sessionId, dateStr, startTimeStr, endTimeStr,
        );
        if (cancelled) return;

        if (state.linked.length > 0) {
          setLinked(state.linked);
          setCandidates(state.candidates);
          notifyLinkChange(state.linked);
        } else if (state.candidates.length === 1) {
          setLinkingId(state.candidates[0].id);
          await associateWorkoutToSession(state.candidates[0].id, sessionId);
          if (cancelled) return;
          setLinked([state.candidates[0]]);
          setCandidates([]);
          notifyLinkChange([state.candidates[0]]);
        } else {
          setCandidates(state.candidates);
        }
      } catch {
        // No biometric data available
      } finally {
        if (!cancelled) {
          setLinkingId(null);
          setLoaded(true);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [sessionId, dateStr, startTimeStr, endTimeStr]);

  if (!loaded || (linked.length === 0 && candidates.length === 0)) return null;

  const busy = linkingId !== null || unlinkingId !== null;

  const handleLink = async (candidate: WorkoutCandidate) => {
    setLinkingId(candidate.id);
    try {
      await associateWorkoutToSession(candidate.id, sessionId);
      const newLinked = [...linked, candidate];
      setLinked(newLinked);
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
      notifyLinkChange(newLinked);
    } catch (err) {
      console.error(err);
    } finally {
      setLinkingId(null);
    }
  };

  const handleUnlink = async (workout: WorkoutCandidate) => {
    setUnlinkingId(workout.id);
    try {
      await dissociateWorkoutFromSession(workout.id);
      const newLinked = linked.filter((w) => w.id !== workout.id);
      setLinked(newLinked);
      setCandidates((prev) =>
        [...prev, workout].sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
        ),
      );
      notifyLinkChange(newLinked);
    } catch (err) {
      console.error(err);
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <div className="mt-3 border-t border-border/30 pt-3">
      {linked.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs font-medium text-green-400">Whoop Data</span>
          </div>
          <div className="space-y-2.5">
            {linked.map((w) => (
              <WorkoutDisplay
                key={w.id}
                workout={w}
                action={
                  <button
                    onClick={() => handleUnlink(w)}
                    disabled={busy}
                    className="flex items-center gap-0.5 text-[10px] text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Unlink className="h-2.5 w-2.5" />
                    {unlinkingId === w.id ? "Unlinking\u2026" : "Unlink"}
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {candidates.length > 0 && (
        <div className={linked.length > 0 ? "mt-3 pt-2.5 border-t border-border/20" : ""}>
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-400">
              {linked.length > 0
                ? "More Whoop Workouts"
                : `Whoop Workout${candidates.length > 1 ? "s" : ""} Detected`}
            </span>
          </div>
          <div className="space-y-2.5">
            {candidates.map((c) => (
              <div key={c.id}>
                <WorkoutDisplay workout={c} />
                <button
                  onClick={() => handleLink(c)}
                  disabled={busy}
                  className="mt-1.5 flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-950/20 px-3 py-1.5 text-xs text-blue-300 transition-colors hover:bg-blue-950/40 disabled:opacity-50"
                >
                  <Link2 className="h-3 w-3" />
                  {linkingId === c.id
                    ? "Linking\u2026"
                    : `Link ${[
                        c.sportName ? c.sportName.trim() : null,
                        formatDurationLabel(c.start, c.end),
                      ]
                        .filter(Boolean)
                        .join(" \u00b7 ") || "workout"}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
