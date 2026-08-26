"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";
import { safeNext } from "@/lib/site";
import { establishTeamSession } from "@/lib/team-session";

export type UnlockState = { error?: string };

export async function unlock(
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const key = process.env.PRIVATE_ACCESS_KEY;
  const attempt = String(formData.get("key") ?? "");
  const next = safeNext(formData.get("next"));

  if (!key || attempt !== key) {
    return { error: "Wrong key." };
  }

  (await cookies()).set(ACCESS_COOKIE, await accessToken(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // Single door: the key also signs the browser into the shared team account (docs/PRIVATE_AREA.md).
  const session = await establishTeamSession();
  if (!session.ok) {
    return { error: "Key accepted, but the team session could not be started. Try again or check the server logs." };
  }

  redirect(next);
}
