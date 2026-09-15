import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assignmentMatches } from "@/lib/public-assignment";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  visitorId: z.string().min(8).max(200), siteId: z.string(), campaignId: z.string(), variantId: z.string(),
  type: z.literal("IMPRESSION"), idempotencyKey: z.string().min(8).max(100),
  device: z.enum(["mobile", "desktop"]).optional(), path: z.string().max(500).optional(), referrerHost: z.string().max(200).optional(),
});
const cors = { "Access-Control-Allow-Origin": "*" };
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" } }); }

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (!rateLimit(`event:${ip}`, 120)) return new NextResponse(null, { status: 202, headers: cors });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400, headers: cors });
  const assignment = await assignmentMatches(parsed.data.siteId, parsed.data.campaignId, parsed.data.variantId, parsed.data.visitorId);
  if (!assignment) return NextResponse.json({ error: "Invalid event" }, { status: 400, headers: cors });
  const site = await db.site.findUniqueOrThrow({ where: { publicId: parsed.data.siteId }, select: { id: true } });
  const abuseHash = crypto.createHash("sha256").update(`${new Date().toISOString().slice(0, 10)}:${ip}`).digest("hex");
  await db.event.create({ data: {
    siteId: site.id, campaignId: parsed.data.campaignId, variantId: assignment.variantId, type: "IMPRESSION",
    idempotencyKey: parsed.data.idempotencyKey, device: parsed.data.device, path: parsed.data.path,
    referrerHost: parsed.data.referrerHost, abuseHash,
  } }).catch(() => null);
  return new NextResponse(null, { status: 202, headers: cors });
}
