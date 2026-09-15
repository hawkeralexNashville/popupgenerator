"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/LoadingButton";

export function PasswordForm({ reset = false }: { reset?: boolean }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true); setError(""); setMessage("");
    const f = new FormData(e.currentTarget);
    const supabase = createSupabaseBrowserClient();
    try {
      if (reset) {
        const { error } = await supabase.auth.updateUser({ password: String(f.get("password")) });
        if (error) { setError(error.message); setPending(false); return; }
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(String(f.get("email")), { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
        if (error) { setError(error.message); setPending(false); return; }
        setMessage("If an account exists, a reset link is on its way."); setPending(false);
      }
    } catch {
      setError("Something went wrong. Please try again."); setPending(false);
    }
  }

  return <form className="card form" onSubmit={submit}>
    <label>{reset ? "New password" : "Email"}<input name={reset ? "password" : "email"} type={reset ? "password" : "email"} minLength={reset ? 10 : undefined} required disabled={pending} /></label>
    {error && <p role="alert" className="error-text">{error}</p>}
    {message && <p role="status" className="success-text">{message}</p>}
    <LoadingButton pending={pending} pendingLabel={reset ? "Updating password..." : "Sending reset link..."}>{reset ? "Update password" : "Send reset link"}</LoadingButton>
  </form>;
}
