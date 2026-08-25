import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStaff, roleFromClaims, type Role } from "@/lib/roles";

export type Session = { userId: string; email: string | null; role: Role };

/**
 * Data Access Layer — the single source of auth truth for Server Components, Server Actions
 * and Route Handlers (Next docs: guides/authentication § Data Access Layer). Server Actions
 * bypass proxy matchers, so every action must call this. Memoised per render pass.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    role: roleFromClaims(claims) ?? "student",
  };
});

/** Redirects to /login when there is no valid session. */
export async function verifySession(next?: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return session;
}

/** Redirects non-staff to /home. */
export async function verifyStaff(): Promise<Session> {
  const session = await verifySession("/admin");
  if (!isStaff(session.role)) redirect("/home");
  return session;
}

export async function verifyAdmin(): Promise<Session> {
  const session = await verifySession("/admin");
  if (session.role !== "admin") redirect("/home");
  return session;
}
