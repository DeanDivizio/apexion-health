// ─── Whoop API Response Types ────────────────────────────────────────────────
// These mirror the Whoop v2 API shapes exactly.

export interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token: string | null;
}

export interface WhoopPaginationParams {
  limit?: number; // max 25
  start?: string; // ISO datetime
  end?: string; // ISO datetime
  nextToken?: string;
}

// ─── Cycle ───────────────────────────────────────────────────────────────────

export interface WhoopCycleScore {
  strain: number;
  kilojoule: number;
  average_heart_rate: number;
  max_heart_rate: number;
}

export interface WhoopCycleResponse {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end?: string;
  timezone_offset: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopCycleScore;
}

// ─── Sleep ───────────────────────────────────────────────────────────────────

export interface WhoopSleepStageSummary {
  total_in_bed_time_milli: number;
  total_awake_time_milli: number;
  total_no_data_time_milli: number;
  total_light_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_rem_sleep_time_milli: number;
  sleep_cycle_count: number;
  disturbance_count: number;
}

export interface WhoopSleepNeeded {
  baseline_milli: number;
  need_from_sleep_debt_milli: number;
  need_from_recent_strain_milli: number;
  need_from_recent_nap_milli: number;
}

export interface WhoopSleepScore {
  stage_summary: WhoopSleepStageSummary;
  sleep_needed: WhoopSleepNeeded;
  respiratory_rate: number;
  sleep_performance_percentage: number;
  sleep_consistency_percentage: number;
  sleep_efficiency_percentage: number;
}

export interface WhoopSleepResponse {
  id: string;
  cycle_id: number;
  v1_id?: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopSleepScore;
}

// ─── Recovery ────────────────────────────────────────────────────────────────

export interface WhoopRecoveryScore {
  user_calibrating: boolean;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd_milli: number;
  spo2_percentage?: number;
  skin_temp_celsius?: number;
}

export interface WhoopRecoveryResponse {
  cycle_id: number;
  sleep_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopRecoveryScore;
}

// ─── Workout ─────────────────────────────────────────────────────────────────

export interface WhoopZoneDurations {
  zone_zero_milli: number;
  zone_one_milli: number;
  zone_two_milli: number;
  zone_three_milli: number;
  zone_four_milli: number;
  zone_five_milli: number;
}

export interface WhoopWorkoutScore {
  strain: number;
  average_heart_rate: number;
  max_heart_rate: number;
  kilojoule: number;
  percent_recorded: number;
  distance_meter?: number;
  altitude_gain_meter?: number;
  altitude_change_meter?: number;
  zone_durations?: WhoopZoneDurations;
}

export interface WhoopWorkoutResponse {
  id: string;
  v1_id?: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_name: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopWorkoutScore;
  sport_id?: number;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface WhoopUserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WhoopBodyMeasurement {
  height_meter: number;
  weight_kilogram: number;
  max_heart_rate: number;
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

export type WhoopWebhookEventType =
  | "workout.updated"
  | "workout.deleted"
  | "sleep.updated"
  | "sleep.deleted"
  | "recovery.updated"
  | "recovery.deleted";

export interface WhoopWebhookPayload {
  user_id: number;
  id: string; // UUID in v2 webhooks
  type: WhoopWebhookEventType;
  trace_id: string;
}
