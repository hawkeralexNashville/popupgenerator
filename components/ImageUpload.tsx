"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type LibraryImage = { path: string; name: string; url: string };

export function ImageUpload({ siteId, value, onChange }: { siteId: string; value: string; onChange: (url: string) => void }) {
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [images, setImages] = useState<LibraryImage[]>([]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  async function loadLibrary() {
    setOpen(true);
    setLoadingLibrary(true);
    setError("");
    try {
      const response = await fetch(`/api/sites/${siteId}/images`);
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Could not load the image library.");
      setImages(result.images);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the image library.");
    } finally {
      setLoadingLibrary(false);
    }
  }

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || uploading) return;
    setUploading(true); setStatus("Uploading image..."); setError("");
    const body = new FormData(); body.set("image", file);
    try {
      const response = await fetch(`/api/sites/${siteId}/images`, { method: "POST", body });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setError(result?.error || "Could not upload the image. Please try again."); setStatus(""); return; }
      onChange(result.url); setStatus("Image uploaded");
    } catch {
      setError("Could not upload the image. Check your connection and try again."); setStatus("");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function choose(image: LibraryImage) {
    onChange(image.url);
    setStatus("Existing image selected");
    setOpen(false);
  }

  return <div className="image-controls">
    <label className="image-upload-label">Upload image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} disabled={uploading} /></label>
    <div className="image-actions">
      <button type="button" className="secondary" onClick={loadLibrary} disabled={uploading}>Choose existing image</button>
      {value && <button type="button" className="secondary" onClick={() => onChange("")} disabled={uploading}>Remove image</button>}
    </div>
    {status && <small className="muted" role="status">{uploading && <span className="spinner" aria-hidden="true" />}{status}</small>}
    {error && <small className="error-text" role="alert">{error}</small>}
    {open && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section className="modal image-library" role="dialog" aria-modal="true" aria-labelledby="image-library-title">
        <div className="modal-heading"><div><h2 id="image-library-title">Image library</h2><p className="muted">Choose an image already uploaded to this workspace.</p></div><button type="button" className="icon-button" aria-label="Close image library" onClick={() => setOpen(false)}>×</button></div>
        {loadingLibrary ? <p className="muted"><span className="spinner" aria-hidden="true" />Loading images...</p> : images.length ? <div className="image-library-grid">{images.map((image) => <button type="button" className="image-library-item" key={image.path} onClick={() => choose(image)} title="Use this image"><Image src={image.url} alt="Previously uploaded image" fill sizes="(max-width: 600px) 42vw, 150px" unoptimized /></button>)}</div> : <div className="image-library-empty"><p>No uploaded images yet.</p><p className="muted">Upload an image here first, then it will be available to reuse.</p></div>}
      </section>
    </div>}
  </div>;
}
