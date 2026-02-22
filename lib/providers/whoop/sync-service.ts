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
  /** Max pages fetched per data type (sleep, recovery, workout, cycle). */
  maxPagesPerType?: number;
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
  bodyDone?: boolean;
}

interface SyncResult {
  pagesProcessed: number;
  complete: boolean;
}

/**
 * Main sync function. Fetches Whoop data in batches, writes raw + canonical.
 * Cursor-resumable: saves progress after each page so interrupted syncs
 * pick up where they left off.
 *
 * Each data type (sleep, recovery, workout, cycle) gets its own independent
 * page budget so no single type can starve the others. The client should
 * call repeatedly until `complete` is true.
 */
export async function syncWhoopData(
  connectionId: string,
  options?: SyncOptions,
): Promise<SyncResult> {
  const maxPagesPerType = options?.maxPagesPerType ?? 2;
  const connection = await prisma.providerConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  const userId = connection.userId;
  const token = await getValidToken(connectionId);

  let cursor: SyncCursor = options?.fullBackfill
    ? {}
    : ((connection.syncCursor as SyncCursor) ?? {});

  let totalPagesProcessed = 0;

  async function syncDataType<T>(
    key: "sleep" | "recovery" | "workout" | "cycle",
    tokenKey: "sleepToken" | "recoveryToken" | "workoutToken" | "cycleToken",
    doneKey: "sleepDone" | "recoveryDone" | "workoutDone" | "cycleDone",
    fetchPage: (params: api.WhoopPaginationParamsPublic) => Promise<{ records: T[]; next_token: string | null }>,
    processPage: (records: T[], connId: string, uid: string) => Promise<void>,
  ) {
    if (cursor[doneKey]) return;

    let typePages = 0;

    try {
      const pageIter = api.paginateAll(
        fetchPage,
        undefined,
        cursor[tokenKey],
      );

      for await (const page of pageIter) {
        await processPage(page.records, connectionId, userId);
        cursor = { ...cursor, [tokenKey]: page.nextToken ?? undefined };
        await saveCursor(connectionId, cursor);
        typePages++;
        totalPagesProcessed++;

        if (typePages >= maxPagesPerType) return;
      }
    } catch (err) {
      console.error(`${key} sync error:`, err);
      await saveCursor(connectionId, cursor);
      throw err;
    }

    cursor[doneKey] = true;
    await saveCursor(connectionId, cursor);
  }

  await syncDataType(
    "sleep", "sleepToken", "sleepDone",
    (params) => api.getSleepCollection(token, params),
    processSleepPage,
  );

  await syncDataType(
    "recovery", "recoveryToken", "recoveryDone",
    (params) => api.getRecoveryCollection(token, params),
    processRecoveryPage,
  );

  await syncDataType(
    "workout", "workoutToken", "workoutDone",
    (params) => api.getWorkoutCollection(token, params),
    processWorkoutPage,
  );

  await syncDataType(
    "cycle", "cycleToken", "cycleDone",
    (params) => api.getCycles(token, params),
    processCyclePage,
  );

  // ─── Body Measurements (single call, no pagination) ────────────────
  if (!cursor.bodyDone) {
    try {
      const body = await api.getBodyMeasurements(token);
      const now = new Date();
      const dateStr =
        String(now.getUTCFullYear()) +
        String(now.getUTCMonth() + 1).padStart(2, "0") +
        String(now.getUTCDate()).padStart(2, "0");
      const adapted = adaptWhoopBody(body, userId, dateStr);
      await prisma.biometricBodyMeasurement.upsert({
        where: {
          userId_provider_dateStr: { userId, provider: "whoop", dateStr },
        },
        create: adapted,
        update: adapted,
      });
    } catch (err) {
      console.error("Body measurement sync error:", err);
    }
    cursor.bodyDone = true;
    await saveCursor(connectionId, cursor);
  }

  const complete =
    !!cursor.sleepDone &&
    !!cursor.recoveryDone &&
    !!cursor.workoutDone &&
    !!cursor.cycleDone &&
    !!cursor.bodyDone;


  if (complete) {
    await prisma.providerConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        syncCursor: Prisma.JsonNull,
        status: "ACTIVE",
        errorMessage: null,
      },
    });
  }

  return { pagesProcessed: totalPagesProcessed, complete };
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
