const PUBMED_DELAY_MS = 350;
const S2_DELAY_MS = 1100;
const MAX_RETRIES = 3;

let lastPubMed = 0;
let lastS2 = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function throttlePubMed(): Promise<void> {
  const elapsed = Date.now() - lastPubMed;
  if (elapsed < PUBMED_DELAY_MS) {
    await sleep(PUBMED_DELAY_MS - elapsed);
  }
  lastPubMed = Date.now();
}

export async function throttleS2(): Promise<void> {
  const elapsed = Date.now() - lastS2;
  if (elapsed < S2_DELAY_MS) {
    await sleep(S2_DELAY_MS - elapsed);
  }
  lastS2 = Date.now();
}

/**
 * Wraps fetch with retry logic for HTTP 429 (rate limit) responses.
 * Reads Retry-After header when available, otherwise uses exponential backoff.
 */
export async function fetchWithRetry(
  url: string,
  opts?: RequestInit,
  maxRetries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, opts);
    if (res.status !== 429) return res;

    if (attempt === maxRetries) {
      throw new Error(`Rate limited after ${maxRetries} retries: ${url}`);
    }

    const retryAfter = res.headers.get("Retry-After");
    const delaySec = retryAfter ? parseInt(retryAfter, 10) : 2;
    const backoffMs = (isNaN(delaySec) ? 2 : delaySec) * 1000 * (attempt + 1);
    console.warn(
      `[rateLimiter] 429 on ${url}, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`,
    );
    await sleep(backoffMs);
  }

  throw new Error(`Rate limited after ${maxRetries} retries: ${url}`);
}
