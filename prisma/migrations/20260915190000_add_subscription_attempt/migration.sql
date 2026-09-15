CREATE TYPE "SubscriptionAttemptStatus" AS ENUM ('PROCESSING', 'SUCCEEDED');

CREATE TABLE "SubscriptionAttempt" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "status" "SubscriptionAttemptStatus" NOT NULL DEFAULT 'PROCESSING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubscriptionAttempt_idempotencyKey_key" ON "SubscriptionAttempt"("idempotencyKey");
CREATE INDEX "SubscriptionAttempt_createdAt_idx" ON "SubscriptionAttempt"("createdAt");
