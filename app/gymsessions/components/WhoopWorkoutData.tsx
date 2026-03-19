"use client";

import { useEffect, useState } from "react";
import { Activity, Link2 } from "lucide-react";
import {
  getOverlappingWorkouts,
  getAssociatedWorkout,
  associateWorkoutToSession,
  type WorkoutCandidate,
} from "@/actions/biometrics";

interface WhoopWorkoutDataProps {
  sessionId: string;
  dateStr: string;
  startTimeStr: string;
  endTimeStr: string;
  onLinkedProvider?: (provider: string) => void;
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

function WorkoutDisplay({ workout }: { workout: WorkoutCandidate }) {
  const durationLabel = formatDurationLabel(workout.start, workout.end);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-neutral-300 font-medium truncate">
          {workout.sportName ?? "Workout"}
        </span>
        {durationLabel && (
          <span className="text-neutral-500 shrink-0">{durationLabel}</span>
        )}
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
            <p className="text-neutral-200">{Math.round(workout.kilojoule)} kJ</p>
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
  onLinkedProvider,
}: WhoopWorkoutDataProps) {
  const [associated, setAssociated] = useState<WorkoutCandidate | null>(null);
  const [candidates, setCandidates] = useState<WorkoutCandidate[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const assoc = await getAssociatedWorkout(sessionId);
        if (assoc) {
          setAssociated(assoc);
          onLinkedProvider?.("whoop");
        } else {
          const overlaps = await getOverlappingWorkouts(
            sessionId,
            dateStr,
            startTimeStr,
            endTimeStr,
          );
          const available = overlaps.filter((w) => !w.gymSessionId);
          if (available.length === 1) {
            // Auto-link when there is exactly one unambiguous candidate.
            setLinking(true);
            await associateWorkoutToSession(available[0].id, sessionId);
            setAssociated(available[0]);
            setCandidates([]);
            onLinkedProvider?.("whoop");
          } else {
            setCandidates(available);
          }
        }
      } catch {
        // No biometric data available
      } finally {
        setLinking(false);
        setLoaded(true);
      }
    }
    load();
  }, [sessionId, dateStr, startTimeStr, endTimeStr, onLinkedProvider]);

  if (!loaded) return null;

  // Already associated
  if (associated) {
    return (
      <div className="mt-3 border-t border-border/30 pt-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="h-3.5 w-3.5 text-green-400" />
          <span className="text-xs font-medium text-green-400">Whoop Data</span>
        </div>
        <WorkoutDisplay workout={associated} />
      </div>
    );
  }

  // Candidates available but not yet linked
  if (candidates.length > 0) {
    const handleLink = async (candidate: WorkoutCandidate) => {
      setLinking(true);
      try {
        await associateWorkoutToSession(candidate.id, sessionId);
        setAssociated(candidate);
        setCandidates([]);
        onLinkedProvider?.("whoop");
      } catch (err) {
        console.error(err);
      } finally {
        setLinking(false);
      }
    };

    return (
      <div className="mt-3 border-t border-border/30 pt-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-medium text-blue-400">
            Whoop Workout{candidates.length > 1 ? "s" : ""} Detected
          </span>
        </div>
        {candidates.map((c) => (
          <div key={c.id} className="mb-2">
            <WorkoutDisplay workout={c} />
            <button
              onClick={() => handleLink(c)}
              disabled={linking}
              className="mt-2 flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-950/20 px-3 py-1.5 text-xs text-blue-300 transition-colors hover:bg-blue-950/40 disabled:opacity-50"
            >
              <Link2 className="h-3 w-3" />
              {linking
                ? "Linking..."
                : `Link ${[
                    c.sportName ? c.sportName.trim() : null,
                    formatDurationLabel(c.start, c.end),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "workout"}`}
            </button>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
