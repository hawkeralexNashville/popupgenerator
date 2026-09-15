import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownedCampaign } from "@/lib/tenant";
import {
  frequencySchema,
  targetingSchema,
  triggerSchema,
  variantConfigSchema,
} from "@/lib/schemas";

const body = z.object({
  name: z.string().min(1).max(120),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]),
  priority: z.number().int().min(0).max(999),
  trigger: triggerSchema,
  targeting: targetingSchema,
  frequency: frequencySchema,
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(60),
    enabled: z.boolean(),
    config: variantConfigSchema,
  })).min(1).max(50),
});

type RouteContext = { params: Promise<{ campaignId: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  const { campaignId } = await params;
  const campaign = await ownedCampaign(campaignId);
  return campaign
    ? NextResponse.json(campaign)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { campaignId } = await params;
  const campaign = await ownedCampaign(campaignId);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        name: parsed.data.name,
        status: parsed.data.status,
        priority: parsed.data.priority,
        trigger: parsed.data.trigger,
        targeting: parsed.data.targeting,
        frequency: parsed.data.frequency,
        publishedAt: parsed.data.status === "ACTIVE" ? new Date() : campaign.publishedAt,
      },
    });

    const retainedIds = parsed.data.variants.flatMap((variant) => variant.id ? [variant.id] : []);
    await tx.variant.deleteMany({ where: { campaignId, id: { notIn: retainedIds } } });

    for (const variant of parsed.data.variants) {
      if (variant.id) {
        await tx.variant.updateMany({
          where: { id: variant.id, campaignId },
          data: { name: variant.name, enabled: variant.enabled, config: variant.config },
        });
      } else {
        await tx.variant.create({
          data: { campaignId, name: variant.name, enabled: variant.enabled, config: variant.config },
        });
      }
    }

    await tx.site.update({
      where: { id: campaign.siteId },
      data: { configVersion: { increment: 1 } },
    });
  });

  return NextResponse.json({ ok: true });
}
