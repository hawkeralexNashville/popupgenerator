"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_CUSTOM_RANGE_DAYS, type AnalyticsRange } from "@/lib/analytics";

const presets = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
  ["this-month", "This month"],
  ["last-month", "Last month"],
] as const;

export function AnalyticsRangePicker({ range }: { range: AnalyticsRange }) {
  const router = useRouter();
  const [customOpen, setCustomOpen] = useState(range.key === "custom" || Boolean(range.error));
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [error, setError] = useState(range.error ?? "");

  function apply(event: FormEvent) {
    event.preventDefault();
    const start = new Date(`${from}T00:00:00Z`);
    const end = new Date(`${to}T00:00:00Z`);
    const days = Math.round((end.valueOf() - start.valueOf()) / 86_400_000) + 1;
    if (!from || !to || Number.isNaN(days) || days < 1) {
      setError("End date must be on or after the start date.");
      return;
    }
    if (days > MAX_CUSTOM_RANGE_DAYS) {
      setError(`Choose a range of ${MAX_CUSTOM_RANGE_DAYS} days or fewer.`);
      return;
    }
    setError("");
    router.push(`/analytics?from=${from}&to=${to}`);
  }

  return <details className="range-picker">
    <summary aria-label={`Date range: ${range.label}`}>{range.label}<span aria-hidden="true">⌄</span></summary>
    <div className="range-menu">
      <div className="range-presets" aria-label="Date range presets">
        {presets.map(([key, label]) => <Link href={`/analytics?range=${key}`} aria-current={range.key === key ? "true" : undefined} key={key}>{label}<span aria-hidden="true">{range.key === key ? "✓" : ""}</span></Link>)}
        <button type="button" className={range.key === "custom" ? "active" : ""} onClick={() => setCustomOpen((open) => !open)}>Custom range<span aria-hidden="true">{range.key === "custom" ? "✓" : ""}</span></button>
      </div>
      {customOpen && <form className="range-custom" onSubmit={apply}>
        <label>Start date<input type="date" required value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>End date<input type="date" required min={from} value={to} onChange={(event) => setTo(event.target.value)} /></label>
        {error && <p className="error-text" role="alert">{error}</p>}
        <button type="submit">Apply</button>
      </form>}
    </div>
  </details>;
}
