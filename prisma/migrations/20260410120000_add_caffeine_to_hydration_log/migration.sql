-- AlterTable
ALTER TABLE "HydrationLog" ADD COLUMN "beverageSubtype" TEXT,
ADD COLUMN "caffeineMg" DOUBLE PRECISION NOT NULL DEFAULT 0;
