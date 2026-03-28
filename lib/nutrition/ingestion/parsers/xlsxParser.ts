import * as ExcelJS from "exceljs";
import type { ParsedArtifactResult } from "@/lib/nutrition/ingestion/types";
import { mapTabularRecordToCandidate } from "@/lib/nutrition/ingestion/parsers/common";

export async function parseXlsxArtifact(body: Uint8Array): Promise<ParsedArtifactResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(body.buffer as ArrayBuffer);

  const items: ParsedArtifactResult["items"] = [];
  const warnings: ParsedArtifactResult["warnings"] = [];

  for (const worksheet of workbook.worksheets) {
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber] = cell.text?.trim() ?? "";
    });

    for (let rowIdx = 2; rowIdx <= worksheet.rowCount; rowIdx++) {
      const row = worksheet.getRow(rowIdx);
      const record: Record<string, unknown> = {};
      let hasValue = false;

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (!header) return;
        const value = cell.value;
        record[header] = value ?? "";
        if (value != null && value !== "") hasValue = true;
      });

      if (!hasValue) continue;

      const mapped = mapTabularRecordToCandidate(record, "xlsx_parser");
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
