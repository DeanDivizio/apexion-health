import type {
  WhoopCycleResponse,
  WhoopSleepResponse,
  WhoopRecoveryResponse,
  WhoopWorkoutResponse,
  WhoopUserProfile,
  WhoopBodyMeasurement,
  WhoopPaginatedResponse,
  WhoopPaginationParams,
} from "./types";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;
const REQUEST_DELAY_MS = 200;

class WhoopApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "WhoopApiError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(ms: number): number {
  return ms + Math.random() * ms * 0.5;
}

async function whoopFetch<T>(
  path: string,
  token: string,
  params?: Record<string, string>,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const url = new URL(`${WHOOP_API_BASE}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, v);
      });
    }

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      return (await res.json()) as T;
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      const backoffMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : jitter(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
      await sleep(backoffMs);
      lastError = new WhoopApiError(429, "Rate limited");
      continue;
    }

    if (res.status === 401) {
      throw new WhoopApiError(401, "Unauthorized — token may be expired");
    }

    const text = await res.text();
    throw new WhoopApiError(res.status, `Whoop API error (${res.status}): ${text}`);
  }

  throw lastError ?? new Error("Whoop API request failed after retries");
}

function buildPaginationParams(p?: WhoopPaginationParams): Record<string, string> {
  const params: Record<string, string> = {};
  if (p?.limit) params.limit = String(p.limit);
  if (p?.start) params.start = p.start;
  if (p?.end) params.end = p.end;
  if (p?.nextToken) params.nextToken = p.nextToken;
  return params;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getCycles(
  token: string,
  params?: WhoopPaginationParams,
): Promise<WhoopPaginatedResponse<WhoopCycleResponse>> {
  await sleep(REQUEST_DELAY_MS);
  return whoopFetch("/v2/cycle", token, buildPaginationParams(params));
}

export async function getCycleById(
  token: string,
  cycleId: number,
): Promise<WhoopCycleResponse> {
  await sleep(REQUEST_DELAY_MS);
  return whoopFetch(`/v2/cycle/${cycleId}`, token);
}

export async function getSleepCollection(
  token: string,
  params?: WhoopPaginationParams,
): Promise<WhoopPaginatedResponse<WhoopSleepResponse>> {
  await sleep(REQUEST_DELAY_MS);
  return whoopFetch("/v2/activity/sleep", token, buildPaginationParams(params));
}

export async function getSleepById(
  token: string,
  sleepId: string,
): Promise<WhoopSleepResponse> {
  await sleep(REQUEST_DELAY_MS);
  return whoopFetch(`/v2/activity/sleep/${sleepId}`, token);
}

export async function getRecoveryCollection(
  token: string,
  params?: WhoopPaginationParams,
): Promise<WhoopPaginatedResponse<WhoopRecoveryResponse>> {
  await sleep(REQUEST_DELAY_MS);
  return whoopFetch("/v2/recovery", token, buildPaginationParams(params));
}

export async function getRecoveryForCycle(
  token: string,
  cycleId: number,
): Promise<WhoopRecoveryResponse> {
  await sleep(REQUEST_DELAY_MS);
  return whoopFetch(`/v2/cycle/${cycleId}/recovery`, token);
}

export async function getWorkoutCollection(
  token: string,
  params?: WhoopPaginationParams,
): Promise<WhoopPaginatedResponse<WhoopWorkoutResponse>> {
  await sleep(REQUEST_DELAY_MS);
  return whoopFetch("/v2/activity/workout", token, buildPaginationParams(params));
}

export async function getWorkoutById(
  token: string,
  workoutId: string,
): Promise<WhoopWorkoutResponse> {
  await sleep(REQUEST_DELAY_MS);
  return whoopFetch(`/v2/activity/workout/${workoutId}`, token);
}

export async function getUserProfile(token: string): Promise<WhoopUserProfile> {
  return whoopFetch("/v2/user/profile/basic", token);
}

export async function getBodyMeasurements(token: string): Promise<WhoopBodyMeasurement> {
  return whoopFetch("/v2/user/measurement/body", token);
}

/**
 * Iterate through all pages of a paginated endpoint.
 * Yields each page's records and the next token.
 * Respects rate limits between pages.
 */
export async function* paginateAll<T>(
  fetchPage: (params: WhoopPaginationParams) => Promise<WhoopPaginatedResponse<T>>,
  baseParams?: Omit<WhoopPaginationParams, "nextToken">,
  startToken?: string,
): AsyncGenerator<{ records: T[]; nextToken: string | null }> {
  let nextToken: string | undefined = startToken;
  const params: WhoopPaginationParams = { limit: 25, ...baseParams };

  do {
    if (nextToken) params.nextToken = nextToken;
    const page = await fetchPage(params);
    yield { records: page.records, nextToken: page.next_token };
    nextToken = page.next_token ?? undefined;
  } while (nextToken);
}
