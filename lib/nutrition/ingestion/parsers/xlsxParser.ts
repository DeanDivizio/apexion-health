import * as XLSX from "xlsx";
import type { ParsedArtifactResult } from "@/lib/nutrition/ingestion/types";
import { mapTabularRecordToCandidate } from "@/lib/nutrition/ingestion/parsers/common";

export function parseXlsxArtifact(body: Uint8Array): ParsedArtifactResult {
  const workbook = XLSX.read(Buffer.from(body), { type: "buffer" });
  const items: ParsedArtifactResult["items"] = [];
  const warnings: ParsedArtifactResult["warnings"] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: true,
    });

    for (const row of rows) {
      const mapped = mapTabularRecordToCandidate(row, "xlsx_parser");
      if (mapped) items.push(mapped);
    }
  }

  if (items.length === 0) {
    warnings.push({
      code: "xlsx_no_items",
      message: "XLSX parser did not extract any valid rows from workbook sheets.",
    });
  }

  return {
    extractionMethod: "xlsx_parser",
    items,
    warnings,
  };
}
