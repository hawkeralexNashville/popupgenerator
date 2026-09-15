import Link from "next/link";
import { redirect } from "next/navigation";
import { AddSite } from "@/components/AddSite";
import { DashboardShell } from "@/components/DashboardShell";
import { db } from "@/lib/db";
import { currentUser, currentWorkspace } from "@/lib/tenant";

export default async function WebsitesPage() {
  if (!await currentUser()) redirect("/login");
  const workspace = await currentWorkspace();
  const sites = workspace ? await db.site.findMany({
    where: { workspaceId: workspace.id },
    include: { _count: { select: { campaigns: true } } },
    orderBy: { createdAt: "desc" },
  }) : [];

  return <DashboardShell>
    <div className="pagehead">
      <div><h1>Websites</h1><p className="page-subtitle">Manage every website connected to this workspace.</p></div>
      <AddSite />
    </div>
    {sites.length ? <section className="site-grid">
      {sites.map((site) => <article className="card site-card" key={site.id}>
        <div className="site-card-heading">
          <div><h2>{site.name}</h2><p className="muted">{site.domain}</p></div>
          <span className={`status-badge ${site.installStatus === "VERIFIED" ? "status-good" : ""}`}>{site.installStatus.replaceAll("_", " ").toLowerCase()}</span>
        </div>
        <div className="site-card-footer"><span className="muted">{site._count.campaigns} campaign{site._count.campaigns === 1 ? "" : "s"}</span><Link className="button secondary" href={`/sites/${site.id}`}>Open website</Link></div>
      </article>)}
    </section> : <div className="card empty-state"><div className="empty-icon">↗</div><h2>No websites yet</h2><p className="muted">Add your first website to install the widget and launch a campaign.</p><AddSite /></div>}
  </DashboardShell>;
}
