"use client";

import { Dumbbell, Trophy, Flame, Clock, Target } from "lucide-react";
import type { FeedEvent } from "@/lib/friends/types";
import { UserAvatar } from "./UserAvatar";
import { EventReactions } from "./EventReactions";
import { timeAgo } from "./helpers";

interface GymExercise {
  name: string;
  sets: number;
  bestSet: { weight: number; reps: number; unit: string };
}

interface GymEventCardProps {
  event: FeedEvent;
  currentUserId: string;
}

export function GymEventCard({ event, currentUserId }: GymEventCardProps) {
  const meta = event.metadata;

  if (event.eventType === "pr_hit") {
    return <PrCard event={event} currentUserId={currentUserId} />;
  }

  if (event.eventType === "workout_streak") {
    return <StreakCard event={event} currentUserId={currentUserId} />;
  }

  const exercises = (meta.exercises as GymExercise[] | undefined) ?? [];
  const hasExerciseDetail = exercises.length > 0;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-neutral-900/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3">
        <UserAvatar user={event.user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/90">{event.user.displayName}</span>
            <span className="text-xs text-white/30">{timeAgo(event.occurredAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Dumbbell className="h-3.5 w-3.5 text-teal-400" />
            <span className="text-xs text-teal-400/80">{event.title}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-xl bg-white/[0.03] border border-white/[0.04] p-3">
        {!!meta.sessionName && (
          <p className="text-sm font-medium text-white/80 mb-2">
            {String(meta.sessionName)}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-white/50">
          {!!meta.durationMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {Number(meta.durationMinutes)} min
            </span>
          )}
          {!!meta.exerciseCount && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {Number(meta.exerciseCount)} exercises
            </span>
          )}
          {!!meta.totalSets && (
            <span>{Number(meta.totalSets)} sets</span>
          )}
        </div>

        {hasExerciseDetail && (
          <div className="mt-3 space-y-1.5">
            {exercises.map((ex) => (
              <div
                key={ex.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-white/70">{ex.name}</span>
                <span className="text-white/40">
                  {ex.bestSet.weight > 0
                    ? `${ex.bestSet.weight} ${ex.bestSet.unit} × ${ex.bestSet.reps}`
                    : `${ex.bestSet.reps} reps`}
                  <span className="text-white/20 ml-1">({ex.sets}s)</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <EventReactions reactions={event.reactions} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function PrCard({ event, currentUserId }: GymEventCardProps) {
  const meta = event.metadata;
  const prevBest = meta.previousBest as { weight: number; reps: number } | undefined;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-neutral-900/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3">
        <UserAvatar user={event.user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/90">{event.user.displayName}</span>
            <span className="text-xs text-white/30">{timeAgo(event.occurredAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">New Personal Record!</span>
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 p-3">
        <p className="text-sm font-medium text-white/80">{String(meta.exercise)}</p>
        <p className="text-2xl font-bold text-amber-400 mt-1">
          {Number(meta.weight)} {String(meta.unit)} × {Number(meta.reps)}
        </p>
        {prevBest && (
          <p className="text-xs text-white/40 mt-1">
            Previous best: {prevBest.weight} lbs × {prevBest.reps}
          </p>
        )}
      </div>

      <div className="px-4 py-3">
        <EventReactions reactions={event.reactions} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function StreakCard({ event, currentUserId }: GymEventCardProps) {
  const meta = event.metadata;

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-950/15 to-neutral-900/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3">
        <UserAvatar user={event.user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/90">{event.user.displayName}</span>
            <span className="text-xs text-white/30">{timeAgo(event.occurredAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-medium text-orange-400">{event.title}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-xl bg-orange-500/[0.06] border border-orange-500/10 p-3 flex items-center gap-3">
        <span className="text-3xl font-bold text-orange-400">{Number(meta.streakCount)}</span>
        <span className="text-sm text-white/50">sessions this {String(meta.period)}</span>
      </div>

      <div className="px-4 py-3">
        <EventReactions reactions={event.reactions} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
