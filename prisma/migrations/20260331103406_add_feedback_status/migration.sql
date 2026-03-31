-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'DEFERRED', 'PRIORITY', 'IGNORED', 'COMPLETE');

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Backfill existing rows
UPDATE "Feedback" SET "updatedAt" = "createdAt" WHERE "updatedAt" = now();

-- CreateIndex
CREATE INDEX "Feedback_status_idx" ON "Feedback"("status");
