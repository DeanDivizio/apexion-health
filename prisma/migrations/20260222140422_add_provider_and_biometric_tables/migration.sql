-- CreateEnum
CREATE TYPE "ProviderConnectionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateTable
CREATE TABLE "ProviderConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT[],
    "status" "ProviderConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" TIMESTAMP(3),
    "syncCursor" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhoopCycle" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "whoopCycleId" INTEGER NOT NULL,
    "whoopUserId" INTEGER NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3),
    "timezoneOffset" TEXT NOT NULL,
    "scoreState" TEXT NOT NULL,
    "strain" DOUBLE PRECISION,
    "kilojoule" DOUBLE PRECISION,
    "averageHeartRate" INTEGER,
    "maxHeartRate" INTEGER,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhoopCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhoopSleep" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "whoopSleepId" TEXT NOT NULL,
    "whoopCycleId" INTEGER NOT NULL,
    "whoopUserId" INTEGER NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "timezoneOffset" TEXT NOT NULL,
    "nap" BOOLEAN NOT NULL,
    "scoreState" TEXT NOT NULL,
    "totalInBedTimeMilli" INTEGER,
    "totalAwakeTimeMilli" INTEGER,
    "totalNoDataTimeMilli" INTEGER,
    "totalLightSleepTimeMilli" INTEGER,
    "totalSlowWaveSleepTimeMilli" INTEGER,
    "totalRemSleepTimeMilli" INTEGER,
    "sleepCycleCount" INTEGER,
    "disturbanceCount" INTEGER,
    "sleepNeededBaselineMilli" INTEGER,
    "needFromSleepDebtMilli" INTEGER,
    "needFromRecentStrainMilli" INTEGER,
    "needFromRecentNapMilli" INTEGER,
    "respiratoryRate" DOUBLE PRECISION,
    "sleepPerformancePct" DOUBLE PRECISION,
    "sleepConsistencyPct" DOUBLE PRECISION,
    "sleepEfficiencyPct" DOUBLE PRECISION,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhoopSleep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhoopRecovery" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "whoopCycleId" INTEGER NOT NULL,
    "whoopSleepId" TEXT NOT NULL,
    "whoopUserId" INTEGER NOT NULL,
    "scoreState" TEXT NOT NULL,
    "userCalibrating" BOOLEAN,
    "recoveryScore" DOUBLE PRECISION,
    "restingHeartRate" DOUBLE PRECISION,
    "hrvRmssdMilli" DOUBLE PRECISION,
    "spo2Percentage" DOUBLE PRECISION,
    "skinTempCelsius" DOUBLE PRECISION,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhoopRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhoopWorkout" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "whoopWorkoutId" TEXT NOT NULL,
    "whoopUserId" INTEGER NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "timezoneOffset" TEXT NOT NULL,
    "sportName" TEXT NOT NULL,
    "sportId" INTEGER,
    "scoreState" TEXT NOT NULL,
    "strain" DOUBLE PRECISION,
    "averageHeartRate" INTEGER,
    "maxHeartRate" INTEGER,
    "kilojoule" DOUBLE PRECISION,
    "percentRecorded" DOUBLE PRECISION,
    "distanceMeter" DOUBLE PRECISION,
    "altitudeGainMeter" DOUBLE PRECISION,
    "altitudeChangeMeter" DOUBLE PRECISION,
    "zoneZeroMilli" INTEGER,
    "zoneOneMilli" INTEGER,
    "zoneTwoMilli" INTEGER,
    "zoneThreeMilli" INTEGER,
    "zoneFourMilli" INTEGER,
    "zoneFiveMilli" INTEGER,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhoopWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricSleep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateStr" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSleepId" TEXT,
    "nap" BOOLEAN NOT NULL DEFAULT false,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "totalInBedTimeMilli" INTEGER,
    "totalAwakeTimeMilli" INTEGER,
    "totalLightSleepTimeMilli" INTEGER,
    "totalDeepSleepTimeMilli" INTEGER,
    "totalRemSleepTimeMilli" INTEGER,
    "sleepCycleCount" INTEGER,
    "disturbanceCount" INTEGER,
    "sleepNeededMilli" INTEGER,
    "respiratoryRate" DOUBLE PRECISION,
    "sleepPerformancePct" DOUBLE PRECISION,
    "sleepConsistencyPct" DOUBLE PRECISION,
    "sleepEfficiencyPct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricSleep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricRecovery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateStr" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRecoveryRef" TEXT,
    "recoveryScore" DOUBLE PRECISION,
    "restingHeartRate" DOUBLE PRECISION,
    "hrvRmssdMilli" DOUBLE PRECISION,
    "spo2Percentage" DOUBLE PRECISION,
    "skinTempCelsius" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricWorkout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateStr" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerWorkoutId" TEXT,
    "sportName" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "strain" DOUBLE PRECISION,
    "averageHeartRate" INTEGER,
    "maxHeartRate" INTEGER,
    "kilojoule" DOUBLE PRECISION,
    "distanceMeter" DOUBLE PRECISION,
    "zoneZeroMilli" INTEGER,
    "zoneOneMilli" INTEGER,
    "zoneTwoMilli" INTEGER,
    "zoneThreeMilli" INTEGER,
    "zoneFourMilli" INTEGER,
    "zoneFiveMilli" INTEGER,
    "gymSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricCycleSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateStr" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerCycleRef" TEXT,
    "strain" DOUBLE PRECISION,
    "kilojoule" DOUBLE PRECISION,
    "averageHeartRate" INTEGER,
    "maxHeartRate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricCycleSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricBodyMeasurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "heightMeter" DOUBLE PRECISION,
    "weightKilogram" DOUBLE PRECISION,
    "maxHeartRate" INTEGER,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricBodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderConnection_userId_idx" ON "ProviderConnection"("userId");

