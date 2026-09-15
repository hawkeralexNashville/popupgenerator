CREATE TYPE "CampaignPlacement" AS ENUM ('MODAL', 'INLINE');

ALTER TABLE "Campaign"
ADD COLUMN "placement" "CampaignPlacement" NOT NULL DEFAULT 'MODAL';
