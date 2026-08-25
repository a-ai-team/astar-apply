"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";

export type UnlockState = { error?: string };

export async function unlock(
  _prev: UnlockState,
  formData: FormData,
): Promise<UnlockState> {
  const key = process.env.PRIVATE_ACCESS_KEY;
  const attempt = String(formData.get("key") ?? "");
  const next = String(formData.get("next") ?? "/home");

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

  redirect(next.startsWith("/") ? next : "/home");
}
