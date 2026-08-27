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

/**
 * Redirects to /auth/team when there is no valid session: with a valid access-key cookie that
 * route re-establishes the shared team session, otherwise it bounces to /unlock.
 */
export async function verifySession(next?: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(next ? `/auth/team?next=${encodeURIComponent(next)}` : "/auth/team");
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
