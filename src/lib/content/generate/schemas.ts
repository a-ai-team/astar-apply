// Structured-output schemas for the writers. They mirror the content contracts but avoid the
// JSON-schema features the API rejects (`additionalProperties` other than false → no z.record):
// widget.props is dropped (filled with {}) and question `numbers.inputs` is a list of {name, value}.
import { z } from "zod";
import {
  CanonicalAnswerBlock, ConceptBlock, KeyMetricsBlock, MechanicsBlock, NowYouCanBlock, OneLinerBlock, QuickFireBlock, ScenarioBlock,
  TrapBlock, WhyHereBlock, WorkedCalcBlock, YourTurnBlock, WIDGET_NAMES, type LessonBody,
} from "../lesson-schema";
import { QUESTION_KINDS, type Question } from "../question-schema";

const WidgetOutBlock = z.object({ type: z.literal("widget"), widget: z.enum(WIDGET_NAMES) });

export const LessonBodyOutSchema = z.object({
  version: z.literal(1),
  reading_minutes: z.number().int(),
  blocks: z.array(
    z.discriminatedUnion("type", [
      WhyHereBlock, ConceptBlock, MechanicsBlock, WorkedCalcBlock, TrapBlock, CanonicalAnswerBlock, ScenarioBlock, YourTurnBlock, QuickFireBlock,
      OneLinerBlock, NowYouCanBlock, WidgetOutBlock, KeyMetricsBlock,
    ]),
  ),
});

export const LessonWriteSchema = z.object({ title: z.string(), body: LessonBodyOutSchema });
export type LessonWrite = z.infer<typeof LessonWriteSchema>;

/** Converts writer output into the contract body (widget.props = {}). */
export function toLessonBody(out: z.infer<typeof LessonBodyOutSchema>): LessonBody {
  return {
    version: 1,
    reading_minutes: out.reading_minutes,
    blocks: out.blocks.map((b) => (b.type === "widget" ? { type: "widget" as const, widget: b.widget, props: {} } : b)),
  };
}

export const QuestionDraftSchema = z.object({
  kind: z.enum(QUESTION_KINDS),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  question: z.string(),
  model_answer_md: z.string(),
  key_points: z.array(z.string()),
  follow_ups: z.array(z.object({ question: z.string(), answer_md: z.string() })),
  weak_answer_note: z.string(),
  numbers: z.object({ inputs: z.array(z.object({ name: z.string(), value: z.number() })), answer: z.number() }).nullable(),
  tags: z.array(z.string()),
  flashcard_back: z.string().nullable(),
});
export type QuestionDraft = z.infer<typeof QuestionDraftSchema>;

export const QuestionWriteSchema = z.object({ questions: z.array(QuestionDraftSchema) });
export type QuestionWrite = z.infer<typeof QuestionWriteSchema>;

export function slugify(text: string, maxWords = 7): string {
  return text
    .toLowerCase()
    .replace(/£/g, " gbp ")
    .replace(/%/g, " pct ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => !["a", "an", "the", "of", "to", "in", "is", "and", "what", "why", "how", "does", "do", "you", "your", "it", "for"].includes(w))
    .slice(0, maxWords)
    .join("-") || "question";
}

/** Draft → contract Question (slug derived from the question text, made unique against `taken`). */
export function toQuestion(d: QuestionDraft, ctx: { topic_slug: string; subtopic_slug: string; source_topic: string; taken: Set<string> }): Question {
  const base = slugify(d.question);
  let slug = base;
  for (let n = 2; ctx.taken.has(slug); n++) slug = `${base}-${n}`;
  ctx.taken.add(slug);
  const inputs: Record<string, number> = {};
  for (const i of d.numbers?.inputs ?? []) inputs[i.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")] = i.value;
  return {
    slug,
    topic_slug: ctx.topic_slug,
    subtopic_slug: ctx.subtopic_slug,
    kind: d.kind,
    difficulty: d.difficulty,
    question: d.question.trim(),
    model_answer_md: d.model_answer_md.trim(),
    key_points: d.key_points,
    follow_ups: d.follow_ups,
    weak_answer_note: d.weak_answer_note,
    numbers: d.numbers ? { inputs, answer: d.numbers.answer } : null,
    source_topic: ctx.source_topic,
    tags: d.tags.map((t) => t.toLowerCase().trim()).filter(Boolean),
    ...(d.flashcard_back ? { flashcard_back: d.flashcard_back } : {}),
    status: "generated",
  };
}

/** Critic output shapes (same draft + notes). */
export const LessonCriticSchema = z.object({ notes: z.string(), draft: LessonWriteSchema });
export const QuestionCriticSchema = z.object({ notes: z.string(), draft: QuestionWriteSchema });
