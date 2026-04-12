# Knowledge Pipeline — Significant Issues

## Pipeline Overview

The knowledge ingestion pipeline transforms YouTube podcasts and scientific papers into a structured knowledge graph with verified claims. For a full architecture description and file map, see `critical-issues.md` in this directory.

### Quick data flow

```
Source Discovery → FETCH → CHUNK → EMBED → EXTRACT_ENTITIES → RESOLVE_ENTITIES
  → SYNTHESIZE_RELATIONSHIPS → Graph Write → EXTRACT_CLAIMS → VERIFY_CLAIMS → Paper Ingestion
```

### Storage systems

- **Prisma/Postgres** — operational metadata: channels, sources, ingestion runs, claims
- **Supabase pgvector** — `knowledge_chunks` table with embeddings
- **Neo4j** — knowledge graph: Concept nodes, relationship edges, Claim nodes, Source nodes

---

## Issues

### S1 — Rate Limiter Uses Module-Level State (Ineffective in Serverless)

**Location:** `lib/knowledge/verification/rateLimiter.ts`

**Problem:** The rate limiter uses module-level variables to track last-call timestamps:

```ts
let lastPubMed = 0;
let lastS2 = 0;
```

On Vercel (serverless), these variables reset to 0 on every cold start. Two concurrent pipeline runs (e.g., from `ingestPendingSources` processing multiple sources) will each see `lastPubMed = 0` and fire requests simultaneously. NCBI's rate limit is 3 req/sec without an API key and 10 req/sec with one. Exceeding this risks IP-level blocks.

Even within a single warm invocation, the rate limiter is only effective for sequential calls within the same function — parallel calls to `searchLiterature` across different claims bypass it.

**Fix:**

1. **Short term:** Check response headers for `X-RateLimit-Remaining` and `Retry-After` from PubMed and Semantic Scholar. Back off when limits are hit.
2. **Medium term:** If you have a Redis instance (e.g., via Upstash), implement a token bucket rate limiter there.
3. **Defensive:** Wrap each external API call with a try/catch that detects HTTP 429 responses and retries with exponential backoff:
   ```ts
   async function fetchWithRetry(url: string, opts?: RequestInit, maxRetries = 3): Promise<Response> {
     for (let attempt = 0; attempt <= maxRetries; attempt++) {
       const res = await fetch(url, opts);
       if (res.status === 429) {
         const retryAfter = parseInt(res.headers.get("Retry-After") ?? "2", 10);
         await sleep(retryAfter * 1000 * (attempt + 1));
         continue;
       }
       return res;
     }
     throw new Error(`Rate limited after ${maxRetries} retries: ${url}`);
   }
   ```

---

### S2 — `MANUAL` Source Type Not Handled by Pipeline

**Location:** `prisma/schema.prisma` line 1188 (`KnowledgeSourceType` enum) and `lib/knowledge/pipeline.ts` lines 112–206 (FETCH step)

**Problem:** The Prisma schema defines `KnowledgeSourceType` with three values: `PODCAST`, `PAPER`, `MANUAL`. The pipeline's FETCH step only handles `PODCAST` and `PAPER`:

```ts
if (source.sourceType === "PODCAST") {
  // ...
} else if (source.sourceType === "PAPER") {
  // ...
}
```

If someone creates a `MANUAL` source and triggers ingestion, the FETCH step produces zero chunks, every subsequent step is skipped, and the source is marked `COMPLETED` (see also critical issue C3).

**Fix:** Two options:

**Option A — Fail fast:** Add an explicit check at the start of the FETCH step:

```ts
if (source.sourceType === "MANUAL") {
  throw new Error("MANUAL sources are not supported by the automated pipeline. Use the direct chunk import API instead.");
}
```

**Option B — Handle it:** Implement a MANUAL flow where the source's `metadata` contains pre-provided text content or a URL to scrape. Parse it into chunks and continue through the pipeline. This could reuse the `paperChunker` or a new generic text chunker.

Either way, use an exhaustive switch/if-else so TypeScript catches unhandled source types at compile time:

