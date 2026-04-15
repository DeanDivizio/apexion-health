"use client";

import type { FeedEvent } from "@/lib/friends/types";
import { GymEventCard } from "./GymEventCard";
import { NutritionEventCard } from "./NutritionEventCard";
import { HydrationEventCard } from "./HydrationEventCard";
import { groupEventsByDay } from "./helpers";

interface FeedTimelineProps {
  events: FeedEvent[];
  currentUserId: string;
}

function EventCard({ event, currentUserId }: { event: FeedEvent; currentUserId: string }) {
  switch (event.domain) {
    case "GYM":
      return <GymEventCard event={event} currentUserId={currentUserId} />;
    case "NUTRITION":
      return <NutritionEventCard event={event} currentUserId={currentUserId} />;
    case "HYDRATION":
      return <HydrationEventCard event={event} currentUserId={currentUserId} />;
    default:
      return null;
  }
}

export function FeedTimeline({ events, currentUserId }: FeedTimelineProps) {
  const grouped = groupEventsByDay(events);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04] mb-4">
          <span className="text-2xl">👋</span>
        </div>
        <p className="text-sm text-white/60 mb-1">No activity yet</p>
        <p className="text-xs text-white/30 max-w-[240px]">
          When your friends log workouts, meals, or hydration, their activity will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs font-medium text-white/30 uppercase tracking-wider">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="space-y-3">
            {group.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
