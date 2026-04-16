-- CreateEnum
CREATE TYPE "LabMarkerAliasSource" AS ENUM ('seed', 'ocr', 'manual');

-- CreateTable
CREATE TABLE "LabMarker" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "defaultRangeLow" DOUBLE PRECISION,
    "defaultRangeHigh" DOUBLE PRECISION,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabMarker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabPanel" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabPanelMarker" (
    "panelId" TEXT NOT NULL,
    "markerId" TEXT NOT NULL,

    CONSTRAINT "LabPanelMarker_pkey" PRIMARY KEY ("panelId","markerId")
);

-- CreateTable
CREATE TABLE "LabMarkerAlias" (
    "id" TEXT NOT NULL,
    "markerId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "source" "LabMarkerAliasSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabMarkerAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabUnitConversion" (
    "id" TEXT NOT NULL,
    "markerId" TEXT NOT NULL,
    "fromUnit" TEXT NOT NULL,
    "toUnit" TEXT NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LabUnitConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "drawTime" TEXT,
    "institution" TEXT,
    "providerName" TEXT,
    "notes" TEXT,
    "originalFileUrl" TEXT,
    "originalFileName" TEXT,
    "originalFileMimeType" TEXT,
    "fileEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "markerId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "normalizedValue" DOUBLE PRECISION,
    "normalizedUnit" TEXT,
    "rangeLow" DOUBLE PRECISION,
    "rangeHigh" DOUBLE PRECISION,
    "flag" TEXT,
    "rawName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LabMarker_key_key" ON "LabMarker"("key");

-- CreateIndex
CREATE UNIQUE INDEX "LabPanel_key_key" ON "LabPanel"("key");

-- CreateIndex
CREATE INDEX "LabPanelMarker_markerId_idx" ON "LabPanelMarker"("markerId");

-- CreateIndex
CREATE UNIQUE INDEX "LabMarkerAlias_alias_key" ON "LabMarkerAlias"("alias");

-- CreateIndex
CREATE INDEX "LabMarkerAlias_markerId_idx" ON "LabMarkerAlias"("markerId");

-- CreateIndex
CREATE INDEX "LabUnitConversion_markerId_idx" ON "LabUnitConversion"("markerId");

-- CreateIndex
CREATE UNIQUE INDEX "LabUnitConversion_markerId_fromUnit_toUnit_key" ON "LabUnitConversion"("markerId", "fromUnit", "toUnit");

-- CreateIndex
CREATE INDEX "LabReport_userId_reportDate_idx" ON "LabReport"("userId", "reportDate");

-- CreateIndex
CREATE INDEX "LabResult_reportId_idx" ON "LabResult"("reportId");

-- CreateIndex
CREATE INDEX "LabResult_markerId_idx" ON "LabResult"("markerId");

-- AddForeignKey
ALTER TABLE "LabPanelMarker" ADD CONSTRAINT "LabPanelMarker_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "LabPanel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabPanelMarker" ADD CONSTRAINT "LabPanelMarker_markerId_fkey" FOREIGN KEY ("markerId") REFERENCES "LabMarker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabMarkerAlias" ADD CONSTRAINT "LabMarkerAlias_markerId_fkey" FOREIGN KEY ("markerId") REFERENCES "LabMarker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabUnitConversion" ADD CONSTRAINT "LabUnitConversion_markerId_fkey" FOREIGN KEY ("markerId") REFERENCES "LabMarker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "LabReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_markerId_fkey" FOREIGN KEY ("markerId") REFERENCES "LabMarker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
