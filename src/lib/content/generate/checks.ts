// Automatic checks run on every writer output before it reaches content/ (docs/loops/04 § AI):
// schema → approval rules (required blocks, `worked_calc` arithmetic via evalExpr, reading ≤ 12)
// → exactly 4 quick-fire pairs → 8-gram overlap against the hidden 400Q set (skipped with a
// warning when the reference is absent). Pure: no I/O, no API. Problems are phrased for the
// critic prompt; the hidden set's text is never included (only counts).
import { approvalProblems, validateLessonBody, type LessonBody } from "../lesson-schema";
import { validateQuestion, type Question } from "../question-schema";
import { jsonText, overlapCount } from "../overlap";
import { LessonWriteSchema, QuestionWriteSchema, toLessonBody, toQuestion, type LessonWrite, type QuestionWrite } from "./schemas";
import { DIFFICULTY_SHARES, type DifficultyMix, type QuestionKind } from "./targets";

export type CheckResult<T> = { ok: boolean; value: T | null; problems: string[]; warnings: string[] };

export type Reference = Set<string> | null;

export function lessonProblems(body: LessonBody, opts: { walkthrough?: boolean; industry?: boolean; reference?: Reference } = {}): { problems: string[]; warnings: string[] } {
  const problems = approvalProblems(body, { walkthrough: opts.walkthrough });
  const warnings: string[] = [];
  // Loop 09: an industry lesson must carry the metrics table the addendum asks for.
  if (opts.industry && !body.blocks.some((b) => b.type === "key_metrics")) problems.push("industry lesson has no key_metrics block");
  const qf = body.blocks.filter((b) => b.type === "quick_fire");
  for (const b of qf) if (b.type === "quick_fire" && b.pairs.length !== 4) problems.push(`quick_fire has ${b.pairs.length} pairs, needs exactly 4`);
  if (qf.length > 1) problems.push(`lesson has ${qf.length} quick_fire blocks, needs exactly 1`);
  if (body.reading_minutes < 6) warnings.push(`reading_minutes ${body.reading_minutes} < 6`);
  for (const b of body.blocks) {
    if (b.type === "worked_calc") {
      for (const s of b.steps) if (!/^[\d\s.+\-*/^()%,×÷−]+$/.test(s.expr)) problems.push(`worked_calc step "${s.label}": expr "${s.expr}" is not pure arithmetic`);
    }
  }
  if (opts.reference === undefined || opts.reference === null) warnings.push("overlap check skipped: hidden 400Q set missing");
  else {
    const hits = overlapCount(jsonText(body), opts.reference);
    if (hits > 0) problems.push(`${hits} 8-word passage(s) overlap a published interview guide — rewrite those passages from first principles in different words`);
  }
  return { problems, warnings };
}

/** Raw writer output → checked contract body. `value` is set whenever the schema passes (even with problems). */
export function checkLesson(raw: unknown, opts: { walkthrough?: boolean; industry?: boolean; reference?: Reference } = {}): CheckResult<{ title: string; body: LessonBody }> {
  const parsed = LessonWriteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, value: null, problems: parsed.error.issues.map((i) => `schema ${i.path.join(".") || "(root)"}: ${i.message}`), warnings: [] };
  }
  const body = toLessonBody(parsed.data.body);
  const v = validateLessonBody(body);
  if (!v.ok) return { ok: false, value: null, problems: v.errors.map((e) => `schema ${e}`), warnings: [] };
  const { problems, warnings } = lessonProblems(v.value, opts);
  return { ok: problems.length === 0, value: { title: parsed.data.title.trim(), body: v.value }, problems, warnings };
}

export type QuestionSetContext = { topic_slug: string; subtopic_slug: string; source_topic: string; qkind: QuestionKind; count: number; mix: DifficultyMix; taken?: Set<string>; reference?: Reference };

export function questionSetProblems(questions: Question[], ctx: QuestionSetContext): { problems: string[]; warnings: string[] } {
  const problems: string[] = [];
  const warnings: string[] = [];
  if (questions.length !== ctx.count) problems.push(`set has ${questions.length} question(s), requested ${ctx.count}`);
  const have: DifficultyMix = [0, 0, 0, 0];
  for (const q of questions) have[q.difficulty - 1]++;
  if (have.some((n, i) => n !== ctx.mix[i])) warnings.push(`difficulty mix ${have.join("/")} differs from requested ${ctx.mix.join("/")}`);
  questions.forEach((q, i) => {
    if (q.kind !== ctx.qkind) problems.push(`question ${i + 1}: kind ${q.kind}, requested ${ctx.qkind}`);
    if (q.kind === "calculation" && q.difficulty === 4 && !q.numbers) problems.push(`question ${i + 1}: difficulty-4 calculation needs numbers`);
    if (q.numbers && Object.keys(q.numbers.inputs).length === 0) warnings.push(`question ${i + 1}: numbers.inputs is empty`);
  });
  const seen = new Set<string>();
  for (const q of questions) {
    const key = q.question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) problems.push(`duplicate question: "${q.question.slice(0, 60)}"`);
    seen.add(key);
  }
  if (ctx.reference === undefined || ctx.reference === null) warnings.push("overlap check skipped: hidden 400Q set missing");
  else {
    questions.forEach((q, i) => {
      const hits = overlapCount(jsonText(q), ctx.reference!);
      if (hits > 0) problems.push(`question ${i + 1}: ${hits} 8-word passage(s) overlap a published interview guide — rewrite in different words`);
    });
  }
  return { problems, warnings };
}

/** Raw writer output → checked contract questions. */
export function checkQuestionSet(raw: unknown, ctx: QuestionSetContext): CheckResult<Question[]> {
  const parsed = QuestionWriteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, value: null, problems: parsed.error.issues.map((i) => `schema ${i.path.join(".") || "(root)"}: ${i.message}`), warnings: [] };
  }
  const taken = ctx.taken ?? new Set<string>();
  const questions: Question[] = [];
  const problems: string[] = [];
  parsed.data.questions.forEach((d, i) => {
    const q = toQuestion(d, { topic_slug: ctx.topic_slug, subtopic_slug: ctx.subtopic_slug, source_topic: ctx.source_topic, taken });
    const v = validateQuestion(q);
    if (!v.ok) problems.push(...v.errors.map((e) => `question ${i + 1}: schema ${e}`));
    else questions.push(v.value);
  });
  if (problems.length) return { ok: false, value: null, problems, warnings: [] };
  const r = questionSetProblems(questions, ctx);
  return { ok: r.problems.length === 0, value: questions, problems: r.problems, warnings: r.warnings };
}

/** Difficulty share of a set of questions vs the 25/30/30/15 target; used by the questions eval suite. */
export function difficultyShares(questions: { difficulty: 1 | 2 | 3 | 4 }[]): { shares: number[]; target: readonly number[]; max_abs_diff: number } {
  const n = questions.length;
  const counts = [0, 0, 0, 0];
  for (const q of questions) counts[q.difficulty - 1]++;
  const shares = counts.map((c) => (n ? c / n : 0));
  const max_abs_diff = Math.max(...shares.map((s, i) => Math.abs(s - DIFFICULTY_SHARES[i])));
  return { shares, target: DIFFICULTY_SHARES, max_abs_diff };
}

export type { LessonWrite, QuestionWrite };
