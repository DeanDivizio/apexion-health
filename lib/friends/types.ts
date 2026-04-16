export type SocialDomain =
  | "GYM"
  | "BIOMETRICS"
  | "NUTRITION"
  | "HYDRATION"
  | "MEDICATION"
  | "ACTIVITY";

export type FriendRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED";

export interface UserProfile {
  id: string;
  clerkId: string;
  displayName: string;
  avatarUrl: string | null;
  friendCode: string;
  lastFeedViewedAt: Date | null;
  createdAt: Date;
}

export interface FriendRequest {
  id: string;
  sender: UserProfile;
  receiver: UserProfile;
  status: FriendRequestStatus;
  createdAt: Date;
  respondedAt: Date | null;
}

export interface Friendship {
  id: string;
  friend: UserProfile;
  createdAt: Date;
  permissions: FriendshipPermission[];
}

export interface FriendshipPermission {
  domain: SocialDomain;
  enabled: boolean;
}

export type FeedEventType =
  | "workout_completed"
  | "pr_hit"
  | "workout_streak"
  | "meal_logged"
  | "daily_macro_goal_hit"
  | "hydration_goal_hit"
  | "hydration_streak"
  | "sleep_logged"
  | "recovery_logged"
  | "dose_logged"
  | "activity_logged"
  | "activity_streak";

export interface FeedEvent {
  id: string;
  user: UserProfile;
  domain: SocialDomain;
  eventType: FeedEventType;
  title: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;
  reactions: FeedReaction[];
}

export interface FeedReaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export type GymDetailLevel = "high" | "low";
