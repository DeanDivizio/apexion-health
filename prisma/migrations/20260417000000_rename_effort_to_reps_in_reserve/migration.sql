-- Rename GymStrengthSet.effort (RPE, 0-10 with 0 meaning "untracked")
-- to GymStrengthSet.repsInReserve (RIR, 0-5 with NULL meaning "untracked").
--
-- Mapping (RPE -> RIR):
--   NULL or 0 (untracked) -> NULL
--   10 (failure)          -> 0
--   9                     -> 1
--   8                     -> 2  (RPE 8 label is "2-3 in reserve"; we keep the lower bound)
--   7                     -> 4  (RPE 7 label is "4-5 in reserve"; we keep the lower bound)
--   6                     -> 4  (clamped so historical mid-scale values map into the RIR range)
--   1-5                   -> 5  (very easy sets; clamped to our max)

ALTER TABLE "GymStrengthSet" ADD COLUMN "repsInReserve" INTEGER;

UPDATE "GymStrengthSet"
SET "repsInReserve" = CASE
    WHEN "effort" IS NULL OR "effort" = 0 THEN NULL
    WHEN "effort" >= 10 THEN 0
    WHEN "effort" = 9 THEN 1
    WHEN "effort" = 8 THEN 2
    WHEN "effort" = 7 THEN 4
    WHEN "effort" = 6 THEN 4
    ELSE 5
END;

ALTER TABLE "GymStrengthSet" DROP COLUMN "effort";
