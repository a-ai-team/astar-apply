"use server";

// Server actions for mock interviews (Loop 07). Every action re-verifies the session (Server
// Actions bypass the proxy), loads the interview with the service-role client to give a stranger an
// explicit 403 (`checkOwnership`), and writes through the cookie client so RLS is the second guard.
// The server clock is the clock of record: `shown_at` is stamped when a question is served and
// `duration_s` is computed here on submit — the browser's timer is display only.
import { redirect } from "next/navigation";
import { z } from "zod";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveChatMode } from "@/lib/chat/mode";
import { gradeTurn } from "@/lib/interviews/grade";
import { checkOwnership } from "@/lib/interviews/ownership";
import { getInterview, getInterviewQuestions, getTurns } from "@/lib/interviews/queries";
import { buildReport, loadLessonIndex, type ReportTurn } from "@/lib/interviews/report";
import { loadPool, MOCK_TOPICS, selectDrill, selectMock } from "@/lib/interviews/select";
import { DRILL_SECONDS, LATE_GRACE_SECONDS, MOCK_SECONDS, type Grade, type InterviewMode, type TranscriptMeta } from "@/lib/interviews/types";
import { typedMetrics } from "@/lib/interviews/speech-metrics";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; status?: 400 | 403 | 404 | 409 };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Form action from /home/interviews: creates the interview + its turns, serves question 1, redirects to the runner. */
export async function startInterview(formData: FormData): Promise<void> {
  const session = await verifySession("/home/interviews");
  const mode = String(formData.get("mode") ?? "") as InterviewMode;
  const topicSlug = String(formData.get("topic") ?? "").trim();
  // Loop 09: a full mock may add one industry module (`industry_topic_id` on the interview) so
  // 3–4 of its questions join the generalist round-robin.
  const industrySlug = String(formData.get("industry") ?? "").trim();
  if (mode !== "drill" && mode !== "mock") throw new Error("bad mode");
  if (mode === "drill" && !/^[a-z0-9-]+$/.test(topicSlug)) throw new Error("bad topic");
  if (industrySlug && !/^[a-z0-9-]+$/.test(industrySlug)) throw new Error("bad industry");
  const db = await createClient();
  const pool = await loadPool(db, mode === "drill" ? topicSlug : undefined);
  const mockTopics = mode === "mock" && industrySlug ? [...MOCK_TOPICS, industrySlug] : undefined;
  const sel = mode === "drill" ? selectDrill(pool, topicSlug) : selectMock(pool, mockTopics ? { topics: mockTopics } : {});
  if (!sel.ids.length) redirect(`/home/interviews?error=${encodeURIComponent(mode === "drill" ? `No approved questions in ${topicSlug} yet.` : "No approved questions yet.")}`);
  let topicId: string | null = null;
  const wantedSlug = mode === "drill" ? topicSlug : industrySlug;
  if (wantedSlug) {
    const { data: t } = await db.from("topics").select("id").eq("slug", wantedSlug).maybeSingle();
    topicId = (t?.id as string | undefined) ?? null;
  }
  const { data: created, error } = await db
    .from("interviews")
    .insert({ user_id: session.userId, mode, topic_id: topicId, question_ids: sel.ids, seconds_per_question: mode === "drill" ? DRILL_SECONDS : MOCK_SECONDS })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "could not create interview");
  const now = new Date().toISOString();
  const { error: tErr } = await db.from("interview_turns").insert(sel.ids.map((qid, i) => ({ interview_id: created.id, ordinal: i, question_id: qid, shown_at: i === 0 ? now : null })));
  if (tErr) throw new Error(tErr.message);
  redirect(`/home/interviews/${created.id}`);
}

/**
 * Loop 08 "Practise this": a 1-question drill on an approved firm question (Loop 07 retro note 1).
 * Same runner, grader and report; the turn carries `firm_question_id` instead of `question_id`.
 */
export async function startDrillFor(formData: FormData): Promise<void> {
  const session = await verifySession("/home/interviews/firms");
  const firmQuestionId = String(formData.get("firmQuestionId") ?? "");
  const back = String(formData.get("back") ?? "/home/interviews/firms");
  if (!UUID.test(firmQuestionId)) redirect(back.startsWith("/home/") ? back : "/home/interviews/firms");
  const db = await createClient();
  const questions = await getInterviewQuestions(db, [firmQuestionId]);
  if (!questions.get(firmQuestionId)) redirect(`${back.startsWith("/home/") ? back : "/home/interviews/firms"}?error=${encodeURIComponent("That question is not available to practise yet.")}`);
  const { data: created, error } = await db
    .from("interviews")
    .insert({ user_id: session.userId, mode: "drill", topic_id: null, question_ids: [firmQuestionId], seconds_per_question: DRILL_SECONDS })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "could not create interview");
  const { error: tErr } = await db.from("interview_turns").insert({ interview_id: created.id, ordinal: 0, question_id: null, firm_question_id: firmQuestionId, shown_at: new Date().toISOString() });
  if (tErr) throw new Error(tErr.message);
  redirect(`/home/interviews/${created.id}`);
}

