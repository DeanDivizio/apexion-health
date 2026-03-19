-- CreateTable
CREATE TABLE "UserHomePreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showMacroSummary" BOOLEAN NOT NULL DEFAULT true,
    "macroSummarySize" TEXT NOT NULL DEFAULT 'large',
    "showHydrationSummary" BOOLEAN NOT NULL DEFAULT true,
    "showMicroNutrientSummary" BOOLEAN NOT NULL DEFAULT false,
    "showWorkoutSummary" BOOLEAN NOT NULL DEFAULT true,
    "showMedsSummary" BOOLEAN NOT NULL DEFAULT true,
    "componentOrder" JSONB NOT NULL DEFAULT '["macroSummary","hydrationSummary","workoutSummary","medsSummary","microNutrientSummary"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHomePreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserHomePreferences_userId_key" ON "UserHomePreferences"("userId");
