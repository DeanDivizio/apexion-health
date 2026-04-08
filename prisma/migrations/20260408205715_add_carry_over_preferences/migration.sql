-- AlterTable
ALTER TABLE "GymUserPreferences" ADD COLUMN     "carryOverReps" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "carryOverWeight" BOOLEAN NOT NULL DEFAULT true;
