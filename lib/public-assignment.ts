import { db } from "@/lib/db";
import { ASSIGNMENT_LIFETIME_MS, hashVisitor, selectVariant } from "@/lib/variant-assignment";

export async function resolvePublicAssignment(siteId: string, campaignId: string, visitorId: string) {
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, status: "ACTIVE", site: { publicId: siteId } },
    select: {
      id: true,
      variants: { where: { enabled: true }, select: { id: true, config: true } },
    },
  });
  if (!campaign?.variants.length) return null;

  const visitorHash = hashVisitor(visitorId);
  const existing = await db.visitorAssignment.findUnique({
    where: { visitorHash_campaignId: { visitorHash, campaignId } },
    select: { variantId: true },
  });
  const variantId = selectVariant(
    visitorHash,
    campaignId,
    campaign.variants.map((variant) => variant.id),
    existing?.variantId,
  );
  const assignment = await db.visitorAssignment.upsert({
    where: { visitorHash_campaignId: { visitorHash, campaignId } },
    create: {
      visitorHash,
      campaignId,
      variantId,
      expiresAt: new Date(Date.now() + ASSIGNMENT_LIFETIME_MS),
    },
    update: existing?.variantId === variantId ? {} : {
      variantId,
      expiresAt: new Date(Date.now() + ASSIGNMENT_LIFETIME_MS),
    },
    select: { variantId: true },
  });

  // A concurrent repair is authoritative even if the enabled set changed.
  return campaign.variants.find((variant) => variant.id === assignment.variantId) ?? null;
}

export async function assignmentMatches(siteId: string, campaignId: string, variantId: string, visitorId: string) {
  const visitorHash = hashVisitor(visitorId);
  return db.visitorAssignment.findFirst({
    where: {
      visitorHash,
      campaignId,
      variantId,
      variant: { enabled: true, campaign: { id: campaignId, status: "ACTIVE", site: { publicId: siteId } } },
    },
    select: { variantId: true },
  });
}
