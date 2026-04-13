-- CreateEnum
CREATE TYPE "ActivityDimensionKind" AS ENUM ('text', 'number', 'number_with_unit', 'date', 'time', 'datetime', 'scale_1_5');

-- CreateTable
CREATE TABLE "ActivityType" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityDimension" (
    "id" TEXT NOT NULL,
    "activityTypeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "ActivityDimensionKind" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityTypeId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL,
    "dateStr" TEXT NOT NULL,
    "timezoneOffsetMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLogValue" (
    "id" TEXT NOT NULL,
    "logId" TEXT NOT NULL,
    "dimensionId" TEXT,
    "keySnapshot" TEXT NOT NULL,
    "labelSnapshot" TEXT NOT NULL,
    "kindSnapshot" "ActivityDimensionKind" NOT NULL,
    "textValue" TEXT,
    "numberValue" DOUBLE PRECISION,
    "unitValue" TEXT,
    "dateValue" TEXT,
    "timeValue" TEXT,
    "dateTimeValue" TIMESTAMP(3),
    "intValue" INTEGER,
    "jsonValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLogValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityType_userId_name_key" ON "ActivityType"("userId", "name");

-- CreateIndex
CREATE INDEX "ActivityType_userId_archivedAt_idx" ON "ActivityType"("userId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityDimension_activityTypeId_key_key" ON "ActivityDimension"("activityTypeId", "key");

-- CreateIndex
CREATE INDEX "ActivityDimension_activityTypeId_sortOrder_idx" ON "ActivityDimension"("activityTypeId", "sortOrder");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_dateStr_idx" ON "ActivityLog"("userId", "dateStr");

-- CreateIndex
CREATE INDEX "ActivityLog_activityTypeId_loggedAt_idx" ON "ActivityLog"("activityTypeId", "loggedAt");

-- CreateIndex
CREATE INDEX "ActivityLogValue_logId_idx" ON "ActivityLogValue"("logId");

-- CreateIndex
CREATE INDEX "ActivityLogValue_dimensionId_idx" ON "ActivityLogValue"("dimensionId");

-- AddForeignKey
ALTER TABLE "ActivityDimension" ADD CONSTRAINT "ActivityDimension_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "ActivityType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "ActivityType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLogValue" ADD CONSTRAINT "ActivityLogValue_logId_fkey" FOREIGN KEY ("logId") REFERENCES "ActivityLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLogValue" ADD CONSTRAINT "ActivityLogValue_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "ActivityDimension"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "UserHomePreferences"
ADD COLUMN "showActivitySummary" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "componentOrder" SET DEFAULT '["macroSummary","hydrationSummary","workoutSummary","medsSummary","microNutrientSummary","activitySummary"]';
