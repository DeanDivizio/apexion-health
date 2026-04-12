# Knowledge Pipeline — Critical Issues

## Pipeline Overview

The knowledge ingestion pipeline transforms YouTube podcasts and scientific papers into a structured knowledge graph with verified claims. The data flows through these stages:

```
Source Discovery (YouTube channels → topic filtering → PENDING sources)
       ↓
  FETCH (yt-dlp transcripts / multi-tier paper full-text retrieval)
       ↓
  CHUNK (sentence-level splitting with token limits + overlap)
       ↓
  EMBED (OpenAI text-embedding-3-small → Supabase pgvector)
       ↓
  EXTRACT_ENTITIES (LLM → entities + relationships per chunk)
       ↓
  RESOLVE_ENTITIES (LLM → deduplicate/canonicalize entity names)
       ↓
  SYNTHESIZE_RELATIONSHIPS (LLM → cross-chunk relationship discovery)
       ↓
  Deduplicate & Write Graph (Bayesian merge → Neo4j)
       ↓
  EXTRACT_CLAIMS (LLM → verifiable factual claims)
       ↓
  VERIFY_CLAIMS (literature search → abstract scoring → evidence extraction)
       ↓
  Paper Ingestion (recursive pipeline runs for supporting papers)
```

### Key files

| Layer | Files |
|-------|-------|
| Orchestrator | `lib/knowledge/pipeline.ts` |
| Types | `lib/knowledge/types.ts` |
| Sources | `lib/knowledge/sources/youtubeService.ts`, `paperFetcher.ts`, `pubmedService.ts`, `semanticScholarService.ts`, `unpaywallService.ts`, `firecrawlClient.ts`, `topicFilter.ts` |
| Chunking | `lib/knowledge/chunking/podcastChunker.ts`, `paperChunker.ts` |
| Embedding | `lib/knowledge/embedding.ts`, `vectorStore.ts` |
| Extraction | `lib/knowledge/extraction/entityExtractor.ts`, `claimExtractor.ts`, `entityResolver.ts`, `relationshipSynthesizer.ts`, `deduplicateRelationships.ts`, `schemas.ts` |
| Graph | `lib/knowledge/graph/neo4jClient.ts`, `neo4jWriter.ts`, `neo4jReader.ts` |
| Verification | `lib/knowledge/verification/claimVerifier.ts`, `batchClaimVerifier.ts`, `queryBuilder.ts`, `literatureSearcher.ts`, `abstractScorer.ts`, `evidenceExtractor.ts`, `prompts.ts`, `verificationUtils.ts`, `doiResolver.ts`, `rateLimiter.ts`, `tokenTracker.ts` |
| Server actions | `actions/knowledge.ts` |
| API routes | `app/api/admin/knowledge/ingest/route.ts`, `discover/route.ts`, `channels/route.ts`, `sources/route.ts`, `graph/route.ts` |
| Schema | `prisma/schema.prisma` (models at ~line 1188+), `supabase/migrations/001_knowledge_chunks.sql` |

---

## Issues

### C1 — Unbounded Recursive Pipeline Invocation

**Location:** `lib/knowledge/pipeline.ts` lines 585–633

**Problem:** During `VERIFY_CLAIMS`, the pipeline discovers supporting papers and calls `runIngestionPipeline` recursively for each one. There is no recursion depth limit. While the recursive call uses `PAPER_INGESTION_STEPS` (which excludes `VERIFY_CLAIMS`), the design is still dangerous:

- A podcast with 30 claims, each yielding 3 papers, means **90 sequential paper ingestion runs** inside a single parent call. Each paper run does FETCH (multi-tier HTTP), CHUNK, EMBED (OpenAI API), and 3 LLM extraction steps. This easily exceeds any serverless timeout.
- A future change adding `VERIFY_CLAIMS` to `PAPER_INGESTION_STEPS` would create true infinite recursion.
- A crash partway through leaves some papers ingested and others not, with no way to resume.

**Fix:**

1. Add a `depth` parameter to `PipelineOptions` (default 0, max 1). Pass `depth + 1` on recursive calls and refuse to recurse beyond the max.
2. Better: don't recurse at all. Instead, upsert discovered papers as `PENDING` sources (this already happens at lines 589–612) and **stop there**. Let a separate process (cron, queue, or manual trigger) pick up pending papers. Remove the inline `runIngestionPipeline` call entirely from the verification block.
3. If inline ingestion is kept, add a configurable concurrency limit and time budget so the parent pipeline can bail out gracefully.

---

### C2 — Missing Neo4j Indexes and Uniqueness Constraints

**Location:** No index/constraint creation exists anywhere in the codebase. Affected operations are in `lib/knowledge/graph/neo4jWriter.ts` and `neo4jReader.ts`.

**Problem:** The graph writer uses `MERGE` extensively:

```cypher
MERGE (c:Concept {name: e.name})
MERGE (s:Source {sourceId: $sourceId})
MERGE (cl:Claim {claimId: c.claimId})
```

Without a uniqueness constraint, Neo4j performs a **full label scan** on every `MERGE`. At a few hundred nodes this is slow; at thousands it will time out. The reader's `CONTAINS` text search in `searchConcepts` is also unindexed.

**Fix:** Create a setup script (e.g., `scripts/setup-neo4j.ts`) that runs these Cypher statements:

```cypher
CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT source_sourceId IF NOT EXISTS FOR (s:Source) REQUIRE s.sourceId IS UNIQUE;
CREATE CONSTRAINT claim_claimId IF NOT EXISTS FOR (cl:Claim) REQUIRE cl.claimId IS UNIQUE;
CREATE TEXT INDEX concept_name_text IF NOT EXISTS FOR (c:Concept) ON (c.name);
```

