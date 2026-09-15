"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/LoadingButton";

export function AddSite() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, startRefresh] = useTransition();
  const [waitingForRefresh, setWaitingForRefresh] = useState(false);
  const [refreshStarted, setRefreshStarted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (refreshing && waitingForRefresh) setRefreshStarted(true);
    if (!refreshing && waitingForRefresh && refreshStarted) {
      setOpen(false); setPending(false); setWaitingForRefresh(false); setRefreshStarted(false);
    }
  }, [refreshing, waitingForRefresh, refreshStarted]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true); setError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/sites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name"), url: f.get("url") }) });
      if (!r.ok) {
        const result = await r.json().catch(() => null);
        setError(result?.error || "Could not add the website. Please try again.");
        setPending(false);
        return;
      }
      setWaitingForRefresh(true);
      startRefresh(() => router.refresh());
    } catch {
      setError("Could not add the website. Check your connection and try again.");
      setPending(false);
    }
  }

  return <>
    <button onClick={() => { setOpen(!open); setError(""); }}>+ Add website</button>
    {open && <form className="card form" style={{ marginTop: 15 }} onSubmit={submit}>
      <label>Website name<input name="name" required disabled={pending} /></label>
      <label>Website URL<input name="url" type="url" placeholder="https://example.com" required disabled={pending} /></label>
      {error && <p role="alert" className="error-text">{error}</p>}
      <LoadingButton pending={pending} pendingLabel="Adding website...">Add website</LoadingButton>
    </form>}
  </>;
}
