"use client";

import { useState } from "react";
import type { FeedReaction } from "@/lib/friends/types";
import { cn } from "@/lib/utils";

const AVAILABLE_REACTIONS = ["🔥", "💪", "👏", "🎉", "💧"];

interface EventReactionsProps {
  reactions: FeedReaction[];
  currentUserId: string;
}

export function EventReactions({ reactions, currentUserId }: EventReactionsProps) {
  const [localReactions, setLocalReactions] = useState(reactions);
  const [showPicker, setShowPicker] = useState(false);

  const grouped = localReactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const userReaction = localReactions.find((r) => r.userId === currentUserId);

  function toggleReaction(emoji: string) {
    if (userReaction?.emoji === emoji) {
      setLocalReactions((prev) => prev.filter((r) => r.userId !== currentUserId));
    } else {
      setLocalReactions((prev) => [
        ...prev.filter((r) => r.userId !== currentUserId),
        {
          id: `r_local_${Date.now()}`,
          userId: currentUserId,
          emoji,
          createdAt: new Date(),
        },
      ]);
    }
    setShowPicker(false);
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {Object.entries(grouped).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
            userReaction?.emoji === emoji
              ? "bg-white/15 ring-1 ring-white/20"
              : "bg-white/[0.06] hover:bg-white/10"
          )}
        >
          <span>{emoji}</span>
          <span className="text-white/60">{count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-xs text-white/40 hover:bg-white/10 hover:text-white/60 transition-colors"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-xl bg-neutral-800 border border-white/10 p-1.5 shadow-xl z-10">
            {AVAILABLE_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
