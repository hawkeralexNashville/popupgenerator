import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultVariant } from "@/lib/schemas";

const mocks = vi.hoisted(() => ({
  assignmentMatches: vi.fn(),
  fetch: vi.fn(),
  requireWorkspace: vi.fn(),
  siteFindMany: vi.fn(),
  siteFindUnique: vi.fn(),
  siteFindUniqueOrThrow: vi.fn(),
  variantFindUnique: vi.fn(),
  eventFindFirst: vi.fn(),
  eventCreate: vi.fn(),
  attemptCreate: vi.fn(),
  attemptFindUnique: vi.fn(),
  attemptDelete: vi.fn(),
  attemptUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/public-assignment", () => ({ assignmentMatches: mocks.assignmentMatches }));
vi.mock("@/lib/crypto", () => ({ decryptSecret: () => "test-api-key" }));
vi.mock("@/lib/tenant", () => ({ requireWorkspace: mocks.requireWorkspace }));
vi.mock("@/lib/db", () => ({ db: {
  site: { findMany: mocks.siteFindMany, findUnique: mocks.siteFindUnique, findUniqueOrThrow: mocks.siteFindUniqueOrThrow },
  variant: { findUnique: mocks.variantFindUnique },
  event: { create: mocks.eventCreate, findFirst: mocks.eventFindFirst },
  subscriptionAttempt: { create: mocks.attemptCreate, findUnique: mocks.attemptFindUnique, delete: mocks.attemptDelete, update: mocks.attemptUpdate },
  $transaction: mocks.transaction,
} }));

import { GET as listSites } from "@/app/api/sites/route";
import { GET as loadConfig } from "@/app/api/public/sites/[siteId]/config/route";
import { POST as recordImpression } from "@/app/api/public/events/route";
import { POST as subscribe } from "@/app/api/public/subscribe/route";

describe("production pilot smoke path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("loads an authenticated site's campaign and records matching A/B events after Beehiiv succeeds", async () => {
    const ids = { siteId: "site-internal", publicSiteId: "site-public", campaignId: "campaign-1", variantId: "variant-a" };
    mocks.requireWorkspace.mockResolvedValue({ id: "workspace-1" });
    mocks.siteFindMany.mockResolvedValue([{ id: ids.siteId, publicId: ids.publicSiteId }]);
    expect((await listSites()).status).toBe(200);

    mocks.siteFindUnique.mockResolvedValue({
      publicId: ids.publicSiteId,
      configVersion: 1,
      campaigns: [{
        id: ids.campaignId, priority: 1, placement: "MODAL", inlinePlacement: {},
        trigger: { seconds: 1 }, targeting: {}, frequency: { kind: "session" },
        variants: [{ id: ids.variantId, name: "Pilot A", config: defaultVariant }],
      }],
    });
    const config = await loadConfig(new Request("https://app.test/config"), { params: Promise.resolve({ siteId: ids.publicSiteId }) });
    expect(config.status).toBe(200);
    expect((await config.json()).campaigns[0].variants[0].id).toBe(ids.variantId);

    mocks.assignmentMatches.mockResolvedValue({ variantId: ids.variantId });
    mocks.siteFindUniqueOrThrow.mockResolvedValue({ id: ids.siteId });
    mocks.eventCreate.mockResolvedValue({ id: "event-1" });
    const impression = await recordImpression(new Request("https://app.test/api/public/events", {
      method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2.1" },
      body: JSON.stringify({ visitorId: "visitor-123", siteId: ids.publicSiteId, campaignId: ids.campaignId, variantId: ids.variantId, type: "IMPRESSION", idempotencyKey: "impression-123" }),
    }));
    expect(impression.status).toBe(202);
    expect(mocks.eventCreate).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ siteId: ids.siteId, campaignId: ids.campaignId, variantId: ids.variantId, type: "IMPRESSION" }) }));

    mocks.variantFindUnique.mockResolvedValue({ id: ids.variantId, campaign: { siteId: ids.siteId, site: { integration: { publicationId: "publication-1", encryptedApiKey: "encrypted" } } } });
    mocks.eventFindFirst.mockResolvedValue(null);
    mocks.attemptCreate.mockResolvedValue({ id: "attempt-1" });
    mocks.attemptUpdate.mockReturnValue(Promise.resolve({ status: "SUCCEEDED" }));
    mocks.transaction.mockResolvedValue([]);
    mocks.fetch.mockResolvedValue(new Response(null, { status: 201 }));
    const result = await subscribe(new Request("https://app.test/api/public/subscribe", {
      method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2.2" },
      body: JSON.stringify({ email: "pilot@example.test", visitorId: "visitor-123", siteId: ids.publicSiteId, campaignId: ids.campaignId, variantId: ids.variantId, idempotencyKey: "conversion-123" }),
    }));
    expect(result.status).toBe(200);
    expect(mocks.fetch).toHaveBeenCalledOnce();
    expect(mocks.eventCreate).toHaveBeenLastCalledWith({ data: { siteId: ids.siteId, campaignId: ids.campaignId, variantId: ids.variantId, type: "CONVERSION", idempotencyKey: "conversion-123" } });
  });
});
