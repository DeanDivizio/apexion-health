# Labs Validation — Significant Issues

## 3. SideNav doesn't render the Labs nav item

The `placeholder: true` was correctly removed from the Labs entry in the `dashboards` array (line 44), but the entire dashboards rendering block is commented out:

```
components/global/SideNav.tsx lines 117-121:
<p className="text-xs ...">Coming Soon</p>
{/* {dashboards.map((item) => ( */}
    {/* <NavItem key={item.href} {...item} /> */}
{/* ))} */}
```

Labs doesn't appear in the SideNav at all. Only the mobile nav via `navItems.ts` is working.

**Location:** `components/global/SideNav.tsx` lines 117–121

**Fix:** Render the Labs dashboard item specifically, without uncommenting the full "Coming Soon" block:

```tsx
{dashboards
  .filter((item) => !item.placeholder)
  .map((item) => (
    <NavItem key={item.href} {...item} />
  ))}
```

Or just render the Labs entry directly below the "Coming Soon" text while leaving the other dashboards commented out.

---

## 4. Supabase upload inside Prisma `$transaction` can orphan files

In `labService.ts`, `uploadLabReportFile` (a Supabase HTTP call) runs inside a Prisma `$transaction` (line 174). If the upload succeeds but the subsequent `tx.labReport.update` fails and rolls back, the file persists in Supabase with no matching DB record — an orphan.

**Location:** `lib/labs/server/labService.ts` lines 170–191 (inside `createLabReport`)

**Fix:** Restructure `createLabReport` to:

1. Run the transaction for DB writes only (report + results + aliases)
2. After the transaction commits, upload the file to Supabase
3. Then update the report's `originalFileUrl` in a separate query
4. If the upload fails, delete the already-committed report (or log for cleanup)

```typescript
const reportId = await prisma.$transaction(async (tx) => {
  const report = await tx.labReport.create({ ... });
  // create results + aliases inside tx
  return report.id;
});

if (input.file) {
  const fileBytes = Uint8Array.from(atob(input.file.base64), (c) => c.charCodeAt(0));
  const storagePath = await uploadLabReportFile({ userId, reportId, ... });
  await prisma.labReport.update({
    where: { id: reportId },
    data: {
      originalFileUrl: storagePath,
      originalFileName: input.file.fileName,
      originalFileMimeType: input.file.mimeType,
      fileEncrypted: input.file.encrypted,
    },
  });
}
```

This ensures the transaction only contains DB operations and external calls happen after commit.
