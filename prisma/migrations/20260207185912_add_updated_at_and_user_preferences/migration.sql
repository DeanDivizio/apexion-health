/*
  Warnings:

  - Added the required column `updatedAt` to the `GymUserExerciseStat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `GymWorkoutSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GymExerciseVariationSupport" ADD COLUMN     "defaultOptionKey" TEXT;

-- AlterTable
ALTER TABLE "GymUserExerciseStat" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "GymWorkoutSession" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "GymUserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightUnit" TEXT NOT NULL DEFAULT 'lbs',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymUserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GymUserPreferences_userId_key" ON "GymUserPreferences"("userId");
