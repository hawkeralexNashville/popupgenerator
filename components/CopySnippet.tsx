"use client";

import { useRef, useState } from "react";

export function CopySnippet({ snippet, compact = false, label = "Copy" }: { snippet: string; compact?: boolean; label?: string }) {
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

  return <div className={compact ? "compact-copy" : "snippet-row"}>
    {!compact && <code>{snippet}</code>}
    <button type="button" className="secondary copy-button" onClick={copy} aria-label={label}>
      {status === "copied" ? "Copied!" : status === "error" ? "Copy failed" : label}
    </button>
    <span className="sr-only" role="status" aria-live="polite">
      {status === "copied" ? "Embed code copied to clipboard." : status === "error" ? "Clipboard access failed. Open the editor to copy the snippet manually." : ""}
    </span>
  </div>;
}
