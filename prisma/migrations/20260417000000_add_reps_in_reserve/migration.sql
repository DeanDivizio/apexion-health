-- Add the new GymStrengthSet.repsInReserve column alongside the existing
-- GymStrengthSet.effort column. The old column is kept in place so a manual
-- backfill can be run and verified before the `effort` column is eventually
-- dropped in a follow-up migration.
--
-- See prisma/migrations/manual/backfill_reps_in_reserve.sql for the
-- accompanying backfill script (run manually, not as part of `prisma migrate`).

ALTER TABLE "GymStrengthSet" ADD COLUMN "repsInReserve" INTEGER;
