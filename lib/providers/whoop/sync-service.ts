import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getValidToken } from "@/lib/providers/token-service";
import * as api from "./api-client";
import {
  adaptWhoopSleep,
  adaptWhoopRecovery,
  adaptWhoopWorkout,
  adaptWhoopCycle,
  adaptWhoopBody,
} from "./adapter";
import type {
  WhoopSleepResponse,
  WhoopRecoveryResponse,
  WhoopWorkoutResponse,
  WhoopCycleResponse,
} from "./types";

interface SyncOptions {
  fullBackfill?: boolean;
}

interface SyncCursor {
  sleepToken?: string;
  recoveryToken?: string;
  workoutToken?: string;
  cycleToken?: string;
  sleepDone?: boolean;
  recoveryDone?: boolean;
  workoutDone?: boolean;
  cycleDone?: boolean;
}

/**
 * Main sync function. Fetches all Whoop data, writes raw + canonical.
 * Cursor-resumable: saves progress after each page so interrupted syncs
 * pick up where they left off.
 */
export async function syncWhoopData(
  connectionId: string,
  options?: SyncOptions,
): Promise<{ pagesProcessed: number }> {
  const connection = await prisma.providerConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  const userId = connection.userId;
  const token = await getValidToken(connectionId);

  let cursor: SyncCursor = options?.fullBackfill
    ? {}
    : ((connection.syncCursor as SyncCursor) ?? {});

  let pagesProcessed = 0;

  // ─── Sleep ──────────────────────────────────────────────────────────
  if (!cursor.sleepDone) {
    try {
      const pageIter = api.paginateAll(
        (params) => api.getSleepCollection(token, params),
        undefined,
        cursor.sleepToken,
      );

      for await (const page of pageIter) {
        await processSleepPage(page.records, connectionId, userId);
        cursor = { ...cursor, sleepToken: page.nextToken ?? undefined };
        await saveCursor(connectionId, cursor);
        pagesProcessed++;
      }
    } catch (err) {
      console.error("Sleep sync error:", err);
      await saveCursor(connectionId, cursor);
      throw err;
    }
    cursor.sleepDone = true;
    await saveCursor(connectionId, cursor);
  }

  // ─── Recovery ───────────────────────────────────────────────────────
  if (!cursor.recoveryDone) {
    try {
      const pageIter = api.paginateAll(
        (params) => api.getRecoveryCollection(token, params),
        undefined,
        cursor.recoveryToken,
      );

      for await (const page of pageIter) {
        await processRecoveryPage(page.records, connectionId, userId);
        cursor = { ...cursor, recoveryToken: page.nextToken ?? undefined };
        await saveCursor(connectionId, cursor);
        pagesProcessed++;
      }
    } catch (err) {
      console.error("Recovery sync error:", err);
      await saveCursor(connectionId, cursor);
      throw err;
    }
    cursor.recoveryDone = true;
    await saveCursor(connectionId, cursor);
  }

  // ─── Workouts ───────────────────────────────────────────────────────
  if (!cursor.workoutDone) {
    try {
      const pageIter = api.paginateAll(
        (params) => api.getWorkoutCollection(token, params),
        undefined,
        cursor.workoutToken,
      );

      for await (const page of pageIter) {
        await processWorkoutPage(page.records, connectionId, userId);
        cursor = { ...cursor, workoutToken: page.nextToken ?? undefined };
        await saveCursor(connectionId, cursor);
        pagesProcessed++;
      }
    } catch (err) {
      console.error("Workout sync error:", err);
      await saveCursor(connectionId, cursor);
      throw err;
    }
    cursor.workoutDone = true;
    await saveCursor(connectionId, cursor);
  }

  // ─── Cycles ─────────────────────────────────────────────────────────
  if (!cursor.cycleDone) {
    try {
      const pageIter = api.paginateAll(
        (params) => api.getCycles(token, params),
        undefined,
        cursor.cycleToken,
      );

      for await (const page of pageIter) {
        await processCyclePage(page.records, connectionId, userId);
        cursor = { ...cursor, cycleToken: page.nextToken ?? undefined };
        await saveCursor(connectionId, cursor);
        pagesProcessed++;
      }
    } catch (err) {
      console.error("Cycle sync error:", err);
      await saveCursor(connectionId, cursor);
      throw err;
    }
    cursor.cycleDone = true;
    await saveCursor(connectionId, cursor);
  }

  // ─── Body Measurements (single call, no pagination) ────────────────
  try {
    const body = await api.getBodyMeasurements(token);
    const adapted = adaptWhoopBody(body, userId);
    await prisma.biometricBodyMeasurement.upsert({
      where: { userId_provider: { userId, provider: "whoop" } },
      create: adapted,
      update: adapted,
    });
  } catch (err) {
    console.error("Body measurement sync error:", err);
  }

  // ─── Finalize ──────────────────────────────────────────────────────
  await prisma.providerConnection.update({
    where: { id: connectionId },
    data: {
      lastSyncAt: new Date(),
      syncCursor: Prisma.JsonNull,
      status: "ACTIVE",
      errorMessage: null,
    },
  });

  return { pagesProcessed };
}

