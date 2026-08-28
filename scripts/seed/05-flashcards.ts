// Seed 05 — derives one flashcard per *approved* question (front = question, back = flashcardBack(body)),
// then seeds demo progress for the e2e student (see ./practice/demo-progress.ts). Idempotent: upsert on
// question_id; a card whose question is no longer approved is archived, never deleted.
// Re-run after every content load (`seed -- 04`) so new approvals get cards.
import { adminClient } from "./env";
import { flashcardBack } from "../../src/lib/content/question-schema";
import { seedDemoProgress } from "./practice/demo-progress";

export async function seedFlashcards() {
  const db = adminClient();
  const { data: questions, error } = await db.from("questions").select("id, topic_id, question, body, status, tags");
  if (error) throw error;
  let approved = 0;
  let archived = 0;
  let skippedLens = 0;
  for (const q of questions ?? []) {
    const body = (q.body ?? {}) as { model_answer_md?: string; flashcard_back?: string };
    // Loop 11: lens questions are lens-specific practice, not general recall — no deck card.
    const isLens = ((q.tags ?? []) as string[]).some((t) => t.startsWith("lens:"));
    if (q.status === "approved" && isLens) { skippedLens++; continue; }
    if (q.status === "approved") {
      const back = flashcardBack({ model_answer_md: body.model_answer_md ?? "", flashcard_back: body.flashcard_back });
      if (!back) throw new Error(`question ${q.id} has no model answer to derive a flashcard from`);
      const { error: upErr } = await db
        .from("flashcards")
        .upsert({ question_id: q.id, topic_id: q.topic_id, front: q.question, back_md: back, status: "approved" }, { onConflict: "question_id" });
      if (upErr) throw new Error(`flashcard for ${q.id}: ${upErr.message}`);
      approved++;
    } else {
      const { data: updated, error: arErr } = await db
        .from("flashcards")
        .update({ status: "archived" })
        .eq("question_id", q.id)
        .neq("status", "archived")
        .select("id");
      if (arErr) throw new Error(`archive flashcard for ${q.id}: ${arErr.message}`);
      archived += updated?.length ?? 0;
    }
  }
  const { count } = await db.from("flashcards").select("id", { count: "exact", head: true }).eq("status", "approved");
  console.log(`seed 05: ${approved} approved questions → ${count ?? 0} approved flashcards (${archived} archived, ${skippedLens} lens questions skipped this run)`);
  await seedDemoProgress();
}
