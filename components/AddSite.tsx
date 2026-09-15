"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/LoadingButton";

export function AddSite() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [, startRefresh] = useTransition();
  const nameInput = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const triggerElement = trigger.current;
    document.body.style.overflow = "hidden";
    nameInput.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      triggerElement?.focus();
    };
  }, [open]);

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
      setOpen(false);
      setPending(false);
      startRefresh(() => router.refresh());
    } catch {
      setError("Could not add the website. Check your connection and try again.");
      setPending(false);
    }
  }

  return <>
    <button ref={trigger} onClick={() => { setOpen(true); setError(""); }}>+ Add website</button>
    {open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-site-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div><h2 id="add-site-title">Add a website</h2><p className="muted">Connect a site to start creating campaigns.</p></div>
          <button type="button" className="icon-button" aria-label="Close dialog" disabled={pending} onClick={() => setOpen(false)}>×</button>
        </div>
        <form className="form" onSubmit={submit}>
          <label>Website name<input ref={nameInput} name="name" autoComplete="organization" required disabled={pending} /></label>
          <label>Website URL<input name="url" type="url" inputMode="url" placeholder="https://example.com" required disabled={pending} /></label>
          {error && <p role="alert" className="error-text">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary" disabled={pending} onClick={() => setOpen(false)}>Cancel</button>
            <LoadingButton pending={pending} pendingLabel="Adding website...">Add website</LoadingButton>
          </div>
        </form>
      </div>
    </div>}
  </>;
}
