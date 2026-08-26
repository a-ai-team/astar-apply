"use server";

// /admin/reports decisions (Loop 08). Approve → the report becomes an `approved` firm_questions row
// (reported_by = the student, recency_year = the year asked, category chosen by the reviewer);
// reject → status only. Staff-only; service-role writes after verifyStaff().
import { revalidatePath } from "next/cache";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIES, FREQUENCIES } from "@/lib/firms/schema";

export type ReportDecisionState = { ok: boolean; errors: string[]; message?: string };

export async function decideReport(_prev: ReportDecisionState, formData: FormData): Promise<ReportDecisionState> {
  const session = await verifyStaff();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const category = String(formData.get("category") ?? "motivation") as (typeof CATEGORIES)[number];
  const frequency = String(formData.get("frequency") ?? "occasional") as (typeof FREQUENCIES)[number];
  const guidance = String(formData.get("guidance_md") ?? "").trim().slice(0, 4000);
  if (!id || (decision !== "approved" && decision !== "rejected")) return { ok: false, errors: ["bad request"] };
  if (!CATEGORIES.includes(category) || !FREQUENCIES.includes(frequency)) return { ok: false, errors: ["bad category/frequency"] };
  const db = createAdminClient();
  const { data: r, error } = await db.from("firm_question_reports").select("id, user_id, firm_id, programme, stage, division, asked_at, question, status").eq("id", id).maybeSingle();
  if (error) return { ok: false, errors: [error.message] };
  if (!r) return { ok: false, errors: ["report not found"] };
  if (r.status !== "pending") return { ok: false, errors: [`already ${r.status}`] };
  let promoted: string | null = null;
  if (decision === "approved") {
    const row = { firm_id: r.firm_id, category, division: r.division, question: (r.question as string).trim(), stage: r.stage, programme: r.programme, frequency, recency_year: r.asked_at ? Number(String(r.asked_at).slice(0, 4)) : null, guidance_md: guidance, sources: [], status: "approved", reported_by: r.user_id, generated_by: `report:${r.id}` };
    const { data: q, error: qErr } = await db.from("firm_questions").upsert(row, { onConflict: "firm_id,question" }).select("id").single();
    if (qErr) return { ok: false, errors: [qErr.message] };
    promoted = q.id as string;
  }
  const { error: uErr } = await db.from("firm_question_reports").update({ status: decision, reviewer_id: session.userId, reviewed_at: new Date().toISOString(), promoted_question_id: promoted }).eq("id", id);
  if (uErr) return { ok: false, errors: [uErr.message] };
  revalidatePath("/admin/reports");
  return { ok: true, errors: [], message: decision === "approved" ? "Approved and added to the firm's bank." : "Rejected." };
}
