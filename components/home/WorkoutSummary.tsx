"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui_primitives/card";
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
    <Card className="bg-neutral-800/50 backdrop-blur-xl border-neutral-700/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-blue-400" />
          Today&apos;s Workout
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No workouts logged today
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <WorkoutSessionRow key={session.sessionId} session={session} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkoutSessionRow({ session }: { session: WorkoutSession }) {
  const timeStr = formatTime(session.startTime);
  const isCardioOnly = session.exerciseCount === 0 && session.cardioMinutes > 0;

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{timeStr}</p>
      {isCardioOnly ? (
        <p className="text-sm">
          Cardio · {session.cardioMinutes} min
        </p>
      ) : (
        <>
          <p className="text-sm">
            {session.exerciseCount} exercise{session.exerciseCount !== 1 ? "s" : ""} · {session.totalSets} set{session.totalSets !== 1 ? "s" : ""}
            {session.cardioMinutes > 0 && ` · ${session.cardioMinutes} min cardio`}
          </p>
          {session.totalVolume > 0 && (
            <p className="text-xs text-muted-foreground">
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
