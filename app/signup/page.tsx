import Link from "next/link";import {AuthForm} from "@/components/AuthForm";
export default function Signup(){return <main className="auth"><Link className="brand" href="/"><i>↗</i>Popup Generator</Link><h1>Create your account</h1><p className="muted">Start turning more readers into subscribers.</p><AuthForm signup/><p>Already have an account? <Link href="/login">Log in</Link></p></main>}
