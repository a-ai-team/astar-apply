// Pure helper for the /auth/team route so the `next` validation is unit-testable (no server-only imports).

/** Only same-site relative paths (no protocol-relative `//evil`) may be post-entry destinations. */
export function safeTeamNext(next: unknown, fallback = "/home"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/**
 * Where /auth/team sends the browser: the validated `next` when the session was established,
 * otherwise back to /unlock carrying `next` (and `error=session` when the key was fine but the
 * team session could not be started).
 */
export function teamEntryTarget(
  origin: string,
  rawNext: unknown,
  outcome: "ok" | "no-key" | "session-failed",
): string {
  const next = safeTeamNext(rawNext);
  if (outcome === "ok") return `${origin}${next}`;
  const url = new URL("/unlock", origin);
  url.searchParams.set("next", next);
  if (outcome === "session-failed") url.searchParams.set("error", "session");
  return url.toString();
}
