# Stage 1: Foundation — Data Model, Seed, Dead Code Cleanup, Nav

This stage establishes the database schema, seeds the marker catalog, removes dead code from a previous labs attempt, and wires up navigation. Nothing in this stage depends on the OCR pipeline, service layer, or UI — those come in Stages 2 and 3.

## Prerequisites

- Postgres database accessible via `DATABASE_URL`
- Prisma CLI available (`npx prisma`)
- Familiarity with the existing schema at `prisma/schema.prisma`

## 1. Prisma Schema — New Models

Add the following models to the **end** of `prisma/schema.prisma`, before any closing comments. Follow existing conventions: `uuid` PKs via `@id @default(uuid())`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, cascade deletes on child relations.

### Enum

```prisma
enum LabMarkerAliasSource {
  seed
  ocr
  manual
}
```

### LabMarker

Canonical marker catalog. Each row is a unique blood test marker (e.g. "Hemoglobin A1c").

```prisma
model LabMarker {
  id              String   @id @default(uuid())
  key             String   @unique
  canonicalName   String
  unit            String
  defaultRangeLow  Float?
  defaultRangeHigh Float?
  description     String?
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  aliases         LabMarkerAlias[]
  panelLinks      LabPanelMarker[]
  unitConversions LabUnitConversion[]
  results         LabResult[]
}
```

- `key`: unique slug like `hemoglobin-a1c`. Generated from the canonical name (lowercase, hyphenated, no special chars).
- `unit`: the canonical/preferred unit for this marker (e.g. `mg/dL`). Used as the normalization target.
- `defaultRangeLow` / `defaultRangeHigh`: standard adult reference range. Nullable because some markers (ratios, calculated values) don't have universal ranges.
- `active`: soft-delete flag. Inactive markers are hidden from UI dropdowns but historical results are preserved.

### LabPanel

Named grouping of markers.

```prisma
model LabPanel {
  id          String   @id @default(uuid())
  key         String   @unique
  displayName String
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  markerLinks LabPanelMarker[]
}
```

### LabPanelMarker

Many-to-many join. A marker like Vitamin D can belong to both "Comprehensive Metabolic Panel" and "Vitamins".

```prisma
model LabPanelMarker {
  panelId  String
  panel    LabPanel  @relation(fields: [panelId], references: [id], onDelete: Cascade)
  markerId String
  marker   LabMarker @relation(fields: [markerId], references: [id], onDelete: Cascade)

  @@id([panelId, markerId])
  @@index([markerId])
}
```

### LabMarkerAlias

Maps variant names to canonical markers. The alias column stores **normalized lowercase** text.

```prisma
model LabMarkerAlias {
  id        String               @id @default(uuid())
  markerId  String
  marker    LabMarker            @relation(fields: [markerId], references: [id], onDelete: Cascade)
  alias     String               @unique
  source    LabMarkerAliasSource
  createdAt DateTime             @default(now())

  @@index([markerId])
}
```

### LabUnitConversion

Marker-specific unit conversion factors. Factors depend on molecular weight, so they are always tied to a specific marker.

```prisma
model LabUnitConversion {
  id       String    @id @default(uuid())
  markerId String
  marker   LabMarker @relation(fields: [markerId], references: [id], onDelete: Cascade)
  fromUnit String
  toUnit   String
  factor   Float

  @@unique([markerId, fromUnit, toUnit])
  @@index([markerId])
}
```

- `factor`: multiply the original value by this to get the normalized value. E.g. glucose mg/dL -> mmol/L uses factor `0.0555`.

### LabReport

A single blood test report from one date/institution.

```prisma
model LabReport {
  id                    String    @id @default(uuid())
  userId                String
  reportDate            DateTime
  drawTime              String?
  institution           String?
  providerName          String?
  notes                 String?
  originalFileUrl       String?
  originalFileName      String?
  originalFileMimeType  String?
  fileEncrypted         Boolean   @default(false)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  results LabResult[]

  @@index([userId, reportDate])
}
```

- `drawTime`: time of the blood draw as `HH:MM` string. Nullable since not always known.
- `providerName`: the ordering physician/provider (e.g. "Dr. Smith").
- `institution`: the processing lab (e.g. "Quest Diagnostics").
- `originalFileUrl`: set only if user opted in to file storage.
- `fileEncrypted`: true if the stored file is AES-256-GCM encrypted client-side.

### LabResult

Individual marker result within a report.

```prisma
model LabResult {
  id              String    @id @default(uuid())
  reportId        String
  report          LabReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
  markerId        String
  marker          LabMarker @relation(fields: [markerId], references: [id], onDelete: Restrict)
  value           Float
  unit            String
  normalizedValue Float?
  normalizedUnit  String?
  rangeLow        Float?
  rangeHigh       Float?
  flag            String?
  rawName         String
  createdAt       DateTime  @default(now())

  @@index([reportId])
  @@index([markerId])
}
```

