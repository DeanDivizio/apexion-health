const UNPAYWALL_BASE = "https://api.unpaywall.org/v2";
const EMAIL = "admin@apexionhealth.com";

export interface UnpaywallResult {
  doi: string;
  title: string;
  pdfUrl: string | null;
  landingPageUrl: string | null;
  oaStatus: string;
  journal: string;
}

export async function findOpenAccessCopy(doi: string): Promise<UnpaywallResult | null> {
  const url = `${UNPAYWALL_BASE}/${encodeURIComponent(doi)}?email=${EMAIL}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  try {
    const data = await res.json();
    const bestOa = data.best_oa_location;

    return {
      doi: data.doi,
      title: data.title ?? "",
      pdfUrl: bestOa?.url_for_pdf ?? null,
      landingPageUrl: bestOa?.url_for_landing_page ?? null,
      oaStatus: data.oa_status ?? "closed",
      journal: data.journal_name ?? "",
    };
  } catch {
    return null;
  }
}
