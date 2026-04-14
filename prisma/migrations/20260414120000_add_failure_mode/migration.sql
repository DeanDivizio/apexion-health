-- AlterTable
ALTER TABLE "GymStrengthSet" ADD COLUMN "failureMode" TEXT;

-- AlterTable
ALTER TABLE "GymUserPreferences" ADD COLUMN "showFailureMode" BOOLEAN NOT NULL DEFAULT true;
