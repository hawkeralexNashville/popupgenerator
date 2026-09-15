import { describe, expect, it } from "vitest";
import { campaignPlacementSchema, defaultVariant, inlinePlacementSchema, variantConfigSchema } from "@/lib/schemas";

describe("campaign placement", () => {
  it("accepts modal and inline placements only", () => {
    expect(campaignPlacementSchema.parse("MODAL")).toBe("MODAL");
    expect(campaignPlacementSchema.parse("INLINE")).toBe("INLINE");
    expect(campaignPlacementSchema.safeParse("OVERLAY").success).toBe(false);
  });
});

describe("inline placement controls", () => {
  it("supplies safe defaults and enforces spacing limits", () => {
    expect(inlinePlacementSchema.parse({})).toEqual({
      firstAfter: 4,
      repeatEvery: 10,
      maxInsertions: 3,
    });
    expect(inlinePlacementSchema.safeParse({ firstAfter: 4, repeatEvery: 2, maxInsertions: 3 }).success).toBe(false);
    expect(inlinePlacementSchema.safeParse({ firstAfter: 4, repeatEvery: 10, maxInsertions: 11 }).success).toBe(false);
  });
});

describe("horizontal popup configuration", () => {
  it("defaults to a balanced one-third image column", () => {
    expect(defaultVariant.horizontalImagePercent).toBe(33);
    expect(defaultVariant.inputWidth).toBe(100);
    expect(defaultVariant.buttonWidth).toBe(100);
  });

  it("adds layout defaults to existing stored variants", () => {
    const legacy = { ...defaultVariant } as Record<string, unknown>;
    for (const key of [
      "imageWidth", "imageHeight", "imageAspectRatio", "imageFit",
      "imageVerticalAlign", "horizontalImagePercent", "horizontalGap",
      "innerPadding", "inputWidth", "buttonWidth",
    ]) delete legacy[key];

    const parsed = variantConfigSchema.parse(legacy);
    expect(parsed.horizontalImagePercent).toBe(33);
    expect(parsed.imageFit).toBe("cover");
    expect(parsed.imageVerticalAlign).toBe("center");
  });

  it("accepts every horizontal column split preset", () => {
    for (const horizontalImagePercent of [25, 33, 40, 50]) {
      expect(variantConfigSchema.parse({
        ...defaultVariant,
        horizontalImagePercent,
      }).horizontalImagePercent).toBe(horizontalImagePercent);
    }
  });
});
