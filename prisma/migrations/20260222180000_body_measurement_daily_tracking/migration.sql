-- Backfill dateStr from fetchedAt for existing rows before adding NOT NULL
ALTER TABLE "BiometricBodyMeasurement" ADD COLUMN "dateStr" TEXT;

UPDATE "BiometricBodyMeasurement"
SET "dateStr" = TO_CHAR("fetchedAt" AT TIME ZONE 'UTC', 'YYYYMMDD')
WHERE "dateStr" IS NULL;

ALTER TABLE "BiometricBodyMeasurement" ALTER COLUMN "dateStr" SET NOT NULL;

-- Drop old unique constraint (userId, provider)
DROP INDEX "BiometricBodyMeasurement_userId_provider_key";

-- Drop old index
DROP INDEX "BiometricBodyMeasurement_userId_idx";

-- Create new unique constraint (userId, provider, dateStr)
CREATE UNIQUE INDEX "BiometricBodyMeasurement_userId_provider_dateStr_key"
  ON "BiometricBodyMeasurement"("userId", "provider", "dateStr");

-- Create new index for querying by user + date
CREATE INDEX "BiometricBodyMeasurement_userId_dateStr_idx"
  ON "BiometricBodyMeasurement"("userId", "dateStr");
