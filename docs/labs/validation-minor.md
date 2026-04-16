# Labs Validation — Minor Issues

## 5. Duplicate `downloadError` display in `LabReportDetail.tsx`

The download error message is rendered twice:

- **Inline** next to the download button (line 299–301)
- **Full-width banner** below the header (lines 332–337)

**Location:** `components/labs/LabReportDetail.tsx` lines 299–301 and 332–337

**Fix:** Remove the inline `{downloadError && ...}` span on lines 299–301 and keep only the banner.

---

## 6. `salt.buffer as ArrayBuffer` cast in `fileEncryption.ts`

```
lib/labs/client/fileEncryption.ts line 22:
salt: salt.buffer as ArrayBuffer,
```

In newer TypeScript/environments, `Uint8Array.buffer` returns `ArrayBufferLike`, not `ArrayBuffer`. This cast works today but may cause issues as types tighten.

**Location:** `lib/labs/client/fileEncryption.ts` line 22

**Fix:** Use `new Uint8Array(salt).buffer` or pass `salt` directly since PBKDF2 accepts `BufferSource`.

---

## 7. `any` types in labService.ts mapper functions

`toReportView(row: any)`, `toResultView(row: any)`, and `toDetailView(row: any)` use untyped `any` parameters. Functional, but loses type safety on the Prisma query shape.

**Location:** `lib/labs/server/labService.ts` lines 21, 36, 58

**Fix:** Use Prisma's generated types with the corresponding `include` shape. Example:

```typescript
import { Prisma } from "@prisma/client";

type ReportWithCount = Prisma.LabReportGetPayload<{
  include: { _count: { select: { results: true } } };
}>;

function toReportView(row: ReportWithCount): LabReportView { ... }
```

---

## 8. Double cache invalidation on delete

`deleteLabReportAction` in `actions/labs.ts` calls `updateTag('labs-${userId}')` (line 68), and `deleteLabReport` in the service layer also calls `updateTag('labs-${userId}')` (line 364 of labService.ts). The tag is invalidated twice for one delete.

**Location:** `actions/labs.ts` line 68, `lib/labs/server/labService.ts` line 364

**Fix:** Remove the `updateTag` call from `deleteLabReportAction` in `actions/labs.ts` — let the service layer own cache invalidation consistently.
