// "Report a question" (Loop 08): input parsing + the 5-per-day rate limit, kept pure so they are
// unit-testable; the server action counts today's rows and calls `reportAllowance`.
import { z } from "zod";
import { PROGRAMMES, STAGES } from "./schema";

export const REPORTS_PER_DAY = 5;

export const ReportInputSchema = z.object({
  firm_id: z.string().uuid(),
  programme: z.enum(PROGRAMMES),
  stage: z.enum(STAGES),
  division: z.string().trim().max(120).transform((s) => s || null),
  asked_at: z.string().trim().regex(/^\d{4}-\d{2}(-\d{2})?$/, "use YYYY-MM or YYYY-MM-DD").or(z.literal("")).transform((s) => (s ? (s.length === 7 ? `${s}-01` : s) : null)),
  context: z.string().trim().max(1000).transform((s) => s || null),
  question: z.string().trim().min(10, "give the question in at least ten characters").max(600),
});
export type ReportInput = z.infer<typeof ReportInputSchema>;

export function parseReportInput(formData: FormData): { ok: true; value: ReportInput } | { ok: false; errors: string[] } {
  const raw = Object.fromEntries(["firm_id", "programme", "stage", "division", "asked_at", "context", "question"].map((k) => [k, String(formData.get(k) ?? "")]));
  const r = ReportInputSchema.safeParse(raw);
  if (r.success) return { ok: true, value: r.data };
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".") || "form"}: ${i.message}`) };
}

/** How many more reports a user may file today given the count already filed since UTC midnight. */
export function reportAllowance(countToday: number, perDay = REPORTS_PER_DAY): { allowed: boolean; remaining: number } {
  const remaining = Math.max(0, perDay - Math.max(0, Math.floor(countToday)));
  return { allowed: remaining > 0, remaining };
}

/** UTC midnight ISO string for "today" — the window the daily count uses. */
export function dayStart(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}
