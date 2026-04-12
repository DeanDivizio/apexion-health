import { prisma } from "@/lib/db/prisma";
import { fetchAbstracts, fetchPmcFullText } from "./pubmedService";
import { findOpenAccessCopy } from "./unpaywallService";
import { fetchPaperByDoi, fetchPaperByPmid } from "./semanticScholarService";
import { scrapeUrl } from "./firecrawlClient";
import type { PaperFullText, PaperSection } from "../types";

interface FetchPaperInput {
  pmid?: string;
  doi?: string;
  title?: string;
}

interface FullTextCacheEntry {
  title: string;
  authors: string[];
  abstract: string;
  sections: PaperSection[];
  doi?: string;
  pmid?: string;
  journal?: string;
  publishedAt?: string;
  fetchTier: string;
  cachedAt: string;
}

/**
 * Attempts to load paper full text from a previously-ingested KnowledgeSource
 * before falling back to the multi-tier external fetch. When a fresh fetch
 * succeeds, the result is written back to the matching KnowledgeSource row
 * so future lookups hit the cache.
 */
export async function fetchPaperFullTextCached(
  input: FetchPaperInput,
): Promise<PaperFullText | null> {
  const { pmid, doi } = input;

  const cached = await lookupCachedFullText(doi, pmid);
  if (cached) {
    console.log(
      `[paperFetcher] Cache hit for ${doi ?? pmid} (cached ${cached.cachedAt})`,
    );
    return {
      title: cached.title,
      authors: cached.authors,
      abstract: cached.abstract,
      sections: cached.sections,
      doi: cached.doi,
      pmid: cached.pmid,
      journal: cached.journal,
      publishedAt: cached.publishedAt,
      fetchTier: cached.fetchTier,
    };
  }

  const paper = await fetchPaperFullText(input);

  if (paper && (doi || pmid)) {
    await writeCacheToSource(paper, doi, pmid);
  }

  return paper;
}

async function lookupCachedFullText(
  doi?: string,
  pmid?: string,
): Promise<FullTextCacheEntry | null> {
  if (!doi && !pmid) return null;

  const externalId = doi ?? pmid!;
  try {
    const source = await prisma.knowledgeSource.findUnique({
      where: {
        sourceType_externalId: { sourceType: "PAPER", externalId },
      },
      select: { status: true, metadata: true },
    });

    if (!source || source.status !== "COMPLETED") return null;

    const meta = source.metadata as Record<string, unknown> | null;
    const cache = meta?.fullTextCache as FullTextCacheEntry | undefined;
    if (!cache?.sections || !cache.fetchTier) return null;

    return cache;
  } catch {
    return null;
  }
}

async function writeCacheToSource(
  paper: PaperFullText,
  doi?: string,
  pmid?: string,
): Promise<void> {
  const externalId = doi ?? pmid;
  if (!externalId) return;

  try {
    const source = await prisma.knowledgeSource.findUnique({
      where: {
        sourceType_externalId: { sourceType: "PAPER", externalId },
      },
      select: { id: true, metadata: true },
    });

    if (!source) return;

    const existingMeta = (source.metadata as Record<string, unknown>) ?? {};
    if (existingMeta.fullTextCache) return;

    await prisma.knowledgeSource.update({
      where: { id: source.id },
      data: {
        metadata: {
          ...existingMeta,
          fullTextCache: JSON.parse(JSON.stringify({
            title: paper.title,
            authors: paper.authors,
            abstract: paper.abstract,
            sections: paper.sections,
            doi: paper.doi,
            pmid: paper.pmid,
            journal: paper.journal,
            publishedAt: paper.publishedAt,
            fetchTier: paper.fetchTier,
            cachedAt: new Date().toISOString(),
          })),
        },
      },
    });

    console.log(`[paperFetcher] Cached full text for ${externalId}`);
  } catch {
    // Cache write failures are non-fatal
  }
}

