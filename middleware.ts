import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: ((cookiesToSet) => {
          // Update the request first. This is essential: downstream Server
          // Components and Route Handlers must see a token refreshed here,
          // not only the browser on its next request.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // Recreate the response with the mutated request, then mirror every
          // cookie (including Supabase's security attributes) to the browser.
          // This is the getAll/setAll pattern required by @supabase/ssr.
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set("cookie", request.cookies.toString());
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        }) satisfies SetAllCookies,
      },
    },
  );

  // Do not use getSession() here: getUser() validates the access token and
  // refreshes it when necessary before the request reaches an authenticated
  // route.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (!user && error) {
    console.warn("Supabase middleware found no authenticated session", {
      path: request.nextUrl.pathname,
      error: error.message,
    });
  }

  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    !request.nextUrl.pathname.startsWith("/api/public/")
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && new URL(origin).host !== host) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|widget.js).*)"],
};
