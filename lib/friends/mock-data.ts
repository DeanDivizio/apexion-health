import type {
  UserProfile,
  FriendRequest,
  Friendship,
  FeedEvent,
} from "./types";

const now = new Date();
function daysAgo(n: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
}
function hoursAgo(n: number): Date {
  const d = new Date(now);
  d.setHours(d.getHours() - n);
  return d;
}
function minutesAgo(n: number): Date {
  const d = new Date(now);
  d.setMinutes(d.getMinutes() - n);
  return d;
}

export const mockCurrentUser: UserProfile = {
  id: "u_self",
  clerkId: "clerk_self",
  displayName: "You",
  avatarUrl: null,
  friendCode: "APEX-9K2F",
  lastFeedViewedAt: hoursAgo(2),
  createdAt: daysAgo(120),
};

export const mockFriends: UserProfile[] = [
  {
    id: "u_alex",
    clerkId: "clerk_alex",
    displayName: "Alex Chen",
    avatarUrl: null,
    friendCode: "APEX-7K3M",
    lastFeedViewedAt: null,
    createdAt: daysAgo(90),
  },
  {
    id: "u_maya",
    clerkId: "clerk_maya",
    displayName: "Maya Patel",
    avatarUrl: null,
    friendCode: "APEX-2R8T",
    lastFeedViewedAt: null,
    createdAt: daysAgo(60),
  },
  {
    id: "u_jordan",
    clerkId: "clerk_jordan",
    displayName: "Jordan Lee",
    avatarUrl: null,
    friendCode: "APEX-5N1W",
    lastFeedViewedAt: null,
    createdAt: daysAgo(45),
  },
  {
    id: "u_sam",
    clerkId: "clerk_sam",
    displayName: "Sam Rivera",
    avatarUrl: null,
    friendCode: "APEX-3D6Q",
    lastFeedViewedAt: null,
    createdAt: daysAgo(30),
  },
];

export const mockPendingRequests: FriendRequest[] = [
  {
    id: "fr_1",
    sender: {
      id: "u_incoming",
      clerkId: "clerk_incoming",
      displayName: "Taylor Kim",
      avatarUrl: null,
      friendCode: "APEX-8V4J",
      lastFeedViewedAt: null,
      createdAt: daysAgo(15),
    },
    receiver: mockCurrentUser,
    status: "PENDING",
    createdAt: hoursAgo(6),
    respondedAt: null,
  },
  {
    id: "fr_2",
    sender: mockCurrentUser,
    receiver: {
      id: "u_outgoing",
      clerkId: "clerk_outgoing",
      displayName: "Casey Brooks",
      avatarUrl: null,
      friendCode: "APEX-1L7P",
      lastFeedViewedAt: null,
      createdAt: daysAgo(20),
    },
    status: "PENDING",
    createdAt: daysAgo(1),
    respondedAt: null,
  },
];

export const mockFriendships: Friendship[] = [
  {
    id: "fs_1",
    friend: mockFriends[0],
    createdAt: daysAgo(80),
    permissions: [
      { domain: "GYM", enabled: true },
      { domain: "NUTRITION", enabled: true },
      { domain: "HYDRATION", enabled: false },
      { domain: "BIOMETRICS", enabled: false },
      { domain: "MEDICATION", enabled: false },
      { domain: "ACTIVITY", enabled: false },
    ],
  },
  {
    id: "fs_2",
    friend: mockFriends[1],
    createdAt: daysAgo(50),
    permissions: [
      { domain: "GYM", enabled: true },
      { domain: "NUTRITION", enabled: false },
      { domain: "HYDRATION", enabled: true },
      { domain: "BIOMETRICS", enabled: false },
      { domain: "MEDICATION", enabled: false },
      { domain: "ACTIVITY", enabled: false },
    ],
  },
  {
    id: "fs_3",
    friend: mockFriends[2],
    createdAt: daysAgo(40),
    permissions: [
      { domain: "GYM", enabled: true },
      { domain: "NUTRITION", enabled: true },
      { domain: "HYDRATION", enabled: true },
      { domain: "BIOMETRICS", enabled: false },
      { domain: "MEDICATION", enabled: false },
      { domain: "ACTIVITY", enabled: false },
    ],
  },
  {
    id: "fs_4",
    friend: mockFriends[3],
    createdAt: daysAgo(25),
    permissions: [
      { domain: "GYM", enabled: false },
      { domain: "NUTRITION", enabled: false },
      { domain: "HYDRATION", enabled: false },
      { domain: "BIOMETRICS", enabled: false },
      { domain: "MEDICATION", enabled: false },
      { domain: "ACTIVITY", enabled: false },
    ],
  },
];

