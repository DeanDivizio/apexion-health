"use client";

import { Apple, Target } from "lucide-react";
import type { FeedEvent } from "@/lib/friends/types";
import { UserAvatar } from "./UserAvatar";
import { EventReactions } from "./EventReactions";
import { timeAgo } from "./helpers";

interface NutritionEventCardProps {
  event: FeedEvent;
  currentUserId: string;
}

export function NutritionEventCard({ event, currentUserId }: NutritionEventCardProps) {
  if (event.eventType === "daily_macro_goal_hit") {
    return <GoalHitCard event={event} currentUserId={currentUserId} />;
  }

  return <MealCard event={event} currentUserId={currentUserId} />;
}

function MealCard({ event, currentUserId }: NutritionEventCardProps) {
  const meta = event.metadata;
  const macros = meta.macros as { calories: number; protein: number; carbs: number; fat: number } | undefined;
  const items = (meta.items as string[]) ?? [];

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
            <Apple className="h-3.5 w-3.5 text-green-400" />
            <span className="text-xs text-green-400/80">{String(meta.mealName)}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-xl bg-white/[0.03] border border-white/[0.04] p-3">
        {items.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {items.map((item) => (
              <span
                key={item}
                className="inline-block rounded-full bg-green-500/10 border border-green-500/15 px-2.5 py-0.5 text-xs text-green-300/80"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {macros && (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-semibold text-white/80">{macros.calories}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">cal</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-400/80">{macros.protein}g</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">protein</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-sky-400/80">{macros.carbs}g</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">carbs</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-400/80">{macros.fat}g</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wide">fat</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3">
        <EventReactions reactions={event.reactions} currentUserId={currentUserId} />
      </div>
    </div>
  );
}

function GoalHitCard({ event, currentUserId }: NutritionEventCardProps) {
  const meta = event.metadata;
  const actual = meta.actual as number;
  const target = meta.target as number;
  const pct = Math.round((actual / target) * 100);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-neutral-900/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-3">
        <UserAvatar user={event.user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/90">{event.user.displayName}</span>
            <span className="text-xs text-white/30">{timeAgo(event.occurredAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Target className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">{event.title}</span>
          </div>
        </div>
      </div>

      <div className="mx-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 p-3">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-emerald-400">
            {actual}{String(meta.unit)}
          </span>
          <span className="text-sm text-white/40 mb-0.5">
            of {target}{String(meta.unit)} ({pct}%)
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        {!!meta.totalCalories && (
          <p className="text-xs text-white/35 mt-2">
            {Number(meta.totalCalories)} total calories today
          </p>
        )}
      </div>

      <div className="px-4 py-3">
        <EventReactions reactions={event.reactions} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
