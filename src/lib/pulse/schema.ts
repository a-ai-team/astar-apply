// Pulse digest shape (Loop 08): one weekly, AI-written market digest with interview framing.
// `pulse_digests.body` must validate against DigestBodySchema before it is stored or rendered.
import { z } from "zod";

export const PULSE_DEFAULT_DOMAINS = ["ft.com", "reuters.com", "bloomberg.com", "bbc.co.uk", "economist.com", "wsj.com"] as const;

export const StorySchema = z.object({
  headline: z.string().min(8).max(160).describe("The story in one line, no clickbait"),
  take_md: z.string().min(40).max(1500).describe("The 30-second take: what happened, why it matters to a bank, 60–120 words"),
  talking_points: z.array(z.string().min(8).max(240)).length(3).describe("Exactly three points a candidate could say in an interview"),
  anchors: z.array(z.string().min(4).max(240)).max(4).describe("Historical anchors or comparable episodes, dated"),
  practice_qs: z.array(z.object({ q: z.string().min(8).max(300), a: z.string().min(20).max(900) })).min(1).max(3).describe("Interview questions this story could prompt, with a model answer outline"),
  sources: z.array(z.object({ title: z.string().min(1).max(200), url: z.string().url().max(500) })).min(1).max(5).describe("Where it was read; real URLs from the search results only"),
});
export const DigestBodySchema = z.object({
  intro_md: z.string().max(800).default(""),
  stories: z.array(StorySchema).min(3).max(6),
});
export type Story = z.infer<typeof StorySchema>;
export type DigestBody = z.infer<typeof DigestBodySchema>;

export function validateDigest(input: unknown): { ok: true; value: DigestBody } | { ok: false; errors: string[] } {
  const r = DigestBodySchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data };
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
}

/** Returns the ISO date of the Monday on or before `d` (UTC). */
export function weekStart(d: Date = new Date()): string {
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = u.getUTCDay(); // 0 Sun … 6 Sat
  u.setUTCDate(u.getUTCDate() - ((day + 6) % 7));
  return u.toISOString().slice(0, 10);
}

/** True when the string is a `YYYY-MM-DD` Monday. */
export function isWeekStart(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s && d.getUTCDay() === 1;
}

export function allowedDomains(): string[] {
  const env = process.env.PULSE_ALLOWED_DOMAINS?.split(",").map((s) => s.trim()).filter(Boolean);
  return env?.length ? env : [...PULSE_DEFAULT_DOMAINS];
}
