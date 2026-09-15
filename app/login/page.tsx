import Link from "next/link";import {AuthForm} from "@/components/AuthForm";
export default function Login(){return <main className="auth"><Link className="brand" href="/"><i>↗</i>Popup Generator</Link><h1>Welcome back</h1><p className="muted">Log in to manage your campaigns.</p><AuthForm/><p>New here? <Link href="/signup">Create an account</Link></p></main>}
