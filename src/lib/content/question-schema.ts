// Question JSON validator — docs/loops/CONTRACTS.md § Question JSON. One object = one `questions`
// row (slug/topic/kind/difficulty/question/status columns) + its `body` (everything else).
import { z } from "zod";

export const QUESTION_KINDS = ["concept", "calculation"] as const;
export const QUESTION_STATUSES = ["draft", "generated", "in_review", "approved", "rejected", "archived"] as const;

export const FollowUpSchema = z.object({ question: z.string().min(1), answer_md: z.string().min(1) });

export const QuestionSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  topic_slug: z.string().min(1),
  subtopic_slug: z.string().min(1).nullable().default(null),
  kind: z.enum(QUESTION_KINDS),
  // 1 definition · 2 why · 3 second-order · 4 numerical/edge
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  question: z.string().min(8),
  model_answer_md: z.string().min(20),
  key_points: z.array(z.string().min(1)).min(3).max(6),
  follow_ups: z.array(FollowUpSchema).min(2).max(3),
  weak_answer_note: z.string().min(1),
  numbers: z.object({ inputs: z.record(z.string(), z.number()), answer: z.number() }).nullable().default(null),
  source_topic: z.string().min(1), // 400Q section label ONLY, never text
  tags: z.array(z.string().min(1)).default([]),
  flashcard_back: z.string().optional(),
  status: z.enum(QUESTION_STATUSES).default("generated"),
});

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionInput = z.input<typeof QuestionSchema>;

/** Columns stored on the `questions` row; everything else goes into `body`. */
export const QUESTION_ROW_KEYS = ["slug", "topic_slug", "subtopic_slug", "kind", "difficulty", "question", "status", "source_topic", "tags"] as const;

export type QuestionBody = Omit<Question, (typeof QUESTION_ROW_KEYS)[number]>;

export function parseQuestion(input: unknown): Question {
  return QuestionSchema.parse(input);
}

export function validateQuestion(input: unknown): { ok: true; value: Question; errors: [] } | { ok: false; value: null; errors: string[] } {
  const r = QuestionSchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data, errors: [] };
  return { ok: false, value: null, errors: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
}

/** Splits a validated question into the row columns and the jsonb body. */
export function splitQuestion(q: Question): { row: Pick<Question, (typeof QUESTION_ROW_KEYS)[number]>; body: QuestionBody } {
  const { slug, topic_slug, subtopic_slug, kind, difficulty, question, status, source_topic, tags, ...body } = q;
  return { row: { slug, topic_slug, subtopic_slug, kind, difficulty, question, status, source_topic, tags }, body };
}

/** Flashcard back = first paragraph of the model answer unless `flashcard_back` is set (CONTRACTS.md). */
export function flashcardBack(q: Pick<Question, "model_answer_md" | "flashcard_back">): string {
  return q.flashcard_back ?? q.model_answer_md.trim().split(/\n\s*\n/)[0];
}

/** Approval rule for questions: numerical (difficulty 4 calculation) questions must carry `numbers`. */
export function assertQuestionApprovable(input: unknown): Question {
  const v = validateQuestion(input);
  if (!v.ok) throw new Error(`question invalid: ${v.errors.join("; ")}`);
  const q = v.value;
  if (q.kind === "calculation" && q.difficulty === 4 && !q.numbers) throw new Error("question not approvable: difficulty-4 calculation needs `numbers`");
  return q;
}
