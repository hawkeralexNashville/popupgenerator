import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { db } from "@/lib/db";
import { currentUser, currentWorkspace } from "@/lib/tenant";

type Breakdown = { name: string; impressions: number; conversions: number };

function rate(row: Pick<Breakdown, "impressions" | "conversions">) {
  return row.impressions ? `${(row.conversions / row.impressions * 100).toFixed(2)}%` : "0.00%";
}

function BreakdownTable({ title, rows }: { title: string; rows: Breakdown[] }) {
  return <section className="card analytics-table-card">
    <h2>{title}</h2>
    {rows.length ? <div className="table-scroll"><table><thead><tr><th>Name</th><th>Impressions</th><th>Conversions</th><th>Rate</th></tr></thead><tbody>
      {rows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.impressions.toLocaleString()}</td><td>{row.conversions.toLocaleString()}</td><td>{rate(row)}</td></tr>)}
    </tbody></table></div> : <p className="muted">No activity in this period.</p>}
  </section>;
}

function TrendChart({ days }: { days: { label: string; impressions: number; conversions: number }[] }) {
  const width = 900, height = 220, pad = 18;
  const max = Math.max(1, ...days.flatMap((day) => [day.impressions, day.conversions]));
  const points = (key: "impressions" | "conversions") => days.map((day, index) => {
    const x = pad + index * ((width - pad * 2) / (days.length - 1));
    const y = height - pad - day[key] / max * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  return <section className="card chart-card"><div className="chart-heading"><div><h2>Daily trend</h2><p className="muted">Impressions and conversions over time</p></div><div className="legend"><span><i className="legend-impressions" />Impressions</span><span><i className="legend-conversions" />Conversions</span></div></div>
    <div className="chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily impressions and conversions trend">
      <line x1={pad} x2={width-pad} y1={height-pad} y2={height-pad} className="chart-axis" />
      <polyline points={points("impressions")} className="chart-line chart-impressions" />
      <polyline points={points("conversions")} className="chart-line chart-conversions" />
    </svg></div>
    <div className="chart-labels"><span>{days[0].label}</span><span>{days[Math.floor(days.length / 2)].label}</span><span>{days.at(-1)?.label}</span></div>
  </section>;
}

export default async function AnalyticsPage() {
  if (!await currentUser()) redirect("/login");
  const workspace = await currentWorkspace();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - 29);
  const events = workspace ? await db.event.findMany({
    where: { occurredAt: { gte: since }, site: { workspaceId: workspace.id } },
    select: { type: true, occurredAt: true, site: { select: { id: true, name: true } }, campaign: { select: { id: true, name: true } }, variant: { select: { id: true, name: true } } },
    orderBy: { occurredAt: "asc" },
  }) : [];
  const impressions = events.filter((event) => event.type === "IMPRESSION").length;
  const conversions = events.filter((event) => event.type === "CONVERSION").length;
  const group = (getItem: (event: typeof events[number]) => { id: string; name: string }) => {
    const result = new Map<string, Breakdown>();
    events.forEach((event) => {
      const item = getItem(event);
      const row = result.get(item.id) ?? { name: item.name, impressions: 0, conversions: 0 };
      if (event.type === "IMPRESSION") row.impressions++; else row.conversions++;
      result.set(item.id, row);
    });
    return [...result.values()].sort((a, b) => b.impressions - a.impressions);
  };
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(since); date.setUTCDate(date.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { key, label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), impressions: 0, conversions: 0 };
  });
  const daysByKey = new Map(days.map((day) => [day.key, day]));
  events.forEach((event) => {
    const day = daysByKey.get(event.occurredAt.toISOString().slice(0, 10));
    if (day) {
      if (event.type === "IMPRESSION") day.impressions++;
      else day.conversions++;
    }
  });

  return <DashboardShell>
    <div className="pagehead"><div><h1>Analytics</h1><p className="page-subtitle">Workspace performance for the last 30 days.</p></div><span className="date-chip">Last 30 days</span></div>
    <section className="metric-grid" aria-label="Analytics summary">
      <div className="card metric"><span className="muted">Impressions</span><strong>{impressions.toLocaleString()}</strong></div>
      <div className="card metric"><span className="muted">Conversions</span><strong>{conversions.toLocaleString()}</strong></div>
      <div className="card metric"><span className="muted">Conversion rate</span><strong>{rate({ impressions, conversions })}</strong></div>
    </section>
    <TrendChart days={days} />
    <div className="analytics-grid"><BreakdownTable title="By website" rows={group((event) => event.site)} /><BreakdownTable title="By campaign" rows={group((event) => event.campaign)} /><BreakdownTable title="By variant" rows={group((event) => event.variant)} /></div>
  </DashboardShell>;
}
