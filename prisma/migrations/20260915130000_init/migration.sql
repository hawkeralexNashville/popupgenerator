CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT','ACTIVE','PAUSED','ARCHIVED');
CREATE TYPE "EventType" AS ENUM ('IMPRESSION','CONVERSION');
CREATE TABLE "Workspace" ("id" TEXT PRIMARY KEY,"name" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "AccountMember" ("id" TEXT PRIMARY KEY,"userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,"workspaceId" TEXT NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,"role" TEXT NOT NULL DEFAULT 'OWNER',UNIQUE("userId","workspaceId"));
CREATE TABLE "Site" ("id" TEXT PRIMARY KEY,"publicId" TEXT NOT NULL UNIQUE,"workspaceId" TEXT NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,"name" TEXT NOT NULL,"url" TEXT NOT NULL,"domain" TEXT NOT NULL,"installStatus" TEXT NOT NULL DEFAULT 'NOT_DETECTED',"configVersion" INTEGER NOT NULL DEFAULT 1,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Integration" ("id" TEXT PRIMARY KEY,"siteId" TEXT NOT NULL UNIQUE REFERENCES "Site"("id") ON DELETE CASCADE,"provider" TEXT NOT NULL DEFAULT 'BEEHIIV',"publicationId" TEXT NOT NULL,"encryptedApiKey" TEXT NOT NULL,"verifiedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Campaign" ("id" TEXT PRIMARY KEY,"siteId" TEXT NOT NULL REFERENCES "Site"("id") ON DELETE CASCADE,"name" TEXT NOT NULL,"status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',"priority" INTEGER NOT NULL DEFAULT 0,"trigger" JSONB NOT NULL,"targeting" JSONB NOT NULL,"frequency" JSONB NOT NULL,"beehiivPublicationId" TEXT,"publishedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "Variant" ("id" TEXT PRIMARY KEY,"campaignId" TEXT NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,"name" TEXT NOT NULL,"config" JSONB NOT NULL,"enabled" BOOLEAN NOT NULL DEFAULT true,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "VisitorAssignment" ("id" TEXT PRIMARY KEY,"visitorHash" TEXT NOT NULL,"campaignId" TEXT NOT NULL,"variantId" TEXT NOT NULL REFERENCES "Variant"("id") ON DELETE CASCADE,"expiresAt" TIMESTAMP(3) NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE("visitorHash","campaignId"));
CREATE TABLE "Event" ("id" TEXT PRIMARY KEY,"siteId" TEXT NOT NULL REFERENCES "Site"("id") ON DELETE CASCADE,"campaignId" TEXT NOT NULL REFERENCES "Campaign"("id") ON DELETE CASCADE,"variantId" TEXT NOT NULL REFERENCES "Variant"("id") ON DELETE CASCADE,"type" "EventType" NOT NULL,"idempotencyKey" TEXT,"occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"device" TEXT,"path" TEXT,"referrerHost" TEXT,"abuseHash" TEXT,UNIQUE("type","idempotencyKey"));
CREATE INDEX "Campaign_siteId_status_priority_idx" ON "Campaign"("siteId","status","priority");
CREATE INDEX "VisitorAssignment_expiresAt_idx" ON "VisitorAssignment"("expiresAt");
CREATE INDEX "Event_campaignId_occurredAt_idx" ON "Event"("campaignId","occurredAt");
CREATE INDEX "Event_variantId_occurredAt_idx" ON "Event"("variantId","occurredAt");

-- Supabase Auth provisions one isolated workspace for each new user.
CREATE OR REPLACE FUNCTION public.provision_workspace() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE workspace_id TEXT := replace(gen_random_uuid()::text, '-', '');
BEGIN
  INSERT INTO "Workspace" ("id", "name") VALUES (workspace_id, COALESCE(new.raw_user_meta_data->>'name', 'My') || E'\'s workspace');
  INSERT INTO "AccountMember" ("id", "userId", "workspaceId", "role") VALUES (replace(gen_random_uuid()::text, '-', ''), new.id, workspace_id, 'OWNER');
  RETURN new;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.provision_workspace();

ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AccountMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Variant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisitorAssignment" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id TEXT) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM "AccountMember" m WHERE m."workspaceId" = workspace_id AND m."userId" = auth.uid())
$$;
CREATE POLICY "members read workspaces" ON "Workspace" FOR SELECT USING (public.is_workspace_member("id"));
CREATE POLICY "members read memberships" ON "AccountMember" FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "members manage sites" ON "Site" FOR ALL USING (public.is_workspace_member("workspaceId")) WITH CHECK (public.is_workspace_member("workspaceId"));
CREATE POLICY "members manage integrations" ON "Integration" FOR ALL USING (EXISTS (SELECT 1 FROM "Site" s WHERE s.id = "siteId" AND public.is_workspace_member(s."workspaceId")));
CREATE POLICY "members manage campaigns" ON "Campaign" FOR ALL USING (EXISTS (SELECT 1 FROM "Site" s WHERE s.id = "siteId" AND public.is_workspace_member(s."workspaceId")));
CREATE POLICY "members manage variants" ON "Variant" FOR ALL USING (EXISTS (SELECT 1 FROM "Campaign" c JOIN "Site" s ON s.id=c."siteId" WHERE c.id = "campaignId" AND public.is_workspace_member(s."workspaceId")));
CREATE POLICY "members read events" ON "Event" FOR SELECT USING (EXISTS (SELECT 1 FROM "Site" s WHERE s.id = "siteId" AND public.is_workspace_member(s."workspaceId")));

-- Public optimized popup assets. Upload/delete is restricted to workspace members.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('popup-images', 'popup-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "public reads popup images" ON storage.objects FOR SELECT USING (bucket_id = 'popup-images');
CREATE POLICY "members upload popup images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'popup-images' AND EXISTS (
    SELECT 1 FROM public."AccountMember" m
    WHERE m."userId" = auth.uid() AND m."workspaceId" = (storage.foldername(name))[1]
  )
);
CREATE POLICY "members delete popup images" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'popup-images' AND EXISTS (
    SELECT 1 FROM public."AccountMember" m
    WHERE m."userId" = auth.uid() AND m."workspaceId" = (storage.foldername(name))[1]
  )
);
