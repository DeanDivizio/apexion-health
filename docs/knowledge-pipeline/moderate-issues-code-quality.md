# Knowledge Pipeline — Moderate Issues: Code Quality & Robustness

## Pipeline Overview

The knowledge ingestion pipeline transforms YouTube podcasts and scientific papers into a structured knowledge graph with verified claims. For a full architecture description and file map, see `critical-issues.md` in this directory.

### Quick data flow

```
Source Discovery → FETCH → CHUNK → EMBED → EXTRACT_ENTITIES → RESOLVE_ENTITIES
  → SYNTHESIZE_RELATIONSHIPS → Graph Write → EXTRACT_CLAIMS → VERIFY_CLAIMS → Paper Ingestion
```

---

## Issues

### Q1 — `embedAndStoreChunks` Duplicates Embedding Logic from `embedTexts`

**Location:** `lib/knowledge/embedding.ts` lines 16–31 (`embedTexts`) and lines 34–59 (`embedAndStoreChunks`)

**Problem:** Both functions create an OpenAI client and iterate through texts in `MAX_BATCH_SIZE` batches with identical embedding logic. The only difference is that `embedAndStoreChunks` also calls `insertChunks` and reports progress.

**Fix:** Have `embedAndStoreChunks` call `embedTexts` internally:

```ts
export async function embedAndStoreChunks(
  sourceId: string,
  sourceType: string,
  chunks: Chunk[],
  onProgress?: (embedded: number, total: number) => void,
): Promise<{ chunkCount: number }> {
  const texts = chunks.map((c) => c.content);

  // Embed in batches, reporting progress
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const batch = texts.slice(i, i + MAX_BATCH_SIZE);
    const batchEmbeddings = await embedTexts(batch);
    allEmbeddings.push(...batchEmbeddings);
    onProgress?.(allEmbeddings.length, texts.length);
  }

  await insertChunks(sourceId, sourceType, chunks, allEmbeddings);
  return { chunkCount: chunks.length };
}
```

This eliminates the duplicated client creation and sorting logic.

---

### Q2 — No Concurrency Control on `ingestPendingSources`

**Location:** `actions/knowledge.ts` lines 195–223

**Problem:** `ingestPendingSources` fetches up to 50 `PENDING` sources and processes them sequentially in a `for` loop. Each `runIngestionPipeline` call involves multiple LLM calls, external API requests, and potentially recursive paper ingestion (see critical issue C1). Processing 50 sources serially will take hours and almost certainly exceed any serverless timeout.

There's also no guard against concurrent invocations — two users clicking "Ingest All" simultaneously would both fetch the same 50 sources and process them in parallel, causing duplicate work and potential data races.

**Fix:**

1. **Add a time budget:**
   ```ts
   const MAX_DURATION_MS = 4 * 60 * 1000; // 4 minutes (leave buffer for 5-min timeout)
   const startTime = Date.now();

   for (const source of sources) {
     if (Date.now() - startTime > MAX_DURATION_MS) {
       results.push({ id: source.id, status: "skipped: time budget exceeded" });
       continue;
     }
     // ...
   }
   ```

2. **Mark sources as PROCESSING before starting** to prevent duplicate processing:
   ```ts
   await prisma.knowledgeSource.updateMany({
     where: { id: { in: sources.map((s) => s.id) } },
     data: { status: "PROCESSING" },
   });
   ```

3. **Reduce batch size** to a realistic number (e.g., 5) or make it configurable.

---

### Q3 — `maxDuration` on Ingest Route May Exceed Plan Limits

**Location:** `app/api/admin/knowledge/ingest/route.ts` line 5

**Problem:**

```ts
export const maxDuration = 1800; // 30 minutes
```

Vercel's `maxDuration` is capped by plan:
- Hobby: 60s
- Pro: 300s (default, can be increased)
- Enterprise: configurable

Setting 1800s won't cause an error, but the function will be killed at the plan's actual limit regardless of this value. A 30-minute ingestion run killed at 5 minutes leaves the source in `PROCESSING` state with no recovery.

**Fix:**

1. Set `maxDuration` to a realistic value for the plan (e.g., `300`).
2. Design the pipeline to be resumable — use the `steps` parameter to pick up from where a previous run left off.
3. For long-running ingestion, consider using a background job system (e.g., Vercel Queues, Inngest, or a cron that processes one source per invocation).

---

### Q4 — `topicFilter.ts` Uses Different OpenAI Client Than Other Extractors

**Location:** `lib/knowledge/sources/topicFilter.ts` lines 26–28

