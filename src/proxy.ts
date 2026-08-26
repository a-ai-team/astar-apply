import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, expectedToken } from "@/lib/access";
import { updateSession } from "@/lib/supabase/proxy";
import { isStaff } from "@/lib/roles";

/**
 * Two gates (docs/PRIVATE_AREA.md):
 *  1. Shared access key cookie for everything under /home and /admin (pre-launch).
 *  2. Supabase session (refreshed here on every request) — /home needs a user,
 *     /admin needs a staff role. Cookie/JWT-only checks; no DB queries (Next proxy guidance).
 * Single door: the key is the only credential. A valid key cookie without a Supabase session
 * (expired, or cleared) goes to /auth/team, which signs the browser into the shared admin
 * "team" user. Magic-link login (/login) is retained for later but unlinked.
 * Server Actions bypass this matcher: every action must also call verifySession() (src/lib/dal.ts).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = pathname.startsWith("/home") || pathname.startsWith("/admin");

  if (isPrivate) {
    const expected = await expectedToken();
    const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
    if (!expected || cookie !== expected) {
      const url = new URL("/unlock", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  const session = await updateSession(request);

  if (isPrivate && !session.userId) {
    const url = new URL("/auth/team", request.url);
    url.searchParams.set("next", pathname);
    return redirectKeepingCookies(url, session.response);
  }
  if (pathname.startsWith("/admin") && !isStaff(session.role)) {
    return redirectKeepingCookies(new URL("/home", request.url), session.response);
  }
  if (pathname === "/login" && session.userId) {
    const next = request.nextUrl.searchParams.get("next");
    const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
    return redirectKeepingCookies(new URL(dest, request.url), session.response);
  }

  // Must return the response from updateSession (it carries refreshed auth cookies).
  return session.response;
}

function redirectKeepingCookies(url: URL, from: NextResponse) {
  const res = NextResponse.redirect(url);
  for (const c of from.cookies.getAll()) res.cookies.set(c);
  return res;
}

export const config = {
  matcher: ["/home/:path*", "/admin/:path*", "/login"],
};
