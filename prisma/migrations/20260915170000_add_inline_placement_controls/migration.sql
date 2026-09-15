ALTER TABLE "Campaign"
ADD COLUMN "inlinePlacement" JSONB NOT NULL DEFAULT '{"firstAfter":4,"repeatEvery":10,"maxInsertions":3}';