// ─── Page processors ─────────────────────────────────────────────────────────

async function processSleepPage(
  records: WhoopSleepResponse[],
  connectionId: string,
  userId: string,
) {
  for (const raw of records) {
    // Upsert raw
    await prisma.whoopSleep.upsert({
      where: { whoopSleepId: raw.id },
      create: {
        connectionId,
        whoopSleepId: raw.id,
        whoopCycleId: raw.cycle_id,
        whoopUserId: raw.user_id,
        start: new Date(raw.start),
        end: new Date(raw.end),
        timezoneOffset: raw.timezone_offset,
        nap: raw.nap,
        scoreState: raw.score_state,
        totalInBedTimeMilli: raw.score?.stage_summary.total_in_bed_time_milli,
        totalAwakeTimeMilli: raw.score?.stage_summary.total_awake_time_milli,
        totalNoDataTimeMilli: raw.score?.stage_summary.total_no_data_time_milli,
        totalLightSleepTimeMilli: raw.score?.stage_summary.total_light_sleep_time_milli,
        totalSlowWaveSleepTimeMilli: raw.score?.stage_summary.total_slow_wave_sleep_time_milli,
        totalRemSleepTimeMilli: raw.score?.stage_summary.total_rem_sleep_time_milli,
        sleepCycleCount: raw.score?.stage_summary.sleep_cycle_count,
        disturbanceCount: raw.score?.stage_summary.disturbance_count,
        sleepNeededBaselineMilli: raw.score?.sleep_needed.baseline_milli,
        needFromSleepDebtMilli: raw.score?.sleep_needed.need_from_sleep_debt_milli,
        needFromRecentStrainMilli: raw.score?.sleep_needed.need_from_recent_strain_milli,
        needFromRecentNapMilli: raw.score?.sleep_needed.need_from_recent_nap_milli,
        respiratoryRate: raw.score?.respiratory_rate,
        sleepPerformancePct: raw.score?.sleep_performance_percentage,
        sleepConsistencyPct: raw.score?.sleep_consistency_percentage,
        sleepEfficiencyPct: raw.score?.sleep_efficiency_percentage,
        rawJson: JSON.parse(JSON.stringify(raw)),
      },
      update: {
        scoreState: raw.score_state,
        totalInBedTimeMilli: raw.score?.stage_summary.total_in_bed_time_milli,
        totalAwakeTimeMilli: raw.score?.stage_summary.total_awake_time_milli,
        totalNoDataTimeMilli: raw.score?.stage_summary.total_no_data_time_milli,
        totalLightSleepTimeMilli: raw.score?.stage_summary.total_light_sleep_time_milli,
        totalSlowWaveSleepTimeMilli: raw.score?.stage_summary.total_slow_wave_sleep_time_milli,
        totalRemSleepTimeMilli: raw.score?.stage_summary.total_rem_sleep_time_milli,
        sleepCycleCount: raw.score?.stage_summary.sleep_cycle_count,
        disturbanceCount: raw.score?.stage_summary.disturbance_count,
        sleepNeededBaselineMilli: raw.score?.sleep_needed.baseline_milli,
        needFromSleepDebtMilli: raw.score?.sleep_needed.need_from_sleep_debt_milli,
        needFromRecentStrainMilli: raw.score?.sleep_needed.need_from_recent_strain_milli,
        needFromRecentNapMilli: raw.score?.sleep_needed.need_from_recent_nap_milli,
        respiratoryRate: raw.score?.respiratory_rate,
        sleepPerformancePct: raw.score?.sleep_performance_percentage,
        sleepConsistencyPct: raw.score?.sleep_consistency_percentage,
        sleepEfficiencyPct: raw.score?.sleep_efficiency_percentage,
        rawJson: JSON.parse(JSON.stringify(raw)),
      },
    });

    // Adapt and upsert canonical
    const canonical = adaptWhoopSleep(raw, userId);
    await prisma.biometricSleep.upsert({
      where: {
        userId_providerSleepId: { userId, providerSleepId: raw.id },
      },
      create: canonical,
      update: canonical,
    });
  }
}

