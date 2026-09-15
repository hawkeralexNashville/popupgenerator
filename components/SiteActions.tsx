"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/LoadingButton";

async function errorMessage(response: Response, fallback: string) {
  const result = await response.json().catch(() => null);
  return result?.error || fallback;
}

export function SiteActions({ siteId }: { siteId: string }) {
  const [campaignPending, setCampaignPending] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [integrationPending, setIntegrationPending] = useState(false);
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [integrationError, setIntegrationError] = useState("");
  const router = useRouter();

  async function campaign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (campaignPending) return;
    setCampaignPending(true); setCampaignError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch(`/api/sites/${siteId}/campaigns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name") }) });
      if (!r.ok) { setCampaignError(await errorMessage(r, "Could not create the campaign. Please try again.")); setCampaignPending(false); return; }
      router.push(`/campaigns/${(await r.json()).id}`);
    } catch {
      setCampaignError("Could not create the campaign. Check your connection and try again."); setCampaignPending(false);
    }
  }

  async function bee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (integrationPending) return;
    setIntegrationPending(true); setIntegrationError(""); setIntegrationMessage("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch(`/api/sites/${siteId}/integration`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: f.get("apiKey"), publicationId: f.get("publicationId") }) });
      if (!r.ok) setIntegrationError(await errorMessage(r, "Could not connect Beehiiv. Please try again."));
      else setIntegrationMessage("Beehiiv connected");
    } catch {
      setIntegrationError("Could not connect Beehiiv. Check your connection and try again.");
    } finally {
      setIntegrationPending(false);
    }
  }

  return <div className="grid">
    <form className="card form" onSubmit={campaign}>
      <h3>Create campaign</h3><label>Name<input name="name" placeholder="General newsletter" required disabled={campaignPending} /></label>
      {campaignError && <p role="alert" className="error-text">{campaignError}</p>}
      <LoadingButton pending={campaignPending} pendingLabel="Creating campaign...">Create and design</LoadingButton>
    </form>
    <form className="card form" onSubmit={bee}>
      <h3>Connect Beehiiv</h3><label>Publication ID<input name="publicationId" required disabled={integrationPending} /></label><label>Private API key<input type="password" name="apiKey" required disabled={integrationPending} /></label>
      {integrationError && <p role="alert" className="error-text">{integrationError}</p>}
      {integrationMessage && <p role="status" className="success-text">{integrationMessage}</p>}
      <LoadingButton pending={integrationPending} pendingLabel="Connecting...">Verify & connect</LoadingButton>
    </form>
  </div>;
}
