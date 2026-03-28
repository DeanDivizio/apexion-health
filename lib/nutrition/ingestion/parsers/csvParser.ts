import { parse } from "csv-parse/sync";
import type { ParsedArtifactResult } from "@/lib/nutrition/ingestion/types";
import { mapTabularRecordToCandidate } from "@/lib/nutrition/ingestion/parsers/common";

export function parseCsvArtifact(body: Uint8Array): ParsedArtifactResult {
  const text = new TextDecoder("utf-8").decode(body);
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, unknown>[];

  const items = rows
    .map((row) => mapTabularRecordToCandidate(row, "csv_parser"))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const warnings =
    items.length === 0
      ? [
          {
            code: "csv_no_items",
            message: "CSV parser did not extract any valid rows.",
          },
        ]
      : [];

  return {
    extractionMethod: "csv_parser",
    items,
    warnings,
  };
}
