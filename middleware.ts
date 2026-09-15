import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: ((values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }) satisfies SetAllCookies,
    },
  });
  await supabase.auth.getUser();
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && !request.nextUrl.pathname.startsWith("/api/public/")) {
    const origin = request.headers.get("origin"), host = request.headers.get("host");
    if (origin && new URL(origin).host !== host) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|widget.js).*)"] };
