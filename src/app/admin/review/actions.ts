"use server";

// Server actions for the review queue (/admin/review/[type]/[id]). Every action verifies a staff
// session (Server Actions bypass the proxy). `decideReview` records a content_reviews row and
// moves the status; `approved` is gated by the same approval rules as the editor and
// scripts/content/approve.ts. `regenerateOne` re-runs the writer synchronously with the
// reviewer's note (needs API credit) and replaces the row's body as `generated`.
import { refresh, revalidateTag } from "next/cache";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClient, hasAnthropicKey } from "@/lib/ai/client";
import { approvalProblems, validateLessonBody } from "@/lib/content/lesson-schema";
import { validateQuestion } from "@/lib/content/question-schema";
import { findSubtopic } from "@/lib/content/taxonomy";
import { checkLesson, checkQuestionSet } from "@/lib/content/generate/checks";
import { promptVersionFor } from "@/lib/content/generate/requests";
import { existingFromDb } from "@/lib/content/generate/service";
import { generateSync } from "@/lib/content/generate/sync";
import { lessonTargets, questionTargets, type QuestionTarget } from "@/lib/content/generate/targets";
import { indexLesson, indexQuestion } from "@/lib/content/index-content";

export type ReviewState = { ok: boolean; errors: string[]; message?: string; at?: string };

const DECISIONS = ["approved", "changes_requested", "rejected"] as const;
const TYPES = ["lesson", "question"] as const;

export async function decideReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const session = await verifyStaff();
  const type = String(formData.get("type") ?? "") as (typeof TYPES)[number];
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as (typeof DECISIONS)[number];
  const comment = String(formData.get("comment") ?? "").trim().slice(0, 4000);
  if (!TYPES.includes(type) || !DECISIONS.includes(decision) || !id) return { ok: false, errors: ["bad request"] };
  if (decision !== "approved" && !comment) return { ok: false, errors: ["a comment is required for changes requested / rejected"] };
  const db = createAdminClient();
  const table = type === "lesson" ? "lessons" : "questions";

  if (decision === "approved") {
    if (type === "lesson") {
      const { data } = await db.from("lessons").select("body, subtopic:subtopics(slug)").eq("id", id).maybeSingle();
      if (!data) return { ok: false, errors: ["lesson not found"] };
      const v = validateLessonBody(data.body);
      if (!v.ok) return { ok: false, errors: v.errors };
      const slug = (data.subtopic as unknown as { slug: string } | null)?.slug ?? "";
      const problems = approvalProblems(v.value, { walkthrough: findSubtopic(slug)?.subtopic.walkthrough });
      if (problems.length) return { ok: false, errors: problems.map((p) => `not approvable: ${p}`) };
    } else {
      const { data } = await db.from("questions").select("kind, difficulty, body").eq("id", id).maybeSingle();
      if (!data) return { ok: false, errors: ["question not found"] };
      const body = data.body as { numbers?: unknown };
      if (data.kind === "calculation" && data.difficulty === 4 && !body.numbers) return { ok: false, errors: ["not approvable: difficulty-4 calculation needs numbers"] };
    }
  }
  const status = decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "in_review";
  const { error: rErr } = await db.from("content_reviews").insert({ target_type: type, target_id: id, reviewer_id: session.userId, decision, comment });
  if (rErr) return { ok: false, errors: [rErr.message] };
  const { data: row, error } = await db.from(table).update({ status, review_note: decision === "approved" ? null : comment }).eq("id", id).select("slug").maybeSingle();
  if (error) return { ok: false, errors: [error.message] };
  if (type === "lesson" && row) revalidateTag(`lesson:${row.slug}`, "max");
  // Loop 06: keep content_chunks in step — approved → (re)index; anything else → chunks removed.
  try {
    const n = type === "lesson" ? await indexLesson(db, id) : await indexQuestion(db, id);
    refresh();
    return { ok: true, errors: [], message: `Recorded: ${decision.replace("_", " ")} → status ${status}${status === "approved" ? ` · ${n} chunk(s) indexed for Mentor` : ""}`, at: new Date().toISOString() };
  } catch (e) {
    refresh();
    return { ok: true, errors: [], message: `Recorded: ${decision.replace("_", " ")} → status ${status} · chunk index failed (${(e as Error).message.slice(0, 120)}) — run \`npm run content:index\``, at: new Date().toISOString() };
  }
}

