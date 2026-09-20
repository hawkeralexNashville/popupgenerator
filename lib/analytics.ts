type CountableEvent = { type: string };

export const ANALYTICS_RANGE_KEYS = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "this-month",
  "last-month",
] as const;

export type AnalyticsRangeKey = typeof ANALYTICS_RANGE_KEYS[number];
export type AnalyticsRange = {
  key: AnalyticsRangeKey | "custom";
  label: string;
  start: Date;
  end: Date;
  from: string;
  to: string;
  error?: string;
};

export const MAX_CUSTOM_RANGE_DAYS = 366;

const labels: Record<AnalyticsRangeKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "this-month": "This month",
  "last-month": "Last month",
};

function utcStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) || isoDate(date) !== value ? null : date;
}

function customLabel(start: Date, endInclusive: Date) {
  const sameYear = start.getUTCFullYear() === endInclusive.getUTCFullYear();
  const format = (date: Date, includeYear: boolean) => date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
  return `${format(start, !sameYear)} – ${format(endInclusive, true)}`;
}

/** Resolve URL state into one UTC range. `end` is always an exclusive query boundary. */
export function resolveAnalyticsRange(
  params: { range?: string; from?: string; to?: string },
  now = new Date(),
): AnalyticsRange {
  const today = utcStart(now);

  if (params.from || params.to || params.range === "custom") {
    const start = parseIsoDate(params.from);
    const endInclusive = parseIsoDate(params.to);
    const days = start && endInclusive
      ? Math.round((endInclusive.valueOf() - start.valueOf()) / 86_400_000) + 1
      : 0;
    if (start && endInclusive && days > 0 && days <= MAX_CUSTOM_RANGE_DAYS) {
      return {
        key: "custom",
        label: customLabel(start, endInclusive),
        start,
        end: addUtcDays(endInclusive, 1),
        from: isoDate(start),
        to: isoDate(endInclusive),
      };
    }
    return { ...resolveAnalyticsRange({ range: "30d" }, now), error: days > MAX_CUSTOM_RANGE_DAYS
      ? `Custom ranges can be at most ${MAX_CUSTOM_RANGE_DAYS} days.`
      : "Choose a valid start and end date." };
  }

  const key: AnalyticsRangeKey = ANALYTICS_RANGE_KEYS.includes(params.range as AnalyticsRangeKey)
    ? params.range as AnalyticsRangeKey
    : "30d";
  let start = today;
  let end = now;
  if (key === "yesterday") {
    start = addUtcDays(today, -1);
    end = today;
  } else if (key === "7d") {
    start = addUtcDays(today, -6);
  } else if (key === "30d") {
    start = addUtcDays(today, -29);
  } else if (key === "this-month") {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  } else if (key === "last-month") {
    end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1));
  }
  return { key, label: labels[key], start, end, from: isoDate(start), to: isoDate(addUtcDays(end, end === now ? 0 : -1)) };
}

export function analyticsDays(range: Pick<AnalyticsRange, "start" | "end">) {
  const lastInstant = new Date(range.end.valueOf() - 1);
  const count = Math.floor((utcStart(lastInstant).valueOf() - range.start.valueOf()) / 86_400_000) + 1;
  return Array.from({ length: count }, (_, index) => addUtcDays(range.start, index));
}

export function thirtyDayWindowStart(now = new Date()) {
  return resolveAnalyticsRange({ range: "30d" }, now).start;
}

export function eventTotals(...eventSources: readonly (readonly CountableEvent[])[]) {
  let impressions = 0;
  let conversions = 0;

  for (const events of eventSources) {
    for (const event of events) {
      if (event.type === "IMPRESSION") impressions++;
      if (event.type === "CONVERSION") conversions++;
    }
  }

  return { impressions, conversions };
}
