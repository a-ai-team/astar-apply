// Lesson JSON validator — the contract in docs/loops/CONTRACTS.md § Lesson JSON. Shared by the
// renderer (Loop 03), the Claude structured-output format (Loop 04) and the eval suites.
// Block types are frozen: add new ones, never rename or remove. Keep this file free of React.
import { z } from "zod";

const md = z.string().min(1, "markdown must not be empty");

export const WorkedStepSchema = z.object({
  label: z.string().min(1),
  expr: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
});

export const StatementLineSchema = z.object({
  line: z.string().min(1),
  delta: z.number(),
  note: z.string().optional(),
});

export const WIDGET_NAMES = ["three_statement", "ev_bridge", "filings_toggle", "dcf_sensitivity", "lbo_returns"] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];

export const WhyHereBlock = z.object({ type: z.literal("why_here"), md });
export const ConceptBlock = z.object({ type: z.literal("concept"), heading: z.string().min(1), md });
export const MechanicsBlock = z.object({ type: z.literal("mechanics"), md });
export const WorkedCalcBlock = z.object({
  type: z.literal("worked_calc"),
  md,
  steps: z.array(WorkedStepSchema).min(1),
});
export const TrapBlock = z.object({ type: z.literal("trap"), md });
export const CanonicalAnswerBlock = z.object({
  type: z.literal("canonical_answer"),
  md,
  seconds: z.number().int().min(15).max(120).default(45),
});
export const ScenarioBlock = z.object({
  type: z.literal("scenario"),
  prompt: z.string().min(1),
  statements: z.object({
    is: z.array(StatementLineSchema),
    cfs: z.array(StatementLineSchema),
    bs: z.array(StatementLineSchema),
  }),
  check: z.string().min(1),
});
export const YourTurnBlock = z.object({
  type: z.literal("your_turn"),
  prompt: z.string().min(1),
  model_answer_md: md,
  rubric: z.array(z.string().min(1)).min(1),
});
export const QuickFireBlock = z.object({
  type: z.literal("quick_fire"),
  pairs: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).length(4, "quick_fire needs exactly 4 pairs"),
});
export const OneLinerBlock = z.object({ type: z.literal("one_liner"), md });
export const NowYouCanBlock = z.object({ type: z.literal("now_you_can"), items: z.array(z.string().min(1)).min(1) });
export const WidgetBlock = z.object({
  type: z.literal("widget"),
  widget: z.enum(WIDGET_NAMES),
  props: z.record(z.string(), z.unknown()).default({}),
});
export const KeyMetricsBlock = z.object({
  type: z.literal("key_metrics"),
  rows: z.array(z.object({ metric: z.string().min(1), definition: z.string().min(1), why_it_matters: z.string().min(1) })).min(1),
});

export const LessonBlockSchema = z.discriminatedUnion("type", [
  WhyHereBlock,
  ConceptBlock,
  MechanicsBlock,
  WorkedCalcBlock,
  TrapBlock,
  CanonicalAnswerBlock,
  ScenarioBlock,
  YourTurnBlock,
  QuickFireBlock,
  OneLinerBlock,
  NowYouCanBlock,
  WidgetBlock,
  KeyMetricsBlock,
]);

export const LessonBodySchema = z.object({
  version: z.literal(1),
  reading_minutes: z.number().int().min(1).max(30),
  blocks: z.array(LessonBlockSchema).min(1),
});

export type LessonBlock = z.infer<typeof LessonBlockSchema>;
export type LessonBlockType = LessonBlock["type"];
export type LessonBody = z.infer<typeof LessonBodySchema>;
export type WorkedStep = z.infer<typeof WorkedStepSchema>;
export type StatementLine = z.infer<typeof StatementLineSchema>;

export const BLOCK_TYPES = LessonBlockSchema.options.map((o) => o.shape.type.value) as LessonBlockType[];

