# Knowledge Pipeline — Moderate Issues: Data Integrity & Correctness

## Pipeline Overview

The knowledge ingestion pipeline transforms YouTube podcasts and scientific papers into a structured knowledge graph with verified claims. For a full architecture description and file map, see `critical-issues.md` in this directory.

### Quick data flow

```
Source Discovery → FETCH → CHUNK → EMBED → EXTRACT_ENTITIES → RESOLVE_ENTITIES
  → SYNTHESIZE_RELATIONSHIPS → Graph Write → EXTRACT_CLAIMS → VERIFY_CLAIMS → Paper Ingestion
```

---

## Issues

### M1 — Claim-Entity Remapping Can Silently Drop All Entity Links

**Location:** `lib/knowledge/pipeline.ts` lines 431–443

**Problem:** After claims are extracted and stored in Prisma, the pipeline remaps entity names using the entity resolver's `nameMap`, then filters to only names present in `canonicalNames`:

```ts
const canonicalNames = new Set(extraction.entities.map((e) => e.name));
const remappedClaimRecords = claimRecords.map((cr) => ({
  ...cr,
  entities: cr.entities
    .map((e) => entityNameMap?.get(e) ?? entityNameMap?.get(e.toLowerCase()) ?? e)
    .filter((e) => canonicalNames.has(e)),
}));
```

Claim extraction runs as a separate LLM call from entity extraction. The claim extractor may name entities differently (e.g., "Vitamin D" vs "Vitamin D3", "magnesium" vs "magnesium L-threonate"). If the name doesn't appear in `nameMap` AND isn't in `canonicalNames`, it's silently dropped.

This means claims can end up with zero entity links in the graph, making them unreachable via concept traversal in the graph explorer.

**Fix:** Instead of strict set membership, do a fuzzy lookup against entity aliases:

```ts
const entityAliasMap = new Map<string, string>();
for (const entity of extraction.entities) {
  entityAliasMap.set(entity.name.toLowerCase(), entity.name);
  for (const alias of entity.aliases) {
    entityAliasMap.set(alias.toLowerCase(), entity.name);
  }
}

function resolveEntityName(name: string): string | null {
  return (
    entityNameMap?.get(name) ??
    entityNameMap?.get(name.toLowerCase()) ??
    entityAliasMap.get(name.toLowerCase()) ??
    null
  );
}

const remappedClaimRecords = claimRecords.map((cr) => ({
  ...cr,
  entities: cr.entities
    .map(resolveEntityName)
    .filter((e): e is string => e !== null),
}));
```

---

### M2 — `commonSubstringLength` in Podcast Chunker Is Positional, Not Actual Common Substring

**Location:** `lib/knowledge/chunking/podcastChunker.ts` lines 126–135

**Problem:** The function counts matching characters at the same position in two strings:

```ts
function commonSubstringLength(a: string, b: string): number {
  for (let i = 0; i < minLen; i++) {
    if (aLower[i] === bLower[i]) count++;
  }
  return count;
}
```

This is used to align chunks with transcript segment timestamps. Two strings like `"the effects of creatine"` and `"the impact of magnesium"` would score highly (matching `"the "` prefix plus common letters) even though they're completely different content. Meanwhile, the same string offset by one character would score poorly.

**Impact:** Chunk timestamps (`startTimestamp`, `endTimestamp`) may be inaccurate, which affects the admin UI's ability to link claims back to specific moments in a podcast.

**Fix:** Use `String.includes()` for matching or implement an actual longest-common-substring check:

```ts
function findTimestamp(
  chunkText: string,
  timestamps: TimestampEntry[],
  edge: "start" | "end",
): number {
  const snippet = edge === "start" ? chunkText.slice(0, 60) : chunkText.slice(-60);
  const normalizedSnippet = snippet.toLowerCase().trim();

  let bestMatch: TimestampEntry | undefined;
  let bestScore = 0;

  for (const entry of timestamps) {
    if (normalizedSnippet.includes(entry.textSnippet.toLowerCase().trim())) {
      return edge === "start" ? entry.offset : entry.endOffset;
    }
    // Fallback: count word overlap
    const snippetWords = new Set(normalizedSnippet.split(/\s+/));
    const entryWords = entry.textSnippet.toLowerCase().split(/\s+/);
    const overlap = entryWords.filter((w) => snippetWords.has(w)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestMatch = entry;
    }
  }

  if (!bestMatch) return 0;
  return edge === "start" ? bestMatch.offset : bestMatch.endOffset;
}
```

---

### M3 — `preparePaperText` Uses Character Count as Token Proxy

**Location:** `lib/knowledge/verification/prompts.ts` lines 118–121

**Problem:** Paper text is truncated using a character-to-token heuristic:

```ts
if (text.length > MAX_PAPER_TOKENS * 4) {
  text = text.slice(0, MAX_PAPER_TOKENS * 4);
}
```

The `* 4` multiplier assumes ~4 characters per token. For scientific text with chemical formulas, gene names, citation markers, and numerical data, the actual ratio is often 2–3 characters per token. This means papers could be sent to the LLM with 16,000+ tokens when the intended limit is 12,000, potentially exceeding the model's context window or producing truncated responses.

**Fix:** Use `gpt-tokenizer` (already a dependency in the project, used by the chunkers):

