"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/LoadingButton";

async function errorMessage(response: Response, fallback: string) {
  const result = await response.json().catch(() => null);
  return result?.error || fallback;
}

export function SiteActions({ siteId, integration }: { siteId: string; integration: { publicationId: string; apiKeyStored: boolean } | null }) {
  const [campaignPending, setCampaignPending] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [integrationPending, setIntegrationPending] = useState(false);
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [integrationError, setIntegrationError] = useState("");
  const [publicationId, setPublicationId] = useState(integration?.publicationId ?? "");
  const [savedPublicationId, setSavedPublicationId] = useState(integration?.publicationId ?? "");
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(Boolean(integration?.apiKeyStored));
  const router = useRouter();

  const credentialsChanged = publicationId !== savedPublicationId || apiKey.length > 0;
  const showConnected = connected && !credentialsChanged;

  function editCredentials(update: () => void) {
    update();
    setIntegrationMessage("");
    setIntegrationError("");
  }

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
      else {
        const result = await r.json();
        setPublicationId(result.publicationId);
        setSavedPublicationId(result.publicationId);
        setApiKey("");
        setConnected(true);
        setIntegrationMessage("Beehiiv connected. Private API key stored securely.");
      }
    } catch {
      setIntegrationError("Could not connect Beehiiv. Check your connection and try again.");
    } finally {
      setIntegrationPending(false);
    }
  }

  async function embeddedForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (formPending) return; setFormPending(true); setFormError("");
    const form = new FormData(e.currentTarget);
    try { const response = await fetch(`/api/sites/${siteId}/embedded-forms`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:form.get("name")}) });
      if (!response.ok) { setFormError(await errorMessage(response,"Could not create the embedded form.")); setFormPending(false); return; }
      router.push(`/embedded-forms/${(await response.json()).id}`);
    } catch { setFormError("Could not create the embedded form. Check your connection and try again."); setFormPending(false); }
  }

  return <div className="grid setup-grid">
    <form className="card form campaign-form" onSubmit={campaign}>
      <h3>New in-content campaign</h3><p className="muted">Automatically place a signup inside article content.</p><label>Name<input name="name" placeholder="General newsletter" required disabled={campaignPending} /></label>
      {campaignError && <p role="alert" className="error-text">{campaignError}</p>}
      <LoadingButton pending={campaignPending} pendingLabel="Creating campaign...">Create and design</LoadingButton>
    </form>
    <form className="card form campaign-form" onSubmit={embeddedForm}>
      <h3>New embedded form</h3><p className="muted">Manually place a form anywhere with one HTML snippet.</p><label>Name<input name="name" placeholder="Footer signup" required disabled={formPending}/></label>
      {formError&&<p role="alert" className="error-text">{formError}</p>}<LoadingButton pending={formPending} pendingLabel="Creating form...">Create and design</LoadingButton>
    </form>
    <form className="card form" onSubmit={bee}>
      <h3>Connect Beehiiv</h3><label>Publication ID<input name="publicationId" value={publicationId} onChange={e=>editCredentials(()=>setPublicationId(e.target.value))} required disabled={integrationPending} autoComplete="off" /></label><label>Private API key<input type="password" name="apiKey" value={apiKey} onChange={e=>editCredentials(()=>setApiKey(e.target.value))} required={!connected} disabled={integrationPending} placeholder={connected?"Stored securely — leave blank to keep current key":""} autoComplete="new-password" /></label>{connected&&<p className="muted" role="status">API key is stored securely. It is never sent back to your browser.</p>}
      {integrationError && <p role="alert" className="error-text">{integrationError}</p>}
      {integrationMessage && <p role="status" className="success-text">{integrationMessage}</p>}
      <LoadingButton className={showConnected?"connected-button":undefined} pending={integrationPending} pendingLabel="Connecting..." disabled={showConnected}>{showConnected?"Connected":"Verify & connect"}</LoadingButton>
    </form>
  </div>;
}
