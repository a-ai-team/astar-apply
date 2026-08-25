import type { Page } from "@playwright/test";
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

/**
 * Signs in as a seeded e2e user (gate 2): `auth.admin.generateLink({ type: "magiclink" })` with
 * the service key, then visit our /auth/confirm route with the hashed token. We use
 * `hashed_token` + our own route rather than `action_link` because the Supabase verify
 * endpoint redirects with a URL fragment / PKCE code that a fresh browser cannot exchange.
 */
export async function signInAs(page: Page, email: E2EUser, next = "/home") {
  const { data, error } = await admin().auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const tokenHash = data.properties.hashed_token;
  await page.goto(`/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&next=${encodeURIComponent(next)}`);
}
