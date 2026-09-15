import { describe, expect, it } from "vitest";
import { defaultVariant } from "@/lib/schemas";
import { popupStyles } from "@/lib/popupStyles";

describe("popupStyles", () => {
  it.each([25, 33, 40, 50] as const)("renders a %s percent horizontal image column", (horizontalImagePercent) => {
    const css = popupStyles({ ...defaultVariant, layout: "horizontal", horizontalImagePercent });

    expect(css).toContain(`grid-template-columns:minmax(0,${horizontalImagePercent}fr) minmax(0,${100 - horizontalImagePercent}fr)`);
    expect(css).toContain(".pg-content{min-width:0}");
  });

  it("uses configured image, gap, form, and button dimensions", () => {
    const css = popupStyles({
      ...defaultVariant,
      imageWidth: 190,
      imageHeight: 260,
      imageAspectRatio: "portrait",
      imageFit: "contain",
      imageVerticalAlign: "bottom",
      horizontalGap: 28,
      inputWidth: 90,
      buttonWidth: 60,
    });

    expect(css).toContain("width:min(100%,190px);max-height:260px;aspect-ratio:3/4;align-self:end");
    expect(css).toContain("gap:28px");
    expect(css).toContain(".pg-email{display:block;width:90%");
    expect(css).toContain(".pg-submit{display:block;width:60%");
    expect(css).toContain("object-fit:contain");
  });

  it("keeps the mobile horizontal layout stacked", () => {
    const css = popupStyles({ ...defaultVariant, layout: "horizontal" });

    expect(css).toContain(".pg-box.pg-horizontal{display:flex;width:100%;flex-direction:column");
    expect(css).toContain(".pg-hide-mobile{display:none}");
  });
});
