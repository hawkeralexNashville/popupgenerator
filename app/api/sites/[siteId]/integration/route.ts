import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownedSite } from "@/lib/tenant";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

const credentialsSchema = z.object({
  apiKey: z.union([z.literal(""), z.string().min(10).max(500)]).optional().default(""),
  publicationId: z.string().trim().min(3).max(200),
});

export async function PUT(req: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  if (!await ownedSite(siteId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const parsed = credentialsSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

    const existing = await db.integration.findUnique({ where: { siteId } });
    if (!existing && parsed.data.apiKey.length < 10) {
      return NextResponse.json({ error: "Enter your Beehiiv private API key" }, { status: 400 });
    }
    const apiKey = parsed.data.apiKey.length >= 10 ? parsed.data.apiKey : decryptSecret(existing!.encryptedApiKey);
    const response = await fetch(`https://api.beehiiv.com/v2/publications/${encodeURIComponent(parsed.data.publicationId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) return NextResponse.json({ error: "Beehiiv could not verify these credentials" }, { status: 400 });

    await db.integration.upsert({
      where: { siteId },
      create: { siteId, publicationId: parsed.data.publicationId, encryptedApiKey: encryptSecret(apiKey), verifiedAt: new Date() },
      update: {
        publicationId: parsed.data.publicationId,
        ...(parsed.data.apiKey.length >= 10 ? { encryptedApiKey: encryptSecret(apiKey) } : {}),
        verifiedAt: new Date(),
      },
    });
    // The private API key is intentionally never included in this response.
    return NextResponse.json({ connected: true, publicationId: parsed.data.publicationId, apiKeyStored: true });
  } catch (error) {
    console.error("Beehiiv integration update failed", { siteId, error });
    return NextResponse.json({ error: "Could not connect Beehiiv. Please try again." }, { status: 500 });
  }
}
