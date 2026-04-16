# Labs Validation — Critical Issues

## 1. Missing `/api/labs/download` API route — file download is broken

`LabReportDetail.tsx` calls `fetch('/api/labs/download?reportId=...')` but no such API route exists. The glob for `app/api/labs/**/*` returns zero files. The "Download Original" button will fail with a 404 for every stored report.

**Location:** `components/labs/LabReportDetail.tsx` line 192

**Fix:** Create `app/api/labs/download/route.ts` that:

1. Authenticates the user via Clerk `auth()`
2. Fetches the `LabReport` record, verifies `userId` ownership
3. Calls `downloadLabReportFile(userId, reportId, originalFileName)`
4. Returns the raw bytes with appropriate `Content-Type` / `Content-Disposition` headers

```typescript
// app/api/labs/download/route.ts
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { downloadLabReportFile } from "@/lib/labs/server/labReportStorage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reportId = request.nextUrl.searchParams.get("reportId");
  if (!reportId) return NextResponse.json({ error: "Missing reportId" }, { status: 400 });

  const report = await prisma.labReport.findFirst({
    where: { id: reportId, userId },
    select: { originalFileName: true, originalFileMimeType: true },
  });

  if (!report?.originalFileName) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await downloadLabReportFile(userId, reportId, report.originalFileName);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": report.originalFileMimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${report.originalFileName}"`,
    },
  });
}
```

---

## 2. Free Testosterone unit conversion is misconfigured

The seed shares the same conversion entry between `total-testosterone` and `free-testosterone`:

```
prisma/seed-lab-markers.ts line 797:
{ markerKeys: ["total-testosterone", "free-testosterone"], fromUnit: "ng/dL", toUnit: "nmol/L", factor: 0.0347 }
```

But Free Testosterone's canonical unit is `pg/mL`, not `ng/dL`. The normalization logic in `labService.ts` looks for conversions where `toUnit = marker.unit`. Since no seeded conversion has `toUnit: "pg/mL"`, any Free Testosterone result in a non-canonical unit silently fails to normalize.

**Location:** `prisma/seed-lab-markers.ts` line 797

**Fix:**

1. Remove `"free-testosterone"` from the shared conversion on line 797
2. Add a separate conversion for Free Testosterone:

```typescript
{ markerKeys: ["free-testosterone"], fromUnit: "pg/mL", toUnit: "pmol/L", factor: 3.467 },
```

This seeds the correct pair `pg/mL <-> pmol/L` for Free Testosterone, independent of Total Testosterone's `ng/dL <-> nmol/L`.
