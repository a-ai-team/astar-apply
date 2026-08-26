import type { Cookie, Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { ACCESS_COOKIE, accessToken } from "../../src/lib/access";

export type E2EUser = "e2e-student@astar.test" | "e2e-mentor@astar.test" | "e2e-admin@astar.test";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing (.env.local)");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Sets the shared access-key cookie (gate 1) on the Playwright context. */
export async function unlockPrivateArea(page: Page, baseURL: string) {
  const key = process.env.PRIVATE_ACCESS_KEY;
  if (!key) throw new Error("PRIVATE_ACCESS_KEY missing (.env.local)");
  await page.context().addCookies([
    { name: ACCESS_COOKIE, value: await accessToken(key), url: baseURL, httpOnly: true, sameSite: "Lax" },
  ]);
}

// Session cookies per user, reused across tests in one run. Supabase rate-limits token
// verifications to 30 per 5 min per IP (supabase/config.toml `token_verifications`), and the
// suite plus the team-session verifications would exceed that if every test verified afresh.
// Access tokens last 1 h, far longer than a run, and nothing here signs out server-side.
const sessionCookies = new Map<E2EUser, Cookie[]>();

/**
 * Signs in as a seeded e2e user: `auth.admin.generateLink({ type: "magiclink" })` with the
 * service key, then visit our /auth/confirm route with the hashed token. We use
 * `hashed_token` + our own route rather than `action_link` because the Supabase verify
 * endpoint redirects with a URL fragment / PKCE code that a fresh browser cannot exchange.
 * (Magic-link login is unlinked in the UI — the team key is the only door — but per-role
 * behaviour is still tested through it.)
 */
export async function signInAs(page: Page, email: E2EUser, next = "/home") {
  const cached = sessionCookies.get(email);
  if (cached) {
    await clearSupabaseCookies(page);
    await page.context().addCookies(cached);
    await page.goto(next);
    return;
  }
  const { data, error } = await admin().auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const tokenHash = data.properties.hashed_token;
  await page.goto(`/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent(next)}`);
  const cookies = (await page.context().cookies()).filter((c) => c.name.startsWith("sb-"));
  if (cookies.length) sessionCookies.set(email, cookies);
}

async function clearSupabaseCookies(page: Page) {
  const context = page.context();
  const keep = (await context.cookies()).filter((c) => !c.name.startsWith("sb-"));
  await context.clearCookies();
  if (keep.length) await context.addCookies(keep);
}

/** Clears today's usage_daily row for a test user (Loop 02: CHAT_DAILY_CAP=1 in e2e). */
export async function resetDailyUsage(email: E2EUser) {
  const client = admin();
  const { data, error } = await client.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`${email} missing — run \`npm run seed -- 00\``);
  const today = new Date().toISOString().slice(0, 10);
  const { error: delError } = await client.from("usage_daily").delete().eq("user_id", user.id).eq("day", today);
  if (delError) throw delError;
}
