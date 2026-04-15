"use client";

import { Droplets, Flame } from "lucide-react";
import type { FeedEvent } from "@/lib/friends/types";
import { UserAvatar } from "./UserAvatar";
import { EventReactions } from "./EventReactions";
import { timeAgo } from "./helpers";

interface HydrationEventCardProps {
  event: FeedEvent;
  currentUserId: string;
}

export function HydrationEventCard({ event, currentUserId }: HydrationEventCardProps) {
  if (event.eventType === "hydration_streak") {
    return <HydrationStreakCard event={event} currentUserId={currentUserId} />;
  }

  return <HydrationGoalCard event={event} currentUserId={currentUserId} />;
}

function HydrationGoalCard({ event, currentUserId }: HydrationEventCardProps) {
  const meta = event.metadata;
  const actual = meta.actual as number;
  const target = meta.target as number;
  const pct = Math.round((actual / target) * 100);

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 to-neutral-900/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3">
        <UserAvatar user={event.user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/90">{event.user.displayName}</span>
            <span className="text-xs text-white/30">{timeAgo(event.occurredAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Droplets className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-xs font-medium text-sky-400">{event.title}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-xl bg-sky-500/[0.06] border border-sky-500/10 p-3">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-sky-400">
            {actual} {String(meta.unit)}
          </span>
          <span className="text-sm text-white/40 mb-0.5">
            of {target} {String(meta.unit)}
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-400 transition-all"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        {!!meta.logCount && (
          <p className="text-xs text-white/35 mt-2">
            {Number(meta.logCount)} logs throughout the day
          </p>
        )}
      </div>

      <div className="px-4 py-3">
        <EventReactions reactions={event.reactions} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function HydrationStreakCard({ event, currentUserId }: HydrationEventCardProps) {
  const meta = event.metadata;

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/15 to-neutral-900/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3">
        <UserAvatar user={event.user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/90">{event.user.displayName}</span>
            <span className="text-xs text-white/30">{timeAgo(event.occurredAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Flame className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-xs font-medium text-sky-400">{event.title}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-xl bg-sky-500/[0.06] border border-sky-500/10 p-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Droplets className="h-5 w-5 text-sky-400" />
          <span className="text-3xl font-bold text-sky-400">{Number(meta.streakDays)}</span>
        </div>
        <div className="text-sm text-white/50">
          <p>day streak</p>
          <p className="text-xs text-white/30">
            {Number(meta.dailyTarget)} {String(meta.unit)}/day target
          </p>
        </div>
      </div>

      <div className="px-4 py-3">
        <EventReactions reactions={event.reactions} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
