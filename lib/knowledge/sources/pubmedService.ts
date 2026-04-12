import { XMLParser } from "fast-xml-parser";
import { fetchWithRetry } from "../verification/rateLimiter";
import type { PaperFullText, PaperSection } from "../types";

const EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const PMC_OA_BASE = "https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi";

function getApiKey(): string | undefined {
  return process.env.NCBI_API_KEY;
}

function buildParams(params: Record<string, string>): string {
  const apiKey = getApiKey();
  if (apiKey) params.api_key = apiKey;
  return new URLSearchParams(params).toString();
}

export async function searchPubMed(
  query: string,
  maxResults: number = 20,
): Promise<string[]> {
  const params = buildParams({
    db: "pubmed",
    term: query,
    retmax: String(maxResults),
    retmode: "json",
    sort: "relevance",
  });

  const res = await fetchWithRetry(`${EUTILS_BASE}/esearch.fcgi?${params}`);
  if (!res.ok) throw new Error(`PubMed search failed: ${res.status}`);

  const data = await res.json();
  return data.esearchresult?.idlist ?? [];
}

export interface PubMedAbstract {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publishedDate: string;
  doi?: string;
  pmcId?: string;
}

export async function fetchAbstracts(pmids: string[]): Promise<PubMedAbstract[]> {
  if (pmids.length === 0) return [];

  const params = buildParams({
    db: "pubmed",
    id: pmids.join(","),
    retmode: "xml",
    rettype: "abstract",
  });

  const res = await fetchWithRetry(`${EUTILS_BASE}/efetch.fcgi?${params}`);
  if (!res.ok) throw new Error(`PubMed fetch failed: ${res.status}`);

  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);

  const articles = Array.isArray(parsed.PubmedArticleSet?.PubmedArticle)
    ? parsed.PubmedArticleSet.PubmedArticle
    : parsed.PubmedArticleSet?.PubmedArticle
      ? [parsed.PubmedArticleSet.PubmedArticle]
      : [];

  return articles.map((article: any) => {
    const medline = article.MedlineCitation;
    const articleData = medline?.Article;
    const pmid = String(medline?.PMID?.["#text"] ?? medline?.PMID ?? "");

    const authorList = articleData?.AuthorList?.Author;
    const authors = Array.isArray(authorList)
      ? authorList.map((a: any) => `${a.ForeName ?? ""} ${a.LastName ?? ""}`.trim())
      : [];

    const abstractTexts = articleData?.Abstract?.AbstractText;
    let abstract = "";
    if (typeof abstractTexts === "string") {
      abstract = abstractTexts;
    } else if (Array.isArray(abstractTexts)) {
      abstract = abstractTexts.map((t: any) => (typeof t === "string" ? t : t["#text"] ?? "")).join(" ");
    } else if (abstractTexts?.["#text"]) {
      abstract = abstractTexts["#text"];
    }

    const articleIds = article.PubmedData?.ArticleIdList?.ArticleId;
    const idList = Array.isArray(articleIds) ? articleIds : articleIds ? [articleIds] : [];
    const doi = idList.find((id: any) => id["@_IdType"] === "doi")?.["#text"];
    const pmcId = idList.find((id: any) => id["@_IdType"] === "pmc")?.["#text"];

    const pubDate = articleData?.Journal?.JournalIssue?.PubDate;
    const publishedDate = pubDate
      ? `${pubDate.Year ?? ""}-${pubDate.Month ?? "01"}-${pubDate.Day ?? "01"}`
      : "";

    return {
      pmid,
      title: articleData?.ArticleTitle ?? "",
      abstract,
      authors,
      journal: articleData?.Journal?.Title ?? "",
      publishedDate,
      doi,
      pmcId,
    };
  });
}

export async function fetchPmcFullText(pmcId: string): Promise<PaperFullText | null> {
  const url = `https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/${pmcId}/unicode`;

  const res = await fetchWithRetry(url);
  if (!res.ok) return null;

  try {
    const data = await res.json();
    const documents = data.documents ?? [];
    if (documents.length === 0) return null;

    const doc = documents[0];
    const passages = doc.passages ?? [];

    let abstract = "";
    const sections: PaperSection[] = [];
    let currentSection = "";
    let currentContent: string[] = [];
    const authors: string[] = [];
    let title = "";

    for (const passage of passages) {
      const infons = passage.infons ?? {};
      const sectionType = infons.section_type ?? infons.type ?? "";
      const text = passage.text ?? "";

      if (sectionType === "TITLE" || infons.type === "title") {
        title = text;
        continue;
      }

      if (sectionType === "ABSTRACT" || infons.type === "abstract") {
        abstract += (abstract ? " " : "") + text;
        continue;
      }

      const heading = infons.section ?? sectionType;
      if (heading !== currentSection && currentContent.length > 0) {
        sections.push({ heading: currentSection, content: currentContent.join(" ") });
        currentContent = [];
      }
      currentSection = heading;
      currentContent.push(text);
    }

    if (currentContent.length > 0) {
      sections.push({ heading: currentSection, content: currentContent.join(" ") });
    }

    return {
      title,
      authors,
      abstract,
      sections,
      pmid: pmcId.replace("PMC", ""),
      fetchTier: "PMC_OA",
    };
  } catch {
    return null;
  }
}
