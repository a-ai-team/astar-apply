// Read helpers for interviews (Loop 07). Pages use the cookie client (RLS → own rows only);
// actions use these with the service-role client after an explicit ownership check.
import type { SupabaseClient } from "@supabase/supabase-js";
import { QuestionBodySchemaLoose } from "@/lib/practice/question-body";
import { getFirmInterviewQuestions } from "@/lib/firms/queries";
import type { LensSlug } from "@/lib/content/lesson-schema";
import type { GradeQuestion } from "./grade";
import type { InterviewRow, StoredReport, TurnRow } from "./types";

export type InterviewQuestion = GradeQuestion & { subtopic_slug: string | null; subtopic_title: string | null; source?: "curriculum" | "firm" };

export async function getInterview(db: SupabaseClient, id: string): Promise<InterviewRow | null> {
  const { data, error } = await db.from("interviews").select("id, user_id, mode, topic_id, question_ids, seconds_per_question, status, started_at, completed_at, overall_score, report").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as InterviewRow | null) ?? null;
}

export async function getTurns(db: SupabaseClient, interviewId: string): Promise<TurnRow[]> {
  const { data, error } = await db.from("interview_turns").select("id, interview_id, ordinal, question_id, firm_question_id, attempt_id, shown_at, answered_at, answer_text, transcript_meta, score, grade, graded_at").eq("interview_id", interviewId).order("ordinal");
  if (error) throw error;
  // Loop 08: a turn is either a curriculum question or a firm question; callers key on `question_id`.
  return (data ?? []).map((r) => ({ ...r, question_id: (r.question_id ?? r.firm_question_id) as string })) as TurnRow[];
}

/**
 * Approved questions by id with everything the grader and the runner need; unknown/unapproved ids are
 * simply absent. Loop 08: ids not found in `questions` are looked up in `firm_questions` (approved,
 * approved firm) so a "Practise this" drill runs through the same runner/grader/report.
 */
export async function getInterviewQuestions(db: SupabaseClient, ids: string[]): Promise<Map<string, InterviewQuestion>> {
  const out = await getCurriculumQuestions(db, ids);
  const missing = ids.filter((id) => !out.has(id));
  if (missing.length) for (const [id, q] of await getFirmInterviewQuestions(db, missing)) out.set(id, q);
  return out;
}

async function getCurriculumQuestions(db: SupabaseClient, ids: string[]): Promise<Map<string, InterviewQuestion>> {
  const out = new Map<string, InterviewQuestion>();
  if (!ids.length) return out;
  const { data, error } = await db.from("questions").select("id, slug, question, difficulty, body, status, topic:topics(slug, title), subtopic:subtopics(slug, title)").in("id", ids).eq("status", "approved");
  if (error) throw error;
  for (const r of data ?? []) {
    const body = QuestionBodySchemaLoose.safeParse(r.body);
    if (!body.success) continue;
    const topic = r.topic as unknown as { slug: string; title: string } | null;
    const sub = r.subtopic as unknown as { slug: string; title: string } | null;
    out.set(r.id as string, {
      id: r.id as string, slug: r.slug as string, question: r.question as string, difficulty: r.difficulty as number,
      topic_slug: topic?.slug ?? "", topic_title: topic?.title ?? "", subtopic_slug: sub?.slug ?? null, subtopic_title: sub?.title ?? null,
      model_answer_md: body.data.model_answer_md, key_points: body.data.key_points, weak_answer_note: body.data.weak_answer_note, numbers: body.data.numbers ?? null, source: "curriculum",
    });
  }
  return out;
}

export type InterviewSummary = Pick<InterviewRow, "id" | "mode" | "status" | "started_at" | "completed_at" | "overall_score"> & { count: number; topic: { slug: string; title: string } | null; lens: LensSlug | null };

export async function listInterviews(db: SupabaseClient, limit = 20): Promise<InterviewSummary[]> {
  const { data, error } = await db.from("interviews").select("id, mode, status, started_at, completed_at, overall_score, question_ids, report, topic:topics(slug, title)").order("started_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string, mode: r.mode as InterviewRow["mode"], status: r.status as InterviewRow["status"], started_at: r.started_at as string, completed_at: r.completed_at as string | null,
    overall_score: r.overall_score as number | null, count: ((r.question_ids as string[] | null) ?? []).length, topic: (r.topic as unknown as { slug: string; title: string } | null) ?? null,
    lens: (r.report as StoredReport | null)?.params?.lens ?? null,
  }));
}

/** Topics that have at least one approved question, with counts — the drill picker. */
export type DrillTopic = { slug: string; title: string; kind: string; count: number };

/** Topics with ≥ 1 approved question (industry modules included, `kind = 'industry'`), curriculum order. */
export async function drillTopics(db: SupabaseClient): Promise<DrillTopic[]> {
  const { data, error } = await db.from("questions").select("status, topic:topics!inner(slug, title, kind, ordinal)").eq("status", "approved");
  if (error) throw error;
  const m = new Map<string, { slug: string; title: string; kind: string; ordinal: number; count: number }>();
  for (const r of data ?? []) {
    const t = r.topic as unknown as { slug: string; title: string; kind: string; ordinal: number };
    const cur = m.get(t.slug) ?? { ...t, count: 0 };
    cur.count++;
    m.set(t.slug, cur);
  }
  return [...m.values()].sort((a, b) => a.ordinal - b.ordinal).map(({ slug, title, kind, count }) => ({ slug, title, kind, count }));
}
