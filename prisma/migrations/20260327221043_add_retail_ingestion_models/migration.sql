-- CreateEnum
CREATE TYPE "NutritionSourceType" AS ENUM ('csv', 'xlsx', 'pdf', 'html_link', 'manual_upload');

-- CreateEnum
CREATE TYPE "NutritionFetchMethod" AS ENUM ('direct_download', 'manual_upload_only');

-- CreateEnum
CREATE TYPE "NutritionParserPreference" AS ENUM ('deterministic_first', 'ocr_allowed');

-- CreateEnum
CREATE TYPE "NutritionIngestionRunStatus" AS ENUM ('queued', 'fetching', 'fetched', 'parsing', 'staged', 'needs_source', 'fetch_failed', 'review_required', 'publish_ready', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "NutritionExtractionMethod" AS ENUM ('csv_parser', 'xlsx_parser', 'pdf_table_parser', 'ocr_llm');

-- CreateEnum
CREATE TYPE "NutritionValidationSeverity" AS ENUM ('hard', 'soft', 'info');

-- AlterTable
ALTER TABLE "NutritionRetailItem" ADD COLUMN     "lastArtifactId" TEXT,
ADD COLUMN     "lastIngestionRunId" TEXT,
ADD COLUMN     "normalizedName" TEXT,
ADD COLUMN     "sourceType" "NutritionSourceType",
ADD COLUMN     "sourceUrl" TEXT;

-- CreateTable
CREATE TABLE "NutritionRetailChainSource" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceType" "NutritionSourceType" NOT NULL,
    "fetchMethod" "NutritionFetchMethod" NOT NULL DEFAULT 'direct_download',
    "parserPreference" "NutritionParserPreference" NOT NULL DEFAULT 'deterministic_first',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionRetailChainSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRetailIngestionRun" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "sourceId" TEXT,
    "status" "NutritionIngestionRunStatus" NOT NULL DEFAULT 'queued',
    "triggeredByUserId" TEXT,
    "sourceUrlSnapshot" TEXT,
    "sourceTypeSnapshot" "NutritionSourceType",
    "fetchMethodSnapshot" "NutritionFetchMethod",
    "parserPreferenceSnapshot" "NutritionParserPreference",
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionRetailIngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRetailIngestionArtifact" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceType" "NutritionSourceType" NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "storagePath" TEXT,
    "fileSizeBytes" INTEGER,
    "checksumSha256" TEXT,
    "httpStatus" INTEGER,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionRetailIngestionArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRetailStagingItem" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "artifactId" TEXT,
    "chainId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT,
    "nutrients" JSONB NOT NULL,
    "servingSize" DOUBLE PRECISION,
    "servingUnit" TEXT,
    "extractionMethod" "NutritionExtractionMethod" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "hardIssueCount" INTEGER NOT NULL DEFAULT 0,
    "softIssueCount" INTEGER NOT NULL DEFAULT 0,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionRetailStagingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRetailStagingIssue" (
    "id" TEXT NOT NULL,
    "stagingItemId" TEXT NOT NULL,
    "severity" "NutritionValidationSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionRetailStagingIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRetailItemVersion" (
    "id" TEXT NOT NULL,
    "retailItemId" TEXT,
    "runId" TEXT NOT NULL,
    "artifactId" TEXT,
    "chainId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" TEXT,
    "nutrients" JSONB NOT NULL,
    "servingSize" DOUBLE PRECISION,
    "servingUnit" TEXT,
    "sourceType" "NutritionSourceType",
    "sourceUrl" TEXT,
    "versionNumber" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionRetailItemVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRetailItemAlias" (
    "id" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "retailItemId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalizedAlias" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionRetailItemAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NutritionRetailChainSource_chainId_active_priority_idx" ON "NutritionRetailChainSource"("chainId", "active", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionRetailChainSource_chainId_sourceName_key" ON "NutritionRetailChainSource"("chainId", "sourceName");

-- CreateIndex
CREATE INDEX "NutritionRetailIngestionRun_chainId_status_idx" ON "NutritionRetailIngestionRun"("chainId", "status");

-- CreateIndex
CREATE INDEX "NutritionRetailIngestionRun_sourceId_idx" ON "NutritionRetailIngestionRun"("sourceId");

-- CreateIndex
CREATE INDEX "NutritionRetailIngestionRun_startedAt_idx" ON "NutritionRetailIngestionRun"("startedAt");

-- CreateIndex
CREATE INDEX "NutritionRetailIngestionArtifact_runId_fetchedAt_idx" ON "NutritionRetailIngestionArtifact"("runId", "fetchedAt");

-- CreateIndex
CREATE INDEX "NutritionRetailIngestionArtifact_checksumSha256_idx" ON "NutritionRetailIngestionArtifact"("checksumSha256");

-- CreateIndex
CREATE INDEX "NutritionRetailStagingItem_runId_approved_idx" ON "NutritionRetailStagingItem"("runId", "approved");

-- CreateIndex
CREATE INDEX "NutritionRetailStagingItem_artifactId_idx" ON "NutritionRetailStagingItem"("artifactId");

-- CreateIndex
CREATE INDEX "NutritionRetailStagingItem_chainId_normalizedName_idx" ON "NutritionRetailStagingItem"("chainId", "normalizedName");

-- CreateIndex
CREATE INDEX "NutritionRetailStagingIssue_stagingItemId_severity_idx" ON "NutritionRetailStagingIssue"("stagingItemId", "severity");

-- CreateIndex
CREATE INDEX "NutritionRetailStagingIssue_code_idx" ON "NutritionRetailStagingIssue"("code");

-- CreateIndex
CREATE INDEX "NutritionRetailItemVersion_runId_publishedAt_idx" ON "NutritionRetailItemVersion"("runId", "publishedAt");

-- CreateIndex
CREATE INDEX "NutritionRetailItemVersion_retailItemId_versionNumber_idx" ON "NutritionRetailItemVersion"("retailItemId", "versionNumber");

-- CreateIndex
CREATE INDEX "NutritionRetailItemVersion_chainId_normalizedName_idx" ON "NutritionRetailItemVersion"("chainId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionRetailItemVersion_retailItemId_versionNumber_key" ON "NutritionRetailItemVersion"("retailItemId", "versionNumber");

-- CreateIndex
CREATE INDEX "NutritionRetailItemAlias_retailItemId_idx" ON "NutritionRetailItemAlias"("retailItemId");

-- CreateIndex
CREATE INDEX "NutritionRetailItemAlias_chainId_active_idx" ON "NutritionRetailItemAlias"("chainId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionRetailItemAlias_chainId_normalizedAlias_key" ON "NutritionRetailItemAlias"("chainId", "normalizedAlias");

-- CreateIndex
CREATE INDEX "NutritionRetailItem_chainId_normalizedName_idx" ON "NutritionRetailItem"("chainId", "normalizedName");

-- CreateIndex
CREATE INDEX "NutritionRetailItem_lastIngestionRunId_idx" ON "NutritionRetailItem"("lastIngestionRunId");

-- CreateIndex
CREATE INDEX "NutritionRetailItem_lastArtifactId_idx" ON "NutritionRetailItem"("lastArtifactId");

-- AddForeignKey
ALTER TABLE "NutritionRetailItem" ADD CONSTRAINT "NutritionRetailItem_lastIngestionRunId_fkey" FOREIGN KEY ("lastIngestionRunId") REFERENCES "NutritionRetailIngestionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailItem" ADD CONSTRAINT "NutritionRetailItem_lastArtifactId_fkey" FOREIGN KEY ("lastArtifactId") REFERENCES "NutritionRetailIngestionArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailChainSource" ADD CONSTRAINT "NutritionRetailChainSource_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "NutritionRetailChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailIngestionRun" ADD CONSTRAINT "NutritionRetailIngestionRun_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "NutritionRetailChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailIngestionRun" ADD CONSTRAINT "NutritionRetailIngestionRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "NutritionRetailChainSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailIngestionArtifact" ADD CONSTRAINT "NutritionRetailIngestionArtifact_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NutritionRetailIngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailStagingItem" ADD CONSTRAINT "NutritionRetailStagingItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NutritionRetailIngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailStagingItem" ADD CONSTRAINT "NutritionRetailStagingItem_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "NutritionRetailIngestionArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailStagingItem" ADD CONSTRAINT "NutritionRetailStagingItem_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "NutritionRetailChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailStagingIssue" ADD CONSTRAINT "NutritionRetailStagingIssue_stagingItemId_fkey" FOREIGN KEY ("stagingItemId") REFERENCES "NutritionRetailStagingItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailItemVersion" ADD CONSTRAINT "NutritionRetailItemVersion_retailItemId_fkey" FOREIGN KEY ("retailItemId") REFERENCES "NutritionRetailItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailItemVersion" ADD CONSTRAINT "NutritionRetailItemVersion_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NutritionRetailIngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailItemVersion" ADD CONSTRAINT "NutritionRetailItemVersion_artifactId_fkey" FOREIGN KEY ("artifactId") REFERENCES "NutritionRetailIngestionArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailItemVersion" ADD CONSTRAINT "NutritionRetailItemVersion_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "NutritionRetailChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailItemAlias" ADD CONSTRAINT "NutritionRetailItemAlias_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "NutritionRetailChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRetailItemAlias" ADD CONSTRAINT "NutritionRetailItemAlias_retailItemId_fkey" FOREIGN KEY ("retailItemId") REFERENCES "NutritionRetailItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
