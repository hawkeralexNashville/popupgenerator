CREATE TYPE "EmbeddedFormStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED');

CREATE TABLE "EmbeddedForm" (
  "id" TEXT NOT NULL, "publicId" TEXT NOT NULL, "siteId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "status" "EmbeddedFormStatus" NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "EmbeddedForm_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmbeddedFormVariant" (
  "id" TEXT NOT NULL, "embeddedFormId" TEXT NOT NULL, "name" TEXT NOT NULL, "config" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "EmbeddedFormVariant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmbeddedFormAssignment" (
  "id" TEXT NOT NULL, "visitorHash" TEXT NOT NULL, "embeddedFormId" TEXT NOT NULL, "variantId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmbeddedFormAssignment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmbeddedFormEvent" (
  "id" TEXT NOT NULL, "siteId" TEXT NOT NULL, "embeddedFormId" TEXT NOT NULL, "variantId" TEXT NOT NULL,
  "type" "EventType" NOT NULL, "idempotencyKey" TEXT, "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "device" TEXT, "path" TEXT, "referrerHost" TEXT, "abuseHash" TEXT,
  CONSTRAINT "EmbeddedFormEvent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmbeddedSubscriptionAttempt" (
  "id" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "siteId" TEXT NOT NULL, "embeddedFormId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL, "status" "SubscriptionAttemptStatus" NOT NULL DEFAULT 'PROCESSING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmbeddedSubscriptionAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmbeddedForm_publicId_key" ON "EmbeddedForm"("publicId");
CREATE INDEX "EmbeddedForm_siteId_status_idx" ON "EmbeddedForm"("siteId", "status");
CREATE UNIQUE INDEX "EmbeddedFormAssignment_visitorHash_embeddedFormId_key" ON "EmbeddedFormAssignment"("visitorHash", "embeddedFormId");
CREATE INDEX "EmbeddedFormAssignment_expiresAt_idx" ON "EmbeddedFormAssignment"("expiresAt");
CREATE UNIQUE INDEX "EmbeddedFormEvent_type_idempotencyKey_key" ON "EmbeddedFormEvent"("type", "idempotencyKey");
CREATE INDEX "EmbeddedFormEvent_embeddedFormId_occurredAt_idx" ON "EmbeddedFormEvent"("embeddedFormId", "occurredAt");
CREATE INDEX "EmbeddedFormEvent_variantId_occurredAt_idx" ON "EmbeddedFormEvent"("variantId", "occurredAt");
CREATE UNIQUE INDEX "EmbeddedSubscriptionAttempt_idempotencyKey_key" ON "EmbeddedSubscriptionAttempt"("idempotencyKey");
CREATE INDEX "EmbeddedSubscriptionAttempt_createdAt_idx" ON "EmbeddedSubscriptionAttempt"("createdAt");
ALTER TABLE "EmbeddedForm" ADD CONSTRAINT "EmbeddedForm_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmbeddedFormVariant" ADD CONSTRAINT "EmbeddedFormVariant_embeddedFormId_fkey" FOREIGN KEY ("embeddedFormId") REFERENCES "EmbeddedForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmbeddedFormAssignment" ADD CONSTRAINT "EmbeddedFormAssignment_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "EmbeddedFormVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmbeddedFormEvent" ADD CONSTRAINT "EmbeddedFormEvent_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmbeddedFormEvent" ADD CONSTRAINT "EmbeddedFormEvent_embeddedFormId_fkey" FOREIGN KEY ("embeddedFormId") REFERENCES "EmbeddedForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmbeddedFormEvent" ADD CONSTRAINT "EmbeddedFormEvent_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "EmbeddedFormVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
