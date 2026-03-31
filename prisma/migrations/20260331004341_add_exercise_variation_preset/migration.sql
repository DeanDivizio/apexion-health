-- CreateTable
CREATE TABLE "GymExerciseVariationPreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymExerciseVariationPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymExerciseVariationPreset_userId_idx" ON "GymExerciseVariationPreset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GymExerciseVariationPreset_userId_exerciseKey_name_key" ON "GymExerciseVariationPreset"("userId", "exerciseKey", "name");
