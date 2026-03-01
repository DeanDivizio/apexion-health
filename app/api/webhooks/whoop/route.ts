import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getValidToken } from "@/lib/providers/token-service";
import * as api from "@/lib/providers/whoop/api-client";
import {
  adaptWhoopSleep,
  adaptWhoopRecovery,
  adaptWhoopWorkout,
} from "@/lib/providers/whoop/adapter";
import type { WhoopWebhookPayload } from "@/lib/providers/whoop/types";

function verifySignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean {
  const payload = timestamp + rawBody;
  const computed = createHmac("sha256", secret)
    .update(payload)
    .digest("base64");
  return computed === signature;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("X-WHOOP-Signature-Timestamp") ?? "";
  const signature = request.headers.get("X-WHOOP-Signature") ?? "";
  const secret = process.env.WHOOP_CLIENT_SECRET ?? "";

  if (!verifySignature(rawBody, timestamp, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: WhoopWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Find the connection for this Whoop user. Include ERROR status so we can
  // attempt recovery — the token may have been refreshed by another instance
  // since the error was recorded.
  const connection = await prisma.providerConnection.findFirst({
    where: {
      providerUserId: String(payload.user_id),
      provider: "whoop",
      status: { in: ["ACTIVE", "ERROR"] },
    },
  });

  if (!connection) {
    return NextResponse.json({ ok: true });
  }

  try {
    const token = await getValidToken(connection.id);
    const userId = connection.userId;

    switch (payload.type) {
      case "sleep.updated":
        await handleSleepUpdated(payload.id, token, connection.id, userId);
        break;

      case "sleep.deleted":
        await handleSleepDeleted(payload.id, userId);
        break;

      case "recovery.updated":
        await handleRecoveryUpdated(payload.id, token, connection.id, userId);
        break;

      case "recovery.deleted":
        await handleRecoveryDeleted(payload.id, userId);
        break;

      case "workout.updated":
        await handleWorkoutUpdated(payload.id, token, connection.id, userId);
        break;

      case "workout.deleted":
        await handleWorkoutDeleted(payload.id, userId);
        break;
    }
  } catch (err) {
    console.error(`Webhook processing error (${payload.type}):`, err);
    // Still return 200 to prevent Whoop from retrying for app-level errors
  }

  return NextResponse.json({ ok: true });
}

// ─── Event Handlers ──────────────────────────────────────────────────────────

async function handleSleepUpdated(
  sleepId: string,
  token: string,
  connectionId: string,
  userId: string,
) {
  const raw = await api.getSleepById(token, sleepId);

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

  const canonical = adaptWhoopSleep(raw, userId);
  await prisma.biometricSleep.upsert({
    where: { userId_providerSleepId: { userId, providerSleepId: raw.id } },
    create: canonical,
    update: canonical,
  });
}

async function handleSleepDeleted(sleepId: string, userId: string) {
  await prisma.whoopSleep.deleteMany({ where: { whoopSleepId: sleepId } });
  await prisma.biometricSleep.deleteMany({
    where: { userId, providerSleepId: sleepId },
  });
}

async function handleRecoveryUpdated(
  sleepId: string, // v2 webhook sends the sleep UUID for recovery events
  token: string,
  connectionId: string,
  userId: string,
) {
  // Find the sleep to get the cycle_id
  const sleep = await prisma.whoopSleep.findUnique({
    where: { whoopSleepId: sleepId },
  });

  if (!sleep) return; // sleep hasn't been synced yet — will catch up on reconciliation

  const raw = await api.getRecoveryForCycle(token, sleep.whoopCycleId);

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

  const canonical = adaptWhoopRecovery(
    raw,
    userId,
    sleep.end.toISOString(),
    sleep.timezoneOffset,
  );
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

async function handleRecoveryDeleted(sleepId: string, userId: string) {
  const sleep = await prisma.whoopSleep.findUnique({
    where: { whoopSleepId: sleepId },
  });
  if (sleep) {
    await prisma.whoopRecovery.deleteMany({
      where: { whoopCycleId: sleep.whoopCycleId },
    });
  }
  // For canonical, recovery is keyed by dateStr — need sleep's date to find it
  // If sleep was already deleted, we can't resolve. This is acceptable;
  // the reconciliation job will clean up orphans.
}

async function handleWorkoutUpdated(
  workoutId: string,
  token: string,
  connectionId: string,
  userId: string,
) {
  const raw = await api.getWorkoutById(token, workoutId);

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
    where: { userId_providerWorkoutId: { userId, providerWorkoutId: raw.id } },
    create: canonical,
    update: canonical,
  });
}

async function handleWorkoutDeleted(workoutId: string, userId: string) {
  await prisma.whoopWorkout.deleteMany({ where: { whoopWorkoutId: workoutId } });
  await prisma.biometricWorkout.deleteMany({
    where: { userId, providerWorkoutId: workoutId },
  });
}
