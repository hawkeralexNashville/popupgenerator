import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { isPopupGeneratorFeatureDisabled, popupGeneratorDisabledValues } from "@/lib/page-disable";

function pageWith(...values: Array<string | null>) {
  return {
    querySelectorAll: vi.fn(() => values.map((value) => ({
      getAttribute: vi.fn(() => value),
    }))),
  } as unknown as Document;
}

describe("automatic in-content page exclusion", () => {
  it("allows the automatic campaign on a page without a disable marker", () => {
    expect(isPopupGeneratorFeatureDisabled(pageWith(), "in-content")).toBe(false);
  });

  it("disables the automatic campaign when the in-content marker is present", () => {
    expect(isPopupGeneratorFeatureDisabled(pageWith("in-content"), "in-content")).toBe(true);
  });

  it("keeps marker parsing centralized for future disable values", () => {
    expect([...popupGeneratorDisabledValues(pageWith(" in-content ", "campaign:future"))]).toEqual(["in-content", "campaign:future"]);
  });

  it("exits before config, assignment, insertion, and impression behavior", () => {
    const runtime = readFileSync("widget/index.ts", "utf8");
    const guard = runtime.indexOf('isPopupGeneratorFeatureDisabled(document, "in-content")');
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(runtime.indexOf("localStorage.getItem"));
    expect(guard).toBeLessThan(runtime.indexOf("/config"));
    expect(guard).toBeLessThan(runtime.indexOf("/assign"));
    expect(guard).toBeLessThan(runtime.indexOf("inlineInsertionPoints("));
    expect(guard).toBeLessThan(runtime.indexOf("recordImpression("));
  });

  it("does not apply the in-content opt-out to embedded forms", () => {
    const embedRuntime = readFileSync("embed/index.ts", "utf8");
    expect(embedRuntime).toContain('querySelectorAll("[data-popup-generator-form]")');
    expect(embedRuntime).not.toContain("popup-generator-disable");
  });
});