Run this once against the database before any pipeline execution. Consider also adding it as a check in `verifyNeo4jConnection` or a startup hook.

---

### C3 — Source Marked COMPLETED Despite Zero Useful Work

**Location:** `lib/knowledge/pipeline.ts` lines 148–206 (FETCH step) and line 697 (final status update)

**Problem:** If `fetchPaperFullText` returns `null` for a PAPER source, the pipeline logs a warning but continues with `chunks = []`. Every subsequent step is skipped due to `chunks.length === 0` guards. At line 697, the source is set to `COMPLETED`. This means:

- The source appears "done" in the admin UI but has zero chunks, entities, and claims.
- It will never be retried because it's not `PENDING` or `FAILED`.
- The `FETCH` run is recorded as `COMPLETED` with `segmentCount: 0`.

**Fix:**

1. After the FETCH step, check if `chunks.length === 0` when it shouldn't be. For PAPER sources that returned null, mark the source as `FAILED` with metadata explaining why:
   ```ts
   if (steps.includes("FETCH") && chunks.length === 0) {
     await prisma.knowledgeSource.update({
       where: { id: sourceId },
       data: {
         status: "FAILED",
         metadata: {
           ...((source.metadata as Record<string, unknown>) ?? {}),
           failureReason: "no_content",
           failureMessage: "Could not fetch content for this source",
         },
       },
     });
     return;
   }
   ```
2. Apply the same logic if EMBED/EXTRACT steps are run but there are zero chunks from the vector store (the "pickup from extraction" path at lines 257–274).

---

### C4 — `deleteSource` Leaves Orphaned Data in Supabase and Neo4j

**Location:** `actions/knowledge.ts` lines 170–177

**Problem:** `deleteSource` only deletes the Prisma record (cascading to `KnowledgeIngestionRun` and `KnowledgeClaim`). Two other storage systems are NOT cleaned up:

- **Supabase `knowledge_chunks` table** — rows with `source_id` matching the deleted source remain forever, consuming storage and polluting vector search results.
- **Neo4j graph** — `Source` nodes, `Concept` MENTIONED_IN edges, `Claim` nodes, and all relationship edges tagged with the source's ID remain as orphans.

**Fix:**

```ts
export async function deleteSource(sourceId: string) {
  await requireAuth();
  requireIngestionEnabled();

  // Clean up vector store
  const { deleteChunksBySourceId } = await import("@/lib/knowledge/vectorStore");
  await deleteChunksBySourceId(sourceId);

  // Clean up Neo4j graph
  try {
    const { clearSourceFromGraph } = await import("@/lib/knowledge/graph/neo4jWriter");
    await clearSourceFromGraph(sourceId);
  } catch (err) {
    console.warn(`Failed to clear graph for source ${sourceId}: ${err}`);
    // Non-fatal: Neo4j may be unavailable
  }

  // Delete Prisma records (cascades to runs + claims)
  return prisma.knowledgeSource.delete({
    where: { id: sourceId },
  });
}
```

Use dynamic imports to avoid loading Neo4j/Supabase clients when they aren't needed elsewhere.

---

### C5 — No Transaction Around Claim Deletion and Re-creation

**Location:** `lib/knowledge/pipeline.ts` lines 404–426

**Problem:** The pipeline does `deleteMany` then creates claims one-by-one in a `for` loop. If the process crashes after the delete but before all creates finish:

- Claims are permanently lost with no way to recover them.
- The source's `KnowledgeClaim` count will be inconsistent with what was actually extracted.

Additionally, creating records one-by-one is significantly slower than batch creation.

**Fix:**

```ts
const claimData = claims.map((claim) => ({
  sourceId,
  claimText: claim.claimText,
  confidence: claim.confidence,
  metadata: { entities: claim.entities },
}));

const claimRecords = await prisma.$transaction(async (tx) => {
  await tx.knowledgeClaim.deleteMany({ where: { sourceId } });
  await tx.knowledgeClaim.createMany({ data: claimData });
  return tx.knowledgeClaim.findMany({
    where: { sourceId },
    orderBy: { createdAt: "asc" },
    select: { id: true, claimText: true, metadata: true },
  });
});
```

This guarantees atomicity — either all claims are replaced, or none are.

---

### C6 — Every Verification Result Gets ALL Papers to Ingest

**Location:** `lib/knowledge/verification/claimVerifier.ts` lines 71–76, `batchClaimVerifier.ts` lines 144–149

**Problem:** After DOI resolution, every single `VerificationResult`'s `papersToIngest` array is overwritten with the **full** deduplicated paper list from all claims:

```ts
for (const result of results) {
  result.papersToIngest = uniquePapers;
}
```

Back in `pipeline.ts`, the consumer iterates `result.papersToIngest` for each result (line 573), building a `paperMap` to deduplicate. This works as a side effect, but:

- The data stored in claim metadata (line 560) is bloated — every claim records evidence for papers it has nothing to do with.
- The semantic meaning of `papersToIngest` per-result is wrong.
- If the dedup logic in `pipeline.ts` is ever changed, this could cause duplicate paper ingestion.

**Fix:** Two options:

**Option A — Per-claim paper lists:** Track which papers came from which claim's evidence and only assign those to each result's `papersToIngest`.

**Option B — Pipeline-level paper collection:** Remove `papersToIngest` from `VerificationResult` entirely. Instead, return a separate top-level `papersToIngest` array on `VerificationOutput`:

```ts
export interface VerificationOutput {
  results: VerificationResult[];
  metrics: VerificationRunMetrics;
  papersToIngest: PaperToIngest[];  // deduplicated, global
}
```

Then the pipeline consumes `verificationOutput.papersToIngest` directly instead of iterating per-result. This is the cleaner approach since the pipeline already deduplicates into a `paperMap`.
