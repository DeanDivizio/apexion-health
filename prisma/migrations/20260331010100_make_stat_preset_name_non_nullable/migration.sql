-- Backfill existing rows: NULL -> empty string
UPDATE "GymUserExerciseStat" SET "presetName" = '' WHERE "presetName" IS NULL;

-- Make column non-nullable with default
ALTER TABLE "GymUserExerciseStat" ALTER COLUMN "presetName" SET DEFAULT '';
ALTER TABLE "GymUserExerciseStat" ALTER COLUMN "presetName" SET NOT NULL;
