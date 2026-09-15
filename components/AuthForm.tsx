"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LoadingButton } from "@/components/LoadingButton";

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(""); setMessage(""); setPending(true);
    const form = new FormData(event.currentTarget), email = String(form.get("email")), password = String(form.get("password"));
    const supabase = createSupabaseBrowserClient();
    try {
      const result = signup
        ? await supabase.auth.signUp({ email, password, options: { data: { name: String(form.get("name")) }, emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard` } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) { setError(result.error.message); setPending(false); return; }
      if (signup && !result.data.session) { setMessage("Check your email to confirm your account, then log in."); setPending(false); return; }
      router.push("/dashboard"); router.refresh();
    } catch {
      setError("Something went wrong. Please try again."); setPending(false);
    }
  }
  return <form className="card form" onSubmit={submit}>
    {signup && <label>Name<input name="name" required minLength={2} disabled={pending} /></label>}
    <label>Email<input name="email" type="email" autoComplete="email" required disabled={pending} /></label>
    <label>Password<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={10} required disabled={pending} /></label>
    {error && <p role="alert" className="error-text">{error}</p>}{message && <p role="status" className="success-text">{message}</p>}
    <LoadingButton pending={pending} pendingLabel={signup ? "Creating account..." : "Logging in..."}>{signup ? "Create account" : "Log in"}</LoadingButton>{!signup && <Link className="muted" href="/forgot-password">Forgot password?</Link>}
  </form>;
}
