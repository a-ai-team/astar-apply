"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin, safeNext } from "@/lib/site";

export type LoginState = { error?: string; sent?: boolean; email?: string };

// Magic-link login is retained for later (user accounts); it is not linked from the UI while the
// access key is the only door (docs/PRIVATE_AREA.md).
/** Send a magic link. Sign-up and sign-in are the same action (Supabase creates the user). */
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const origin = await requestOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };
  return { sent: true, email };
}

// TODO(james): Google OAuth — needs a GCP consent screen + client ID in Supabase → Auth →
// Providers. Then add `signInWithOAuth({ provider: "google", options: { redirectTo } })` here.

/** Leave the private area: drop the Supabase session and the access-key cookie, back to /unlock. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ACCESS_COOKIE);
  redirect("/unlock");
}