```ts
import { encode } from "gpt-tokenizer";

export function preparePaperText(paper: PaperFullText): string {
  const relevantSections = paper.sections.filter((s) =>
    RELEVANT_SECTIONS.has(s.heading.toLowerCase()),
  );
  const sections = relevantSections.length > 0 ? relevantSections : paper.sections;

  const parts: string[] = [];
  let tokenCount = 0;

  for (const s of sections) {
    const sectionText = `## ${s.heading}\n${s.content}\n\n`;
    const sectionTokens = encode(sectionText).length;
    if (tokenCount + sectionTokens > MAX_PAPER_TOKENS) {
      const remaining = MAX_PAPER_TOKENS - tokenCount;
      if (remaining > 200) {
        // Add a truncated version of this section
        parts.push(sectionText.slice(0, remaining * 3)); // conservative char estimate
      }
      break;
    }
    parts.push(sectionText);
    tokenCount += sectionTokens;
  }

  return parts.join("");
}
```

---

### M4 — `clearSourceFromGraph` First Query Is Overly Broad

**Location:** `lib/knowledge/graph/neo4jWriter.ts` lines 11–14

**Problem:** The first deletion query matches ALL relationships in the entire graph where `r.sourceId = $sourceId`:

```cypher
MATCH ()-[r]->() WHERE r.sourceId = $sourceId DELETE r
```

This is correct if every relationship is unique per source. But after entity resolution and deduplication, two different sources may contribute relationships between the same concepts with the same predicate. The `MERGE` in `writeExtractionToGraph` uses `{sourceId: $sourceId}` as part of the match key, so relationships ARE source-scoped. However, this broad pattern match still scans all relationships in the graph.

**Fix:** Scope the deletion more precisely by including the relationship predicate labels:

```cypher
MATCH (a:Concept)-[r]->(b:Concept) WHERE r.sourceId = $sourceId DELETE r
```

This limits the scan to Concept→Concept edges, avoiding Source, Claim, and other node types. Combined with the Neo4j indexes from critical issue C2, this will be much faster.

---

### M5 — `extractChannelId` Returns Handle Format, Causing Repeated Resolutions

**Location:** `lib/knowledge/sources/youtubeService.ts` lines 41–49 and 171–179

**Problem:** When a YouTube URL uses the `/@handle` format, `extractChannelId` returns `@handle` (e.g., `@hubaborman`). This value is stored in `KnowledgeChannel.channelId`. Every time `fetchChannelVideos` is called with this handle, it makes an extra YouTube search API call to resolve the handle to a `UC`-prefixed channel ID (line 173).

This wastes a YouTube API quota unit per scan. More importantly, YouTube's search API could theoretically return a different channel for the same handle if the handle changes or there are name collisions.

**Fix:** Resolve the handle to a canonical `UC`-prefixed channel ID at `addChannel` time:

```ts
export async function addChannel(name: string, url: string, topicDomains: string[]) {
  await requireAdmin();
  requireIngestionEnabled();

  let channelId = extractChannelId(url);

  // Resolve handles to canonical channel IDs
  if (channelId.startsWith("@")) {
    const { resolveChannelHandle } = await import("@/lib/knowledge/sources/youtubeService");
    channelId = await resolveChannelHandle(channelId);
  }

  return prisma.knowledgeChannel.create({
    data: { channelId, name, url, topicDomains, active: true },
  });
}
```

And add a `resolveChannelHandle` export to `youtubeService.ts` that extracts the resolution logic from `fetchChannelVideos`.

---

### M6 — `recordRunComplete` Uses `findFirst` Instead of Passing Run ID

**Location:** `lib/knowledge/pipeline.ts` lines 750–779

**Problem:** `recordRunStart` creates a run and returns its ID, but this ID is never captured:

```ts
await recordRunStart(sourceId, "FETCH"); // return value discarded
// ... step logic ...
await recordRunComplete(sourceId, "FETCH", { ... }); // does a findFirst to locate the run
```

`recordRunComplete` then uses `findFirst({ where: { sourceId, step, status: "RUNNING" } })` to relocate the run. If a previous failed run left a `RUNNING` record (because step failure recording doesn't exist — see significant issue S8), this could update the wrong record.

**Fix:** Capture the run ID from `recordRunStart` and pass it through:

```ts
const runId = await recordRunStart(sourceId, "FETCH");
// ... step logic ...
await recordRunComplete(runId, { segmentCount: chunks.length });
```

Update `recordRunComplete` to take a run ID directly:

```ts
async function recordRunComplete(
  runId: string,
  stats: Record<string, unknown>,
): Promise<void> {
  await prisma.knowledgeIngestionRun.update({
    where: { id: runId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      stats: stats as Prisma.InputJsonValue,
    },
  });
}
```

---

### M7 — Firecrawl Client Missing API Key Header

**Location:** `lib/knowledge/sources/firecrawlClient.ts` lines 21–29

**Problem:** The Firecrawl scrape request sends no `Authorization` header:

```ts
const res = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url, formats: ["markdown"], waitFor: 5000 }),
});
```

Most Firecrawl deployments (including the hosted service) require a Bearer token. Without it, the request either fails silently (returns null, caught by the try/catch) or works only against an unauthenticated local instance.

**Fix:**

```ts
const headers: Record<string, string> = { "Content-Type": "application/json" };
const apiKey = process.env.FIRECRAWL_API_KEY;
if (apiKey) {
  headers["Authorization"] = `Bearer ${apiKey}`;
}

const res = await fetch(endpoint, {
  method: "POST",
  headers,
  body: JSON.stringify({ url, formats: ["markdown"], waitFor: 5000 }),
});
```
