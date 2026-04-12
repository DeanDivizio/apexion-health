-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('PODCAST', 'PAPER', 'MANUAL');

-- CreateEnum
CREATE TYPE "KnowledgeSourceStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "KnowledgeIngestionStep" AS ENUM ('FETCH', 'CHUNK', 'EMBED', 'EXTRACT_ENTITIES', 'EXTRACT_CLAIMS', 'VERIFY_CLAIMS');

-- CreateEnum
CREATE TYPE "KnowledgeIngestionRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "KnowledgeClaimVerification" AS ENUM ('UNVERIFIED', 'SUPPORTED', 'CONTESTED', 'REFUTED');

-- CreateTable
CREATE TABLE "KnowledgeChannel" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "topicDomains" TEXT[],
    "relevanceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastScannedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "id" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "url" TEXT,
    "channelId" TEXT,
    "status" "KnowledgeSourceStatus" NOT NULL DEFAULT 'PENDING',
    "relevanceScore" DOUBLE PRECISION,
    "fetchTier" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeIngestionRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "step" "KnowledgeIngestionStep" NOT NULL,
    "status" "KnowledgeIngestionRunStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "stats" JSONB,
    "batchId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeIngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeClaim" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "chunkRef" TEXT,
    "claimText" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "verificationStatus" "KnowledgeClaimVerification" NOT NULL DEFAULT 'UNVERIFIED',
    "supportingPaperIds" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeChannel_channelId_key" ON "KnowledgeChannel"("channelId");

-- CreateIndex
CREATE INDEX "KnowledgeChannel_active_idx" ON "KnowledgeChannel"("active");

-- CreateIndex
CREATE INDEX "KnowledgeSource_status_idx" ON "KnowledgeSource"("status");

-- CreateIndex
CREATE INDEX "KnowledgeSource_channelId_idx" ON "KnowledgeSource"("channelId");

-- CreateIndex
CREATE INDEX "KnowledgeSource_sourceType_idx" ON "KnowledgeSource"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSource_sourceType_externalId_key" ON "KnowledgeSource"("sourceType", "externalId");

-- CreateIndex
CREATE INDEX "KnowledgeIngestionRun_sourceId_step_idx" ON "KnowledgeIngestionRun"("sourceId", "step");

-- CreateIndex
CREATE INDEX "KnowledgeIngestionRun_status_idx" ON "KnowledgeIngestionRun"("status");

-- CreateIndex
CREATE INDEX "KnowledgeIngestionRun_batchId_idx" ON "KnowledgeIngestionRun"("batchId");

-- CreateIndex
CREATE INDEX "KnowledgeClaim_sourceId_idx" ON "KnowledgeClaim"("sourceId");

-- CreateIndex
CREATE INDEX "KnowledgeClaim_verificationStatus_idx" ON "KnowledgeClaim"("verificationStatus");

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "KnowledgeChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeIngestionRun" ADD CONSTRAINT "KnowledgeIngestionRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeClaim" ADD CONSTRAINT "KnowledgeClaim_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
