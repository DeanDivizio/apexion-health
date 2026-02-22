import type {
  WhoopCycleResponse,
  WhoopSleepResponse,
  WhoopRecoveryResponse,
  WhoopWorkoutResponse,
  WhoopBodyMeasurement,
} from "./types";

/**
 * Derive a YYYYMMDD dateStr from an ISO timestamp and a timezone offset
 * like "+05:00", "-04:00", or "Z".
 */
function dateStrFromTimestamp(isoString: string, tzOffset: string): string {
  const utc = new Date(isoString);
  let offsetMinutes = 0;

  if (tzOffset && tzOffset !== "Z") {
    const sign = tzOffset.startsWith("-") ? -1 : 1;
    const parts = tzOffset.replace(/[+-]/, "").split(":");
    offsetMinutes = sign * (parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10));
  }

  const local = new Date(utc.getTime() + offsetMinutes * 60 * 1000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, "0");
  const d = String(local.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// ─── Sleep ───────────────────────────────────────────────────────────────────

export function adaptWhoopSleep(raw: WhoopSleepResponse, userId: string) {
  const dateStr = dateStrFromTimestamp(raw.end, raw.timezone_offset);
  const score = raw.score;

  return {
    userId,
    dateStr,
    provider: "whoop" as const,
    providerSleepId: raw.id,
    nap: raw.nap,
    start: new Date(raw.start),
    end: new Date(raw.end),
    totalInBedTimeMilli: score?.stage_summary.total_in_bed_time_milli ?? null,
    totalAwakeTimeMilli: score?.stage_summary.total_awake_time_milli ?? null,
    totalLightSleepTimeMilli:
      score?.stage_summary.total_light_sleep_time_milli ?? null,
    totalDeepSleepTimeMilli:
      score?.stage_summary.total_slow_wave_sleep_time_milli ?? null,
    totalRemSleepTimeMilli:
      score?.stage_summary.total_rem_sleep_time_milli ?? null,
    sleepCycleCount: score?.stage_summary.sleep_cycle_count ?? null,
    disturbanceCount: score?.stage_summary.disturbance_count ?? null,
    sleepNeededMilli: score?.sleep_needed
      ? score.sleep_needed.baseline_milli +
        score.sleep_needed.need_from_sleep_debt_milli +
        score.sleep_needed.need_from_recent_strain_milli +
        score.sleep_needed.need_from_recent_nap_milli
      : null,
    respiratoryRate: score?.respiratory_rate ?? null,
    sleepPerformancePct: score?.sleep_performance_percentage ?? null,
    sleepConsistencyPct: score?.sleep_consistency_percentage ?? null,
    sleepEfficiencyPct: score?.sleep_efficiency_percentage ?? null,
  };
}

// ─── Recovery ────────────────────────────────────────────────────────────────

export function adaptWhoopRecovery(
  raw: WhoopRecoveryResponse,
  userId: string,
  sleepEndIso: string,
  tzOffset: string,
) {
  const dateStr = dateStrFromTimestamp(sleepEndIso, tzOffset);

  return {
    userId,
    dateStr,
    provider: "whoop" as const,
    providerRecoveryRef: String(raw.cycle_id),
    recoveryScore: raw.score?.recovery_score ?? null,
    restingHeartRate: raw.score?.resting_heart_rate ?? null,
    hrvRmssdMilli: raw.score?.hrv_rmssd_milli ?? null,
    spo2Percentage: raw.score?.spo2_percentage ?? null,
    skinTempCelsius: raw.score?.skin_temp_celsius ?? null,
  };
}

// ─── Workout ─────────────────────────────────────────────────────────────────

export function adaptWhoopWorkout(raw: WhoopWorkoutResponse, userId: string) {
  const dateStr = dateStrFromTimestamp(raw.start, raw.timezone_offset);
  const score = raw.score;
  const zones = score?.zone_durations;

  return {
    userId,
    dateStr,
    provider: "whoop" as const,
    providerWorkoutId: raw.id,
    sportName: raw.sport_name,
    start: new Date(raw.start),
    end: new Date(raw.end),
    strain: score?.strain ?? null,
    averageHeartRate: score?.average_heart_rate ?? null,
    maxHeartRate: score?.max_heart_rate ?? null,
    kilojoule: score?.kilojoule ?? null,
    distanceMeter: score?.distance_meter ?? null,
    zoneZeroMilli: zones?.zone_zero_milli ?? null,
    zoneOneMilli: zones?.zone_one_milli ?? null,
    zoneTwoMilli: zones?.zone_two_milli ?? null,
    zoneThreeMilli: zones?.zone_three_milli ?? null,
    zoneFourMilli: zones?.zone_four_milli ?? null,
    zoneFiveMilli: zones?.zone_five_milli ?? null,
  };
}

// ─── Cycle Summary ───────────────────────────────────────────────────────────

export function adaptWhoopCycle(raw: WhoopCycleResponse, userId: string) {
  if (!raw.end) return null; // current open cycle — skip

  const dateStr = dateStrFromTimestamp(raw.end, raw.timezone_offset);

  return {
    userId,
    dateStr,
    provider: "whoop" as const,
    providerCycleRef: String(raw.id),
    strain: raw.score?.strain ?? null,
    kilojoule: raw.score?.kilojoule ?? null,
    averageHeartRate: raw.score?.average_heart_rate ?? null,
    maxHeartRate: raw.score?.max_heart_rate ?? null,
  };
}

// ─── Body Measurements ───────────────────────────────────────────────────────

export function adaptWhoopBody(raw: WhoopBodyMeasurement, userId: string, dateStr: string) {
  return {
    userId,
    provider: "whoop" as const,
    dateStr,
    heightMeter: raw.height_meter,
    weightKilogram: raw.weight_kilogram,
    maxHeartRate: raw.max_heart_rate,
    fetchedAt: new Date(),
  };
}
