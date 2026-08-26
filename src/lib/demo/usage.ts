// Landing-page demo chat cap (Loop 10): DEMO_CHAT_DAILY_CAP answers per hashed IP per UTC day.
// Counter lives in memory (per server process) and, when 0011 is applied, in `demo_usage` via
// `increment_demo_usage()` so it survives restarts and scales across instances. The higher of the
// two counts wins, so the memory store never under-counts a running instance.
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export function demoCap(): number {
  const n = Number(process.env.DEMO_CHAT_DAILY_CAP ?? 3);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** SHA-256 of salt + ip; the raw IP is never stored. */
export function hashIp(ip: string, salt = process.env.DEMO_IP_SALT || (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").slice(0, 16) || "astar-demo"): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
}

const memory = new Map<string, number>();

export function resetDemoMemory() {
  memory.clear();
}

/** Bumps and returns the count for (ipHash, day). `db` optional (null → memory only). */
export async function bumpDemoUsage(ipHash: string, db: SupabaseClient | null, day = utcDay()): Promise<number> {
  const key = `${ipHash}:${day}`;
  const mem = (memory.get(key) ?? 0) + 1;
  memory.set(key, mem);
  if (!db) return mem;
  const { data, error } = await db.rpc("increment_demo_usage", { p_ip_hash: ipHash, p_day: day });
  if (error) return mem; // 0011 unapplied → memory only
  const n = Number(data ?? 0);
  if (n > mem) memory.set(key, n);
  return Math.max(n, mem);
}

/** Pure decision used by the route: over the cap once `count > cap`. */
export function overCap(count: number, cap = demoCap()): boolean {
  return count > cap;
}