async function processRecoveryPage(
  records: WhoopRecoveryResponse[],
  connectionId: string,
  userId: string,
) {
  for (const raw of records) {
    // Look up the associated sleep to get its end time and timezone for dateStr
    const linkedSleep = await prisma.whoopSleep.findFirst({
      where: { whoopCycleId: raw.cycle_id, connectionId },
      select: { end: true, timezoneOffset: true },
    });
    const sleepEndIso = linkedSleep?.end.toISOString() ?? raw.created_at;
    const tzOffset = linkedSleep?.timezoneOffset ?? "+00:00";

    await prisma.whoopRecovery.upsert({
      where: { whoopCycleId: raw.cycle_id },
      create: {
        connectionId,
        whoopCycleId: raw.cycle_id,
        whoopSleepId: raw.sleep_id,
        whoopUserId: raw.user_id,
        scoreState: raw.score_state,
        userCalibrating: raw.score?.user_calibrating,
        recoveryScore: raw.score?.recovery_score,
        restingHeartRate: raw.score?.resting_heart_rate,
        hrvRmssdMilli: raw.score?.hrv_rmssd_milli,
        spo2Percentage: raw.score?.spo2_percentage,
        skinTempCelsius: raw.score?.skin_temp_celsius,
        rawJson: JSON.parse(JSON.stringify(raw)),
      },
      update: {
        whoopSleepId: raw.sleep_id,
        scoreState: raw.score_state,
        userCalibrating: raw.score?.user_calibrating,
        recoveryScore: raw.score?.recovery_score,
        restingHeartRate: raw.score?.resting_heart_rate,
        hrvRmssdMilli: raw.score?.hrv_rmssd_milli,
        spo2Percentage: raw.score?.spo2_percentage,
        skinTempCelsius: raw.score?.skin_temp_celsius,
        rawJson: JSON.parse(JSON.stringify(raw)),
      },
    });

    const canonical = adaptWhoopRecovery(raw, userId, sleepEndIso, tzOffset);
    await prisma.biometricRecovery.upsert({
      where: {
        userId_dateStr_provider: {
          userId,
          dateStr: canonical.dateStr,
          provider: "whoop",
        },
      },
      create: canonical,
      update: canonical,
    });
  }
}

