import { fetchPaperByPmid } from "../sources/semanticScholarService";
import { throttleS2 } from "./rateLimiter";
import type { PaperToIngest } from "./types";

export async function resolveMissingDois(
  papers: PaperToIngest[],
): Promise<PaperToIngest[]> {
  const resolved: PaperToIngest[] = [];
  let lookups = 0;

  for (const paper of papers) {
    if (paper.doi) {
      resolved.push(paper);
      continue;
    }

    if (!paper.pmid) {
      resolved.push(paper);
      continue;
    }

    try {
      await throttleS2();
      const s2 = await fetchPaperByPmid(paper.pmid);
      if (s2?.doi) {
        console.log(
          `[doi-resolve] PMID ${paper.pmid} → DOI ${s2.doi}`,
        );
        resolved.push({ ...paper, doi: s2.doi });
        lookups++;
      } else {
        resolved.push(paper);
      }
    } catch {
      resolved.push(paper);
    }
  }

  if (lookups > 0) {
    console.log(`[doi-resolve] Resolved ${lookups}/${papers.length} missing DOIs`);
  }

  return resolved;
}
