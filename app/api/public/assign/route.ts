import { NextResponse } from "next/server";
import { z } from "zod";
import { resolvePublicAssignment } from "@/lib/public-assignment";
import { rateLimit } from "@/lib/rate-limit";
import { variantConfigSchema } from "@/lib/schemas";

const schema = z.object({
  visitorId: z.string().min(8).max(200),
  siteId: z.string().min(1).max(200),
  campaignId: z.string().min(1).max(200),
});
const cors = { "Access-Control-Allow-Origin": "*" };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (!rateLimit(`assignment:${ip}`, 120)) return NextResponse.json({ error: "Try again later" }, { status: 429, headers: cors });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid assignment request" }, { status: 400, headers: cors });
  const variant = await resolvePublicAssignment(parsed.data.siteId, parsed.data.campaignId, parsed.data.visitorId);
  const config = variant && variantConfigSchema.safeParse(variant.config);
  if (!variant || !config?.success) return NextResponse.json({ error: "Campaign not found" }, { status: 404, headers: cors });
  return NextResponse.json({ variant: { id: variant.id, config: config.data } }, { headers: { ...cors, "Cache-Control": "no-store" } });
}