- `value` / `unit`: as printed on the report. Never modified.
- `normalizedValue` / `normalizedUnit`: computed on save if a `LabUnitConversion` exists from `unit` to the marker's canonical `unit`. Null if no conversion needed (units already match) or no conversion available.
- `flag`: `"H"` (high), `"L"` (low), or null.
- `rawName`: the original marker name from the report before alias resolution.
- `onDelete: Restrict` on marker relation: prevents deleting a marker that has results. Use `active = false` soft-delete instead.

## 2. Run Migration

```bash
npx prisma migrate dev --name add_lab_models
```

Verify the migration creates all seven models and the enum. Regenerate the client:

```bash
npx prisma generate
```

## 3. Seed Script

Create `prisma/seed-lab-markers.ts`. This script seeds four things:

1. **Panels** (~10-12)
2. **Markers** (~80-100) with default reference ranges
3. **Aliases** (~300) including each marker's canonical name as an alias
4. **Unit conversions** (~20-30 bidirectional pairs)
5. **Panel-marker memberships** (join table rows)

### Idempotency

Use upserts keyed on `LabMarker.key`, `LabPanel.key`, and `LabMarkerAlias.alias` so the script can be re-run safely as the catalog grows.

### Panels to Seed

| key | displayName | sortOrder |
|-----|-------------|-----------|
| `cbc` | Complete Blood Count | 1 |
| `cmp` | Comprehensive Metabolic Panel | 2 |
| `lipid` | Lipid Panel | 3 |
| `thyroid` | Thyroid Panel | 4 |
| `hormones` | Hormones | 5 |
| `iron` | Iron Studies | 6 |
| `vitamins` | Vitamins | 7 |
| `diabetes` | Diabetes / Glycemic | 8 |
| `inflammation` | Inflammation Markers | 9 |
| `liver` | Liver Function | 10 |
| `kidney` | Kidney Function | 11 |
| `other` | Other | 99 |

### Markers to Seed (by panel, with cross-panel memberships noted)

**Complete Blood Count (cbc):**
- WBC, RBC, Hemoglobin, Hematocrit, MCV, MCH, MCHC, RDW, Platelet Count, MPV
- Neutrophils %, Neutrophils Abs, Lymphocytes %, Lymphocytes Abs, Monocytes %, Monocytes Abs, Eosinophils %, Eosinophils Abs, Basophils %, Basophils Abs

**Comprehensive Metabolic Panel (cmp):**
- Glucose (also in `diabetes`), BUN (also in `kidney`), Creatinine (also in `kidney`), eGFR (also in `kidney`), Sodium, Potassium, Chloride, CO2/Bicarbonate, Calcium (also in `other`), Total Protein, Albumin, Globulin, A/G Ratio, Total Bilirubin (also in `liver`), ALP (also in `liver`), AST (also in `liver`), ALT (also in `liver`)

**Lipid Panel (lipid):**
- Total Cholesterol, LDL Cholesterol, HDL Cholesterol, Triglycerides, VLDL Cholesterol

**Thyroid (thyroid):**
- TSH, Free T4, Free T3, Total T4, Total T3, Reverse T3, TPO Antibodies, Thyroglobulin Antibodies

**Hormones (hormones):**
- Total Testosterone, Free Testosterone, SHBG, Estradiol, LH, FSH, DHEA-S, IGF-1, Cortisol, Prolactin

**Iron Studies (iron):**
- Iron, TIBC, Ferritin, Transferrin Saturation

**Vitamins (vitamins):**
- Vitamin D 25-OH (also in `cmp` at some labs), Vitamin B12, Folate

**Diabetes / Glycemic (diabetes):**
- HbA1c, Fasting Insulin, HOMA-IR (Glucose is already in `cmp`, cross-linked here)

**Inflammation (inflammation):**
- CRP, High-Sensitivity CRP, ESR, Homocysteine

**Other (other):**
- Uric Acid, Magnesium, Phosphorus, GGT (also in `liver`), PSA

### Reference Ranges

Source from widely published Quest/LabCorp adult reference intervals. Example format in the seed data:

```typescript
{ key: "hemoglobin", canonicalName: "Hemoglobin", unit: "g/dL", defaultRangeLow: 13.5, defaultRangeHigh: 17.5 }
{ key: "glucose", canonicalName: "Glucose", unit: "mg/dL", defaultRangeLow: 65, defaultRangeHigh: 99 }
{ key: "total-cholesterol", canonicalName: "Total Cholesterol", unit: "mg/dL", defaultRangeLow: 0, defaultRangeHigh: 200 }
```

When in doubt, use the broader "normal" range. These are defaults only — each `LabResult` stores the range printed on that specific report.

### Alias Rules

