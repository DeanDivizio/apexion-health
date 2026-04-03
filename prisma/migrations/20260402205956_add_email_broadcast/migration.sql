-- CreateTable
CREATE TABLE "EmailBroadcast" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "sentCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailBroadcast_createdAt_idx" ON "EmailBroadcast"("createdAt");
