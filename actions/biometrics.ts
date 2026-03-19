"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import type { BiometricWorkout } from "@prisma/client";

export interface BiometricDaySummary {
  dateStr: string;
  sleep: {
    id: string;
    nap: boolean;
    start: string;
    end: string;
    totalInBedTimeMilli: number | null;
    totalAwakeTimeMilli: number | null;
    totalLightSleepTimeMilli: number | null;
    totalDeepSleepTimeMilli: number | null;
    totalRemSleepTimeMilli: number | null;
    sleepCycleCount: number | null;
    disturbanceCount: number | null;
    sleepNeededMilli: number | null;
    respiratoryRate: number | null;
    sleepPerformancePct: number | null;
    sleepConsistencyPct: number | null;
    sleepEfficiencyPct: number | null;
  }[];
  recovery: {
    recoveryScore: number | null;
    restingHeartRate: number | null;
    hrvRmssdMilli: number | null;
    spo2Percentage: number | null;
    skinTempCelsius: number | null;
  } | null;
  cycle: {
    strain: number | null;
    kilojoule: number | null;
    averageHeartRate: number | null;
    maxHeartRate: number | null;
  } | null;
}

export async function getBiometricDays(
  limit = 14,
  beforeDateStr?: string,
): Promise<BiometricDaySummary[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const sleepRecords = await prisma.biometricSleep.findMany({
    where: {
      userId,
      ...(beforeDateStr ? { dateStr: { lt: beforeDateStr } } : {}),
    },
    orderBy: { dateStr: "desc" },
    take: limit * 2,
  });

  const dateStrs = [...new Set(sleepRecords.map((s) => s.dateStr))].slice(
    0,
    limit,
  );

  if (dateStrs.length === 0) return [];

  const [recoveries, cycles] = await Promise.all([
    prisma.biometricRecovery.findMany({
      where: { userId, dateStr: { in: dateStrs } },
    }),
    prisma.biometricCycleSummary.findMany({
      where: { userId, dateStr: { in: dateStrs } },
    }),
  ]);

  const recoveryMap = new Map(recoveries.map((r) => [r.dateStr, r]));
  const cycleMap = new Map(cycles.map((c) => [c.dateStr, c]));

  return dateStrs.map((dateStr) => {
    const daySleeps = sleepRecords
      .filter((s) => s.dateStr === dateStr)
      .map((s) => ({
        id: s.id,
        nap: s.nap,
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        totalInBedTimeMilli: s.totalInBedTimeMilli,
        totalAwakeTimeMilli: s.totalAwakeTimeMilli,
        totalLightSleepTimeMilli: s.totalLightSleepTimeMilli,
        totalDeepSleepTimeMilli: s.totalDeepSleepTimeMilli,
        totalRemSleepTimeMilli: s.totalRemSleepTimeMilli,
        sleepCycleCount: s.sleepCycleCount,
        disturbanceCount: s.disturbanceCount,
        sleepNeededMilli: s.sleepNeededMilli,
        respiratoryRate: s.respiratoryRate,
        sleepPerformancePct: s.sleepPerformancePct,
        sleepConsistencyPct: s.sleepConsistencyPct,
        sleepEfficiencyPct: s.sleepEfficiencyPct,
      }));

    const recovery = recoveryMap.get(dateStr);
    const cycle = cycleMap.get(dateStr);

    return {
      dateStr,
      sleep: daySleeps,
      recovery: recovery
        ? {
            recoveryScore: recovery.recoveryScore,
            restingHeartRate: recovery.restingHeartRate,
            hrvRmssdMilli: recovery.hrvRmssdMilli,
            spo2Percentage: recovery.spo2Percentage,
            skinTempCelsius: recovery.skinTempCelsius,
          }
        : null,
      cycle: cycle
        ? {
            strain: cycle.strain,
            kilojoule: cycle.kilojoule,
            averageHeartRate: cycle.averageHeartRate,
            maxHeartRate: cycle.maxHeartRate,
          }
        : null,
    };
  });
}

export async function getTodayBiometrics() {
  const { userId } = await auth();
  if (!userId) return null;

  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayStr = `${y}${m}${d}`;

  const yesterday = new Date(now.getTime() - 86400000);
  const yy = yesterday.getFullYear();
  const ym = String(yesterday.getMonth() + 1).padStart(2, "0");
  const yd = String(yesterday.getDate()).padStart(2, "0");
  const yesterdayStr = `${yy}${ym}${yd}`;

  // Try today first, fall back to yesterday
  for (const dateStr of [todayStr, yesterdayStr]) {
    const [recovery, sleep] = await Promise.all([
      prisma.biometricRecovery.findFirst({
        where: { userId, dateStr },
      }),
      prisma.biometricSleep.findFirst({
        where: { userId, dateStr, nap: false },
        orderBy: { end: "desc" },
      }),
    ]);

    if (recovery || sleep) {
      const totalSleepMilli = sleep
        ? (sleep.totalLightSleepTimeMilli ?? 0) +
          (sleep.totalDeepSleepTimeMilli ?? 0) +
          (sleep.totalRemSleepTimeMilli ?? 0)
        : null;

      return {
        dateStr,
        isToday: dateStr === todayStr,
        recoveryScore: recovery?.recoveryScore ?? null,
        restingHeartRate: recovery?.restingHeartRate ?? null,
        hrvRmssdMilli: recovery?.hrvRmssdMilli ?? null,
        sleepDurationMilli: totalSleepMilli,
        sleepPerformancePct: sleep?.sleepPerformancePct ?? null,
      };
    }
  }

  return null;
}

