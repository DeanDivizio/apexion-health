-- CreateTable
CREATE TABLE "NutritionFoodPreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionFoodPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionFoodPresetItem" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "foodSource" "NutritionFoodSource" NOT NULL,
    "sourceFoodId" TEXT,
    "foundationFoodId" TEXT,
    "snapshotName" TEXT NOT NULL,
    "snapshotBrand" TEXT,
    "servings" DOUBLE PRECISION NOT NULL,
    "portionLabel" TEXT,
    "portionGramWeight" DOUBLE PRECISION,
    "nutrients" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionFoodPresetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionFoodPreset_userId_active_idx" ON "NutritionFoodPreset"("userId", "active");

-- CreateIndex
CREATE INDEX "NutritionFoodPreset_userId_name_idx" ON "NutritionFoodPreset"("userId", "name");

-- CreateIndex
CREATE INDEX "NutritionFoodPresetItem_presetId_sortOrder_idx" ON "NutritionFoodPresetItem"("presetId", "sortOrder");

-- AddForeignKey
ALTER TABLE "NutritionFoodPresetItem" ADD CONSTRAINT "NutritionFoodPresetItem_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "NutritionFoodPreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
