import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export function DashboardShell({children}:{children:React.ReactNode}){return <div className="shell"><aside className="sidebar"><Link className="brand" href="/dashboard"><i>↗</i>Popup Generator</Link><nav><Link href="/dashboard">Overview</Link><Link href="/dashboard#sites">Websites</Link><Link href="/dashboard#analytics">Analytics</Link></nav><form action={async()=>{"use server";const supabase=await createSupabaseServerClient();await supabase.auth.signOut();redirect("/")}} style={{marginTop:40}}><button className="secondary">Log out</button></form></aside><main className="main">{children}</main></div>}
