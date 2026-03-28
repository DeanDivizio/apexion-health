-- AlterTable
ALTER TABLE "NutritionRetailChainSource"
ADD COLUMN "manualStoragePath" TEXT,
ADD COLUMN "manualFileName" TEXT,
ADD COLUMN "manualMimeType" TEXT,
ADD COLUMN "manualFileSizeBytes" INTEGER,
ADD COLUMN "manualChecksumSha256" TEXT,
ADD COLUMN "manualUploadedAt" TIMESTAMP(3);
