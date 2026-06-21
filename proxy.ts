import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";

// Next.js 16 renamed the "middleware" convention to "proxy".
// next-intl handles locale negotiation/redirects; on top of that we refresh
// the Supabase session and guard every /admin route (single-admin dashboard).
const intlMiddleware = createMiddleware(routing);

const LOCALES = routing.locales as readonly string[];

export default async function proxy(request: NextRequest) {
  // 1. Let next-intl produce the base response (handles locale prefixing).
  const response = intlMiddleware(request);

  // 2. Bind a Supabase client to the request/response cookies so the auth
  //    session is refreshed and readable in Server Components below.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Admin route protection. Paths look like /{locale}/admin[/...].
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const locale = LOCALES.includes(segments[0]!)
    ? segments[0]!
    : routing.defaultLocale;
  const isAdmin = segments[1] === "admin";
  const isLogin = isAdmin && segments[2] === "login";

  if (isAdmin && !isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/admin/login`;
    url.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Already authenticated owners never see the login screen.
  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/admin`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Skip API routes, Next internals, Vercel internals and static files.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
