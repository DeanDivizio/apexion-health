import type { ExtractedRelationship } from "../types";

export interface MergedRelationship extends ExtractedRelationship {
  observationCount: number;
}

/**
 * Groups relationships by (subject, predicate, object) and merges duplicates.
 * Confidence is merged using Bayesian combination: 1 - product(1 - c_i).
 * The context from the highest-confidence observation is kept.
 */
export function deduplicateRelationships(
  relationships: ExtractedRelationship[],
): MergedRelationship[] {
  const groups = new Map<string, ExtractedRelationship[]>();

  for (const rel of relationships) {
    const key = `${rel.subject}|${rel.predicate}|${rel.object}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(rel);
    } else {
      groups.set(key, [rel]);
    }
  }

  const merged: MergedRelationship[] = [];

  for (const group of groups.values()) {
    const mergedConfidence = bayesianMerge(group.map((r) => r.confidence));

    let bestContext = group[0].context;
    let bestConfidence = group[0].confidence;
    for (const r of group) {
      if (r.confidence > bestConfidence) {
        bestConfidence = r.confidence;
        bestContext = r.context;
      }
    }

    merged.push({
      subject: group[0].subject,
      predicate: group[0].predicate,
      object: group[0].object,
      confidence: mergedConfidence,
      context: bestContext,
      observationCount: group.length,
    });
  }

  return merged;
}

function bayesianMerge(confidences: number[]): number {
  if (confidences.length === 0) return 0;
  if (confidences.length === 1) return confidences[0];

  const product = confidences.reduce(
    (acc, c) => acc * (1 - Math.min(c, 0.999)),
    1,
  );
  return Math.round((1 - product) * 1000) / 1000;
}
