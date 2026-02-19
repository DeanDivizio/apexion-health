-- CreateTable
CREATE TABLE "GymUserExerciseDefault" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseKey" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,

    CONSTRAINT "GymUserExerciseDefault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymUserExerciseDefault_userId_exerciseKey_idx" ON "GymUserExerciseDefault"("userId", "exerciseKey");

-- CreateIndex
CREATE UNIQUE INDEX "GymUserExerciseDefault_userId_exerciseKey_templateId_key" ON "GymUserExerciseDefault"("userId", "exerciseKey", "templateId");