```ts
switch (source.sourceType) {
  case "PODCAST": { /* ... */ break; }
  case "PAPER": { /* ... */ break; }
  case "MANUAL": { /* ... */ break; }
  default: {
    const _exhaustive: never = source.sourceType;
    throw new Error(`Unhandled source type: ${_exhaustive}`);
  }
}
```

---

### S3 — No Admin Role Check on Server Actions

**Location:** `actions/knowledge.ts` lines 16–19

**Problem:** The `requireAuth()` helper only verifies that a user is logged in. It does not check for admin privileges:

```ts
async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
```

Any authenticated user of the app can trigger source ingestion, delete sources, scan channels, and access all knowledge data via server actions.

**Fix:** Check for an admin role using Clerk session claims or user metadata:

```ts
async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const role = (sessionClaims?.metadata as Record<string, unknown>)?.role;
  if (role !== "admin") throw new Error("Forbidden: admin access required");

  return userId;
}
```

Replace all `requireAuth()` calls in `actions/knowledge.ts` with `requireAdmin()`. Apply the same pattern to the API routes in `app/api/admin/knowledge/`.

---

### S4 — Error Progress Callback Always Reports Step as "FETCH"

**Location:** `lib/knowledge/pipeline.ts` lines 744–746

**Problem:** When the pipeline fails at any step, the `onProgress` callback and the error metadata always say the failure was at `"FETCH"`:

```ts
onProgress?.({ step: "FETCH", status: "FAILED", error: message });
```

This is misleading in the admin UI — a user can't tell if the failure was in entity extraction, embedding, or verification.

**Fix:** Track the current step as a mutable variable:

```ts
let currentStep: KnowledgeIngestionStep = steps[0] ?? "FETCH";
```

Update it at the start of each step block:

```ts
if (steps.includes("EMBED") && chunks.length > 0) {
  currentStep = "EMBED";
  // ...
}
```

Then use it in the catch block:

```ts
onProgress?.({ step: currentStep, status: "FAILED", error: message });
```

Also update the `KnowledgeSource` metadata with the failing step:

```ts
await prisma.knowledgeSource.update({
  where: { id: sourceId },
  data: {
    status: "FAILED",
    metadata: {
      ...((source.metadata as Record<string, unknown>) ?? {}),
      failedAtStep: currentStep,
      failureMessage: message,
    },
  },
});
```

---

### S5 — `CHUNK` Step Is a No-Op

**Location:** `lib/knowledge/pipeline.ts` lines 208–223

**Problem:** The CHUNK step does not perform any chunking. Chunking happens inside the FETCH step (line 144 for podcasts, line 188 for papers). The CHUNK step only records a run with the already-computed chunk count:

```ts
if (steps.includes("CHUNK")) {
  await recordRunStart(sourceId, "CHUNK");
  await recordRunComplete(sourceId, "CHUNK", { chunkCount: chunks.length });
}
```

If someone passes `steps: ["CHUNK"]` alone (e.g., to re-chunk without re-fetching), nothing happens.

**Fix:** Separate FETCH and CHUNK responsibilities:

1. **FETCH** should only retrieve raw data and store it:
   - For podcasts: fetch the transcript and store it in source metadata (similar to how papers store `fullTextCache`).
   - For papers: fetch full text and store it in `fullTextCache` (already done).
2. **CHUNK** should read the cached raw data from metadata and perform chunking:
   ```ts
   if (steps.includes("CHUNK")) {
     if (source.sourceType === "PODCAST") {
       const cached = (source.metadata as any)?.rawTranscript;
       if (cached) chunks = chunkPodcastTranscript(cached);
     } else if (source.sourceType === "PAPER") {
       const cached = (source.metadata as any)?.fullTextCache;
       if (cached) chunks = chunkPaper(cached);
     }
   }
   ```

This allows re-chunking with different parameters without re-fetching, which is useful during development.

---

### S6 — Duplicate PubMed Fetch in Paper Fetcher

