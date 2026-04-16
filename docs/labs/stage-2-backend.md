# Stage 2: Backend — OCR Pipeline, Service Layer, Actions, Encryption Utilities

This stage builds all server-side logic: the OCR extraction pipeline, alias resolution, unit normalization, Supabase file storage, client-side encryption utilities, the service layer, Zod schemas, and server actions. Everything is testable independently of the UI.

## Prerequisites

- Stage 1 complete: all Prisma models migrated, seed data populated, dead code removed
- `OPENAI_API_KEY` environment variable set
- Supabase project accessible with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set
- `lab-reports` bucket created in Supabase Storage (private, non-public access)

## 1. OCR Extraction — `lib/labs/ocr/extractLabReport.ts`

Follow the pattern of `lib/ocr/extractNutritionLabel.ts`. This file defines:

### Zod Response Schema

```typescript
import { z } from "zod";

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
```

### System Prompt

The system prompt must be detailed (similar to the ~30-line nutrition label prompt). Key instructions to include:

- You are a clinical lab report data extractor. Given an image or PDF of a blood test / lab report, extract ALL visible test results into structured JSON.
- Extract EVERY marker visible on the report. Do not skip any.
- Return the marker `name` exactly as printed on the report. Do not normalize, abbreviate, or rename. Alias resolution happens separately.
- `value` must be numeric. Skip qualitative-only results (e.g. "Reactive", "Non-Reactive", "Positive", "Negative"). These are not supported yet.
- `rangeLow` and `rangeHigh`: extract the reference range as printed. If the range is shown as `65-99`, then `rangeLow` is 65 and `rangeHigh` is 99. If only one bound is shown (e.g. `<200`), set the other to null.
- `flag`: `"H"` if the result is flagged high, `"L"` if flagged low, `null` if within range or no flag is shown.
- For multi-page reports, extract markers from ALL pages.
- If the same marker appears twice (e.g. fasting and non-fasting glucose), include both with their exact names as printed.
- `reportDate`: extract as ISO date `YYYY-MM-DD`. Look for "Date Collected", "Collection Date", "Specimen Date", or similar.
- `drawTime`: extract as `HH:MM` (24-hour) if visible on the report (e.g. "Time Collected: 08:30"). Return null if not shown.
- `institution`: the processing laboratory (e.g. "Quest Diagnostics", "LabCorp"). Return null if not visible.
- `providerName`: the ordering physician/provider. Return null if not visible.
- `unit`: use the unit exactly as printed on the report (mg/dL, g/dL, mIU/L, etc.). Do not convert units.
- Return ONLY valid JSON matching the described shape.

### Export Function

```typescript
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
```

Import `extractStructuredData` from `@/lib/ocr/extractStructuredData`. It already handles images, PDFs, base64, URLs, retries, and Zod validation.

## 2. Alias Resolver — `lib/labs/server/aliasResolver.ts`

Resolves raw extracted marker names against the `LabMarkerAlias` table.

### Interface

```typescript
export interface ResolvedResult {
  raw: LabResultItem;          // the original OCR-extracted item
  markerId: string;
  markerKey: string;
  canonicalName: string;
  canonicalUnit: string;
}

export interface AliasResolutionResult {
  matched: ResolvedResult[];
  unmatched: LabResultItem[];  // items with no alias match
}
```

### Logic

1. Fetch all aliases from `LabMarkerAlias` (joined to `LabMarker` for key/canonicalName/unit). This table is small enough to load in one query.
2. Build a lookup `Map<string, { markerId, markerKey, canonicalName, unit }>` keyed by alias.
3. For each extracted result:
   - Normalize the name: `name.toLowerCase().trim().replace(/\s+/g, " ")`
   - Look up in the map
   - If found: add to `matched` with marker details
   - If not found: add to `unmatched`
4. Return `{ matched, unmatched }`

The canonical name is included as an alias in the seed (Stage 1), so the lookup map covers both alternate names and canonical names in one pass.

### Creating New Aliases (user resolution)

When a user maps an unmatched name to an existing marker during the review step, create a new `LabMarkerAlias` with:
- `alias`: the normalized raw name
- `markerId`: the marker the user selected
- `source`: `manual`

This ensures the same name auto-resolves on future uploads. This creation happens in the service layer (see section 4), called from the `confirmLabReportAction`.

## 3. File Storage — `lib/labs/server/labReportStorage.ts`

Follow the pattern of `lib/nutrition/server/sourceStorageService.ts`.

### Functions

