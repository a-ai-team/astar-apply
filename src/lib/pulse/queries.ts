// Read helpers for Pulse (Loop 08). Student pages use the cookie client: RLS serves only `approved`
// digests. Admin pages pass the service-role client and filter on status themselves.
import type { SupabaseClient } from "@supabase/supabase-js";
import { validateDigest, type DigestBody } from "./schema";

export type DigestRow = { id: string; week_start: string; status: string; body: DigestBody; model: string | null; prompt_version: string | null; generated_at: string };
export type DigestSummary = Pick<DigestRow, "id" | "week_start" | "status" | "generated_at"> & { story_count: number; headlines: string[] };

const COLS = "id, week_start, status, body, model, prompt_version, generated_at";

function toRow(r: Record<string, unknown>): DigestRow | null {
  const v = validateDigest(r.body);
  if (!v.ok) {
    console.warn(`pulse_digests ${r.week_start}: body failed schema — ${v.errors.slice(0, 3).join("; ")}`);
    return null;
  }
  return { id: r.id as string, week_start: String(r.week_start), status: r.status as string, body: v.value, model: (r.model as string | null) ?? null, prompt_version: (r.prompt_version as string | null) ?? null, generated_at: String(r.generated_at) };
}

export async function listDigests(db: SupabaseClient, opts: { statuses?: string[]; limit?: number } = {}): Promise<DigestSummary[]> {
  let q = db.from("pulse_digests").select(COLS).order("week_start", { ascending: false }).limit(opts.limit ?? 52);
  if (opts.statuses) q = q.in("status", opts.statuses);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).flatMap((r) => {
    const row = toRow(r as Record<string, unknown>);
    return row ? [{ id: row.id, week_start: row.week_start, status: row.status, generated_at: row.generated_at, story_count: row.body.stories.length, headlines: row.body.stories.map((s) => s.headline) }] : [];
  });
}

export async function getDigest(db: SupabaseClient, week: string): Promise<DigestRow | null> {
  const { data, error } = await db.from("pulse_digests").select(COLS).eq("week_start", week).maybeSingle();
  if (error) throw error;
  return data ? toRow(data as Record<string, unknown>) : null;
}

/** Newest approved digest (cookie client: RLS already limits to approved). */
export async function latestDigest(db: SupabaseClient, opts: { statuses?: string[] } = {}): Promise<DigestRow | null> {
  let q = db.from("pulse_digests").select(COLS).order("week_start", { ascending: false }).limit(1);
  if (opts.statuses) q = q.in("status", opts.statuses);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data ? toRow(data as Record<string, unknown>) : null;
}

/** "Week of 24 August 2026" for a YYYY-MM-DD Monday. */
export function weekLabel(week: string): string {
  const d = new Date(`${week}T00:00:00Z`);
  return `Week of ${d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`;
}