const MetricsSchema = z.object({
  wpm: z.number().min(0).max(600).nullable().optional(),
  filler_count: z.number().int().min(0).max(500).optional(),
  fillers: z.array(z.string().max(30)).max(50).optional(),
  duration_s: z.number().min(0).max(3600).optional(),
  voice: z.boolean().optional(),
});

export type SubmitTurnInput = { interviewId: string; ordinal: number; answerText: string; metrics?: z.input<typeof MetricsSchema> | null };
export type SubmitTurnResult = ActionResult<{ score: number; grade: Grade; attemptId: string | null; late: boolean; durationS: number; next: { ordinal: number; shownAt: string } | null; gradedBy: string }>;

/** Grades one turn synchronously (< 10 s live, instant in fixture mode), writes the attempt, serves the next question. Idempotent per turn. */
export async function submitTurn(input: SubmitTurnInput): Promise<SubmitTurnResult> {
  const session = await verifySession("/home/interviews");
  if (!UUID.test(input.interviewId)) return { ok: false, error: "bad interview id", status: 400 };
  const ordinal = Number(input.ordinal);
  if (!Number.isInteger(ordinal) || ordinal < 0) return { ok: false, error: "bad ordinal", status: 400 };
  const answerText = String(input.answerText ?? "").slice(0, 6000);
  const admin = createAdminClient();
  const interview = await getInterview(admin, input.interviewId);
  const own = checkOwnership(interview, session.userId);
  if (!own.ok) return { ok: false, error: own.error, status: own.status };
  if (interview!.status !== "in_progress") return { ok: false, error: "this interview is over", status: 409 };
  const turns = await getTurns(admin, interview!.id);
  const turn = turns.find((t) => t.ordinal === ordinal);
  if (!turn) return { ok: false, error: "no such turn", status: 404 };
  const nextTurn = turns.find((t) => t.ordinal === ordinal + 1) ?? null;
  if (turn.answered_at && turn.grade) {
    // Already graded (double submit / reload): return what we have, make sure the next question is served.
    const shownAt = nextTurn ? nextTurn.shown_at ?? (await serve(admin, nextTurn.id)) : null;
    return { ok: true, score: Number(turn.score ?? 0), grade: turn.grade, attemptId: turn.attempt_id, late: Boolean(turn.transcript_meta?.late), durationS: turn.transcript_meta?.duration_s ?? 0, next: nextTurn && shownAt ? { ordinal: nextTurn.ordinal, shownAt } : null, gradedBy: "stored" };
  }
  const questions = await getInterviewQuestions(admin, [turn.question_id]);
  const q = questions.get(turn.question_id);
  if (!q) return { ok: false, error: "question is no longer available", status: 409 };

  // Server-side timing.
  const now = new Date();
  const shownAt = turn.shown_at ? new Date(turn.shown_at) : now;
  const durationS = Math.max(0, Math.round((now.getTime() - shownAt.getTime()) / 100) / 10);
  const late = durationS > interview!.seconds_per_question + LATE_GRACE_SECONDS;
  const parsedMetrics = MetricsSchema.safeParse(input.metrics ?? {});
  const clientMetrics = parsedMetrics.success ? parsedMetrics.data : {};
  const typed = typedMetrics(answerText, durationS);
  const metrics: TranscriptMeta = {
    wpm: clientMetrics.voice ? (clientMetrics.wpm ?? typed.wpm) : typed.wpm,
    filler_count: clientMetrics.voice ? (clientMetrics.filler_count ?? 0) : typed.filler_count,
    fillers: clientMetrics.voice ? (clientMetrics.fillers ?? []) : typed.fillers,
    duration_s: durationS,
    late,
    voice: Boolean(clientMetrics.voice),
  };

  const mode = await resolveChatMode();
  const graded = await gradeTurn({ question: q, answer: answerText, metrics, secondsAllowed: interview!.seconds_per_question }, mode);

  const db = await createClient();
  // Firm questions (Loop 08) are not `questions` rows, so they get no attempts row (attempts.question_id FK).
  let attemptId: string | null = null;
  if (q.source !== "firm") {
    const { data: attempt, error: aErr } = await db
      .from("attempts")
      .insert({ user_id: session.userId, question_id: q.id, mode: interview!.mode, self_grade: null, answer_text: answerText || null, ai_score: graded.score, ai_feedback: graded.grade, interview_id: interview!.id })
      .select("id")
      .single();
    if (aErr) return { ok: false, error: aErr.message };
    attemptId = attempt.id as string;
  }
  const { error: uErr } = await db
    .from("interview_turns")
    .update({ attempt_id: attemptId, answered_at: now.toISOString(), answer_text: answerText || null, transcript_meta: metrics, score: graded.score, grade: graded.grade, prompt_version: graded.prompt_version, graded_at: new Date().toISOString() })
    .eq("id", turn.id);
  if (uErr) return { ok: false, error: uErr.message };
  const nextShown = nextTurn ? nextTurn.shown_at ?? (await serve(db, nextTurn.id)) : null;
  return { ok: true, score: graded.score, grade: graded.grade, attemptId, late, durationS, next: nextTurn && nextShown ? { ordinal: nextTurn.ordinal, shownAt: nextShown } : null, gradedBy: graded.prompt_version };
}

