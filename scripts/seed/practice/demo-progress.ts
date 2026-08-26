// Demo progress for the e2e student (created by seed 00): one completed lesson, two self-graded
// attempts and two flashcard reviews dated two days ago, so /home/progress has something to show
// and the dashboard queries are exercised. Idempotent: skips rows that already exist. Lives in a
// subdirectory so `npm run seed -- 05` resolves to 05-flashcards.ts (which calls this).
// The e2e spec clears this user's practice rows before asserting exact counts.
import { adminClient } from "../env";
import { applyReview, Rating } from "../../../src/lib/practice/srs";

export const DEMO_STUDENT = "e2e-student@astar.test";
const DEMO_MARK = "seed:05-demo";

export async function seedDemoProgress() {
  const db = adminClient();
  const { data: users, error: uErr } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (uErr) throw uErr;
  const user = users.users.find((u) => u.email === DEMO_STUDENT);
  if (!user) {
    console.log(`seed 05: ${DEMO_STUDENT} missing (run \`npm run seed -- 00\`) — demo progress skipped`);
    return;
  }
  const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000);

  // Lesson complete
  const { data: lesson } = await db.from("lessons").select("id").eq("slug", "three-statement-links").eq("status", "approved").maybeSingle();
  if (lesson) {
    const { error } = await db.from("lesson_progress").upsert({ user_id: user.id, lesson_id: lesson.id, completed_at: twoDaysAgo.toISOString() }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  // Attempts (no natural key → marker in answer_text)
  const { data: questions } = await db.from("questions").select("id").eq("status", "approved").order("slug").limit(2);
  const { count: existingAttempts } = await db.from("attempts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("answer_text", DEMO_MARK);
  if ((existingAttempts ?? 0) === 0 && questions?.length) {
    const rows = questions.map((q, i) => ({ user_id: user.id, question_id: q.id, mode: "practice", self_grade: i === 0 ? 3 : 2, answer_text: DEMO_MARK, created_at: twoDaysAgo.toISOString() }));
    const { error } = await db.from("attempts").insert(rows);
    if (error) throw error;
  }

  // Reviews: two cards rated Good two days ago
  const { data: cards } = await db.from("flashcards").select("id").eq("status", "approved").order("front").limit(2);
  for (const c of cards ?? []) {
    const { count } = await db.from("card_state").select("flashcard_id", { count: "exact", head: true }).eq("user_id", user.id).eq("flashcard_id", c.id);
    if ((count ?? 0) > 0) continue;
    const { next, log } = applyReview(null, Rating.Good, twoDaysAgo);
    const { error: sErr } = await db.from("card_state").insert({ user_id: user.id, flashcard_id: c.id, ...next, due: new Date(next.due).toISOString(), last_review: next.last_review ? new Date(next.last_review).toISOString() : null });
    if (sErr) throw sErr;
    const { error: rErr } = await db.from("reviews").insert({ user_id: user.id, flashcard_id: c.id, ...log, due: log.due.toISOString(), reviewed_at: log.reviewed_at.toISOString() });
    if (rErr) throw rErr;
  }
  const { data: stats } = await db.from("user_stats").select("*").eq("user_id", user.id).maybeSingle();
  console.log(`seed 05: demo progress for ${DEMO_STUDENT} → ${JSON.stringify(stats)}`);
}
