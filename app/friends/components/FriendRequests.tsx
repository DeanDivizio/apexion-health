"use client";

import { useState } from "react";
import { Check, X, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui_primitives/button";
import type { FriendRequest, UserProfile } from "@/lib/friends/types";
import { UserAvatar } from "./UserAvatar";
import { timeAgo } from "./helpers";

interface FriendRequestsProps {
  requests: FriendRequest[];
  currentUser: UserProfile;
}

export function FriendRequests({ requests, currentUser }: FriendRequestsProps) {
  const [localRequests, setLocalRequests] = useState(requests);

  const incoming = localRequests.filter(
    (r) => r.receiver.id === currentUser.id && r.status === "PENDING"
  );
  const outgoing = localRequests.filter(
    (r) => r.sender.id === currentUser.id && r.status === "PENDING"
  );

  function acceptRequest(id: string) {
    setLocalRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "ACCEPTED" as const, respondedAt: new Date() }
          : r
      )
    );
  }

  function declineRequest(id: string) {
    setLocalRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "DECLINED" as const, respondedAt: new Date() }
          : r
      )
    );
  }

  function cancelRequest(id: string) {
    setLocalRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "CANCELLED" as const, respondedAt: new Date() }
          : r
      )
    );
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {incoming.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
            Incoming Requests
          </p>
          <div className="space-y-2">
            {incoming.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-xl bg-neutral-800/50 border border-white/[0.06] p-3"
              >
                <UserAvatar user={req.sender} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90">
                    {req.sender.displayName}
                  </p>
                  <p className="text-xs text-white/40">
                    {timeAgo(req.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25"
                    onClick={() => acceptRequest(req.id)}
                  >
                    <Check className="h-4 w-4 text-emerald-400" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/10"
                    onClick={() => declineRequest(req.id)}
                  >
                    <X className="h-4 w-4 text-white/50" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
            Sent Requests
          </p>
          <div className="space-y-2">
            {outgoing.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-xl bg-neutral-800/50 border border-white/[0.06] p-3"
              >
                <UserAvatar user={req.receiver} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90">
                    {req.receiver.displayName}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-white/30" />
                    <p className="text-xs text-white/40">Pending</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-white/40 hover:text-white/60"
                  onClick={() => cancelRequest(req.id)}
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
