"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui_primitives/tabs";
import { FeedTimeline } from "./components/FeedTimeline";
import { FriendRequests } from "./components/FriendRequests";
import { FriendsList } from "./components/FriendsList";
import { AddFriendDialog } from "./components/AddFriendDialog";
import {
  mockCurrentUser,
  mockFeedEvents,
  mockPendingRequests,
  mockFriendships,
} from "@/lib/friends/mock-data";

export default function FriendsPage() {
  const incomingCount = mockPendingRequests.filter(
    (r) => r.receiver.id === mockCurrentUser.id && r.status === "PENDING"
  ).length;

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-medium tracking-wide text-neutral-100 md:hidden">
          Friends
        </h1>
        <AddFriendDialog currentUser={mockCurrentUser} />
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="friends">
            Friends
            <span className="ml-1.5 text-xs text-white/40">
              {mockFriendships.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {incomingCount > 0 && (
              <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white">
                {incomingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <FeedTimeline
            events={mockFeedEvents}
            currentUserId={mockCurrentUser.id}
          />
        </TabsContent>

        <TabsContent value="friends">
          <FriendsList friendships={mockFriendships} />
        </TabsContent>

        <TabsContent value="requests">
          <FriendRequests
            requests={mockPendingRequests}
            currentUser={mockCurrentUser}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