- Each marker's `canonicalName` (lowercased) **must** be seeded as an alias with source `seed`.
- Add 1-4 additional aliases per marker: common abbreviations, lab-specific variants.
- **Do NOT seed ambiguous short aliases** that could map to multiple markers. Examples of what NOT to seed:
  - Bare `"bilirubin"` (could be Total or Direct)
  - Bare `"t4"` (could be Free or Total)
  - Bare `"testosterone"` (could be Total or Free)
  - Bare `"cholesterol"` (could be Total, LDL, or HDL)
- Only seed unambiguous forms. Ambiguous names will correctly fall through to user resolution during upload.

### Unit Conversions to Seed

Seed both directions (A->B and B->A with reciprocal factors):

| Marker(s) | fromUnit | toUnit | factor |
|-----------|----------|--------|--------|
| Glucose | mg/dL | mmol/L | 0.0555 |
| Total Cholesterol, LDL, HDL | mg/dL | mmol/L | 0.02586 |
| Triglycerides | mg/dL | mmol/L | 0.01129 |
| Total Testosterone, Free Testosterone | ng/dL | nmol/L | 0.0347 |
| Creatinine | mg/dL | umol/L | 88.42 |
| Hemoglobin | g/dL | g/L | 10 |
| Vitamin D 25-OH | ng/mL | nmol/L | 2.496 |
| Vitamin B12 | pg/mL | pmol/L | 0.7378 |
| Iron | ug/dL | umol/L | 0.1791 |
| Calcium | mg/dL | mmol/L | 0.2495 |
| Uric Acid | mg/dL | umol/L | 59.48 |

The `toUnit` should match the marker's canonical `unit` field. For the reverse direction, use `1 / factor`.

### Running the Seed

The script should be runnable standalone:

```bash
npx tsx prisma/seed-lab-markers.ts
```

Alternatively, wire it into `prisma/seed.ts` if one exists, or add a `"prisma": { "seed": "tsx prisma/seed-lab-markers.ts" }` entry to `package.json`.

## 4. Dead Code Cleanup

**Before removing anything, verify each candidate is actually dead.** For every file and type below, run a project-wide search to confirm zero live imports or references. Comments and the file's own definition do not count. If a reference is found, trace whether the consumer is itself dead. Only delete once the full chain is confirmed unused.

### Candidates

| Candidate | Location | Believed Status |
|-----------|----------|----------------|
| `Result`, `Test`, `IndividualResult` | `utils/types.ts` | Dead — old lab types |
| `ClinicalLabArray`, `Lab_Testosterone`, `Lab_CBC` | `utils/types.ts` | Dead — old lab types |
| `TestResult`, `TestData`, `MyAreaChartProps`, `RenderChartsProps` | `utils/types.ts` | Dead — old chart types |
| `Testosterone_Form`, `AromataseInhibitor_Form`, `PDE5Inhibitor_Form`, `HCG_Form`, `Estrogen_Form` | `utils/types.ts` | Verify — old HRT form types |
| `homeLabs` field in `ClerkUserMetadata` | `utils/types.ts` | Dead — old Clerk metadata |
| `RenderCharts` + entire file | `utils/ChartRendering.tsx` | Dead — only imported by commented-out labs page |
| `PinnedData` + entire file | `components/home/PinnedData.tsx` | Dead — only consumer of `RenderCharts` |
| Current placeholder | `app/labs/page.tsx` | Will be replaced in Stage 3 |

### Verification commands

For each type/file, run:

```bash
rg "RenderCharts" --type ts --type tsx -l
rg "PinnedData" --type ts --type tsx -l
rg "Lab_CBC" --type ts --type tsx -l
# ... etc for each candidate
```

Exclude hits that are:
- The definition itself
- Inside comments
- In the file being deleted

### After all removals

```bash
npx tsc --noEmit
npx next build
```

Both must pass cleanly. Fix any breakage before proceeding.

## 5. Nav Integration

### SideNav (`components/global/SideNav.tsx`)

The labs entry currently has `placeholder: true`:

```typescript
{ href: "/labs", icon: TestTube, label: "Lab Results", placeholder: true },
```

Remove the `placeholder: true` property so it renders as a normal nav link.

### Mobile Nav (`lib/nav/navItems.ts`)

Labs is currently commented out:

```typescript
// { key: "labs", href: "/labs", icon: FlaskConical, label: "Labs" },
```

Uncomment this line. Note: the `FlaskConical` icon import from `lucide-react` is already present at the top of the file.

## 6. Verification Checklist

Before moving to Stage 2, confirm:

- [ ] `npx prisma migrate dev` ran successfully (migration file created)
- [ ] `npx prisma generate` completed (client types include all new models)
- [ ] Seed script runs without errors (`npx tsx prisma/seed-lab-markers.ts`)
- [ ] Spot-check: query a few markers, aliases, and panel memberships in Prisma Studio or a quick script
- [ ] Dead code removed, `npx tsc --noEmit` passes, `npx next build` succeeds
- [ ] Labs nav item visible in SideNav (no longer marked placeholder)
- [ ] Labs nav item available in mobile nav options
