type CountableEvent = { type: string };

export function thirtyDayWindowStart(now = new Date()) {
  const since = new Date(now);
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - 29);
  return since;
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
