"use client";

import { useRef, useState } from "react";

export function CopySnippet({ snippet }: { snippet: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setStatus("copied");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus("idle"), 1600);
    } catch {
      setStatus("error");
    }
  }

  return <div className="snippet-row">
    <code>{snippet}</code>
    <button type="button" className="secondary copy-button" onClick={copy} aria-label="Copy sitewide install snippet">
      {status === "copied" ? "Copied!" : status === "error" ? "Copy failed" : "Copy"}
    </button>
    <span className="sr-only" role="status" aria-live="polite">
      {status === "copied" ? "Install snippet copied to clipboard." : status === "error" ? "Clipboard access failed. Select and copy the snippet manually." : ""}
    </span>
  </div>;
}
