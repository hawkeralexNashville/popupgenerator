"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget), email = String(form.get("email")), password = String(form.get("password"));
    const supabase = createSupabaseBrowserClient();
    const result = signup
      ? await supabase.auth.signUp({ email, password, options: { data: { name: String(form.get("name")) }, emailRedirectTo: `${location.origin}/auth/callback?next=/dashboard` } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return setError(result.error.message);
    if (signup && !result.data.session) return setMessage("Check your email to confirm your account, then log in.");
    router.push("/dashboard"); router.refresh();
  }
  return <form className="card form" onSubmit={submit}>
    {signup && <label>Name<input name="name" required minLength={2} /></label>}
    <label>Email<input name="email" type="email" autoComplete="email" required /></label>
    <label>Password<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={10} required /></label>
    {error && <p role="alert" className="error-text">{error}</p>}{message && <p role="status" className="success-text">{message}</p>}
    <button>{signup ? "Create account" : "Log in"}</button>{!signup && <Link className="muted" href="/forgot-password">Forgot password?</Link>}
  </form>;
}