**Location:** `lib/knowledge/sources/paperFetcher.ts` lines 146–163 (Tier 1) and lines 229–245 (Tier 6)

**Problem:** In `fetchPaperFullText`, Tier 1 calls `fetchAbstracts([pmid])` to check for a PMC ID. If Tier 1 fails to get full text and all subsequent tiers (2–5) also fail, Tier 6 calls `fetchAbstracts([pmid])` again for the same PMID. The abstract data from Tier 1 is discarded.

**Fix:** Cache the Tier 1 abstract and reuse it:

```ts
export async function fetchPaperFullText(input: FetchPaperInput): Promise<PaperFullText | null> {
  const { pmid, doi, title } = input;
  let cachedAbstract: PubMedAbstract | null = null;

  // Tier 1: PMC Open Access
  if (pmid) {
    const abstracts = await fetchAbstracts([pmid]);
    cachedAbstract = abstracts[0] ?? null;
    if (cachedAbstract?.pmcId) {
      const fullText = await fetchPmcFullText(cachedAbstract.pmcId);
      if (fullText && fullText.sections.length > 0) {
        return { /* ... */ };
      }
    }
  }

  // ... Tiers 2–5 ...

  // Tier 6: Abstract only (reuse cached abstract)
  const abstract = cachedAbstract ?? (pmid ? (await fetchAbstracts([pmid]))[0] : null);
  if (abstract) {
    return { /* ... */ };
  }

  return null;
}
```

---

### S7 — `buildBiorxivPaper` Requires `jatsxml` but Never Fetches It

**Location:** `lib/knowledge/sources/paperFetcher.ts` lines 293–305

**Problem:** The function returns `null` if the bioRxiv entry has no `jatsxml` field. But even when `jatsxml` IS present, the XML is never fetched or parsed — the function returns `sections: []`. This means bioRxiv Tier 3 is effectively abstract-only in all cases. If there's no `jatsxml` metadata field, the whole tier is skipped even though the abstract and metadata are still useful.

**Fix:** Two options:

**Option A — Remove the `jatsxml` gate:** Return the abstract and metadata regardless:

```ts
function buildBiorxivPaper(entry: any): PaperFullText | null {
  if (!entry.abstract && !entry.title) return null;

  return {
    title: entry.title ?? "",
    authors: (entry.authors ?? "").split(";").map((a: string) => a.trim()).filter(Boolean),
    abstract: entry.abstract ?? "",
    sections: [],
    doi: entry.doi,
    publishedAt: entry.date,
    fetchTier: "BIORXIV",
  };
}
```

**Option B — Actually fetch and parse JATS XML:** If full text is important, fetch the JATS XML URL and parse sections from it.

---

### S8 — Step Failure Not Recorded in Ingestion Runs

**Location:** `lib/knowledge/pipeline.ts` — `recordRunStart` (line 750) and `recordRunComplete` (line 760). No `recordRunFailed` exists.

**Problem:** When a step throws an error, its `KnowledgeIngestionRun` record stays in `RUNNING` status forever. The top-level catch marks the `KnowledgeSource` as `FAILED`, but the individual step run is never updated. This makes it hard to tell from the admin UI which step caused the failure.

**Fix:** Add a `recordRunFailed` helper:

```ts
async function recordRunFailed(
  sourceId: string,
  step: KnowledgeIngestionStep,
  error: string,
): Promise<void> {
  const existing = await prisma.knowledgeIngestionRun.findFirst({
    where: { sourceId, step, status: "RUNNING" },
    orderBy: { startedAt: "desc" },
  });
  if (existing) {
    await prisma.knowledgeIngestionRun.update({
      where: { id: existing.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error,
      },
    });
  }
}
```

Call it in the top-level catch block using the tracked `currentStep` (from S4):

```ts
catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await recordRunFailed(sourceId, currentStep, message);
  // ... rest of error handling
}
```

Better yet: refactor to pass the run ID from `recordRunStart` through the step logic (see moderate issue M6) so `recordRunFailed` doesn't need to do a `findFirst`.
