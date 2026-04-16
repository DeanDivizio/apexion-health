# Stage 3: UI — Upload Flow + Labs Dashboard

This stage builds the user-facing interface: the upload/review flow and the labs dashboard with report list, report detail, and marker trend charts. **This is a desktop-first design** — unlike most of the app which is mobile-optimized.

## Prerequisites

- Stage 1 complete: Prisma models, seed data, dead code removed, nav wired
- Stage 2 complete: all backend functions available (`extractLabReportAction`, `confirmLabReportAction`, `listLabReportsAction`, `getLabReportAction`, `getMarkerHistoryAction`, `deleteLabReportAction`)
- `lib/labs/client/fileEncryption.ts` available for client-side encryption

## Key Design Principles

1. **Desktop-first layout.** Use multi-column grid layouts at `md`+ breakpoints, collapsing to stacked on mobile. Trend charts should be wide and horizontal. Report detail should use full-width data tables, not accordion/card patterns.
2. **Reuse existing UI primitives.** The app uses shadcn-style components in `components/ui_primitives/` (Card, Button, Sheet, Dialog, Select, Table, etc.) and Recharts via `components/ui_primitives/chart.tsx`.
3. **Server Components where possible.** The page itself (`app/labs/page.tsx`) should be a Server Component that fetches data. Client Components for interactive parts (upload, chart interactions).
4. **Existing chart patterns.** See `components/charts/AreaChart.tsx` and `components/charts/InteractiveAreaChart.tsx` for Recharts usage patterns in the codebase.

## 1. Page — `app/labs/page.tsx`

Replace the current placeholder entirely. This is a **Server Component**.

### Data Fetching

```typescript
import { listLabReportsAction } from "@/actions/labs";
```

Fetch the reports list server-side. Pass data to the client `LabsDashboard` component.

### Layout

```tsx
<main className="flex flex-col items-start pb-12 px-4 md:px-8 xl:px-16">
  <header>...</header>
  <LabsDashboard reports={reports} />
</main>
```

The page should have a heading ("Lab Results" or similar) and an "Upload Report" button in the header area.

## 2. Dashboard Orchestrator — `components/labs/LabsDashboard.tsx`

**Client Component** (`"use client"`). Manages the dashboard state: which view is active, which report is selected, upload modal state.

### Desktop Layout (md+)

Two-column grid:
- **Left sidebar** (~320px or `w-80`): scrollable list of reports (cards/rows)
- **Main content area** (remaining width): shows either:
  - Report detail (when a report is selected)
  - Marker trend chart (when a marker is selected from trend view)
  - Upload flow (when upload is active)
  - Empty state with prompt to upload first report

### Mobile Layout (<md)

Stacked: report list at top, selected content below. Or tab-based navigation between "Reports" and "Trends" views.

### State

- `selectedReportId: string | null`
- `selectedMarkerKey: string | null`
- `isUploading: boolean`
- `activeView: "report" | "trends"`

## 3. Report List — `components/labs/LabReportCard.tsx`

Renders a single report in the sidebar list.

### Content

- Report date (formatted nicely, e.g. "Mar 15, 2026")
- Institution name (if available)
- Provider name (if available)
- Result count (e.g. "42 markers")
- File storage indicator icon (if `originalFileUrl` is set)
- Visual highlight when selected

### Interaction

Click selects the report and displays `LabReportDetail` in the main content area.

## 4. Report Detail — `components/labs/LabReportDetail.tsx`

Full report view displayed in the main content area when a report is selected.

### Header

- Report date, draw time (if available)
- Institution, provider name
- "Download Original" button (if file is stored; prompts for password if encrypted)
- "Delete Report" button with confirmation dialog

### Results Table

**Full-width data table**, not cards or accordions. Columns:

| Panel | Marker | Value | Unit | Range | Flag |
|-------|--------|-------|------|-------|------|

- **Panel column**: group results by their `LabPanel` memberships. A marker appearing in multiple panels shows under each panel group.
- **Marker column**: canonical name. Tooltip or secondary text showing the raw name if it differs.
- **Value column**: the numeric value. If `normalizedValue` exists and differs from `value`, show a small indicator (e.g. tooltip: "Normalized from 5.2 mmol/L").
- **Range column**: `rangeLow - rangeHigh` (from the report, not defaults).
- **Flag column**: color-coded badge. Red for "H", blue/orange for "L", nothing for normal.

Panel sections can sit **side-by-side** at wide desktop widths (e.g. 2-column grid of panel tables when viewport is very wide).

### Interaction

Clicking a marker name in the table should navigate to the trend view for that marker.

## 5. Marker Trend Chart — `components/labs/MarkerTrendChart.tsx`

Trend chart for a single marker over time. Displayed in the main content area.

### Data

Call `getMarkerHistoryAction(markerKey)` to fetch all results for the selected marker. The returned array contains `{ reportDate, drawTime, value, unit, normalizedValue, normalizedUnit, rangeLow, rangeHigh, flag, institution }`.

### Chart Type

Area chart using Recharts (via `components/ui_primitives/chart.tsx` or directly with Recharts). The chart should be **wide and horizontal**, taking full advantage of the main content width.

### Chart Elements

- **X-axis**: report dates (formatted as month/year or full date depending on density)
- **Y-axis**: marker value
- **Data line/area**: the marker values over time
- **Reference range band**: shaded area between `rangeLow` and `rangeHigh` (use the range from each individual result; if ranges vary across reports, shade the most recent range)
- **Data points**: dots on the line. Color-code by flag (red for H, blue for L, default for normal)
- **Tooltips**: on hover, show date, value, unit, institution, flag

### Unit Handling

