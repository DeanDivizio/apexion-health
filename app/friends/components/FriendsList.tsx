"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Friendship } from "@/lib/friends/types";
import { UserAvatar } from "./UserAvatar";
import { SharingPermissions } from "./SharingPermissions";

interface FriendsListProps {
  friendships: Friendship[];
}

export function FriendsList({ friendships }: FriendsListProps) {
  const [selectedFriendship, setSelectedFriendship] = useState<Friendship | null>(null);

  if (selectedFriendship) {
    return (
      <SharingPermissions
        friendship={selectedFriendship}
        onBack={() => setSelectedFriendship(null)}
      />
    );
  }

  if (friendships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04] mb-3">
          <span className="text-xl">🤝</span>
        </div>
        <p className="text-sm text-white/60 mb-1">No friends yet</p>
        <p className="text-xs text-white/30">
          Add friends with their friend code to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {friendships.map((fs) => {
        const enabledCount = fs.permissions.filter((p) => p.enabled).length;
        return (
          <button
            key={fs.id}
            onClick={() => setSelectedFriendship(fs)}
            className="flex items-center gap-3 w-full rounded-xl bg-neutral-800/50 border border-white/[0.06] p-3 hover:bg-neutral-800/70 transition-colors text-left"
          >
            <UserAvatar user={fs.friend} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90">
                {fs.friend.displayName}
              </p>
              <p className="text-xs text-white/40">
                {enabledCount > 0
                  ? `Sharing ${enabledCount} ${enabledCount === 1 ? "category" : "categories"}`
                  : "Not sharing any data"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/20 shrink-0" />
          </button>
        );
      })}
    </div>
  );
}
