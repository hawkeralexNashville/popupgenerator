import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { decryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";
import { assignmentMatches } from "@/lib/public-assignment";
import { rateLimit } from "@/lib/rate-limit";

const subscribeSchema = z.object({ email: z.string().email().max(254), visitorId: z.string().min(8).max(200), siteId: z.string(), campaignId: z.string(), variantId: z.string(), idempotencyKey: z.string().min(8).max(100) });
const cors = { "Access-Control-Allow-Origin": "*" };
const BEEHIIV_TIMEOUT_MS = 9000;
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" } }); }

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (!rateLimit(`subscribe:${ip}`, 10, 3600000)) return NextResponse.json({ error: "Please try again later" }, { status: 429, headers: cors });
  const parsed = subscribeSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400, headers: cors });
  const assignment = await assignmentMatches(parsed.data.siteId, parsed.data.campaignId, parsed.data.variantId, parsed.data.visitorId);
  if (!assignment) return NextResponse.json({ error: "Signup is temporarily unavailable" }, { status: 503, headers: cors });
  const variant = await db.variant.findUnique({ where: { id: assignment.variantId }, include: { campaign: { include: { site: { include: { integration: true } } } } } });
  const integration = variant?.campaign.site.integration;
  if (!variant || !integration) return NextResponse.json({ error: "Signup is temporarily unavailable" }, { status: 503, headers: cors });
  const identifiers = { siteId: variant.campaign.siteId, campaignId: parsed.data.campaignId, variantId: assignment.variantId };
  const existingConversion = await db.event.findFirst({ where: { type: "CONVERSION", idempotencyKey: parsed.data.idempotencyKey } });
  if (existingConversion) return NextResponse.json({ ok: true }, { headers: cors });
  try {
    await db.subscriptionAttempt.create({ data: { idempotencyKey: parsed.data.idempotencyKey, ...identifiers } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const attempt = await db.subscriptionAttempt.findUnique({ where: { idempotencyKey: parsed.data.idempotencyKey } });
      if (attempt?.status === "SUCCEEDED") return NextResponse.json({ ok: true }, { headers: cors });
      return NextResponse.json({ error: "This subscription is already being processed. Please wait." }, { status: 409, headers: cors });
    }
    console.error("Subscription idempotency claim failed", { ...identifiers, error });
    return NextResponse.json({ error: "Signup is temporarily unavailable" }, { status: 503, headers: cors });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BEEHIIV_TIMEOUT_MS);
  try {
    const bee = await fetch(`https://api.beehiiv.com/v2/publications/${encodeURIComponent(integration.publicationId)}/subscriptions`, { method: "POST", headers: { Authorization: `Bearer ${decryptSecret(integration.encryptedApiKey)}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: parsed.data.email, reactivate_existing: true, send_welcome_email: true }), signal: controller.signal });
    if (!bee.ok) {
      console.error("Beehiiv subscription failed", { ...identifiers, status: bee.status });
      await db.subscriptionAttempt.delete({ where: { idempotencyKey: parsed.data.idempotencyKey } }).catch(() => null);
      return NextResponse.json({ error: "We could not subscribe you. Please try again." }, { status: 502, headers: cors });
    }
  } catch (error) {
    const timedOut = controller.signal.aborted;
    console.error(timedOut ? "Beehiiv subscription timed out" : "Beehiiv subscription request failed", { ...identifiers, error });
    await db.subscriptionAttempt.delete({ where: { idempotencyKey: parsed.data.idempotencyKey } }).catch(() => null);
    return NextResponse.json({ error: timedOut ? "The subscription service took too long to respond. Please try again." : "We could not subscribe you. Please try again." }, { status: timedOut ? 504 : 502, headers: cors });
  } finally {
    clearTimeout(timeout);
  }

  try {
    await db.$transaction([
      db.event.create({ data: { ...identifiers, type: "CONVERSION", idempotencyKey: parsed.data.idempotencyKey } }),
      db.subscriptionAttempt.update({ where: { idempotencyKey: parsed.data.idempotencyKey }, data: { status: "SUCCEEDED" } }),
    ]);
  } catch (error) {
    console.error("Conversion event creation failed", { ...identifiers, error });
    return NextResponse.json({ error: "You were subscribed, but confirmation is temporarily unavailable." }, { status: 503, headers: cors });
  }
  return NextResponse.json({ ok: true }, { headers: cors });
}
