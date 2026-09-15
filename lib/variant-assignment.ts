import crypto from "node:crypto";

export const ASSIGNMENT_LIFETIME_MS = 3650 * 24 * 60 * 60 * 1000;

export function hashVisitor(visitorId: string) {
  return crypto.createHash("sha256").update(visitorId).digest("hex");
}

function allocationHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Keeps a valid persisted choice, otherwise allocates evenly. Keeping allocation
 * separate makes it possible to add weights later without changing persistence.
 */
export function selectVariant(
  visitorHash: string,
  campaignId: string,
  enabledVariantIds: string[],
  assignedVariantId?: string,
) {
  if (!enabledVariantIds.length) throw new Error("No enabled variants");
  if (assignedVariantId && enabledVariantIds.includes(assignedVariantId)) {
    return assignedVariantId;
  }
  const stableIds = [...enabledVariantIds].sort();
  return stableIds[allocationHash(`${visitorHash}:${campaignId}`) % stableIds.length];
}
