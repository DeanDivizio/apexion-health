-- CreateEnum
CREATE TYPE "GymExerciseType" AS ENUM ('strength', 'cardio');

-- CreateEnum
CREATE TYPE "GymRepMode" AS ENUM ('bilateral', 'dualUnilateral');

-- CreateTable
CREATE TABLE "GymWorkoutSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateStr" TEXT NOT NULL,
    "startTimeStr" TEXT NOT NULL,
    "endTimeStr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymWorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymWorkoutExercise" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "GymExerciseType" NOT NULL,
    "exerciseKey" TEXT NOT NULL,
    "notes" TEXT,
    "durationMinutes" DOUBLE PRECISION,
    "distance" DOUBLE PRECISION,
    "distanceUnit" TEXT,

    CONSTRAINT "GymWorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymStrengthSet" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "repsBilateral" INTEGER,
    "repsLeft" INTEGER,
    "repsRight" INTEGER,
    "effort" INTEGER,
    "durationSeconds" INTEGER,

    CONSTRAINT "GymStrengthSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymVariationTemplate" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "GymVariationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymVariationOption" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER,

    CONSTRAINT "GymVariationOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymCustomExercise" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "repMode" "GymRepMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GymCustomExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymCustomExerciseTarget" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "muscle" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "GymCustomExerciseTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymExerciseVariationSupport" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "labelOverride" TEXT,

    CONSTRAINT "GymExerciseVariationSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymExerciseVariationOptionLabelOverride" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "labelOverride" TEXT NOT NULL,

    CONSTRAINT "GymExerciseVariationOptionLabelOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymExerciseVariationEffect" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "multipliers" JSONB,
    "deltas" JSONB,

    CONSTRAINT "GymExerciseVariationEffect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymWorkoutExerciseVariation" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,

    CONSTRAINT "GymWorkoutExerciseVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymUserExerciseStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseKey" TEXT NOT NULL,
    "prDateStr" TEXT,
    "prWeight" DOUBLE PRECISION,
    "prRepsBilateral" INTEGER,
    "prRepsLeft" INTEGER,
    "prRepsRight" INTEGER,
    "prTotalVolume" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "GymUserExerciseStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GymWorkoutSession_userId_dateStr_idx" ON "GymWorkoutSession"("userId", "dateStr");

-- CreateIndex
CREATE INDEX "GymWorkoutExercise_sessionId_order_idx" ON "GymWorkoutExercise"("sessionId", "order");

-- CreateIndex
CREATE INDEX "GymWorkoutExercise_exerciseKey_idx" ON "GymWorkoutExercise"("exerciseKey");

-- CreateIndex
CREATE INDEX "GymStrengthSet_exerciseId_order_idx" ON "GymStrengthSet"("exerciseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "GymVariationOption_templateId_key_key" ON "GymVariationOption"("templateId", "key");

-- CreateIndex
CREATE INDEX "GymCustomExercise_userId_idx" ON "GymCustomExercise"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GymCustomExercise_userId_key_key" ON "GymCustomExercise"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "GymCustomExerciseTarget_exerciseId_muscle_key" ON "GymCustomExerciseTarget"("exerciseId", "muscle");

-- CreateIndex
CREATE UNIQUE INDEX "GymExerciseVariationSupport_exerciseId_templateId_key" ON "GymExerciseVariationSupport"("exerciseId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "GymExerciseVariationOptionLabelOverride_exerciseId_template_key" ON "GymExerciseVariationOptionLabelOverride"("exerciseId", "templateId", "optionKey");

-- CreateIndex
CREATE UNIQUE INDEX "GymExerciseVariationEffect_exerciseId_templateId_optionKey_key" ON "GymExerciseVariationEffect"("exerciseId", "templateId", "optionKey");

-- CreateIndex
CREATE UNIQUE INDEX "GymWorkoutExerciseVariation_exerciseId_templateId_key" ON "GymWorkoutExerciseVariation"("exerciseId", "templateId");

-- CreateIndex
CREATE INDEX "GymUserExerciseStat_userId_idx" ON "GymUserExerciseStat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GymUserExerciseStat_userId_exerciseKey_key" ON "GymUserExerciseStat"("userId", "exerciseKey");

-- AddForeignKey
ALTER TABLE "GymWorkoutExercise" ADD CONSTRAINT "GymWorkoutExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GymWorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymStrengthSet" ADD CONSTRAINT "GymStrengthSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "GymWorkoutExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymVariationOption" ADD CONSTRAINT "GymVariationOption_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GymVariationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymCustomExerciseTarget" ADD CONSTRAINT "GymCustomExerciseTarget_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "GymCustomExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymExerciseVariationSupport" ADD CONSTRAINT "GymExerciseVariationSupport_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "GymCustomExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymExerciseVariationSupport" ADD CONSTRAINT "GymExerciseVariationSupport_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GymVariationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymExerciseVariationOptionLabelOverride" ADD CONSTRAINT "GymExerciseVariationOptionLabelOverride_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "GymCustomExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymExerciseVariationOptionLabelOverride" ADD CONSTRAINT "GymExerciseVariationOptionLabelOverride_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GymVariationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymExerciseVariationEffect" ADD CONSTRAINT "GymExerciseVariationEffect_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "GymCustomExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymExerciseVariationEffect" ADD CONSTRAINT "GymExerciseVariationEffect_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GymVariationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymWorkoutExerciseVariation" ADD CONSTRAINT "GymWorkoutExerciseVariation_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "GymWorkoutExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymWorkoutExerciseVariation" ADD CONSTRAINT "GymWorkoutExerciseVariation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GymVariationTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
