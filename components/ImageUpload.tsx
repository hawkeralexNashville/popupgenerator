"use client";

import { useState } from "react";
export function ImageUpload({ campaignId, value, onChange }: { campaignId: string; value: string; onChange: (url: string) => void }) {
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true); setStatus("Uploading image..."); setError("");
    const body = new FormData(); body.set("image", file);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/images`, { method: "POST", body });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setError(result?.error || "Could not upload the image. Please try again."); setStatus(""); return; }
      onChange(result.url); setStatus("Image uploaded");
    } catch {
      setError("Could not upload the image. Check your connection and try again."); setStatus("");
    } finally {
      setUploading(false);
    }
  }
  return <div className="form"><label>Upload image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} disabled={uploading} /></label>{value && <button type="button" className="secondary" onClick={() => onChange("")} disabled={uploading}>Remove image</button>}{status && <small className="muted" role="status">{uploading && <span className="spinner" aria-hidden="true" />}{status}</small>}{error && <small className="error-text" role="alert">{error}</small>}</div>;
}