```typescript
export async function uploadLabReportFile(params: {
  userId: string;
  reportId: string;
  fileName: string;
  mimeType: string;
  body: Uint8Array;
}): Promise<string>  // returns the storage path / URL

export async function downloadLabReportFile(
  userId: string,
  reportId: string,
  fileName: string,
): Promise<Uint8Array>

export async function deleteLabReportFile(
  userId: string,
  reportId: string,
  fileName: string,
): Promise<void>
```

### Storage Path

`{userId}/{reportId}/{fileName}`

### Bucket

Use environment variable `SUPABASE_LAB_REPORTS_BUCKET` with fallback `"lab-reports"`.

The bucket must be created in Supabase with **private** access. Files are only accessed through the app (download function returns raw bytes; client handles decryption if needed).

## 4. Client-Side Encryption — `lib/labs/client/fileEncryption.ts`

**This file is client-side only.** It must not be imported by any server code. Use the `"use client"` directive or ensure it's only imported in client components.

Uses the Web Crypto API (`SubtleCrypto`) — no external dependencies.

### Functions

```typescript
export async function encryptFile(
  fileBuffer: ArrayBuffer,
  password: string,
): Promise<ArrayBuffer>

export async function decryptFile(
  encryptedBuffer: ArrayBuffer,
  password: string,
): Promise<ArrayBuffer>
```

### Implementation Details

- **Key derivation:** PBKDF2 with 100,000 iterations, SHA-256 hash.
- **Encryption:** AES-256-GCM.
- **Salt:** 16 bytes, randomly generated per encryption.
- **IV:** 12 bytes, randomly generated per encryption.
- **Output format:** `[16-byte salt][12-byte IV][ciphertext]` — prepend salt and IV to the encrypted data so decryption can extract them.
- **Decryption:** Read first 16 bytes as salt, next 12 as IV, remainder as ciphertext. Derive the same key from salt + password, decrypt.

This is approximately 40-50 lines of code. No error wrapping beyond what `SubtleCrypto` throws natively (wrong password will throw a `DOMException` from `decrypt`).

## 5. Schemas — `lib/labs/schemas.ts`

Zod schemas for all service/action inputs. Follow the user rule: use `z.email()` not `z.string().email()` (though unlikely to need email here).

### Key Schemas

```typescript
import { z } from "zod";

export const labResultItemInputSchema = z.object({
  markerId: z.string().uuid(),
  value: z.number(),
  unit: z.string(),
  rangeLow: z.number().nullable().optional(),
  rangeHigh: z.number().nullable().optional(),
  flag: z.enum(["H", "L"]).nullable().optional(),
  rawName: z.string(),
});

export const confirmLabReportInputSchema = z.object({
  reportDate: z.string(),
  drawTime: z.string().nullable().optional(),
  institution: z.string().nullable().optional(),
  providerName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  results: z.array(labResultItemInputSchema),
  newAliases: z.array(z.object({
    rawName: z.string(),
    markerId: z.string().uuid(),
  })).optional(),
  file: z.object({
    base64: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    encrypted: z.boolean(),
  }).nullable().optional(),
});

export type ConfirmLabReportInput = z.infer<typeof confirmLabReportInputSchema>;
```

## 6. Types — `lib/labs/types.ts`

View types for the UI layer. Define interfaces for what the service returns to the UI:

- `LabReportView` — report metadata + result count + whether file is stored
- `LabReportDetailView` — report + full results array (each with marker info + panel memberships)
- `LabResultView` — single result with marker canonical name, value, unit, normalized value, range, flag
- `MarkerHistoryPoint` — `{ reportDate, drawTime, value, unit, normalizedValue, normalizedUnit, rangeLow, rangeHigh, flag, institution }`
- `MarkerCatalogView` — marker info for dropdowns/search
- `AliasResolutionResult` — re-export from aliasResolver or define here

## 7. Service Layer — `lib/labs/server/labService.ts`

Follow the pattern of `lib/medication/server/medicationService.ts`. Use `prisma` from `@/lib/db/prisma`. Use `cacheTag` and `cacheLife` from `next/cache` on read functions.

### Cache Tags

- Read queries: `cacheTag(\`labs-${userId}\`)`
- Marker history: `cacheTag(\`labs-${userId}\`, \`lab-marker-${userId}-${markerKey}\`)`
- After mutations: `updateTag(\`labs-${userId}\`)` (and the marker-specific tag where applicable)

### Functions

#### `createLabReport(userId, input: ConfirmLabReportInput)`

In a `prisma.$transaction`:
1. Create the `LabReport` row (report metadata).
2. For each result in `input.results`:
   - Look up `LabUnitConversion` for the marker if `unit` differs from `LabMarker.unit`.
   - If conversion exists: `normalizedValue = value * factor`, `normalizedUnit = toUnit`.
   - If no conversion: `normalizedValue = null`, `normalizedUnit = null`.
   - Create the `LabResult` row.
