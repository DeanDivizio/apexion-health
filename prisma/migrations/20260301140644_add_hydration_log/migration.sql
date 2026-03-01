-- CreateTable
CREATE TABLE "HydrationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountOz" DOUBLE PRECISION NOT NULL,
    "dateStr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HydrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HydrationLog_userId_dateStr_idx" ON "HydrationLog"("userId", "dateStr");
