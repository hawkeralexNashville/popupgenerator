import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveEmbeddedAssignment } from "@/lib/embedded-assignment";
import { rateLimit } from "@/lib/rate-limit";
import { variantConfigSchema } from "@/lib/schemas";

const cors = { "Access-Control-Allow-Origin": "*" };
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" } }); }
export async function POST(request: Request, { params }: { params: Promise<{ formId: string }> }) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (!rateLimit(`embedded-assignment:${ip}`, 120)) return NextResponse.json({ error: "Try again later" }, { status: 429, headers: cors });
  const body = z.object({ visitorId: z.string().min(8).max(200) }).safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: cors });
  const { formId } = await params;
  const result = await resolveEmbeddedAssignment(formId, body.data.visitorId);
  const config = result && variantConfigSchema.safeParse(result.variant.config);
  if (!result || !config?.success) return NextResponse.json({ error: "Form not found" }, { status: 404, headers: cors });
  return NextResponse.json({ formId: result.formId, siteId: result.siteId, variant: { id: result.variant.id, config: config.data } }, { headers: { ...cors, "Cache-Control": "no-store" } });
}
