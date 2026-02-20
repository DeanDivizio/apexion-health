-- CreateTable
CREATE TABLE "Substance" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isCompound" BOOLEAN NOT NULL DEFAULT false,
    "defaultDoseUnit" TEXT DEFAULT 'mg',
    "selfIngredientKey" TEXT,
    "brand" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Substance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstanceDeliveryMethod" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstanceDeliveryMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstanceMethodLink" (
    "substanceId" TEXT NOT NULL,
    "deliveryMethodId" TEXT NOT NULL,

    CONSTRAINT "SubstanceMethodLink_pkey" PRIMARY KEY ("substanceId","deliveryMethodId")
);

-- CreateTable
CREATE TABLE "SubstanceVariant" (
    "id" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "deliveryMethodId" TEXT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstanceVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstanceIngredient" (
    "id" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "ingredientKey" TEXT NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "amountPerServing" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mg',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstanceIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstancePreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstancePreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstancePresetItem" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "snapshotName" TEXT NOT NULL,
    "doseValue" DOUBLE PRECISION,
    "doseUnit" TEXT,
    "compoundServings" DOUBLE PRECISION,
    "deliveryMethodId" TEXT,
    "variantId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstancePresetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstanceLogSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "presetId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstanceLogSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstanceLogItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "snapshotName" TEXT NOT NULL,
    "doseValue" DOUBLE PRECISION,
    "doseUnit" TEXT,
    "compoundServings" DOUBLE PRECISION,
    "deliveryMethodId" TEXT,
    "variantId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubstanceLogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubstanceLogItemIngredient" (
    "id" TEXT NOT NULL,
    "logItemId" TEXT NOT NULL,
    "sourceIngredientId" TEXT,
    "ingredientKey" TEXT NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "amountTotal" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mg',
    "sourceAmountPerServing" DOUBLE PRECISION NOT NULL,
    "sourceServings" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubstanceLogItemIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Substance_key_key" ON "Substance"("key");

-- CreateIndex
CREATE INDEX "Substance_ownerUserId_idx" ON "Substance"("ownerUserId");

-- CreateIndex
CREATE INDEX "Substance_selfIngredientKey_idx" ON "Substance"("selfIngredientKey");

-- CreateIndex
CREATE UNIQUE INDEX "SubstanceDeliveryMethod_key_key" ON "SubstanceDeliveryMethod"("key");

-- CreateIndex
CREATE INDEX "SubstanceVariant_substanceId_idx" ON "SubstanceVariant"("substanceId");

-- CreateIndex
CREATE INDEX "SubstanceVariant_deliveryMethodId_idx" ON "SubstanceVariant"("deliveryMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "SubstanceVariant_substanceId_key_key" ON "SubstanceVariant"("substanceId", "key");

-- CreateIndex
CREATE INDEX "SubstanceIngredient_substanceId_idx" ON "SubstanceIngredient"("substanceId");

-- CreateIndex
CREATE INDEX "SubstanceIngredient_ingredientKey_idx" ON "SubstanceIngredient"("ingredientKey");

-- CreateIndex
CREATE UNIQUE INDEX "SubstanceIngredient_substanceId_ingredientKey_key" ON "SubstanceIngredient"("substanceId", "ingredientKey");

-- CreateIndex
CREATE INDEX "SubstancePreset_userId_updatedAt_idx" ON "SubstancePreset"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "SubstancePresetItem_presetId_sortOrder_idx" ON "SubstancePresetItem"("presetId", "sortOrder");

-- CreateIndex
CREATE INDEX "SubstancePresetItem_substanceId_idx" ON "SubstancePresetItem"("substanceId");

-- CreateIndex
CREATE INDEX "SubstancePresetItem_deliveryMethodId_idx" ON "SubstancePresetItem"("deliveryMethodId");

-- CreateIndex
CREATE INDEX "SubstancePresetItem_variantId_idx" ON "SubstancePresetItem"("variantId");

-- CreateIndex
CREATE INDEX "SubstanceLogSession_userId_loggedAt_idx" ON "SubstanceLogSession"("userId", "loggedAt");

-- CreateIndex
CREATE INDEX "SubstanceLogSession_presetId_idx" ON "SubstanceLogSession"("presetId");

-- CreateIndex
CREATE INDEX "SubstanceLogItem_sessionId_sortOrder_idx" ON "SubstanceLogItem"("sessionId", "sortOrder");

-- CreateIndex
CREATE INDEX "SubstanceLogItem_userId_createdAt_idx" ON "SubstanceLogItem"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SubstanceLogItem_substanceId_createdAt_idx" ON "SubstanceLogItem"("substanceId", "createdAt");

-- CreateIndex
CREATE INDEX "SubstanceLogItem_deliveryMethodId_idx" ON "SubstanceLogItem"("deliveryMethodId");

-- CreateIndex
CREATE INDEX "SubstanceLogItem_variantId_idx" ON "SubstanceLogItem"("variantId");

-- CreateIndex
CREATE INDEX "SubstanceLogItemIngredient_logItemId_idx" ON "SubstanceLogItemIngredient"("logItemId");

-- CreateIndex
CREATE INDEX "SubstanceLogItemIngredient_ingredientKey_amountTotal_idx" ON "SubstanceLogItemIngredient"("ingredientKey", "amountTotal");

-- CreateIndex
CREATE INDEX "SubstanceLogItemIngredient_sourceIngredientId_idx" ON "SubstanceLogItemIngredient"("sourceIngredientId");

-- AddForeignKey
ALTER TABLE "SubstanceMethodLink" ADD CONSTRAINT "SubstanceMethodLink_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceMethodLink" ADD CONSTRAINT "SubstanceMethodLink_deliveryMethodId_fkey" FOREIGN KEY ("deliveryMethodId") REFERENCES "SubstanceDeliveryMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceVariant" ADD CONSTRAINT "SubstanceVariant_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceVariant" ADD CONSTRAINT "SubstanceVariant_deliveryMethodId_fkey" FOREIGN KEY ("deliveryMethodId") REFERENCES "SubstanceDeliveryMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceIngredient" ADD CONSTRAINT "SubstanceIngredient_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstancePresetItem" ADD CONSTRAINT "SubstancePresetItem_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "SubstancePreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstancePresetItem" ADD CONSTRAINT "SubstancePresetItem_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstancePresetItem" ADD CONSTRAINT "SubstancePresetItem_deliveryMethodId_fkey" FOREIGN KEY ("deliveryMethodId") REFERENCES "SubstanceDeliveryMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstancePresetItem" ADD CONSTRAINT "SubstancePresetItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "SubstanceVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceLogSession" ADD CONSTRAINT "SubstanceLogSession_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "SubstancePreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceLogItem" ADD CONSTRAINT "SubstanceLogItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SubstanceLogSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceLogItem" ADD CONSTRAINT "SubstanceLogItem_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "Substance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceLogItem" ADD CONSTRAINT "SubstanceLogItem_deliveryMethodId_fkey" FOREIGN KEY ("deliveryMethodId") REFERENCES "SubstanceDeliveryMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceLogItem" ADD CONSTRAINT "SubstanceLogItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "SubstanceVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceLogItemIngredient" ADD CONSTRAINT "SubstanceLogItemIngredient_logItemId_fkey" FOREIGN KEY ("logItemId") REFERENCES "SubstanceLogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubstanceLogItemIngredient" ADD CONSTRAINT "SubstanceLogItemIngredient_sourceIngredientId_fkey" FOREIGN KEY ("sourceIngredientId") REFERENCES "SubstanceIngredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
