import { describe, expect, it } from "vitest";
import { analyticsDays, eventTotals, resolveAnalyticsRange, thirtyDayWindowStart } from "@/lib/analytics";

const now = new Date("2026-09-20T18:42:00Z");

function expectRange(params: Parameters<typeof resolveAnalyticsRange>[0], start: string, end: string) {
  const range = resolveAnalyticsRange(params, now);
  expect(range.start.toISOString()).toBe(start);
  expect(range.end.toISOString()).toBe(end);
  return range;
}

describe("workspace analytics totals", () => {
  it("uses a 30-calendar-day window beginning at UTC midnight", () => {
    expect(thirtyDayWindowStart(now).toISOString())
      .toBe("2026-08-22T00:00:00.000Z");
  });

  it.each([
    [{ range: "today" }, "2026-09-20T00:00:00.000Z", "2026-09-20T18:42:00.000Z"],
    [{ range: "yesterday" }, "2026-09-19T00:00:00.000Z", "2026-09-20T00:00:00.000Z"],
    [{ range: "7d" }, "2026-09-14T00:00:00.000Z", "2026-09-20T18:42:00.000Z"],
    [{ range: "30d" }, "2026-08-22T00:00:00.000Z", "2026-09-20T18:42:00.000Z"],
    [{ range: "this-month" }, "2026-09-01T00:00:00.000Z", "2026-09-20T18:42:00.000Z"],
    [{ range: "last-month" }, "2026-08-01T00:00:00.000Z", "2026-09-01T00:00:00.000Z"],
  ] as const)("resolves preset %# with UTC calendar boundaries", (params, start, end) => {
    expectRange(params, start, end);
  });

  it("resolves an inclusive custom date range to exclusive query boundaries", () => {
    const range = expectRange(
      { from: "2026-09-01", to: "2026-09-20" },
      "2026-09-01T00:00:00.000Z",
      "2026-09-21T00:00:00.000Z",
    );
    expect(range.label).toBe("Sep 1 – Sep 20, 2026");
  });

  it("handles month and year boundaries", () => {
    const january = new Date("2026-01-12T09:00:00Z");
    const range = resolveAnalyticsRange({ range: "last-month" }, january);
    expect(range.start.toISOString()).toBe("2025-12-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("rejects invalid, reversed, and excessively large custom ranges safely", () => {
    expect(resolveAnalyticsRange({ from: "bad", to: "2026-09-20" }, now).key).toBe("30d");
    expect(resolveAnalyticsRange({ from: "2026-09-21", to: "2026-09-20" }, now).error).toMatch(/valid/);
    expect(resolveAnalyticsRange({ from: "2020-01-01", to: "2026-09-20" }, now).error).toMatch(/366/);
  });

  it("creates only the chart days in the selected range", () => {
    expect(analyticsDays(resolveAnalyticsRange({ range: "yesterday" }, now))).toHaveLength(1);
    expect(analyticsDays(resolveAnalyticsRange({ range: "7d" }, now))).toHaveLength(7);
    expect(analyticsDays(resolveAnalyticsRange({ range: "30d" }, now))).toHaveLength(30);
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

  it("applies identical selected boundaries to campaign and embedded-form events", () => {
    const range = resolveAnalyticsRange({ range: "7d" }, now);
    const withinRange = (event: { occurredAt: Date }) => event.occurredAt >= range.start && event.occurredAt < range.end;
    const campaignEvents = [
      { type: "IMPRESSION", occurredAt: new Date("2026-09-14T00:00:00Z") },
      { type: "CONVERSION", occurredAt: new Date("2026-09-13T23:59:59Z") },
    ];
    const embeddedFormEvents = [
      { type: "CONVERSION", occurredAt: new Date("2026-09-20T18:41:59Z") },
      { type: "IMPRESSION", occurredAt: new Date("2026-09-20T18:42:00Z") },
    ];

    expect(eventTotals(campaignEvents.filter(withinRange), embeddedFormEvents.filter(withinRange)))
      .toEqual({ impressions: 1, conversions: 1 });
  });
});