// ─── Gym Session <-> Biometric Workout Association ──────────────────────────

export interface WorkoutCandidate {
  id: string;
  provider: string;
  providerWorkoutId: string | null;
  sportName: string | null;
  start: string;
  end: string;
  strain: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  kilojoule: number | null;
  zoneZeroMilli: number | null;
  zoneOneMilli: number | null;
  zoneTwoMilli: number | null;
  zoneThreeMilli: number | null;
  zoneFourMilli: number | null;
  zoneFiveMilli: number | null;
  distanceMeter: number | null;
  gymSessionId: string | null;
}

export interface WorkoutLinkState {
  linked: WorkoutCandidate[];
  candidates: WorkoutCandidate[];
}

function shiftDateStr(dateStr: string, deltaDays: number): string {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const utc = new Date(Date.UTC(y, m, d, 12, 0, 0));
  utc.setUTCDate(utc.getUTCDate() + deltaDays);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function parseSessionTime(dateStr: string, timeStr: string): Date {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);

  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return new Date(y, m, d);

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  return new Date(y, m, d, hours, minutes);
}

function toWorkoutCandidate(w: BiometricWorkout): WorkoutCandidate {
  return {
    id: w.id,
    provider: w.provider,
    providerWorkoutId: w.providerWorkoutId,
    sportName: w.sportName,
    start: w.start.toISOString(),
    end: w.end.toISOString(),
    strain: w.strain,
    averageHeartRate: w.averageHeartRate,
    maxHeartRate: w.maxHeartRate,
    kilojoule: w.kilojoule,
    zoneZeroMilli: w.zoneZeroMilli,
    zoneOneMilli: w.zoneOneMilli,
    zoneTwoMilli: w.zoneTwoMilli,
    zoneThreeMilli: w.zoneThreeMilli,
    zoneFourMilli: w.zoneFourMilli,
    zoneFiveMilli: w.zoneFiveMilli,
    distanceMeter: w.distanceMeter,
    gymSessionId: w.gymSessionId,
  };
}

const OVERLAP_BUFFER_MS = 15 * 60 * 1000;

/**
 * Returns the biometric link state for a gym session in a single round trip.
 *
 * Always returns both the already-linked workouts AND unlinked candidates so
 * the UI can display linked data while still offering additional activities
 * (e.g. a run before a weightlifting session = two Whoop activities, one
 * Apexion gym session).
 *
 * Candidates use a tiered matching strategy:
 *   1. Timestamp overlap (±15 min buffer)
 *   2. Same-day dateStr
 *   3. ±1 day dateStr (last resort)
 *
 * The server origin is us-east-2, so `parseSessionTime` produces EST
 * timestamps that align with Whoop's UTC-stored start/end values.
 */
export async function getWorkoutLinkState(
  sessionId: string,
  dateStr: string,
  startTimeStr: string,
  endTimeStr: string,
): Promise<WorkoutLinkState> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const [linkedWorkouts, allNearby] = await Promise.all([
    prisma.biometricWorkout.findMany({
      where: { userId, gymSessionId: sessionId },
      orderBy: { start: "asc" },
    }),
    prisma.biometricWorkout.findMany({
      where: {
        userId,
        gymSessionId: null,
        dateStr: {
          in: [shiftDateStr(dateStr, -1), dateStr, shiftDateStr(dateStr, 1)],
        },
      },
      orderBy: { start: "asc" },
    }),
  ]);

  let candidates: typeof allNearby = [];

  if (allNearby.length > 0) {
    const sessionStart = parseSessionTime(dateStr, startTimeStr);
    const sessionEnd = parseSessionTime(dateStr, endTimeStr);

    const overlapping = allNearby.filter(
      (w) =>
        w.start.getTime() < sessionEnd.getTime() + OVERLAP_BUFFER_MS &&
        w.end.getTime() > sessionStart.getTime() - OVERLAP_BUFFER_MS,
    );

    if (overlapping.length > 0) {
      candidates = overlapping;
    } else {
      const sameDay = allNearby.filter((w) => w.dateStr === dateStr);
      candidates = sameDay.length > 0 ? sameDay : allNearby;
    }
  }

  return {
    linked: linkedWorkouts.map(toWorkoutCandidate),
    candidates: candidates.map(toWorkoutCandidate),
  };
}

/**
 * Associate a BiometricWorkout with a GymWorkoutSession.
 * Fails if the workout is already linked to a different session.
 */
export async function associateWorkoutToSession(
  biometricWorkoutId: string,
  gymSessionId: string,
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const result = await prisma.biometricWorkout.updateMany({
    where: {
      id: biometricWorkoutId,
      userId,
      OR: [{ gymSessionId: null }, { gymSessionId }],
    },
    data: { gymSessionId },
  });

  if (result.count === 0) {
    throw new Error("Workout not found or already linked to another session");
  }
}

/**
 * Remove the link between a BiometricWorkout and its GymWorkoutSession.
 */
export async function dissociateWorkoutFromSession(
  biometricWorkoutId: string,
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const result = await prisma.biometricWorkout.updateMany({
    where: { id: biometricWorkoutId, userId },
    data: { gymSessionId: null },
  });

  if (result.count === 0) {
    throw new Error("Workout not found");
  }
}

/**
 * Get the associated biometric workout for a gym session (if any).
 */
export async function getAssociatedWorkout(
  gymSessionId: string,
): Promise<WorkoutCandidate | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const workout = await prisma.biometricWorkout.findFirst({
    where: { userId, gymSessionId },
  });

  return workout ? toWorkoutCandidate(workout) : null;
}