export const mockFeedEvents: FeedEvent[] = [
  // GYM — high detail (workout_completed with full exercise breakdown)
  {
    id: "fe_1",
    user: mockFriends[0],
    domain: "GYM",
    eventType: "workout_completed",
    title: "Completed a workout",
    summary: "Push Day — 5 exercises, 18 sets in 58 min",
    metadata: {
      sessionName: "Push Day",
      durationMinutes: 58,
      exerciseCount: 5,
      totalSets: 18,
      exercises: [
        { name: "Bench Press", sets: 4, bestSet: { weight: 205, reps: 6, unit: "lbs" } },
        { name: "Overhead Press", sets: 4, bestSet: { weight: 135, reps: 8, unit: "lbs" } },
        { name: "Incline Dumbbell Press", sets: 3, bestSet: { weight: 75, reps: 10, unit: "lbs" } },
        { name: "Cable Flyes", sets: 4, bestSet: { weight: 30, reps: 12, unit: "lbs" } },
        { name: "Tricep Pushdown", sets: 3, bestSet: { weight: 60, reps: 12, unit: "lbs" } },
      ],
    },
    occurredAt: minutesAgo(45),
    createdAt: minutesAgo(45),
    reactions: [
      { id: "r_1", userId: "u_maya", emoji: "💪", createdAt: minutesAgo(30) },
      { id: "r_2", userId: "u_jordan", emoji: "🔥", createdAt: minutesAgo(20) },
    ],
  },

  // GYM — PR hit
  {
    id: "fe_2",
    user: mockFriends[1],
    domain: "GYM",
    eventType: "pr_hit",
    title: "Hit a new PR!",
    summary: "Deadlift — 315 lbs × 3",
    metadata: {
      exercise: "Deadlift",
      weight: 315,
      reps: 3,
      unit: "lbs",
      previousBest: { weight: 305, reps: 3 },
    },
    occurredAt: hoursAgo(3),
    createdAt: hoursAgo(3),
    reactions: [
      { id: "r_3", userId: "u_alex", emoji: "🔥", createdAt: hoursAgo(2) },
      { id: "r_4", userId: "u_self", emoji: "💪", createdAt: hoursAgo(2) },
      { id: "r_5", userId: "u_jordan", emoji: "🎉", createdAt: hoursAgo(1) },
    ],
  },

  // GYM — low detail (just completed, minimal info)
  {
    id: "fe_3",
    user: mockFriends[2],
    domain: "GYM",
    eventType: "workout_completed",
    title: "Completed a workout",
    summary: "Leg Day — 6 exercises in 72 min",
    metadata: {
      sessionName: "Leg Day",
      durationMinutes: 72,
      exerciseCount: 6,
      totalSets: 22,
    },
    occurredAt: hoursAgo(5),
    createdAt: hoursAgo(5),
    reactions: [],
  },

  // NUTRITION — meal logged
  {
    id: "fe_4",
    user: mockFriends[0],
    domain: "NUTRITION",
    eventType: "meal_logged",
    title: "Logged a meal",
    summary: "Post-workout shake + chicken bowl",
    metadata: {
      mealName: "Lunch",
      items: ["Protein Shake", "Chicken Rice Bowl"],
      macros: { calories: 820, protein: 62, carbs: 88, fat: 22 },
    },
    occurredAt: hoursAgo(4),
    createdAt: hoursAgo(4),
    reactions: [],
  },

  // NUTRITION — daily goal hit
  {
    id: "fe_5",
    user: mockFriends[2],
    domain: "NUTRITION",
    eventType: "daily_macro_goal_hit",
    title: "Hit daily protein goal",
    summary: "168g of 160g target",
    metadata: {
      nutrient: "Protein",
      actual: 168,
      target: 160,
      unit: "g",
      totalCalories: 2450,
    },
    occurredAt: hoursAgo(8),
    createdAt: hoursAgo(8),
    reactions: [
      { id: "r_6", userId: "u_alex", emoji: "👏", createdAt: hoursAgo(7) },
    ],
  },

  // HYDRATION — goal hit
  {
    id: "fe_6",
    user: mockFriends[1],
    domain: "HYDRATION",
    eventType: "hydration_goal_hit",
    title: "Hit hydration goal",
    summary: "128 oz of 120 oz target",
    metadata: {
      actual: 128,
      target: 120,
      unit: "oz",
      logCount: 8,
    },
    occurredAt: hoursAgo(10),
    createdAt: hoursAgo(10),
    reactions: [
      { id: "r_7", userId: "u_self", emoji: "💧", createdAt: hoursAgo(9) },
    ],
  },

  // HYDRATION — streak
  {
    id: "fe_7",
    user: mockFriends[0],
    domain: "HYDRATION",
    eventType: "hydration_streak",
    title: "Hydration streak!",
    summary: "7-day streak hitting water goal",
    metadata: {
      streakDays: 7,
      dailyTarget: 120,
      unit: "oz",
    },
    occurredAt: hoursAgo(14),
    createdAt: hoursAgo(14),
    reactions: [
      { id: "r_8", userId: "u_maya", emoji: "🔥", createdAt: hoursAgo(13) },
      { id: "r_9", userId: "u_jordan", emoji: "👏", createdAt: hoursAgo(12) },
    ],
  },

  // GYM — streak
  {
    id: "fe_8",
    user: mockFriends[0],
    domain: "GYM",
    eventType: "workout_streak",
    title: "Gym streak!",
    summary: "12 sessions this month",
    metadata: {
      streakCount: 12,
      period: "month",
    },
    occurredAt: daysAgo(1),
    createdAt: daysAgo(1),
    reactions: [
      { id: "r_10", userId: "u_self", emoji: "🔥", createdAt: daysAgo(1) },
    ],
  },

  // NUTRITION — another meal
  {
    id: "fe_9",
    user: mockFriends[2],
    domain: "NUTRITION",
    eventType: "meal_logged",
    title: "Logged a meal",
    summary: "Dinner — steak and veggies",
    metadata: {
      mealName: "Dinner",
      items: ["Ribeye Steak", "Roasted Broccoli", "Sweet Potato"],
      macros: { calories: 950, protein: 72, carbs: 45, fat: 48 },
    },
    occurredAt: daysAgo(1),
    createdAt: daysAgo(1),
    reactions: [],
  },

  // GYM — another high detail from a different user
  {
    id: "fe_10",
    user: mockFriends[1],
    domain: "GYM",
    eventType: "workout_completed",
    title: "Completed a workout",
    summary: "Pull Day — 6 exercises, 20 sets in 65 min",
    metadata: {
      sessionName: "Pull Day",
      durationMinutes: 65,
      exerciseCount: 6,
      totalSets: 20,
      exercises: [
        { name: "Deadlift", sets: 4, bestSet: { weight: 315, reps: 3, unit: "lbs" } },
        { name: "Barbell Row", sets: 4, bestSet: { weight: 185, reps: 8, unit: "lbs" } },
        { name: "Pull-ups", sets: 3, bestSet: { weight: 0, reps: 12, unit: "BW" } },
        { name: "Face Pulls", sets: 3, bestSet: { weight: 40, reps: 15, unit: "lbs" } },
        { name: "Barbell Curl", sets: 3, bestSet: { weight: 85, reps: 10, unit: "lbs" } },
        { name: "Hammer Curl", sets: 3, bestSet: { weight: 35, reps: 12, unit: "lbs" } },
      ],
    },
    occurredAt: daysAgo(2),
    createdAt: daysAgo(2),
    reactions: [
      { id: "r_11", userId: "u_alex", emoji: "💪", createdAt: daysAgo(2) },
    ],
  },
];
