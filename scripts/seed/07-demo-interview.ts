// Seed 07 — one completed Accounting drill for the e2e student, graded by the fixture grader and
// reported by the fixture report, so /home/interviews has history and the report page renders
// against real rows. Idempotent: skipped when a `seed:07-demo` interview already exists for the
// user. Requires seeds 00 (users) and 03/04 (approved questions). The e2e spec clears this
// user's interviews before asserting exact counts.
import { adminClient } from "./env";
import { gradeFixture } from "../../src/lib/interviews/grade";
import { getInterviewQuestions } from "../../src/lib/interviews/queries";
import { loadLessonIndex, reportFixture, type ReportTurn } from "../../src/lib/interviews/report";
import { loadPool, seededRng, selectDrill } from "../../src/lib/interviews/select";
import { DRILL_SECONDS } from "../../src/lib/interviews/types";

export const DEMO_STUDENT = "e2e-student@astar.test";
const DEMO_MARK = "seed:07-demo";

/** Deliberately mixed answers so the report has something to say. */
const ANSWERS: Record<string, string> = {
  "depreciation-up-10": "Operating profit falls by 10, tax falls by 2.5 at 25 percent, so net income is down 7.5. On the cash flow statement you add the 10 of depreciation back because it is non-cash, so cash is up 2.5. Balance sheet: PP&E down 10, cash up 2.5, assets down 7.5, retained earnings down 7.5, so it balances.",
  "inventory-bought-on-credit": "Nothing on the income statement. Inventory goes up 20 and payables go up 20 on the balance sheet.",
  "why-most-important-statement": "The income statement, because profit is what matters.",
};

export async function seedDemoInterview() {
  const db = adminClient();
  const { data: users, error: uErr } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (uErr) throw uErr;
  const user = users.users.find((u) => u.email === DEMO_STUDENT);
  if (!user) {
    console.log(`seed 07: ${DEMO_STUDENT} missing (run \`npm run seed -- 00\`) — demo interview skipped`);
    return;
  }
  const { data: existing } = await db.from("interviews").select("id").eq("user_id", user.id).eq("prompt_version", DEMO_MARK).limit(1);
  if (existing?.length) {
    console.log(`seed 07: demo interview already exists (${existing[0].id}) — nothing to do`);
    return;
  }
  const pool = await loadPool(db, "accounting");
  const sel = selectDrill(pool, "accounting", { rng: seededRng(7) });
  if (!sel.ids.length) {
    console.log("seed 07: no approved accounting questions — run seeds 03/04 first");
    return;
  }
  const { data: topic } = await db.from("topics").select("id").eq("slug", "accounting").single();
  const questions = await getInterviewQuestions(db, sel.ids);
  const startedAt = new Date(Date.now() - 86_400_000);
  const { data: interview, error: iErr } = await db
    .from("interviews")
    .insert({ user_id: user.id, mode: "drill", topic_id: topic!.id, question_ids: sel.ids, seconds_per_question: DRILL_SECONDS, status: "in_progress", started_at: startedAt.toISOString() })
    .select("id")
    .single();
  if (iErr) throw iErr;
  const reportTurns: ReportTurn[] = [];
  for (const [i, qid] of sel.ids.entries()) {
    const q = questions.get(qid)!;
    const answer = ANSWERS[q.slug] ?? q.key_points.slice(0, 2).join(". ") + ".";
    const g = gradeFixture({ question: q, answer, metrics: { duration_s: 60 } });
    const shown = new Date(startedAt.getTime() + i * 70_000);
    const answered = new Date(shown.getTime() + 60_000);
    const { data: attempt, error: aErr } = await db.from("attempts").insert({ user_id: user.id, question_id: qid, mode: "drill", answer_text: answer, ai_score: g.score, ai_feedback: g.grade, interview_id: interview.id, created_at: answered.toISOString() }).select("id").single();
    if (aErr) throw aErr;
    const { error: tErr } = await db.from("interview_turns").insert({ interview_id: interview.id, ordinal: i, question_id: qid, attempt_id: attempt.id, shown_at: shown.toISOString(), answered_at: answered.toISOString(), answer_text: answer, transcript_meta: { wpm: null, filler_count: 0, fillers: [], duration_s: 60, late: false, voice: false }, score: g.score, grade: g.grade, prompt_version: g.prompt_version, graded_at: answered.toISOString() });
    if (tErr) throw tErr;
    reportTurns.push({ ordinal: i, question: q.question, topic_slug: q.topic_slug, topic_title: q.topic_title, subtopic_slug: q.subtopic_slug, difficulty: q.difficulty, score: g.score, grade: g.grade, answer_text: answer });
  }
  const lessons = await loadLessonIndex(db);
  const { report } = reportFixture({ mode: "drill", turns: reportTurns, lessons });
  const overall = Math.round((reportTurns.reduce((s, t) => s + (t.score ?? 0), 0) / reportTurns.length) * 10) / 10;
  const { error: fErr } = await db.from("interviews").update({ status: "completed", completed_at: new Date(startedAt.getTime() + sel.ids.length * 70_000).toISOString(), overall_score: overall, report, prompt_version: DEMO_MARK }).eq("id", interview.id);
  if (fErr) throw fErr;
  console.log(`seed 07: demo drill ${interview.id} — ${sel.ids.length} turns, overall ${overall}/10, ${report.focus_areas.length} focus areas`);
}
