// Thread context (Loop 06): where "Ask Mentor" was pressed — a practice question (+ optional
// attempt), a flashcard's question, or a lesson block. Loaded with the service-role client after
// the session is verified; approved rows only, so a student can never pull a draft into a thread.
// `renderContext` is pure: it produces the text of the `role: "system"` message appended after the
// user turn (README § Mid-conversation system messages) and the retrieval hint.
import type { SupabaseClient } from "@supabase/supabase-js";
import { blockLabel } from "@/lib/content/block-labels";
import { blockText } from "@/lib/content/index-chunks";
import { validateLessonBody } from "@/lib/content/lesson-schema";
import { QuestionBodySchemaLoose } from "@/lib/practice/question-body";
import type { ThreadContext } from "./types";

export type ContextBundle = {
  kind: "question" | "lesson_block";
  /** Chip text / thread title seed, e.g. "Q: What is enterprise value…" or "The EqV → EV bridge › The trap". */
  label: string;
  /** Deep link back to the item. */
  href: string;
  /** Query hint for retrieval (the question text or the lesson + block heading). */
  hint: string;
  /** Text of the system message. */
  text: string;
  question_id?: string;
  lesson_id?: string;
  attempt?: { self_grade: number | null; answer_text: string | null } | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates a raw `context` object from the request body; drops anything malformed. */
export function parseThreadContext(raw: unknown): ThreadContext | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: ThreadContext = {};
  if (typeof r.question_id === "string" && UUID.test(r.question_id)) out.question_id = r.question_id;
  if (typeof r.lesson_id === "string" && UUID.test(r.lesson_id)) out.lesson_id = r.lesson_id;
  if (typeof r.attempt_id === "string" && UUID.test(r.attempt_id)) out.attempt_id = r.attempt_id;
  if (typeof r.block_index === "number" && Number.isInteger(r.block_index) && r.block_index >= 0) out.block_index = r.block_index;
  return out.question_id || out.lesson_id ? out : null;
}

export async function loadThreadContext(db: SupabaseClient, ctx: ThreadContext | null | undefined, userId?: string): Promise<ContextBundle | null> {
  if (!ctx) return null;
  if (ctx.question_id) {
    const { data, error } = await db.from("questions").select("id, slug, question, body, status, difficulty, topic:topics(slug, title)").eq("id", ctx.question_id).eq("status", "approved").maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const body = QuestionBodySchemaLoose.safeParse(data.body);
    if (!body.success) return null;
    const topic = data.topic as unknown as { slug: string; title: string } | null;
    let attempt: ContextBundle["attempt"] = null;
    if (ctx.attempt_id && userId) {
      const { data: a } = await db.from("attempts").select("self_grade, answer_text").eq("id", ctx.attempt_id).eq("user_id", userId).eq("question_id", ctx.question_id).maybeSingle();
      attempt = a ? { self_grade: a.self_grade as number | null, answer_text: a.answer_text as string | null } : null;
    }
    return renderQuestionContext({ id: data.id as string, slug: data.slug as string, question: data.question as string, difficulty: data.difficulty as number, topic_slug: topic?.slug ?? "", topic_title: topic?.title ?? "", model_answer_md: body.data.model_answer_md, key_points: body.data.key_points, weak_answer_note: body.data.weak_answer_note, attempt });
  }
  if (ctx.lesson_id) {
    const { data, error } = await db.from("lessons").select("id, slug, title, body, status, subtopic:subtopics(topic:topics(slug, title))").eq("id", ctx.lesson_id).eq("status", "approved").maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const v = validateLessonBody(data.body);
    if (!v.ok) return null;
    const topic = (data.subtopic as unknown as { topic: { slug: string; title: string } } | null)?.topic;
    const idx = ctx.block_index != null && ctx.block_index < v.value.blocks.length ? ctx.block_index : null;
    const block = idx != null ? v.value.blocks[idx] : null;
    return renderLessonContext({ id: data.id as string, slug: data.slug as string, title: data.title as string, topic_slug: topic?.slug ?? "", topic_title: topic?.title ?? "", block_index: idx, block_type: block?.type ?? null, block_heading: block?.type === "concept" ? block.heading : null, block_text: block ? blockText(block) : null });
  }
  return null;
}

export function renderQuestionContext(q: { id: string; slug: string; question: string; difficulty: number; topic_slug: string; topic_title: string; model_answer_md: string; key_points: string[]; weak_answer_note: string; attempt: ContextBundle["attempt"] }): ContextBundle {
  const short = q.question.length > 80 ? q.question.slice(0, 77).trimEnd() + "…" : q.question;
  const lines = [
    `The student is looking at this practice question from the Technicals bank (${q.topic_title}, difficulty ${q.difficulty}):`,
    `Question: ${q.question}`,
    `Model answer: ${q.model_answer_md}`,
    q.key_points.length ? `Key points: ${q.key_points.join("; ")}` : "",
    q.weak_answer_note ? `What a weak answer looks like: ${q.weak_answer_note}` : "",
  ];
  if (q.attempt) {
    const grade = q.attempt.self_grade ? ({ 1: "missed it", 2: "partly", 3: "nailed it" } as Record<number, string>)[q.attempt.self_grade] : null;
    lines.push(`Their latest attempt${grade ? ` (self-graded: ${grade})` : ""}${q.attempt.answer_text ? `: "${q.attempt.answer_text.slice(0, 1500)}"` : " has no typed answer."}`);
  }
  lines.push("If their message is short or ambiguous, assume it is about this question. Do not repeat the whole model answer back; use it to check and sharpen their understanding.");
  return {
    kind: "question", question_id: q.id, label: `Q: ${short}`, href: `/home/practice/${q.slug}`, hint: q.question, text: lines.filter(Boolean).join("\n"), attempt: q.attempt ?? null,
  };
}

export function renderLessonContext(l: { id: string; slug: string; title: string; topic_slug: string; topic_title: string; block_index: number | null; block_type: string | null; block_heading: string | null; block_text: string | null }): ContextBundle {
  const section = l.block_type ? (l.block_heading ?? blockLabel(l.block_type as Parameters<typeof blockLabel>[0])) : null;
  const lines = [
    `The student is reading the Technicals lesson "${l.title}" (${l.topic_title})${section ? `, section "${section}"` : ""}.`,
    l.block_text ? `That section says:\n${l.block_text.slice(0, 3000)}` : "",
    "If their message is short or ambiguous, assume it is about this section. Explain it in your own words rather than re-quoting it at length.",
  ];
  const anchor = l.block_index != null ? `#block-${l.block_index}` : "";
  return {
    kind: "lesson_block", lesson_id: l.id, label: section ? `${l.title} › ${section}` : l.title, href: `/home/technicals/${l.topic_slug}/${l.slug}${anchor}`,
    hint: section ? `${l.title} ${section}` : l.title, text: lines.filter(Boolean).join("\n"),
  };
}

/** The opening message of an "Ask Mentor" thread quotes the item so the title and transcript say what it is about. */
export function firstMessageFor(b: Pick<ContextBundle, "kind" | "label">): string {
  return b.kind === "question" ? `Explain this question to me: ${b.label.replace(/^Q:\s*/, "")}` : `Explain this lesson section to me: ${b.label}`;
}
