/*
  Warnings:

  - Added the required column `updatedAt` to the `GymCustomExercise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GymCustomExercise" ADD COLUMN     "bodyRegion" TEXT,
ADD COLUMN     "movementPattern" TEXT,
ADD COLUMN     "movementPlane" TEXT,
ADD COLUMN     "presetId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "GymCanonRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customExerciseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "userNote" TEXT,
    "adminNote" TEXT,
    "snapshotPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymCanonRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymCanonRequest_status_createdAt_idx" ON "GymCanonRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GymCanonRequest_userId_idx" ON "GymCanonRequest"("userId");

-- AddForeignKey
ALTER TABLE "GymCanonRequest" ADD CONSTRAINT "GymCanonRequest_customExerciseId_fkey" FOREIGN KEY ("customExerciseId") REFERENCES "GymCustomExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
