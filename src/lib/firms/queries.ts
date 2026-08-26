// Read helpers for the firm bank (Loop 08). Student pages use the cookie client: RLS serves only
// approved firms and approved questions of approved firms. Admin pages pass the service-role client
// and filter on status themselves.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { InterviewQuestion } from "@/lib/interviews/queries";
import { gradeMaterialFromGuidance, type Firm, type FirmQuestion } from "./schema";

export type FirmRow = Firm & { id: string; status: string; updated_at: string };
export type FirmQuestionRow = FirmQuestion & { id: string; firm_id: string; status: string; reported_by: string | null; generated_by: string | null; created_at: string };
export type FirmSummary = Pick<FirmRow, "id" | "slug" | "name" | "type" | "hq" | "status"> & { question_count: number };

const FIRM_COLS = "id, slug, name, type, founded, hq, headcount, scale_note, divisions, values, process, sources, status, updated_at";
const Q_COLS = "id, firm_id, category, division, question, stage, programme, frequency, recency_year, guidance_md, sources, status, reported_by, generated_by, created_at";

export async function listFirms(db: SupabaseClient, opts: { statuses?: string[] } = {}): Promise<FirmSummary[]> {
  let q = db.from("firms").select("id, slug, name, type, hq, status").order("name");
  if (opts.statuses) q = q.in("status", opts.statuses);
  const { data, error } = await q;
  if (error) throw error;
  const firms = (data ?? []) as Omit<FirmSummary, "question_count">[];
  if (!firms.length) return [];
  let cq = db.from("firm_questions").select("firm_id, status").in("firm_id", firms.map((f) => f.id));
  if (opts.statuses) cq = cq.in("status", opts.statuses);
  const { data: qs, error: qErr } = await cq;
  if (qErr) throw qErr;
  const counts = new Map<string, number>();
  for (const r of qs ?? []) counts.set(r.firm_id as string, (counts.get(r.firm_id as string) ?? 0) + 1);
  return firms.map((f) => ({ ...f, question_count: counts.get(f.id) ?? 0 }));
}

export async function getFirm(db: SupabaseClient, slug: string): Promise<FirmRow | null> {
  const { data, error } = await db.from("firms").select(FIRM_COLS).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as FirmRow | null) ?? null;
}

export async function listFirmQuestions(db: SupabaseClient, firmId: string, opts: { statuses?: string[] } = {}): Promise<FirmQuestionRow[]> {
  let q = db.from("firm_questions").select(Q_COLS).eq("firm_id", firmId).order("category").order("frequency").order("created_at");
  if (opts.statuses) q = q.in("status", opts.statuses);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as FirmQuestionRow[];
}

/**
 * Firm questions in the Loop 07 `InterviewQuestion` shape so the runner, grader and report can
 * drill them unchanged: model answer / key points / weak-answer note are derived from guidance_md.
 * Only approved questions of approved firms are returned through RLS on the cookie client; the
 * service-role client gets the same filter applied here.
 */
export async function getFirmInterviewQuestions(db: SupabaseClient, ids: string[]): Promise<Map<string, InterviewQuestion>> {
  const out = new Map<string, InterviewQuestion>();
  if (!ids.length) return out;
  const { data, error } = await db.from("firm_questions").select("id, question, category, guidance_md, status, firm:firms!inner(slug, name, status)").in("id", ids).eq("status", "approved");
  if (error) throw error;
  for (const r of data ?? []) {
    const firm = r.firm as unknown as { slug: string; name: string; status: string };
    if (firm.status !== "approved") continue;
    const material = gradeMaterialFromGuidance(r.question as string, r.guidance_md as string);
    out.set(r.id as string, {
      id: r.id as string, slug: `firm-${firm.slug}-${(r.id as string).slice(0, 8)}`, question: r.question as string, difficulty: r.category === "technical" ? 3 : 2,
      topic_slug: `firm:${firm.slug}`, topic_title: firm.name, subtopic_slug: r.category as string, subtopic_title: null,
      ...material, numbers: null, source: "firm",
    });
  }
  return out;
}
