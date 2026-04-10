-- AlterTable
ALTER TABLE "HydrationLog" ADD COLUMN "beverageSubtype" TEXT,
ADD COLUMN "caffeineMg" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill existing coffee entries with default subtype "drip" (11.8 mg/fl oz)
UPDATE "HydrationLog"
SET "beverageSubtype" = 'drip',
    "caffeineMg" = ROUND("amountOz" * 11.8)
WHERE "beverageType" = 'coffee';

-- Backfill existing tea entries with default subtype "black" (5.9 mg/fl oz)
UPDATE "HydrationLog"
SET "beverageSubtype" = 'black',
    "caffeineMg" = ROUND("amountOz" * 5.9)
WHERE "beverageType" = 'tea';