/** Blocks a lesson must carry before it can be `approved` (CONTRACTS.md). */
export const REQUIRED_FOR_APPROVAL: readonly LessonBlockType[] = ["trap", "canonical_answer", "your_turn", "quick_fire", "one_liner"];

/** Parse an unknown value as a Lesson body; throws ZodError on failure. */
export function parseLessonBody(input: unknown): LessonBody {
  return LessonBodySchema.parse(input);
}

export type ValidationResult<T> = { ok: true; value: T; errors: [] } | { ok: false; value: null; errors: string[] };

/** Non-throwing validation with human-readable `path: message` errors (for the admin editor). */
export function validateLessonBody(input: unknown): ValidationResult<LessonBody> {
  const r = LessonBodySchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data, errors: [] };
  return { ok: false, value: null, errors: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
}

/** Returns the approval problems for an already-valid body (empty array = approvable). */
export function approvalProblems(body: LessonBody, opts: { walkthrough?: boolean } = {}): string[] {
  const present = new Set(body.blocks.map((b) => b.type));
  const problems: string[] = [];
  for (const t of REQUIRED_FOR_APPROVAL) if (!present.has(t)) problems.push(`missing required block "${t}"`);
  if (opts.walkthrough && !present.has("scenario")) problems.push('walkthrough lessons need a "scenario" block');
  if (body.reading_minutes > 12) problems.push(`reading_minutes ${body.reading_minutes} > 12`);
  for (const b of body.blocks) {
    if (b.type === "worked_calc") {
      for (const s of b.steps) {
        const v = evalExpr(s.expr);
        if (v !== null && Math.abs(v - s.value) > Math.max(0.01, Math.abs(s.value) * 0.005)) {
          problems.push(`worked_calc step "${s.label}": ${s.expr} = ${v}, not ${s.value}`);
        }
      }
    }
  }
  return problems;
}

/** Validates + checks approval rules; throws an Error listing every problem. Use on every approve path. */
export function assertApprovable(input: unknown, opts: { walkthrough?: boolean } = {}): LessonBody {
  const v = validateLessonBody(input);
  if (!v.ok) throw new Error(`lesson body invalid: ${v.errors.join("; ")}`);
  const problems = approvalProblems(v.value, opts);
  if (problems.length) throw new Error(`lesson not approvable: ${problems.join("; ")}`);
  return v.value;
}

/**
 * Tiny safe arithmetic evaluator for `worked_calc.expr` (numbers, + - * / ^, parentheses, %).
 * Returns null when the expression uses anything else (e.g. words), so prose steps are skipped.
 */
export function evalExpr(expr: string): number | null {
  const src = expr.replace(/,/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  if (!/^[\d\s.+\-*/^()%]+$/.test(src)) return null;
  let i = 0;
  const peek = () => src[i];
  const skip = () => { while (src[i] === " ") i++; };
  function num(): number {
    skip();
    if (peek() === "(") { i++; const v = expr3(); skip(); if (peek() !== ")") throw 0; i++; return v; }
    if (peek() === "-") { i++; return -num(); }
    const m = /^\d*\.?\d+/.exec(src.slice(i));
    if (!m) throw 0;
    i += m[0].length;
    let v = Number(m[0]);
    skip();
    if (peek() === "%") { i++; v /= 100; }
    return v;
  }
  function pow(): number { let b = num(); skip(); while (peek() === "^") { i++; b = b ** num(); skip(); } return b; }
  function expr2(): number {
    let v = pow(); skip();
    while (peek() === "*" || peek() === "/") { const op = src[i++]; const r = pow(); v = op === "*" ? v * r : v / r; skip(); }
    return v;
  }
  function expr3(): number {
    let v = expr2(); skip();
    while (peek() === "+" || peek() === "-") { const op = src[i++]; const r = expr2(); v = op === "+" ? v + r : v - r; skip(); }
    return v;
  }
  try {
    const v = expr3();
    skip();
    if (i !== src.length || !Number.isFinite(v)) return null;
    return v;
  } catch {
    return null;
  }
}
