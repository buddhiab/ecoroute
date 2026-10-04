import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { portalFromPath, sessionCookieName } from "@/lib/portal";
import { getRole, isAdmin } from "@/lib/roles";

// Routes that are fully public — no auth needed
const PUBLIC_PREFIXES = [
  "/",
  "/register",
  "/login",
  "/track",        // public driver tracking page

  "/_next",        // Next.js internals
  "/api/push-subscribe", // citizen push subscription
  "/api/notify",   // triggered by server actions
  "/favicon.ico",
  "/manifest",         // PWA manifests (manifest-driver.json / manifest-citizen.json)
  "/offline",
  "/icons",
  "/sw.js",
];

function isPublic(pathname) {
  return PUBLIC_PREFIXES.some((p) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p)
  );
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Let public routes through immediately
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Build a response we can attach cookie updates to
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: { name: sessionCookieName(portalFromPath(pathname)) },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() is safe — it re-validates the token server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── /admin routes ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login/admin", request.url));
    }
    // Admin roles come from app_metadata only — user_metadata is user-editable
    const role = getRole(user);
    if (!isAdmin(user)) {
      // Signed in but wrong role — redirect to their own portal
      const redirectTo =
        role === "driver" ? "/driver" : role === "citizen" ? "/citizen" : "/";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
    return supabaseResponse;
  }

  // ── /driver routes ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/driver")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login/driver", request.url));
    }
    // Must have role=driver in user metadata
    const role = getRole(user);
    if (role !== "driver") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  // ── /citizen routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/citizen")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login/citizen", request.url));
    }
    const role = getRole(user);
    if (role !== "citizen") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all paths except static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
