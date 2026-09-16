import { db } from "@/lib/db";
import { ASSIGNMENT_LIFETIME_MS, hashVisitor, selectVariant } from "@/lib/variant-assignment";

export async function resolveEmbeddedAssignment(publicFormId: string, visitorId: string) {
  const form = await db.embeddedForm.findFirst({
    where: { publicId: publicFormId, status: "ACTIVE" },
    select: { id: true, site: { select: { publicId: true } }, variants: { where: { enabled: true }, select: { id: true, config: true } } },
  });
  if (!form?.variants.length) return null;
  const visitorHash = hashVisitor(visitorId);
  const existing = await db.embeddedFormAssignment.findUnique({
    where: { visitorHash_embeddedFormId: { visitorHash, embeddedFormId: form.id } }, select: { variantId: true },
  });
  const variantId = selectVariant(visitorHash, form.id, form.variants.map((variant) => variant.id), existing?.variantId);
  const assignment = await db.embeddedFormAssignment.upsert({
    where: { visitorHash_embeddedFormId: { visitorHash, embeddedFormId: form.id } },
    create: { visitorHash, embeddedFormId: form.id, variantId, expiresAt: new Date(Date.now() + ASSIGNMENT_LIFETIME_MS) },
    update: existing?.variantId === variantId ? {} : { variantId, expiresAt: new Date(Date.now() + ASSIGNMENT_LIFETIME_MS) },
    select: { variantId: true },
  });
  const variant = form.variants.find((candidate) => candidate.id === assignment.variantId);
  return variant ? { formId: form.id, siteId: form.site.publicId, variant } : null;
}

export async function embeddedAssignmentMatches(publicFormId: string, variantId: string, visitorId: string) {
  return db.embeddedFormAssignment.findFirst({ where: {
    visitorHash: hashVisitor(visitorId), variantId,
    variant: { enabled: true, embeddedForm: { publicId: publicFormId, status: "ACTIVE" } },
  }, select: { variantId: true, embeddedFormId: true } });
}
