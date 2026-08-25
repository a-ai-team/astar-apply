// Shared helpers for the private-area gate. Works in both the proxy (edge) and server actions.
export const ACCESS_COOKIE = "astar_access";

export async function accessToken(key: string): Promise<string> {
  const data = new TextEncoder().encode(`astar-apply:${key}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Token that a valid cookie must match, or null if the key isn't configured. */
export async function expectedToken(): Promise<string | null> {
  const key = process.env.PRIVATE_ACCESS_KEY;
  if (!key) return null;
  return accessToken(key);
}
