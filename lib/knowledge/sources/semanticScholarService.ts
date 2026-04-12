import { fetchWithRetry } from "../verification/rateLimiter";

const S2_BASE = "https://api.semanticscholar.org/graph/v1";

export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  authors: { name: string }[];
  year: number | null;
  doi: string | null;
  openAccessPdfUrl: string | null;
  citationCount: number;
  tldr: string | null;
}

export async function fetchPaperByDoi(doi: string): Promise<SemanticScholarPaper | null> {
  return fetchPaper(`DOI:${doi}`);
}

export async function fetchPaperByPmid(pmid: string): Promise<SemanticScholarPaper | null> {
  return fetchPaper(`PMID:${pmid}`);
}

async function fetchPaper(identifier: string): Promise<SemanticScholarPaper | null> {
  const fields = "title,abstract,authors,year,externalIds,openAccessPdf,citationCount,tldr";
  const url = `${S2_BASE}/paper/${encodeURIComponent(identifier)}?fields=${fields}`;

  const headers: Record<string, string> = {};
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;

  const res = await fetchWithRetry(url, { headers });
  if (!res.ok) return null;

  try {
    const data = await res.json();
    return {
      paperId: data.paperId,
      title: data.title ?? "",
      abstract: data.abstract ?? null,
      authors: data.authors ?? [],
      year: data.year ?? null,
      doi: data.externalIds?.DOI ?? null,
      openAccessPdfUrl: data.openAccessPdf?.url ?? null,
      citationCount: data.citationCount ?? 0,
      tldr: data.tldr?.text ?? null,
    };
  } catch {
    return null;
  }
}

export async function searchPapers(
  query: string,
  limit: number = 10,
): Promise<SemanticScholarPaper[]> {
  const fields = "title,abstract,authors,year,externalIds,openAccessPdf,citationCount,tldr";
  const url = `${S2_BASE}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;

  const headers: Record<string, string> = {};
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;

  const res = await fetchWithRetry(url, { headers });
  if (!res.ok) return [];

  try {
    const data = await res.json();
    return (data.data ?? []).map((paper: any) => ({
      paperId: paper.paperId,
      title: paper.title ?? "",
      abstract: paper.abstract ?? null,
      authors: paper.authors ?? [],
      year: paper.year ?? null,
      doi: paper.externalIds?.DOI ?? null,
      openAccessPdfUrl: paper.openAccessPdf?.url ?? null,
      citationCount: paper.citationCount ?? 0,
      tldr: paper.tldr?.text ?? null,
    }));
  } catch {
    return [];
  }
}