-- CreateIndex
CREATE INDEX "ProviderConnection_provider_status_idx" ON "ProviderConnection"("provider", "status");

-- CreateIndex
CREATE INDEX "ProviderConnection_providerUserId_provider_idx" ON "ProviderConnection"("providerUserId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderConnection_userId_provider_key" ON "ProviderConnection"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "WhoopCycle_whoopCycleId_key" ON "WhoopCycle"("whoopCycleId");

-- CreateIndex
CREATE INDEX "WhoopCycle_connectionId_idx" ON "WhoopCycle"("connectionId");

-- CreateIndex
CREATE INDEX "WhoopCycle_whoopUserId_start_idx" ON "WhoopCycle"("whoopUserId", "start");

-- CreateIndex
CREATE UNIQUE INDEX "WhoopSleep_whoopSleepId_key" ON "WhoopSleep"("whoopSleepId");

-- CreateIndex
CREATE INDEX "WhoopSleep_connectionId_idx" ON "WhoopSleep"("connectionId");

-- CreateIndex
CREATE INDEX "WhoopSleep_whoopUserId_start_idx" ON "WhoopSleep"("whoopUserId", "start");

-- CreateIndex
CREATE INDEX "WhoopSleep_whoopCycleId_idx" ON "WhoopSleep"("whoopCycleId");

-- CreateIndex
CREATE UNIQUE INDEX "WhoopRecovery_whoopCycleId_key" ON "WhoopRecovery"("whoopCycleId");

-- CreateIndex
CREATE INDEX "WhoopRecovery_connectionId_idx" ON "WhoopRecovery"("connectionId");

-- CreateIndex
CREATE INDEX "WhoopRecovery_whoopUserId_idx" ON "WhoopRecovery"("whoopUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WhoopWorkout_whoopWorkoutId_key" ON "WhoopWorkout"("whoopWorkoutId");

-- CreateIndex
CREATE INDEX "WhoopWorkout_connectionId_idx" ON "WhoopWorkout"("connectionId");

-- CreateIndex
CREATE INDEX "WhoopWorkout_whoopUserId_start_idx" ON "WhoopWorkout"("whoopUserId", "start");

-- CreateIndex
CREATE INDEX "BiometricSleep_userId_dateStr_idx" ON "BiometricSleep"("userId", "dateStr");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricSleep_userId_providerSleepId_key" ON "BiometricSleep"("userId", "providerSleepId");

-- CreateIndex
CREATE INDEX "BiometricRecovery_userId_dateStr_idx" ON "BiometricRecovery"("userId", "dateStr");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricRecovery_userId_dateStr_provider_key" ON "BiometricRecovery"("userId", "dateStr", "provider");

-- CreateIndex
CREATE INDEX "BiometricWorkout_userId_dateStr_idx" ON "BiometricWorkout"("userId", "dateStr");

-- CreateIndex
CREATE INDEX "BiometricWorkout_gymSessionId_idx" ON "BiometricWorkout"("gymSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricWorkout_userId_providerWorkoutId_key" ON "BiometricWorkout"("userId", "providerWorkoutId");

-- CreateIndex
CREATE INDEX "BiometricCycleSummary_userId_dateStr_idx" ON "BiometricCycleSummary"("userId", "dateStr");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricCycleSummary_userId_dateStr_provider_key" ON "BiometricCycleSummary"("userId", "dateStr", "provider");

-- CreateIndex
CREATE INDEX "BiometricBodyMeasurement_userId_idx" ON "BiometricBodyMeasurement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricBodyMeasurement_userId_provider_key" ON "BiometricBodyMeasurement"("userId", "provider");

-- AddForeignKey
ALTER TABLE "WhoopCycle" ADD CONSTRAINT "WhoopCycle_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ProviderConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhoopSleep" ADD CONSTRAINT "WhoopSleep_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ProviderConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhoopRecovery" ADD CONSTRAINT "WhoopRecovery_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ProviderConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhoopWorkout" ADD CONSTRAINT "WhoopWorkout_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ProviderConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiometricWorkout" ADD CONSTRAINT "BiometricWorkout_gymSessionId_fkey" FOREIGN KEY ("gymSessionId") REFERENCES "GymWorkoutSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
