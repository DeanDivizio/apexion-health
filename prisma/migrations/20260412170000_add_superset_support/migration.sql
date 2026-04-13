-- AlterTable
ALTER TABLE "GymWorkoutExercise" ADD COLUMN     "supersetGroupId" TEXT,
ADD COLUMN     "supersetTemplateId" TEXT;

-- CreateTable
CREATE TABLE "GymSupersetTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseAKey" TEXT NOT NULL,
    "exerciseBKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymSupersetTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymSupersetTemplate_userId_idx" ON "GymSupersetTemplate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GymSupersetTemplate_userId_exerciseAKey_exerciseBKey_key" ON "GymSupersetTemplate"("userId", "exerciseAKey", "exerciseBKey");

-- CreateIndex
CREATE INDEX "GymWorkoutExercise_supersetGroupId_idx" ON "GymWorkoutExercise"("supersetGroupId");

-- AddForeignKey
ALTER TABLE "GymWorkoutExercise" ADD CONSTRAINT "GymWorkoutExercise_supersetTemplateId_fkey" FOREIGN KEY ("supersetTemplateId") REFERENCES "GymSupersetTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