**Problem:** The topic filter creates a vanilla `openai` client:

```ts
function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}
```

Every other LLM call in the pipeline uses `@posthog/ai`'s `OpenAI` wrapper for analytics tracking. Topic filter LLM calls won't appear in PostHog, creating a blind spot in cost/usage monitoring.

**Fix:**

```ts
import { OpenAI } from "@posthog/ai";
import { getPostHogClient } from "@/lib/posthog-server";

function getClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
    posthog: getPostHogClient(),
  });
}
```

---

### Q5 — `batchProcessor.ts` Hardcodes Model, Potentially Inconsistent with Sync Path

**Location:** `lib/knowledge/batchProcessor.ts` line 28

**Problem:** The batch processor hardcodes the model in `buildBatchJsonl`:

```ts
model: req.model ?? "gpt-5-mini",
```

Individual extractors (`entityExtractor.ts`, `claimExtractor.ts`, `queryBuilder.ts`, etc.) each define their own `MODEL` constant. If someone changes the model in one of those files for the sync path, the batch path will still use `gpt-5-mini`, leading to inconsistent extraction quality between sync and batch modes.

**Fix:** Either:

1. **Require callers to always pass the model:**
   ```ts
   interface BatchRequest {
     customId: string;
     systemPrompt: string;
     userContent: string;
     model: string; // make required
     maxTokens?: number;
   }
   ```

2. **Define a shared constant:**
   ```ts
   // lib/knowledge/config.ts
   export const EXTRACTION_MODEL = "gpt-5-mini";
   export const CLASSIFICATION_MODEL = "gpt-4.1-nano";
   ```

   Import from this shared config in all extractors and the batch processor.

---

### Q6 — `getChunksBySourceId` Fetches Embedding Vectors Unnecessarily

**Location:** `lib/knowledge/vectorStore.ts` lines 84–88

**Problem:** When loading chunks for re-extraction (called from `pipeline.ts` line 267), the query fetches all columns including the 1536-dimensional embedding vectors:

```ts
const { data, error } = await supabase
  .from(TABLE)
  .select("*")
  .eq("source_id", sourceId)
```

For a source with 100 chunks, this transfers ~600KB of embedding data that is immediately discarded (only `content`, `chunkIndex`, and `metadata` are used).

**Fix:** Select only the needed columns:

```ts
const { data, error } = await supabase
  .from(TABLE)
  .select("id, source_id, source_type, chunk_index, content, metadata")
  .eq("source_id", sourceId)
  .order("chunk_index", { ascending: true });
```

---

### Q7 — No Neo4j Driver Cleanup in Serverless Context

**Location:** `lib/knowledge/graph/neo4jClient.ts`

**Problem:** The Neo4j driver is stored as a global singleton (`globalForNeo4j.neo4jDriver`). In scripts, `closeNeo4jDriver()` is called manually. In the serverless context (Next.js API routes, server actions), the driver is never explicitly closed. While the global singleton pattern prevents creating multiple drivers, the driver maintains a connection pool that may:

- Hold open TCP connections that eventually time out.
- Leak resources if the serverless instance is frozen and later garbage collected.

**Fix:** This is low risk in practice since Neo4j drivers handle connection pooling internally and are designed to be long-lived. However, you could:

1. Add `closeNeo4jDriver()` as a handler for the `beforeExit` process event:
   ```ts
   if (typeof process !== "undefined") {
     process.on("beforeExit", async () => {
       await closeNeo4jDriver();
     });
   }
   ```

2. Or configure the driver with more aggressive connection timeouts:
   ```ts
   const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
     maxConnectionLifetime: 60_000,
     connectionAcquisitionTimeout: 10_000,
   });
   ```

---

### Additional Notes for Agents

When working through these issues, keep in mind:

- **Testing:** This pipeline doesn't have automated tests yet. When fixing issues, consider adding at least a basic test for the fix (e.g., a unit test for `preparePaperText` token counting, or for `commonSubstringLength` replacement).
- **Import patterns:** Files inside `lib/knowledge/` use relative imports (`../types`, `./schemas`). App-layer files use `@/lib/knowledge/...`. Keep this consistent.
- **Error handling philosophy:** The pipeline intentionally treats Neo4j failures as non-fatal (graph writes are wrapped in try/catch with warnings). Maintain this pattern — the pipeline should still complete and store data in Prisma/Supabase even if Neo4j is down.
- **PostHog wrapping:** LLM clients should use `@posthog/ai`'s `OpenAI` wrapper for analytics. The pattern is established in `entityExtractor.ts` and others — follow the same approach.
