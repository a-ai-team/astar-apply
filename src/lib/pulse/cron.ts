// Auth for GET /api/cron/pulse (Loop 08). Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`
// when the env var exists on the project. No secret configured → every call is refused (never
// open by default). Comparison is constant-time.
import { timingSafeEqual } from "node:crypto";

export function cronAuthorized(authorization: string | null, secret: string | undefined = process.env.CRON_SECRET): boolean {
  if (!secret || !authorization) return false;
  const m = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  if (!m) return false;
  const given = Buffer.from(m[1]);
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}
