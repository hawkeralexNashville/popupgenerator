import { describe, expect, it } from "vitest";
import { eventTotals, thirtyDayWindowStart } from "@/lib/analytics";

describe("workspace analytics totals", () => {
  it("uses a 30-calendar-day window beginning at UTC midnight", () => {
    expect(thirtyDayWindowStart(new Date("2026-09-20T18:42:00Z")).toISOString())
      .toBe("2026-08-22T00:00:00.000Z");
  });

  it("combines standard and embedded-form events exactly once", () => {
    const standardEvents = [
      { type: "IMPRESSION" },
      { type: "CONVERSION" },
      { type: "DISMISSAL" },
    ];
    const embeddedEvents = [
      { type: "IMPRESSION" },
      { type: "IMPRESSION" },
      { type: "CONVERSION" },
    ];

    const overviewTotals = eventTotals(standardEvents, embeddedEvents);
    const analyticsTotals = eventTotals(standardEvents, embeddedEvents);

    expect(overviewTotals).toEqual({ impressions: 3, conversions: 2 });
    expect(overviewTotals).toEqual(analyticsTotals);
  });
});
