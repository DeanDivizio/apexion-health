import { PDFParse } from "pdf-parse";
import type { ParsedArtifactResult } from "@/lib/nutrition/ingestion/types";
import { mapTabularRecordToCandidate } from "@/lib/nutrition/ingestion/parsers/common";

function splitTableLine(line: string): string[] {
  const byPipe = line.split("|").map((part) => part.trim()).filter(Boolean);
  if (byPipe.length >= 2) return byPipe;

  const byTabs = line.split("\t").map((part) => part.trim()).filter(Boolean);
  if (byTabs.length >= 2) return byTabs;

  return line.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
}

function buildRecordsFromPdfText(text: string): Record<string, unknown>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let headerColumns: string[] | null = null;
  const records: Record<string, unknown>[] = [];

  for (const line of lines) {
    const columns = splitTableLine(line);
    if (columns.length < 3) continue;

    if (!headerColumns) {
      const joined = columns.join(" ").toLowerCase();
      const looksLikeHeader =
        (joined.includes("calories") || joined.includes("cal")) &&
        (joined.includes("protein") || joined.includes("fat") || joined.includes("carb"));
      if (looksLikeHeader) {
        headerColumns = columns;
      }
      continue;
    }

    // Stop when we hit another obvious section header.
    const allWords = columns.every((col) => /^[a-zA-Z\s]+$/.test(col));
    if (allWords && columns.length <= 2) continue;

    const record: Record<string, unknown> = {};
    for (let i = 0; i < headerColumns.length; i += 1) {
      record[headerColumns[i]] = columns[i] ?? "";
    }
    records.push(record);
  }

  return records;
}

export async function parsePdfArtifact(body: Uint8Array): Promise<ParsedArtifactResult> {
  const parser = new PDFParse({ data: body });
  try {
    const parsed = await parser.getText();
    const records = buildRecordsFromPdfText(parsed.text ?? "");
    const items = records
      .map((record) => mapTabularRecordToCandidate(record, "pdf_table_parser"))
      .filter((row): row is NonNullable<typeof row> => Boolean(row));

    const warnings =
      items.length === 0
        ? [
            {
              code: "pdf_table_no_items",
              message:
                "PDF table parser did not extract any valid menu rows. Consider OCR fallback.",
            },
          ]
        : [];

    return {
      extractionMethod: "pdf_table_parser",
      items,
      warnings,
    };
  } finally {
    await parser.destroy();
  }
}
