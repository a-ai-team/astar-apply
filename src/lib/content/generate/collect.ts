// Turns parsed batch rows into content/ files (pure: returns the files to write; the CLI and the
// route decide where they go). Items that fail the automatic checks are still kept — as `draft`
// with `check_problems` — so the review queue and the admin editor can show them, unless the
// schema itself failed (then there is nothing valid to write and the item is reported failed).
import type { LessonBody } from "../lesson-schema";
import type { Question } from "../question-schema";
import { checkLesson, checkQuestionSet, type Reference } from "./checks";
import type { ParsedRow } from "./batch";
import { usageCost, type Usage } from "./cost";
import { promptVersionFor } from "./requests";
import { contentPathFor, parseCustomId, targetFromCustomId, type ExistingContent, type Target } from "./targets";

/** content/lessons/<slug>.json (scripts/content/validate.ts LessonFile + Loop 04 provenance fields). */
export type LessonFileOut = {
  slug: string; subtopic_slug: string; title: string; ordinal: number;
  status: "generated" | "draft"; generated_by: string; prompt_version: string; body: LessonBody;
  check_problems?: string[]; check_warnings?: string[]; critic_notes?: string;
};
/** content/questions/<slug>.json — Question JSON + provenance. */
export type QuestionFileOut = Question & { generated_by: string; prompt_version: string; check_problems?: string[]; check_warnings?: string[]; critic_notes?: string };

export type CollectedItem = {
  custom_id: string;
  kind: "lesson" | "questions";
  status: "written" | "draft" | "failed";
  problems: string[];
  warnings: string[];
  retryable: boolean;
  usage: Usage | null;
  cost_usd: number;
  files: { path: string; json: LessonFileOut | QuestionFileOut }[];
  target: Target | null;
  /** Raw writer output kept for the critic pass (only when problems exist). */
  output?: unknown;
};

export type CollectOptions = { existing: ExistingContent; reference: Reference; model: string; generatedBy?: string; batch?: boolean };

/** Runs the checks for one row and shapes the files. `existing` supplies question slugs already taken. */
export function collectRow(row: ParsedRow, opts: CollectOptions, taken = new Set(opts.existing.questions.map((q) => q.slug))): CollectedItem {
  const parsed = parseCustomId(row.custom_id);
  const target = targetFromCustomId(row.custom_id, opts.existing);
  const base = { custom_id: row.custom_id, usage: row.ok ? row.usage : row.usage, target, files: [] as CollectedItem["files"] };
  const cost = base.usage ? usageCost(base.usage, opts.model, { batch: opts.batch ?? true }) : 0;
  if (!parsed || !target) return { ...base, kind: parsed?.kind ?? "lesson", status: "failed", problems: [`unknown custom_id ${row.custom_id}`], warnings: [], retryable: false, cost_usd: cost };
  if (!row.ok) return { ...base, kind: parsed.kind, status: "failed", problems: [row.error], warnings: [], retryable: row.retryable, cost_usd: cost };
  const generatedBy = opts.generatedBy ?? (row.model || opts.model);

  if (target.kind === "lesson") {
    const r = checkLesson(row.output, { walkthrough: target.walkthrough, industry: Boolean(target.industry), reference: opts.reference });
    if (!r.value) return { ...base, kind: "lesson", status: "failed", problems: r.problems, warnings: r.warnings, retryable: true, cost_usd: cost, output: row.output };
    const file: LessonFileOut = {
      slug: target.slug, subtopic_slug: target.subtopic_slug, title: r.value.title, ordinal: 1,
      status: r.ok ? "generated" : "draft", generated_by: generatedBy, prompt_version: promptVersionFor("lesson", Boolean(target.industry)), body: r.value.body,
      ...(r.problems.length ? { check_problems: r.problems } : {}), ...(r.warnings.length ? { check_warnings: r.warnings } : {}),
    };
    return { ...base, kind: "lesson", status: r.ok ? "written" : "draft", problems: r.problems, warnings: r.warnings, retryable: false, cost_usd: cost, files: [{ path: contentPathFor(target, `${target.slug}.json`), json: file }], output: r.ok ? undefined : row.output };
  }

  const r = checkQuestionSet(row.output, { topic_slug: target.topic_slug, subtopic_slug: target.subtopic_slug, source_topic: target.source_section, qkind: target.qkind, count: target.count, mix: target.mix, taken, reference: opts.reference });
  if (!r.value) return { ...base, kind: "questions", status: "failed", problems: r.problems, warnings: r.warnings, retryable: true, cost_usd: cost, output: row.output };
  const files = r.value.map((q) => ({
    path: contentPathFor(target, `${q.slug}.json`),
    json: { ...q, status: r.ok ? ("generated" as const) : ("draft" as const), generated_by: generatedBy, prompt_version: promptVersionFor("questions", Boolean(target.industry)), ...(r.problems.length ? { check_problems: r.problems } : {}), ...(r.warnings.length ? { check_warnings: r.warnings } : {}) } satisfies QuestionFileOut,
  }));
  return { ...base, kind: "questions", status: r.ok ? "written" : "draft", problems: r.problems, warnings: r.warnings, retryable: false, cost_usd: cost, files, output: r.ok ? undefined : row.output };
}

export function collectRows(rows: ParsedRow[], opts: CollectOptions): CollectedItem[] {
  const taken = new Set(opts.existing.questions.map((q) => q.slug));
  return rows.map((r) => collectRow(r, opts, taken));
}

export function summarise(items: CollectedItem[]) {
  const by = (s: CollectedItem["status"]) => items.filter((i) => i.status === s);
  return {
    requested: items.length,
    written: by("written").length,
    draft: by("draft").length,
    failed: by("failed").length,
    resubmit: items.filter((i) => i.status === "failed" && i.retryable).map((i) => i.custom_id),
    files: items.reduce((n, i) => n + i.files.length, 0),
    cost_usd: Number(items.reduce((n, i) => n + i.cost_usd, 0).toFixed(4)),
  };
}
