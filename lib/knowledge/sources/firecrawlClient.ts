export interface FirecrawlScrapeResult {
  success: boolean;
  markdown: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
  };
}

export async function scrapeUrl(url: string): Promise<FirecrawlScrapeResult | null> {
  const apiUrl = process.env.FIRECRAWL_API_URL;
  if (!apiUrl) {
    console.warn("[firecrawl] FIRECRAWL_API_URL not set, skipping scrape");
    return null;
  }

  const endpoint = `${apiUrl.replace(/\/$/, "")}/v1/scrape`;

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        waitFor: 5000,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      success: data.success ?? false,
      markdown: data.data?.markdown ?? "",
      metadata: data.data?.metadata ?? {},
    };
  } catch {
    return null;
  }
}
