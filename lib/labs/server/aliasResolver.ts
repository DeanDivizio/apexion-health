import { prisma } from "@/lib/db/prisma";
import type { LabResultItem } from "@/lib/labs/ocr/extractLabReport";

export interface ResolvedResult {
  raw: LabResultItem;
  markerId: string;
  markerKey: string;
  canonicalName: string;
  canonicalUnit: string;
}

export interface AliasResolutionResult {
  matched: ResolvedResult[];
  unmatched: LabResultItem[];
}

function normalizeAliasName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export async function resolveAliases(
  results: LabResultItem[],
): Promise<AliasResolutionResult> {
  const aliases = await prisma.labMarkerAlias.findMany({
    include: {
      marker: {
        select: {
          id: true,
          key: true,
          canonicalName: true,
          unit: true,
        },
      },
    },
  });

  const lookup = new Map<
    string,
    { markerId: string; markerKey: string; canonicalName: string; unit: string }
  >();
  for (const a of aliases) {
    lookup.set(a.alias, {
      markerId: a.marker.id,
      markerKey: a.marker.key,
      canonicalName: a.marker.canonicalName,
      unit: a.marker.unit,
    });
  }

  const matched: ResolvedResult[] = [];
  const unmatched: LabResultItem[] = [];

  for (const result of results) {
    const normalized = normalizeAliasName(result.name);
    const match = lookup.get(normalized);
    if (match) {
      matched.push({
        raw: result,
        markerId: match.markerId,
        markerKey: match.markerKey,
        canonicalName: match.canonicalName,
        canonicalUnit: match.unit,
      });
    } else {
      unmatched.push(result);
    }
  }

  return { matched, unmatched };
}