export async function regenerateOne(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  await verifyStaff();
  const type = String(formData.get("type") ?? "") as (typeof TYPES)[number];
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 4000);
  if (!TYPES.includes(type) || !id) return { ok: false, errors: ["bad request"] };
  if (!hasAnthropicKey()) return { ok: false, errors: ["ANTHROPIC_API_KEY is not set — regenerate is unavailable"] };
  const db = createAdminClient();
  const existing = await existingFromDb(db);
  try {
    if (type === "lesson") {
      const { data } = await db.from("lessons").select("slug, subtopic:subtopics(slug)").eq("id", id).maybeSingle();
      if (!data) return { ok: false, errors: ["lesson not found"] };
      const subtopicSlug = (data.subtopic as unknown as { slug: string } | null)?.slug ?? "";
      const target = lessonTargets(existing, { slugs: [subtopicSlug], force: true })[0];
      if (!target) return { ok: false, errors: [`no curriculum subtopic ${subtopicSlug}`] };
      const row = await generateSync(getClient(), target, { note: note || null });
      if (!row.ok) return { ok: false, errors: [`writer failed: ${row.error}`] };
      const r = checkLesson(row.output, { walkthrough: target.walkthrough, reference: null });
      if (!r.value) return { ok: false, errors: r.problems };
      const { error } = await db.from("lessons").update({ title: r.value.title, body: r.value.body, body_version: r.value.body.version, reading_minutes: r.value.body.reading_minutes, status: r.ok ? "generated" : "draft", generated_by: row.model ?? "claude-opus-5", prompt_version: promptVersionFor("lesson"), review_note: r.problems.length ? r.problems.join("\n") : null }).eq("id", id);
      if (error) return { ok: false, errors: [error.message] };
      revalidateTag(`lesson:${data.slug}`, "max");
    } else {
      const { data } = await db.from("questions").select("slug, kind, difficulty, question, subtopic:subtopics(slug)").eq("id", id).maybeSingle();
      if (!data) return { ok: false, errors: ["question not found"] };
      const subtopicSlug = (data.subtopic as unknown as { slug: string } | null)?.slug ?? "";
      const base = questionTargets({ ...existing, questions: existing.questions.filter((q) => q.slug !== data.slug) }, { slugs: [subtopicSlug], force: true }).find((t) => t.qkind === data.kind);
      if (!base) return { ok: false, errors: [`no curriculum subtopic ${subtopicSlug}`] };
      const mix: QuestionTarget["mix"] = [0, 0, 0, 0];
      mix[(data.difficulty as number) - 1] = 1;
      const target: QuestionTarget = { ...base, count: 1, mix, input: { ...base.input, count: 1, mix, existing_questions: base.input.existing_questions.filter((q) => q !== data.question) }, expected_output_tokens: 1500 };
      const row = await generateSync(getClient(), target, { note: note || null });
      if (!row.ok) return { ok: false, errors: [`writer failed: ${row.error}`] };
      const r = checkQuestionSet(row.output, { topic_slug: target.topic_slug, subtopic_slug: target.subtopic_slug, source_topic: target.source_section, qkind: target.qkind, count: 1, mix, reference: null, taken: new Set(existing.questions.map((q) => q.slug)) });
      if (!r.value?.length) return { ok: false, errors: r.problems };
      const q = r.value[0];
      const v = validateQuestion(q);
      if (!v.ok) return { ok: false, errors: v.errors };
      const { slug: _s, topic_slug: _t, subtopic_slug: _st, kind, difficulty, question, status: _status, source_topic, tags, ...body } = v.value;
      void _s; void _t; void _st; void _status;
      const { error } = await db.from("questions").update({ kind, difficulty, question, body, source_topic, tags, status: r.ok ? "generated" : "draft", generated_by: row.model ?? "claude-opus-5", prompt_version: promptVersionFor("questions"), review_note: r.problems.length ? r.problems.join("\n") : null }).eq("id", id);
      if (error) return { ok: false, errors: [error.message] };
    }
  } catch (e) {
    return { ok: false, errors: [`regenerate failed: ${(e as Error).message.slice(0, 300)}`] };
  }
  try { if (type === "lesson") await indexLesson(db, id); else await indexQuestion(db, id); } catch (e) { console.warn("content_chunks: reindex after regenerate failed", e); }
  refresh();
  return { ok: true, errors: [], message: "Regenerated — review the new draft", at: new Date().toISOString() };
}