- Use `normalizedValue` / `normalizedUnit` when available.
- Fall back to raw `value` / `unit` when no normalization exists.
- If a result has a different unit AND no normalization (missing conversion), show it on the chart with a distinct visual indicator (e.g. different point shape, dashed connection line) and a tooltip explaining the unit mismatch. Do not silently plot incompatible units on the same scale.

### Header

- Marker canonical name as title
- Unit label on Y-axis
- Marker selector: searchable dropdown/combobox to switch between markers. Use `listMarkers` data from the service layer (can be fetched once and cached client-side).

## 6. Upload Flow — `components/labs/LabReportUploader.tsx`

**Client Component.** Triggered by an "Upload Report" button on the dashboard. Opens as a full-width panel within the main content area (not a separate route, not a small modal — it needs room for the results table).

### Step 1: File Selection

- Drag-and-drop zone + click-to-browse
- Accept: `image/*,.pdf`
- On file select: read as base64, call `extractLabReportAction(base64, mimeType)`
- Show loading state during OCR (may take 5-15 seconds for multi-page PDFs). Consider a progress indicator or pulsing skeleton.

### Step 2: Review Screen

Displayed after OCR completes. Two main sections:

#### Report Metadata (editable)

Pre-filled from OCR output, user can correct:
- Report date (date picker)
- Draw time (time input, optional)
- Institution (text input)
- Provider name (text input)
- Notes (textarea, optional)

#### Matched Results Table

| Raw Name | Mapped To | Value | Unit | Range | Flag | |
|----------|-----------|-------|------|-------|------|-|
| HEMOGLOBIN A1C | Hemoglobin A1c | 5.4 | % | 4.0-5.6 | | Edit |

- Shows rawName from OCR -> canonical marker name it resolved to
- Value, unit, range, flag are **editable** (user can correct OCR misreads)
- Each row has an edit toggle or inline editing

#### Unmatched Results Section

For each unmatched result:
- Raw name + value + unit + range + flag displayed
- **Searchable dropdown** of existing markers to map to (search by canonical name)
- "Skip" option to exclude this result from the saved report
- When a user maps an unmatched name to a marker, this creates a new alias on save (source: `manual`)

#### File Storage Options

Below the results:
- **"Store original file" toggle** (default off)
- When enabled, reveals: **"Password-protect file" toggle** (default off)
- When password protection is enabled, shows:
  - Password input field
  - Confirm password input field
  - Warning text: "This password encrypts your file client-side. If forgotten, the file cannot be recovered. We cannot reset it for you."

### Step 3: Confirm

"Confirm & Save" button behavior:
1. **Storage off**: call `confirmLabReportAction` without file data.
2. **Storage on, encryption off**: encode the raw file as base64, call `confirmLabReportAction` with `file: { base64, fileName, mimeType, encrypted: false }`.
3. **Storage on, encryption on**: encrypt the file client-side using the password via `encryptFile()` from `lib/labs/client/fileEncryption.ts`, encode the encrypted result as base64, call `confirmLabReportAction` with `file: { base64, fileName, mimeType, encrypted: true }`.

On success: close the upload panel, refresh the reports list, select the newly created report.

"Cancel" button: discard the preview. Since nothing was persisted (no Supabase upload, no DB rows), cancel is a clean discard with zero orphans.

## 7. File Download (from Report Detail)

When a report has a stored file:
- Show a "View Original" or "Download Original" button in the report detail header
- If `fileEncrypted` is true: prompt for password, download the encrypted blob, decrypt client-side using `decryptFile()`, then display/download the decrypted file
- If `fileEncrypted` is false: download and display directly
- Handle wrong password gracefully (the `SubtleCrypto.decrypt` call will throw; show a user-friendly error)

## 8. Empty States

- **No reports yet**: centered message with an upload prompt. "Upload your first blood test report to get started." with a prominent upload button.
- **No results for a marker**: message in the trend chart area. "No results found for this marker."
- **Unmatched results all skipped**: if user skips all unmatched items, that's fine — only matched results are saved.

## 9. File Structure Summary

```
app/
  labs/
    page.tsx                          -- Server Component (data fetch + layout)

components/
  labs/
    LabsDashboard.tsx                 -- Client Component (orchestrator, layout, state)
    LabReportCard.tsx                 -- Report card for sidebar list
    LabReportDetail.tsx               -- Full report view with results table
    MarkerTrendChart.tsx              -- Trend chart for a single marker
    LabReportUploader.tsx             -- Upload + review + confirm flow
```

## 10. Verification Checklist

- [ ] `app/labs/page.tsx` renders as a Server Component, fetches reports
- [ ] Dashboard shows desktop two-column layout at `md`+ breakpoints
- [ ] Dashboard collapses to stacked layout on mobile
- [ ] Report list displays cards with date, institution, result count
- [ ] Clicking a report shows the detail view with results grouped by panel
- [ ] Results table shows value, unit, range, and color-coded flags
- [ ] Marker trend chart renders with Recharts, shows reference range band
- [ ] Trend chart handles unit normalization (uses normalized values when available)
- [ ] Upload flow: file selection, OCR loading state, review screen all work
- [ ] Review screen: matched results are editable, unmatched results have marker search dropdown
- [ ] File storage toggle works: off (no file sent), on without encryption (raw file sent), on with encryption (encrypted file sent)
- [ ] Password warning is displayed when encryption is toggled on
- [ ] Confirm saves report + results to DB, new aliases are created for resolved unmatched items
- [ ] Cancel discards cleanly with no orphans
- [ ] Delete report removes DB rows and Supabase file (if stored)
- [ ] Download original works for both encrypted and unencrypted files
- [ ] Empty states render appropriately
- [ ] `npx tsc --noEmit` passes
- [ ] `npx next build` succeeds
