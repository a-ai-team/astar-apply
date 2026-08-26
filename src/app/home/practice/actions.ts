"use server";

// Server actions for Practice (question bank, flashcards, lesson progress, ⌘K search). Every
// action re-verifies the session (Server Actions bypass the proxy) and writes through the cookie
// client, so RLS guarantees rows are the caller's own. FSRS maths runs here (server-side), never
// in the browser, so the client cannot forge a schedule.
import { refresh } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { applyReview, isGrade, type CardStateRow } from "@/lib/practice/srs";
import { searchContent as searchContentQuery } from "@/lib/practice/queries";
import type { SearchHit } from "@/lib/practice/search";

export type AttemptMode = "practice" | "drill" | "mock" | "lesson_your_turn";
export type RecordAttemptInput = { questionId: string; selfGrade: 1 | 2 | 3; mode?: AttemptMode; answerText?: string };
export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const MODES: AttemptMode[] = ["practice", "drill", "mock", "lesson_your_turn"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Records one self-graded attempt on a question. Follow-ups are not separate attempts (plan default). */
export async function recordAttempt(input: RecordAttemptInput): Promise<ActionResult<{ attemptId: string }>> {
  const session = await verifySession("/home/practice");
  const grade = Number(input.selfGrade);
  const mode = input.mode ?? "practice";
  if (!UUID.test(input.questionId)) return { ok: false, error: "bad question id" };
  if (![1, 2, 3].includes(grade)) return { ok: false, error: "self_grade must be 1–3" };
  if (!MODES.includes(mode)) return { ok: false, error: "bad mode" };
  const answer = typeof input.answerText === "string" ? input.answerText.slice(0, 4000) : null;
  const db = await createClient();
  const { data, error } = await db
    .from("attempts")
    .insert({ user_id: session.userId, question_id: input.questionId, mode, self_grade: grade, answer_text: answer })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert failed" };
  return { ok: true, attemptId: data.id as string };
}

export type ReviewCardResult = ActionResult<{ streak: number; mastered: boolean; due: string }>;

/** Applies an FSRS rating (1 Again … 4 Good/Easy) to one card: upserts `card_state`, appends `reviews`. */
export async function reviewCard(flashcardId: string, rating: number): Promise<ReviewCardResult> {
  const session = await verifySession("/home/flashcards");
  if (!UUID.test(flashcardId)) return { ok: false, error: "bad flashcard id" };
  const r = Number(rating);
  if (!isGrade(r)) return { ok: false, error: "rating must be 1–4" };
  const db = await createClient();
  // The card must be visible (approved) to the caller.
  const { data: card, error: cErr } = await db.from("flashcards").select("id").eq("id", flashcardId).maybeSingle();
  if (cErr || !card) return { ok: false, error: cErr?.message ?? "card not found" };
  const { data: current, error: sErr } = await db.from("card_state").select("*").eq("flashcard_id", flashcardId).eq("user_id", session.userId).maybeSingle();
  if (sErr) return { ok: false, error: sErr.message };
  const now = new Date();
  const { next, log } = applyReview((current as CardStateRow | null) ?? null, r, now);
  const stateRow = { user_id: session.userId, flashcard_id: flashcardId, ...next, due: new Date(next.due).toISOString(), last_review: next.last_review ? new Date(next.last_review).toISOString() : null };
  const { error: upErr } = await db.from("card_state").upsert(stateRow, { onConflict: "user_id,flashcard_id" });
  if (upErr) return { ok: false, error: upErr.message };
  const { error: logErr } = await db.from("reviews").insert({ user_id: session.userId, flashcard_id: flashcardId, ...log, due: log.due.toISOString(), reviewed_at: log.reviewed_at.toISOString() });
  if (logErr) return { ok: false, error: logErr.message };
  return { ok: true, streak: next.streak, mastered: next.mastered, due: stateRow.due };
}

/** "Mark complete" on a lesson page (form action). Idempotent upsert; refreshes the page. */
export async function completeLesson(formData: FormData): Promise<void> {
  const session = await verifySession("/home/technicals");
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!UUID.test(lessonId)) return;
  const db = await createClient();
  const { error } = await db.from("lesson_progress").upsert({ user_id: session.userId, lesson_id: lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  refresh();
}

/** Undo "Mark complete". */
export async function uncompleteLesson(formData: FormData): Promise<void> {
  const session = await verifySession("/home/technicals");
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!UUID.test(lessonId)) return;
  const db = await createClient();
  const { error } = await db.from("lesson_progress").delete().eq("user_id", session.userId).eq("lesson_id", lessonId);
  if (error) throw new Error(error.message);
  refresh();
}

/** ⌘K palette search (approved content only — RLS + status filter in `search_content()`). */
export async function searchContent(q: string): Promise<SearchHit[]> {
  await verifySession("/home");
  const db = await createClient();
  try {
    return await searchContentQuery(db, String(q ?? ""));
  } catch {
    return [];
  }
}
