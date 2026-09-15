import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isWorkspaceAuthError, requireWorkspace } from "@/lib/tenant";

const siteSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

export async function GET() {
  try {
    const workspace = await requireWorkspace();
    const sites = await db.site.findMany({
      where: { workspaceId: workspace.id },
      include: {
        _count: { select: { campaigns: true } },
        events: {
          where: { occurredAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
          select: { type: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sites);
  } catch (error) {
    if (isWorkspaceAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to list sites", { error });
    return NextResponse.json({ error: "Could not load sites" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspace = await requireWorkspace();
    const payload = siteSchema.parse(await request.json());
    const url = new URL(payload.url);
    if (!["http:", "https:"].includes(url.protocol)) {
      return NextResponse.json({ error: "Invalid site" }, { status: 400 });
    }

    const site = await db.site.create({
      data: {
        workspaceId: workspace.id,
        name: payload.name,
        url: url.origin,
        domain: url.hostname.toLowerCase(),
      },
    });
    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    if (isWorkspaceAuthError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid site" }, { status: 400 });
    }
    console.error("Failed to create site", { error });
    return NextResponse.json({ error: "Could not create site" }, { status: 500 });
  }
}
