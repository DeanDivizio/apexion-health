import { z } from "zod";
import { extractStructuredData } from "@/lib/ocr/extractStructuredData";

const labResultItemSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  rangeLow: z.number().nullable(),
  rangeHigh: z.number().nullable(),
  flag: z.enum(["H", "L"]).nullable(),
});

const labReportExtractionSchema = z.object({
  reportDate: z.string(),
  drawTime: z.string().nullable(),
  institution: z.string().nullable(),
  providerName: z.string().nullable(),
  results: z.array(labResultItemSchema),
});

export type LabReportExtraction = z.infer<typeof labReportExtractionSchema>;
export type LabResultItem = z.infer<typeof labResultItemSchema>;

const SYSTEM_PROMPT = `You are a clinical lab report data extractor. Given an image or PDF of a blood test / lab report, extract ALL visible test results into structured JSON.

Rules:
- Extract EVERY marker visible on the report. Do not skip any.
- Return the marker "name" exactly as printed on the report. Do not normalize, abbreviate, or rename. Alias resolution happens separately.
- "value" must be numeric. Skip qualitative-only results (e.g. "Reactive", "Non-Reactive", "Positive", "Negative"). These are not supported yet.
- "rangeLow" and "rangeHigh": extract the reference range as printed. If the range is shown as "65-99", then rangeLow is 65 and rangeHigh is 99. If only one bound is shown (e.g. "<200"), set rangeLow to null and rangeHigh to 200. If ">10", set rangeLow to 10 and rangeHigh to null.
- "flag": "H" if the result is flagged high, "L" if flagged low, null if within range or no flag is shown.
- For multi-page reports, extract markers from ALL pages.
- If the same marker appears twice (e.g. fasting and non-fasting glucose), include both with their exact names as printed.
- "reportDate": extract as ISO date YYYY-MM-DD. Look for "Date Collected", "Collection Date", "Specimen Date", "Date Reported", or similar.
- "drawTime": extract as HH:MM (24-hour format) if visible on the report (e.g. "Time Collected: 08:30"). Return null if not shown.
- "institution": the processing laboratory (e.g. "Quest Diagnostics", "LabCorp"). Return null if not visible.
- "providerName": the ordering physician/provider (e.g. "Dr. Smith"). Return null if not visible.
- "unit": use the unit exactly as printed on the report (mg/dL, g/dL, mIU/L, etc.). Do not convert units.
- Do not invent or estimate values. Only extract what is explicitly printed.
- If a value contains "<" or ">" (e.g. "<0.5"), use the numeric part (0.5) as the value.

Return ONLY valid JSON matching this shape:
{
  "reportDate": "YYYY-MM-DD",
  "drawTime": "HH:MM" | null,
  "institution": "string" | null,
  "providerName": "string" | null,
  "results": [
    { "name": "string", "value": number, "unit": "string", "rangeLow": number | null, "rangeHigh": number | null, "flag": "H" | "L" | null }
  ]
}`;

export async function extractLabReport(
  image: string,
  posthogDistinctId?: string,
): Promise<LabReportExtraction> {
  return extractStructuredData({
    image,
    systemPrompt: SYSTEM_PROMPT,
    responseSchema: labReportExtractionSchema,
    posthogDistinctId,
  });
}
