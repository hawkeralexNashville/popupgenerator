import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  frequencySchema,
  inlinePlacementSchema,
  targetingSchema,
  triggerSchema,
  variantConfigSchema,
} from "@/lib/schemas";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const site = await db.site.findUnique({
    where: { publicId: siteId },
    select: {
      publicId: true,
      configVersion: true,
      campaigns: {
        where: { status: "ACTIVE" },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          priority: true,
          placement: true,
          inlinePlacement: true,
          trigger: true,
          targeting: true,
          frequency: true,
          variants: {
            where: { enabled: true },
            select: { id: true, name: true, config: true },
          },
        },
      },
    },
  });

  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const campaigns = site.campaigns.flatMap((campaign) => {
    const trigger = triggerSchema.safeParse(campaign.trigger);
    const targeting = targetingSchema.safeParse(campaign.targeting);
    const frequency = frequencySchema.safeParse(campaign.frequency);
    const inlinePlacement = inlinePlacementSchema.safeParse(campaign.inlinePlacement);
    const variants = campaign.variants.flatMap((variant) => {
      const config = variantConfigSchema.safeParse(variant.config);
      return config.success
        ? [{ id: variant.id, name: variant.name, config: config.data }]
        : [];
    });

    return trigger.success &&
      targeting.success &&
      frequency.success &&
      inlinePlacement.success &&
      variants.length
      ? [
          {
            id: campaign.id,
            priority: campaign.priority,
            placement: campaign.placement,
            inlinePlacement: inlinePlacement.data,
            trigger: trigger.data,
            targeting: targeting.data,
            frequency: frequency.data,
            variants,
          },
        ]
      : [];
  });

  return NextResponse.json(
    { siteId: site.publicId, version: site.configVersion, campaigns },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