export async function fetchPaperFullText(
  input: FetchPaperInput,
): Promise<PaperFullText | null> {
  const { pmid, doi, title } = input;
  let cachedAbstract: Awaited<ReturnType<typeof fetchAbstracts>>[number] | null = null;

  // Tier 1: PMC Open Access
  if (pmid) {
    const abstracts = await fetchAbstracts([pmid]);
    cachedAbstract = abstracts[0] ?? null;
    if (cachedAbstract?.pmcId) {
      const fullText = await fetchPmcFullText(cachedAbstract.pmcId);
      if (fullText && fullText.sections.length > 0) {
        return {
          ...fullText,
          doi: doi ?? cachedAbstract.doi,
          pmid,
          authors: cachedAbstract.authors,
          publishedAt: cachedAbstract.publishedDate,
          journal: cachedAbstract.journal,
          fetchTier: "PMC_OA",
        };
      }
    }
  }

  // Tier 2: Unpaywall
  if (doi) {
    const oa = await findOpenAccessCopy(doi);
    if (oa?.pdfUrl) {
      const paperFromPdf = await extractTextFromPdfUrl(oa.pdfUrl);
      if (paperFromPdf) {
        return {
          ...paperFromPdf,
          doi,
          pmid,
          journal: oa.journal,
          fetchTier: "UNPAYWALL",
        };
      }
    }
  }

  // Tier 3: bioRxiv / medRxiv
  if (doi) {
    const preprint = await fetchFromBiorxiv(doi);
    if (preprint) {
      return { ...preprint, doi, pmid, fetchTier: "BIORXIV" };
    }
  }

  // Tier 4: Semantic Scholar
  const s2Paper = doi
    ? await fetchPaperByDoi(doi)
    : pmid
      ? await fetchPaperByPmid(pmid)
      : null;

  if (s2Paper?.openAccessPdfUrl) {
    const paperFromPdf = await extractTextFromPdfUrl(s2Paper.openAccessPdfUrl);
    if (paperFromPdf) {
      return {
        ...paperFromPdf,
        doi: doi ?? s2Paper.doi ?? undefined,
        pmid,
        authors: s2Paper.authors.map((a) => a.name),
        fetchTier: "SEMANTIC_SCHOLAR",
      };
    }
  }

  // Tier 5: Firecrawl web scrape
  if (doi) {
    const doiUrl = `https://doi.org/${doi}`;
    const scraped = await scrapeUrl(doiUrl);
    if (scraped?.success && scraped.markdown.length > 500) {
      const sections = parseMarkdownSections(scraped.markdown);
      return {
        title: scraped.metadata?.title ?? title ?? "",
        authors: [],
        abstract: extractAbstractFromMarkdown(scraped.markdown),
        sections,
        doi,
        pmid,
        fetchTier: "FIRECRAWL",
      };
    }
  }

  // Tier 6: Abstract only (reuse cached abstract from Tier 1 when available)
  const abstract = cachedAbstract ?? (pmid ? (await fetchAbstracts([pmid]))[0] : null);
  if (abstract) {
    return {
      title: abstract.title,
      authors: abstract.authors,
      abstract: abstract.abstract,
      sections: [],
      doi: doi ?? abstract.doi,
      pmid,
      journal: abstract.journal,
      publishedAt: abstract.publishedDate,
      fetchTier: "ABSTRACT_ONLY",
    };
  }

  return null;
}

async function extractTextFromPdfUrl(
  pdfUrl: string,
): Promise<PaperFullText | null> {
  try {
    const scraped = await scrapeUrl(pdfUrl);
    if (!scraped?.success || scraped.markdown.length < 200) return null;

    return {
      title: scraped.metadata?.title ?? "",
      authors: [],
      abstract: extractAbstractFromMarkdown(scraped.markdown),
      sections: parseMarkdownSections(scraped.markdown),
      fetchTier: "PDF",
    };
  } catch {
    return null;
  }
}

async function fetchFromBiorxiv(doi: string): Promise<PaperFullText | null> {
  try {
    const url = `https://api.biorxiv.org/details/biorxiv/${encodeURIComponent(doi)}`;
    const res = await fetch(url);
    if (!res.ok) {
      const medrxivUrl = `https://api.biorxiv.org/details/medrxiv/${encodeURIComponent(doi)}`;
      const medrxivRes = await fetch(medrxivUrl);
      if (!medrxivRes.ok) return null;
      const medrxivData = await medrxivRes.json();
      const collection = medrxivData.collection ?? [];
      if (collection.length === 0) return null;
      const entry = collection[0];
      return buildBiorxivPaper(entry);
    }

    const data = await res.json();
    const collection = data.collection ?? [];
    if (collection.length === 0) return null;
    return buildBiorxivPaper(collection[0]);
  } catch {
    return null;
  }
}

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

function parseMarkdownSections(markdown: string): PaperSection[] {
  const sections: PaperSection[] = [];
  const lines = markdown.split("\n");
  let currentHeading = "Introduction";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      if (currentContent.length > 0) {
        sections.push({ heading: currentHeading, content: currentContent.join("\n") });
        currentContent = [];
      }
      currentHeading = headingMatch[1].trim();
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({ heading: currentHeading, content: currentContent.join("\n") });
  }

  return sections;
}

function extractAbstractFromMarkdown(markdown: string): string {
  const abstractMatch = markdown.match(/#{1,3}\s*Abstract\s*\n([\s\S]*?)(?=\n#{1,3}\s|\n$)/i);
  if (abstractMatch) return abstractMatch[1].trim();

  const lines = markdown.split("\n").filter((l) => l.trim().length > 0);
  return lines.slice(0, 5).join(" ").slice(0, 1000);
}