async function serve(db: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>, turnId: string): Promise<string> {
  const now = new Date().toISOString();
  const { error } = await db.from("interview_turns").update({ shown_at: now }).eq("id", turnId).is("shown_at", null);
  if (error) throw new Error(error.message);
  return now;
}

/** Stamps `shown_at` on a turn that has not been served yet (page load of the runner). Own rows only. */
export async function markTurnShown(interviewId: string, ordinal: number): Promise<ActionResult<{ shownAt: string }>> {
  const session = await verifySession("/home/interviews");
  if (!UUID.test(interviewId)) return { ok: false, error: "bad interview id", status: 400 };
  const admin = createAdminClient();
  const interview = await getInterview(admin, interviewId);
  const own = checkOwnership(interview, session.userId);
  if (!own.ok) return { ok: false, error: own.error, status: own.status };
  const db = await createClient();
  const { data: turn } = await db.from("interview_turns").select("id, shown_at").eq("interview_id", interviewId).eq("ordinal", ordinal).maybeSingle();
  if (!turn) return { ok: false, error: "no such turn", status: 404 };
  const shownAt = (turn.shown_at as string | null) ?? (await serve(db, turn.id as string));
  return { ok: true, shownAt };
}

/** Grades nothing; computes the overall score, writes the report, marks the interview completed. Idempotent. */
export async function finishInterview(interviewId: string): Promise<ActionResult<{ overall: number | null; focusAreas: number }>> {
  const session = await verifySession("/home/interviews");
  if (!UUID.test(interviewId)) return { ok: false, error: "bad interview id", status: 400 };
  const admin = createAdminClient();
  const interview = await getInterview(admin, interviewId);
  const own = checkOwnership(interview, session.userId);
  if (!own.ok) return { ok: false, error: own.error, status: own.status };
  if (interview!.status === "completed" && interview!.report) return { ok: true, overall: interview!.overall_score, focusAreas: interview!.report.focus_areas.length };
  if (interview!.status === "abandoned") return { ok: false, error: "this interview was abandoned", status: 409 };
  const turns = await getTurns(admin, interviewId);
  const questions = await getInterviewQuestions(admin, turns.map((t) => t.question_id));
  const graded = turns.filter((t) => t.score != null);
  const overall = graded.length ? Math.round((graded.reduce((s, t) => s + Number(t.score), 0) / graded.length) * 10) / 10 : null;
  const reportTurns: ReportTurn[] = turns.flatMap((t) => {
    const q = questions.get(t.question_id);
    if (!q) return [];
    return [{ ordinal: t.ordinal, question: q.question, topic_slug: q.topic_slug, topic_title: q.topic_title, subtopic_slug: q.subtopic_slug, difficulty: q.difficulty, score: t.score == null ? null : Number(t.score), grade: t.grade, answer_text: t.answer_text }];
  });
  const lessons = await loadLessonIndex(admin);
  const mode = await resolveChatMode();
  const { report, prompt_version } = await buildReport({ mode: interview!.mode, turns: reportTurns, lessons }, graded.length ? mode : "fixture");
  const db = await createClient();
  const { error } = await db.from("interviews").update({ status: "completed", completed_at: new Date().toISOString(), overall_score: overall, report, prompt_version }).eq("id", interviewId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, overall, focusAreas: report.focus_areas.length };
}

/** Form action: marks an in-progress interview abandoned and returns to the hub. */
export async function abandonInterview(formData: FormData): Promise<void> {
  const session = await verifySession("/home/interviews");
  const interviewId = String(formData.get("interviewId") ?? "");
  if (!UUID.test(interviewId)) redirect("/home/interviews");
  const admin = createAdminClient();
  const interview = await getInterview(admin, interviewId);
  const own = checkOwnership(interview, session.userId);
  if (!own.ok) redirect("/home/interviews");
  if (interview!.status === "in_progress") {
    const db = await createClient();
    const { error } = await db.from("interviews").update({ status: "abandoned", completed_at: new Date().toISOString() }).eq("id", interviewId);
    if (error) throw new Error(error.message);
  }
  redirect("/home/interviews");
}
