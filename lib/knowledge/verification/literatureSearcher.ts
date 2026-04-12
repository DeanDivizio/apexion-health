import {
  searchPubMed,
  fetchAbstracts,
} from "../sources/pubmedService";
import { searchPapers } from "../sources/semanticScholarService";
import { throttlePubMed, throttleS2 } from "./rateLimiter";
import type { CandidateAbstract } from "./types";

const RESULTS_PER_SOURCE = 5;

export async function searchLiterature(
  queries: string[],
): Promise<CandidateAbstract[]> {
  const allCandidates: CandidateAbstract[] = [];

  for (const query of queries) {
    const [pubmedResults, s2Results] = await Promise.allSettled([
      searchPubMedForQuery(query),
      searchS2ForQuery(query),
    ]);

    if (pubmedResults.status === "fulfilled") {
      allCandidates.push(...pubmedResults.value);
    } else {
      console.warn(
        `[search] PubMed search failed for "${query}": ${pubmedResults.reason}`,
      );
    }

    if (s2Results.status === "fulfilled") {
      allCandidates.push(...s2Results.value);
    } else {
      console.warn(
        `[search] S2 search failed for "${query}": ${s2Results.reason}`,
      );
    }
  }

  return deduplicateCandidates(allCandidates);
}

async function searchPubMedForQuery(
  query: string,
): Promise<CandidateAbstract[]> {
  await throttlePubMed();
  const pmids = await searchPubMed(query, RESULTS_PER_SOURCE);
  if (pmids.length === 0) return [];

  await throttlePubMed();
  const abstracts = await fetchAbstracts(pmids);

  return abstracts
    .filter((a) => a.abstract.length > 0)
    .map((a) => ({
      pmid: a.pmid,
      doi: a.doi,
      pmcId: a.pmcId,
      title: a.title,
      abstract: a.abstract,
      authors: a.authors,
      journal: a.journal,
      source: "pubmed" as const,
    }));
}

async function searchS2ForQuery(
  query: string,
): Promise<CandidateAbstract[]> {
  await throttleS2();
  const papers = await searchPapers(query, RESULTS_PER_SOURCE);

  return papers
    .filter((p) => p.abstract && p.abstract.length > 0)
    .map((p) => ({
      doi: p.doi ?? undefined,
      openAccessUrl: p.openAccessPdfUrl ?? undefined,
      title: p.title,
      abstract: p.abstract!,
      authors: p.authors.map((a) => a.name),
      year: p.year ?? undefined,
      source: "semantic_scholar" as const,
    }));
}

function deduplicateCandidates(
  candidates: CandidateAbstract[],
): CandidateAbstract[] {
  const seen = new Map<string, CandidateAbstract>();

  for (const c of candidates) {
    const doiKey = c.doi?.toLowerCase();
    if (doiKey && seen.has(doiKey)) {
      const existing = seen.get(doiKey)!;
      seen.set(doiKey, mergeCandidate(existing, c));
      continue;
    }

    const titleKey = c.title.toLowerCase().trim();
    if (seen.has(titleKey)) {
      const existing = seen.get(titleKey)!;
      seen.set(titleKey, mergeCandidate(existing, c));
      continue;
    }

    const key = doiKey ?? titleKey;
    seen.set(key, c);
  }

  return Array.from(seen.values());
}

function mergeCandidate(
  existing: CandidateAbstract,
  incoming: CandidateAbstract,
): CandidateAbstract {
  return {
    ...existing,
    pmid: existing.pmid ?? incoming.pmid,
    doi: existing.doi ?? incoming.doi,
    pmcId: existing.pmcId ?? incoming.pmcId,
    openAccessUrl: existing.openAccessUrl ?? incoming.openAccessUrl,
    year: existing.year ?? incoming.year,
    journal: existing.journal ?? incoming.journal,
  };
}
