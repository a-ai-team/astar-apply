import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublicKey, supabaseUrl } from "./env";
import { roleFromClaims, type Role } from "@/lib/roles";

export type SessionInfo = {
  /** Response carrying any refreshed auth cookies. Always return this (or copy its cookies). */
  response: NextResponse;
  userId: string | null;
  role: Role | null;
};

/**
 * Refresh the Supabase session inside `src/proxy.ts` and expose the verified claims.
 * Pattern from Supabase's `lib/supabase/proxy.ts` (creating-a-client guide, Next.js tab).
 * `getClaims()` validates the JWT signature; never use `getSession()` here.
 */
export async function updateSession(request: NextRequest): Promise<SessionInfo> {
  let supabaseResponse = NextResponse.next({ request });

  // With Fluid compute, don't put this client in a global. Always create one per request.
  const supabase = createServerClient(supabaseUrl(), supabasePublicKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  // Do not run code between createServerClient and getClaims(): a simple mistake here
  // makes users get randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  return {
    response: supabaseResponse,
    userId: claims?.sub ?? null,
    role: claims ? roleFromClaims(claims) : null,
  };
}
