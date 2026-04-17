-- Manual backfill: GymStrengthSet.effort (RPE, 0-10, 0 = untracked)
-- → GymStrengthSet.repsInReserve (RIR, 0-5, NULL = untracked).
--
-- This is NOT a Prisma migration — run it manually (e.g. via
-- `psql`, `prisma db execute --file …`, or the Supabase SQL editor)
-- *after* the `20260417000000_add_reps_in_reserve` migration has been
-- applied and *before* the follow-up migration that drops `effort`.
--
-- Mapping (RPE → RIR):
--   NULL or 0 (untracked) → NULL
--   10 (failure)          → 0
--   9                     → 1
--   8                     → 2   (RPE 8 label is "2-3 in reserve"; lower bound)
--   7                     → 4   (RPE 7 label is "4-5 in reserve"; lower bound)
--   6                     → 4   (clamped into the RIR range)
--   1-5                   → 5   (very easy sets; clamped to our max)
--
-- Safe to re-run: this only rewrites rows whose repsInReserve is still NULL,
-- so previously-backfilled or hand-edited RIR values are left alone.

BEGIN;

-- 1. Preview row counts before updating (optional; remove if running non-interactively).
--    Uncomment to inspect:
-- SELECT "effort", COUNT(*)
-- FROM "GymStrengthSet"
-- WHERE "repsInReserve" IS NULL
-- GROUP BY "effort"
-- ORDER BY "effort";

-- 2. Backfill.
UPDATE "GymStrengthSet"
SET "repsInReserve" = CASE
    WHEN "effort" IS NULL OR "effort" = 0 THEN NULL
    WHEN "effort" >= 10 THEN 0
    WHEN "effort" = 9 THEN 1
    WHEN "effort" = 8 THEN 2
    WHEN "effort" = 7 THEN 4
    WHEN "effort" = 6 THEN 4
    ELSE 5
END
WHERE "repsInReserve" IS NULL
  AND "effort" IS NOT NULL
  AND "effort" <> 0;

-- 3. Sanity check after update (optional).
-- SELECT "effort", "repsInReserve", COUNT(*)
-- FROM "GymStrengthSet"
-- GROUP BY "effort", "repsInReserve"
-- ORDER BY "effort", "repsInReserve";

COMMIT;
