import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoadingButton } from "@/components/LoadingButton";
import { DashboardNav } from "@/components/DashboardNav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard"><i>↗</i>Popup Generator</Link>
        <DashboardNav />
        <form className="logout-form" action={async () => {
          "use server";
          const supabase = await createSupabaseServerClient();
          await supabase.auth.signOut();
          redirect("/");
        }}>
          <LoadingButton className="secondary" pendingLabel="Logging out...">Log out</LoadingButton>
        </form>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