3. For each entry in `input.newAliases`:
   - Normalize the raw name (lowercase, trim, collapse whitespace).
   - Upsert into `LabMarkerAlias` with source `manual`.
4. If `input.file` is present:
   - Decode the base64 to `Uint8Array`.
   - Call `uploadLabReportFile(...)`.
   - Update the `LabReport` with `originalFileUrl`, `originalFileName`, `originalFileMimeType`, `fileEncrypted`.
5. Call `updateTag(\`labs-${userId}\`)`.
6. Return the created report ID.

#### `listLabReports(userId, opts?)`

Query `LabReport` where `userId` matches, ordered by `reportDate` desc. Include `_count: { results: true }` for result count. Paginate if `opts` provides limit/offset.

#### `getLabReport(userId, reportId)`

Fetch the report with all results, each joined to its `LabMarker` (with `panelLinks -> panel`). Verify `userId` matches. Group results by panel for the view.

#### `getMarkerHistory(userId, markerKey, opts?)`

Query `LabResult` joined through `LabReport` (where `report.userId = userId`) and `LabMarker` (where `marker.key = markerKey`). Order by `report.reportDate` asc. Return array of `MarkerHistoryPoint`.

#### `listMarkers(opts?)`

Query `LabMarker` where `active = true`. If `opts.search` provided, filter by `canonicalName` contains (case-insensitive). Include panel memberships. For the marker search dropdown in the UI.

#### `createMarkerAlias(markerId, alias, source)`

Normalize `alias`, upsert into `LabMarkerAlias`.

#### `deleteLabReport(userId, reportId)`

1. Fetch the report, verify `userId` matches.
2. If `originalFileUrl` is set, call `deleteLabReportFile(...)` to remove from Supabase Storage.
3. Delete the `LabReport` row (cascade deletes results).
4. Call `updateTag(\`labs-${userId}\`)`.

#### `normalizeResultValue(markerId, value, unit)`

Look up `LabUnitConversion` where `markerId` and `fromUnit = unit`. If found, return `{ normalizedValue: value * factor, normalizedUnit: toUnit }`. If not, return null.

## 8. Server Actions — `actions/labs.ts`

Follow the pattern of `actions/medication.ts`. All actions start with Clerk `auth()` to get `userId`.

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { updateTag } from "next/cache";
```

### Actions

#### `extractLabReportAction(fileBase64: string, mimeType: string)`

1. Require userId via `auth()`.
2. Call `extractLabReport(fileBase64, userId)` to run OCR.
3. Call `resolveAliases(extraction.results)` to match names to markers.
4. Return `{ extractedReport: extraction, matched, unmatched }`.
5. **Nothing is persisted.** The file stays in browser memory. This is a preview step only.

#### `confirmLabReportAction(input: unknown)`

1. Require userId.
2. Parse with `confirmLabReportInputSchema`.
3. Call `createLabReport(userId, parsed)`.
4. Return the new report ID.

#### `listLabReportsAction()`

1. Require userId.
2. Call `listLabReports(userId)`.

#### `getLabReportAction(reportId: string)`

1. Require userId.
2. Call `getLabReport(userId, reportId)`.

#### `getMarkerHistoryAction(markerKey: string)`

1. Require userId.
2. Call `getMarkerHistory(userId, markerKey)`.

#### `deleteLabReportAction(reportId: string)`

1. Require userId.
2. Call `deleteLabReport(userId, reportId)`.
3. Call `updateTag(\`labs-${userId}\`)`.

#### `resolveMarkerAliasAction(rawName: string, markerId: string)`

1. Require userId.
2. Call `createMarkerAlias(markerId, rawName, "manual")`.

## 9. Verification Checklist

Before moving to Stage 3, confirm:

- [ ] `lib/labs/ocr/extractLabReport.ts` compiles and exports `extractLabReport`
- [ ] `lib/labs/server/aliasResolver.ts` compiles and exports `resolveAliases`
- [ ] `lib/labs/server/labReportStorage.ts` compiles; `lab-reports` bucket exists in Supabase
- [ ] `lib/labs/client/fileEncryption.ts` compiles; `encryptFile`/`decryptFile` exported
- [ ] `lib/labs/schemas.ts` and `lib/labs/types.ts` compile
- [ ] `lib/labs/server/labService.ts` compiles; all functions exported
- [ ] `actions/labs.ts` compiles; all actions exported
- [ ] `npx tsc --noEmit` passes
- [ ] (Optional) Test OCR extraction against a sample lab report PDF to verify the system prompt produces usable output
- [ ] (Optional) Test encryption round-trip: encrypt a small buffer, decrypt it, verify equality
