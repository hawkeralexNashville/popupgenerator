import { describe, expect, it, vi } from "vitest";
import { inlineInsertionIndexes, startCampaignDisplay, type CampaignTrigger } from "@/lib/widget-display";

function harness(scroll = 0) {
  let onScroll: (() => void) | undefined;
  let onTimeout: (() => void) | undefined;
  let onExit: (() => void) | undefined;
  const environment = {
    scrollPercent: () => scroll,
    onScroll: vi.fn((callback: () => void) => { onScroll = callback; }),
    after: vi.fn((callback: () => void) => { onTimeout = callback; }),
    onExitIntent: vi.fn((callback: () => void) => { onExit = callback; }),
    isDesktop: () => true,
  };
  return { environment, scrollTo: (value: number) => { scroll = value; onScroll?.(); }, fireTimeout: () => onTimeout?.(), fireExit: () => onExit?.() };
}

const allTriggers: CampaignTrigger = { scrollPercent: 50, seconds: 5, exitIntent: true, logic: "ANY" };

describe("campaign display scheduling", () => {
  it("shows inline campaigns immediately without installing modal triggers", () => {
    const show = vi.fn();
    const { environment } = harness();
    startCampaignDisplay("INLINE", allTriggers, show, environment);
    expect(show).toHaveBeenCalledOnce();
    expect(environment.onScroll).not.toHaveBeenCalled();
    expect(environment.after).not.toHaveBeenCalled();
    expect(environment.onExitIntent).not.toHaveBeenCalled();
  });

  it("preserves the configured inline paragraph positions", () => {
    expect(inlineInsertionIndexes(40, { firstAfter: 4, repeatEvery: 10, maxInsertions: 3 })).toEqual([3, 13, 23]);
  });

  it("keeps modal ANY triggers gated until one fires", () => {
    const show = vi.fn();
    const controls = harness();
    startCampaignDisplay("MODAL", allTriggers, show, controls.environment);
    expect(show).not.toHaveBeenCalled();
    controls.scrollTo(50);
    expect(show).toHaveBeenCalledOnce();
  });

  it("keeps modal ALL triggers gated until every trigger fires", () => {
    const show = vi.fn();
    const controls = harness();
    startCampaignDisplay("MODAL", { ...allTriggers, logic: "ALL" }, show, controls.environment);
    controls.scrollTo(50);
    controls.fireTimeout();
    expect(show).not.toHaveBeenCalled();
    controls.fireExit();
    expect(show).toHaveBeenCalledOnce();
  });
});
