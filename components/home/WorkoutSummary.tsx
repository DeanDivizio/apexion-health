"use client";

import { Dumbbell } from "lucide-react";

interface WorkoutSession {
  sessionId: string;
  startTime: string;
  endTime: string;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
  muscleGroups: string[];
  cardioMinutes: number;
}

interface WorkoutSummaryProps {
  sessions: WorkoutSession[];
}

export function WorkoutSummary({ sessions }: WorkoutSummaryProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-4 transition-colors hover:bg-neutral-800/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-blue-400 opacity-80">Today&apos;s Workout</span>
        <Dumbbell className="h-3.5 w-3.5 text-blue-200 opacity-50 shrink-0" aria-hidden />
      </div>
      <div>
        {sessions.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No workouts logged today
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <WorkoutSessionRow key={session.sessionId} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkoutSessionRow({ session }: { session: WorkoutSession }) {
  const timeStr = formatTime(session.startTime);
  const isCardioOnly = session.exerciseCount === 0 && session.cardioMinutes > 0;

  return (
    <div className="space-y-1">
      <p className="text-xs text-neutral-500">{timeStr}</p>
      {isCardioOnly ? (
        <p className="text-sm text-neutral-100">
          Cardio · {session.cardioMinutes} min
        </p>
      ) : (
        <>
          <p className="text-sm text-neutral-100">
            {session.exerciseCount} exercise{session.exerciseCount !== 1 ? "s" : ""} · {session.totalSets} set{session.totalSets !== 1 ? "s" : ""}
            {session.cardioMinutes > 0 && ` · ${session.cardioMinutes} min cardio`}
          </p>
          {session.totalVolume > 0 && (
            <p className="text-xs text-neutral-500">
              Volume: {session.totalVolume.toLocaleString()} lbs
            </p>
          )}
          {session.muscleGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {session.muscleGroups.map((mg) => (
                <span
                  key={mg}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300"
                >
                  {mg}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatTime(isoOrTimeStr: string): string {
  try {
    const date = new Date(isoOrTimeStr);
    if (isNaN(date.getTime())) return isoOrTimeStr;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoOrTimeStr;
  }
}
