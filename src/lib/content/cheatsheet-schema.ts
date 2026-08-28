// Cheat sheet JSON validator (Loop 11) — CONTRACTS.md § Technicals v2. One per curriculum topic,
// living in `content/cheatsheets/<topic_slug>.json`, rendered by
// /home/technicals/[topic]/cheatsheet with print CSS. Keep this file free of React.
import { z } from "zod";

export const CheatSheetSchema = z.object({
  topic_slug: z.string().min(1),
  /** Every formula the student should be able to write from memory, with a plain-English note. */
  formulas: z.array(z.object({ name: z.string().min(1), latex: z.string().min(1), note: z.string().min(1) })).min(1),
  /** The memorisable answers: question → the 60–90 word answer, trimmed to its spine. */
  canonical: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).min(1),
  /** The mistakes that lose the offer, one line each. */
  traps: z.array(z.string().min(1)).min(1),
  one_liners: z.array(z.string().min(1)).min(1),
  /**
   * `ft-only` material: named so the student is not blindsided, never taught as a lesson
   * (docs/research/technicals-v2/00-syllabus.md § 8).
   */
  you_may_hear: z.array(z.string().min(1)).default([]),
});

export type CheatSheet = z.infer<typeof CheatSheetSchema>;

export type CheatSheetValidation = { ok: true; value: CheatSheet; errors: [] } | { ok: false; value: null; errors: string[] };

export function validateCheatSheet(input: unknown): CheatSheetValidation {
  const r = CheatSheetSchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data, errors: [] };
  return { ok: false, value: null, errors: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
}
