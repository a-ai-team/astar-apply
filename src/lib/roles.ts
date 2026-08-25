// App roles. Stored in `profiles.role`; mirrored into the JWT as the `user_role` claim by the
// Postgres custom-access-token hook in supabase/migrations/0001_init.sql.
// NOTE: the claim is `user_role`, not `role` — Supabase already uses `role` for the Postgres
// role (`authenticated`) and overwriting it breaks every PostgREST query.
export const ROLES = ["student", "mentor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_CLAIM = "user_role";

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function roleFromClaims(claims: Record<string, unknown> | null | undefined): Role | null {
  const value = claims?.[ROLE_CLAIM];
  return isRole(value) ? value : null;
}

/** Staff can open /admin. */
export function isStaff(role: Role | null | undefined): boolean {
  return role === "admin" || role === "mentor";
}
