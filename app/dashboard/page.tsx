import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, currentWorkspace } from "@/lib/tenant";
import { DashboardShell } from "@/components/DashboardShell";
import { AddSite } from "@/components/AddSite";
import { eventTotals, thirtyDayWindowStart } from "@/lib/analytics";

export default async function Dashboard() {
  if (!await currentUser()) redirect("/login");
  const workspace = await currentWorkspace();
  const since = thirtyDayWindowStart();
  const sites = workspace ? await db.site.findMany({
    where: { workspaceId: workspace.id },
    include: {
      campaigns: true,
      events: { where: { occurredAt: { gte: since } }, select: { type: true } },
      embeddedEvents: { where: { occurredAt: { gte: since } }, select: { type: true } },
    },
    orderBy: { createdAt: "desc" },
  }) : [];
  const standardEvents = sites.flatMap((site) => site.events);
  const embeddedEvents = sites.flatMap((site) => site.embeddedEvents);
  const { impressions, conversions: signups } = eventTotals(standardEvents, embeddedEvents);

  return <DashboardShell>
    <div className="pagehead">
      <div><h1>Overview</h1><p className="page-subtitle">A snapshot of your workspace performance over the last 30 days.</p></div>
      <AddSite />
    </div>
    <section className="metric-grid" aria-label="Performance summary">
      <div className="card metric"><span className="muted">Impressions</span><strong>{impressions.toLocaleString()}</strong></div>
      <div className="card metric"><span className="muted">Signups</span><strong>{signups.toLocaleString()}</strong></div>
      <div className="card metric"><span className="muted">Conversion rate</span><strong>{impressions ? (signups / impressions * 100).toFixed(2) : "0.00"}%</strong></div>
    </section>
    <div className="section-heading"><div><h2>Websites</h2><p className="muted">Manage campaigns and installation for each site.</p></div><Link className="text-link" href="/websites">View all</Link></div>
    {sites.length ? <section className="site-grid">{sites.slice(0, 6).map((site) => <Link className="card site-card" href={`/sites/${site.id}`} key={site.id}>
      <div><strong>{site.name}</strong><p className="muted">{site.domain}</p></div>
      <span>{site.campaigns.length} campaign{site.campaigns.length === 1 ? "" : "s"}</span>
    </Link>)}</section> : <div className="card empty-state"><div className="empty-icon">↗</div><h2>Add your first website</h2><p className="muted">One sitewide snippet powers every campaign you create.</p><AddSite /></div>}
  </DashboardShell>;
}
