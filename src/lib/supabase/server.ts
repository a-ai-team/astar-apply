import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicKey, supabaseUrl } from "./env";

/**
 * Cookie-backed client for Server Components, Server Actions and Route Handlers.
 * Create a new one per request (it just configures `fetch` with the request's cookies).
 * Pattern from supabase.com/docs/guides/auth/server-side/creating-a-client (Next.js tab).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabasePublicKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, which can't write cookies. Safe to ignore:
          // src/proxy.ts refreshes the session and writes cookies on every request.
        }
      },
    },
  });
}
