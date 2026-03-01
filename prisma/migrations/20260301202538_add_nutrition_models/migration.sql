-- CreateEnum
CREATE TYPE "NutritionFoodSource" AS ENUM ('foundation', 'complex', 'retail');

-- CreateTable
CREATE TABLE "NutritionFoundationFood" (
    "id" TEXT NOT NULL,
    "fdcId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "nutrients" JSONB NOT NULL,
    "portions" JSONB,
    "defaultServingSize" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "defaultServingUnit" TEXT NOT NULL DEFAULT 'g',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionFoundationFood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionUserFood" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "nutrients" JSONB NOT NULL,
    "servingSize" DOUBLE PRECISION NOT NULL,
    "servingUnit" TEXT NOT NULL DEFAULT 'g',
    "ingredients" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionUserFood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRetailChain" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionRetailChain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRetailItem" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "nutrients" JSONB NOT NULL,
    "servingSize" DOUBLE PRECISION,
    "servingUnit" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionRetailItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRetailUserItem" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "nutrients" JSONB NOT NULL,
    "servingSize" DOUBLE PRECISION,
    "servingUnit" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionRetailUserItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionMealSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "dateStr" TEXT NOT NULL,
    "mealLabel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionMealSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionMealItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "foodSource" "NutritionFoodSource" NOT NULL,
    "sourceFoodId" TEXT,
    "foundationFoodId" TEXT,
    "snapshotName" TEXT NOT NULL,
    "snapshotBrand" TEXT,
    "servings" DOUBLE PRECISION NOT NULL,
    "portionLabel" TEXT,
    "portionGramWeight" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "snapshotCalories" DOUBLE PRECISION NOT NULL,
    "snapshotProtein" DOUBLE PRECISION NOT NULL,
    "snapshotCarbs" DOUBLE PRECISION NOT NULL,
    "snapshotFat" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionMealItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionMealItemNutrient" (
    "id" TEXT NOT NULL,
    "mealItemId" TEXT NOT NULL,
    "nutrientKey" TEXT NOT NULL,
    "nutrientName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionMealItemNutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionUserGoals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calories" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "carbs" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "microGoals" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionUserGoals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NutritionFoundationFood_fdcId_key" ON "NutritionFoundationFood"("fdcId");

-- CreateIndex
CREATE INDEX "NutritionFoundationFood_name_idx" ON "NutritionFoundationFood"("name");

-- CreateIndex
CREATE INDEX "NutritionUserFood_userId_name_idx" ON "NutritionUserFood"("userId", "name");

-- CreateIndex
CREATE INDEX "NutritionUserFood_userId_active_idx" ON "NutritionUserFood"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionRetailChain_key_key" ON "NutritionRetailChain"("key");

-- CreateIndex
CREATE INDEX "NutritionRetailItem_chainId_name_idx" ON "NutritionRetailItem"("chainId", "name");

-- CreateIndex
CREATE INDEX "NutritionRetailUserItem_chainId_userId_idx" ON "NutritionRetailUserItem"("chainId", "userId");

-- CreateIndex
CREATE INDEX "NutritionRetailUserItem_userId_idx" ON "NutritionRetailUserItem"("userId");

-- CreateIndex
CREATE INDEX "NutritionMealSession_userId_dateStr_idx" ON "NutritionMealSession"("userId", "dateStr");

-- CreateIndex
CREATE INDEX "NutritionMealSession_userId_loggedAt_idx" ON "NutritionMealSession"("userId", "loggedAt");

-- CreateIndex
CREATE INDEX "NutritionMealItem_sessionId_sortOrder_idx" ON "NutritionMealItem"("sessionId", "sortOrder");

-- CreateIndex
CREATE INDEX "NutritionMealItemNutrient_mealItemId_idx" ON "NutritionMealItemNutrient"("mealItemId");

-- CreateIndex
CREATE INDEX "NutritionMealItemNutrient_nutrientKey_amount_idx" ON "NutritionMealItemNutrient"("nutrientKey", "amount");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionUserGoals_userId_key" ON "NutritionUserGoals"("userId");

-- AddForeignKey
ALTER TABLE "NutritionRetailItem" ADD CONSTRAINT "NutritionRetailItem_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "NutritionRetailChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailUserItem" ADD CONSTRAINT "NutritionRetailUserItem_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "NutritionRetailChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionMealItem" ADD CONSTRAINT "NutritionMealItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NutritionMealSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionMealItemNutrient" ADD CONSTRAINT "NutritionMealItemNutrient_mealItemId_fkey" FOREIGN KEY ("mealItemId") REFERENCES "NutritionMealItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
