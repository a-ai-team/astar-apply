"use server";

// `reportQuestion` (Loop 08): a signed-in student files an interview question they were asked; it
// waits as `pending` in /admin/reports until a mentor approves (→ promoted to firm_questions) or
// rejects it. 5 per user per UTC day, counted on firm_question_reports. Writes via the cookie
// client (RLS: own insert) after the firm is confirmed approved.
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { dayStart, parseReportInput, reportAllowance, REPORTS_PER_DAY } from "@/lib/firms/reports";

export type ReportState = { ok: boolean; errors: string[]; message?: string; remaining?: number };

export async function reportQuestion(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const session = await verifySession("/home/interviews/report");
  const parsed = parseReportInput(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  const db = await createClient();
  const { count, error: cErr } = await db.from("firm_question_reports").select("id", { count: "exact", head: true }).eq("user_id", session.userId).gte("created_at", dayStart());
  if (cErr) return { ok: false, errors: [cErr.message] };
  const allowance = reportAllowance(count ?? 0);
  if (!allowance.allowed) return { ok: false, errors: [`You have filed ${REPORTS_PER_DAY} reports today — thank you. Try again tomorrow.`], remaining: 0 };
  const { data: firm } = await db.from("firms").select("id").eq("id", parsed.value.firm_id).maybeSingle();
  if (!firm) return { ok: false, errors: ["firm: pick a firm from the list"] };
  const { error } = await db.from("firm_question_reports").insert({ user_id: session.userId, ...parsed.value });
  if (error) return { ok: false, errors: [error.message] };
  return { ok: true, errors: [], message: "Thanks — a mentor will review it before it appears in the bank.", remaining: allowance.remaining - 1 };
}
