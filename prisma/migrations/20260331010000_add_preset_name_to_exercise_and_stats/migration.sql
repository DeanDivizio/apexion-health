-- AlterTable
ALTER TABLE "GymWorkoutExercise" ADD COLUMN "presetName" TEXT;

-- AlterTable
ALTER TABLE "GymUserExerciseStat" ADD COLUMN "presetName" TEXT;

-- Drop old unique constraint and create new one that includes presetName
DROP INDEX IF EXISTS "GymUserExerciseStat_userId_exerciseKey_key";

CREATE UNIQUE INDEX "GymUserExerciseStat_userId_exerciseKey_presetName_key" ON "GymUserExerciseStat"("userId", "exerciseKey", "presetName");