async function processWorkoutPage(
  records: WhoopWorkoutResponse[],
  connectionId: string,
  userId: string,
) {
  for (const raw of records) {
    await prisma.whoopWorkout.upsert({
      where: { whoopWorkoutId: raw.id },
      create: {
        connectionId,
        whoopWorkoutId: raw.id,
        whoopUserId: raw.user_id,
        start: new Date(raw.start),
        end: new Date(raw.end),
        timezoneOffset: raw.timezone_offset,
        sportName: raw.sport_name,
        sportId: raw.sport_id,
        scoreState: raw.score_state,
        strain: raw.score?.strain,
        averageHeartRate: raw.score?.average_heart_rate,
        maxHeartRate: raw.score?.max_heart_rate,
        kilojoule: raw.score?.kilojoule,
        percentRecorded: raw.score?.percent_recorded,
        distanceMeter: raw.score?.distance_meter,
        altitudeGainMeter: raw.score?.altitude_gain_meter,
        altitudeChangeMeter: raw.score?.altitude_change_meter,
        zoneZeroMilli: raw.score?.zone_durations?.zone_zero_milli,
        zoneOneMilli: raw.score?.zone_durations?.zone_one_milli,
        zoneTwoMilli: raw.score?.zone_durations?.zone_two_milli,
        zoneThreeMilli: raw.score?.zone_durations?.zone_three_milli,
        zoneFourMilli: raw.score?.zone_durations?.zone_four_milli,
        zoneFiveMilli: raw.score?.zone_durations?.zone_five_milli,
        rawJson: JSON.parse(JSON.stringify(raw)),
      },
      update: {
        scoreState: raw.score_state,
        strain: raw.score?.strain,
        averageHeartRate: raw.score?.average_heart_rate,
        maxHeartRate: raw.score?.max_heart_rate,
        kilojoule: raw.score?.kilojoule,
        percentRecorded: raw.score?.percent_recorded,
        distanceMeter: raw.score?.distance_meter,
        altitudeGainMeter: raw.score?.altitude_gain_meter,
        altitudeChangeMeter: raw.score?.altitude_change_meter,
        zoneZeroMilli: raw.score?.zone_durations?.zone_zero_milli,
        zoneOneMilli: raw.score?.zone_durations?.zone_one_milli,
        zoneTwoMilli: raw.score?.zone_durations?.zone_two_milli,
        zoneThreeMilli: raw.score?.zone_durations?.zone_three_milli,
        zoneFourMilli: raw.score?.zone_durations?.zone_four_milli,
        zoneFiveMilli: raw.score?.zone_durations?.zone_five_milli,
        rawJson: JSON.parse(JSON.stringify(raw)),
      },
    });

    const canonical = adaptWhoopWorkout(raw, userId);
    await prisma.biometricWorkout.upsert({
      where: {
        userId_providerWorkoutId: { userId, providerWorkoutId: raw.id },
      },
      create: canonical,
      update: canonical,
    });
  }
}

async function processCyclePage(
  records: WhoopCycleResponse[],
  connectionId: string,
  userId: string,
) {
  for (const raw of records) {
    await prisma.whoopCycle.upsert({
      where: { whoopCycleId: raw.id },
      create: {
        connectionId,
        whoopCycleId: raw.id,
        whoopUserId: raw.user_id,
        start: new Date(raw.start),
        end: raw.end ? new Date(raw.end) : null,
        timezoneOffset: raw.timezone_offset,
        scoreState: raw.score_state,
        strain: raw.score?.strain,
        kilojoule: raw.score?.kilojoule,
        averageHeartRate: raw.score?.average_heart_rate,
        maxHeartRate: raw.score?.max_heart_rate,
        rawJson: JSON.parse(JSON.stringify(raw)),
      },
      update: {
        end: raw.end ? new Date(raw.end) : null,
        scoreState: raw.score_state,
        strain: raw.score?.strain,
        kilojoule: raw.score?.kilojoule,
        averageHeartRate: raw.score?.average_heart_rate,
        maxHeartRate: raw.score?.max_heart_rate,
        rawJson: JSON.parse(JSON.stringify(raw)),
      },
    });

    const canonical = adaptWhoopCycle(raw, userId);
    if (canonical) {
      await prisma.biometricCycleSummary.upsert({
        where: {
          userId_dateStr_provider: {
            userId,
            dateStr: canonical.dateStr,
            provider: "whoop",
          },
        },
        create: canonical,
        update: canonical,
      });
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function saveCursor(connectionId: string, cursor: SyncCursor) {
  await prisma.providerConnection.update({
    where: { id: connectionId },
    data: { syncCursor: JSON.parse(JSON.stringify(cursor)) },
  });
}
