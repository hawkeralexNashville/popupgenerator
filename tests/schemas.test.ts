import { describe, expect, it } from "vitest";
import { defaultVariant, variantConfigSchema } from "../lib/schemas";

describe("popup layout configuration", () => {
  it("provides balanced defaults for horizontal composition", () => {
    const config = variantConfigSchema.parse(defaultVariant);
    expect(config.horizontalSplit).toBe("33/67");
    expect(config.imageFit).toBe("cover");
    expect(config.imageVerticalAlign).toBe("center");
    expect(config.formWidth).toBe(100);
    expect(config.buttonWidth).toBe(100);
  });

  it("adds new layout defaults to existing saved configurations", () => {
    const legacy = { ...defaultVariant } as Partial<typeof defaultVariant>;
    delete legacy.horizontalSplit;
    delete legacy.imageAspectRatio;
    delete legacy.columnGap;

    const config = variantConfigSchema.parse(legacy);
    expect(config.horizontalSplit).toBe("33/67");
    expect(config.imageAspectRatio).toBe("original");
    expect(config.columnGap).toBe(24);
  });

  it("accepts each supported horizontal split and image treatment", () => {
    for (const horizontalSplit of ["25/75", "33/67", "40/60", "50/50"] as const) {
      for (const imageAspectRatio of ["square", "4:3", "portrait", "original"] as const) {
        expect(variantConfigSchema.parse({ ...defaultVariant, horizontalSplit, imageAspectRatio, imageFit: "contain" })).toMatchObject({ horizontalSplit, imageAspectRatio, imageFit: "contain" });
      }
    }
  });
});
