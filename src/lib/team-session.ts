import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Shared "team" account that the access key signs everyone into (docs/PRIVATE_AREA.md). */
export const TEAM_USER_DISPLAY_NAME = "A* team";

export function teamUserEmail(): string {
  return process.env.TEAM_USER_EMAIL || "team@astar-apply.internal";
}

export type TeamSessionResult = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Establish the shared team Supabase session on the current response.
 *
 * Single door: the site password is the only credential. Behind it we still want the
 * Supabase machinery (`verifySession()`, RLS, the `user_role` claim), so we sign the browser
 * into one shared admin user without an email round-trip:
 *  1. service role: ensure the team user exists (`email_confirm: true`) and `profiles.role = 'admin'`;
 *  2. `auth.admin.generateLink({ type: "magiclink" })` → `properties.hashed_token`;
 *  3. cookie client: `auth.verifyOtp({ type: "magiclink", token_hash })` — this writes the
 *     session cookies onto the current response (same mechanism as e2e/helpers/auth.ts).
 *
 * Must be called where cookies can be written (Server Action or Route Handler). Never throws:
 * failures are logged and returned so the caller can decide what to do.
 */
export async function establishTeamSession(): Promise<TeamSessionResult> {
  // Serialise within this process: generating a magic link invalidates the previous one, so
  // concurrent entries (a navigation plus its prefetches, all bounced to /auth/team) would
  // otherwise race and fail. Each call still writes cookies to its own request.
  const run = queue.then(establishTeamSessionNow, establishTeamSessionNow);
  queue = run.then(noop, noop);
  return run;
}

let queue: Promise<unknown> = Promise.resolve();
const noop = () => undefined;

async function establishTeamSessionNow(): Promise<TeamSessionResult> {
  try {
    const admin = createAdminClient();
    const email = teamUserEmail();

    const userId = await ensureTeamUser(admin, email);

    const supabase = await createClient();
    // One retry for the cross-instance race the in-process queue cannot cover.
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (linkError) throw linkError;
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: link.properties.hashed_token,
      });
      if (!verifyError) return { ok: true, userId };
      lastError = verifyError;
    }
    throw lastError;
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[team-session] failed to establish team session:", error);
    return { ok: false, error };
  }
}

async function ensureTeamUser(admin: ReturnType<typeof createAdminClient>, email: string): Promise<string> {
  let id: string | undefined;
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  id = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;

  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { display_name: TEAM_USER_DISPLAY_NAME },
    });
    if (error) throw error;
    id = data.user.id;
  }

  // The `user_role` JWT claim is copied from profiles.role at token issue time (migration 0001),
  // so the role must be right before generateLink/verifyOtp.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({ id, role: "admin", display_name: TEAM_USER_DISPLAY_NAME }, { onConflict: "id" });
  if (profileError) throw profileError;

  return id;
}
