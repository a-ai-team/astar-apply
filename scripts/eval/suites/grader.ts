// Grader suite (Loop 07): 40 hand-scored student answers in fixtures/eval/grader.jsonl, graded by
// the live Opus 5 grader (interview-grade.v1). Thresholds: Spearman ≥ 0.7 and MAE ≤ 1.0 against the
// human scores, and every empty/off-topic row ≤ 1. Without API credit the live part is skipped
// (`NO API CREDIT — grader suite skipped`, exit 0) and the deterministic fixture grader is run
// instead so the fixture's calibration is at least visible (printed, not gated).
import { readFileSync } from "node:fs";
import path from "node:path";
import { isCredentialFailure, probeApi } from "../../dev/api-probe";
import { gradeFixture, gradeLive, type GradeQuestion } from "../../../src/lib/interviews/grade";
import { CURRICULUM } from "../../../src/lib/content/taxonomy";
import { readJsonl, type SuiteResult } from "../index";
import { THRESHOLDS } from "../thresholds";

export type GraderItem = { id: string; question_slug: string; band: "excellent" | "partial" | "wrong" | "empty"; human_score: number; answer: string; note?: string };

function loadQuestion(slug: string): GradeQuestion {
  const j = JSON.parse(readFileSync(path.join("content", "questions", `${slug}.json`), "utf8")) as { slug: string; question: string; difficulty: number; topic_slug: string; model_answer_md: string; key_points: string[]; weak_answer_note: string; numbers: GradeQuestion["numbers"] };
  return { id: slug, slug, question: j.question, difficulty: j.difficulty, topic_slug: j.topic_slug, topic_title: CURRICULUM.find((t) => t.slug === j.topic_slug)?.title ?? j.topic_slug, model_answer_md: j.model_answer_md, key_points: j.key_points, weak_answer_note: j.weak_answer_note, numbers: j.numbers ?? null };
}

function rank(xs: number[]): number[] {
  const idx = xs.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const out = new Array<number>(xs.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1].v === idx[i].v) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k].i] = r;
    i = j + 1;
  }
  return out;
}

/** Spearman rank correlation (ties → average ranks, Pearson on ranks). */
export function spearman(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length < 2) return 0;
  const ra = rank(a);
  const rb = rank(b);
  const ma = ra.reduce((s, x) => s + x, 0) / ra.length;
  const mb = rb.reduce((s, x) => s + x, 0) / rb.length;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < ra.length; i++) {
    num += (ra[i] - ma) * (rb[i] - mb);
    da += (ra[i] - ma) ** 2;
    db += (rb[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

export function mae(a: number[], b: number[]): number {
  return a.length ? a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0) / a.length : 0;
}

export function summarise(rows: { id: string; band: string; human: number; score: number }[]) {
  const human = rows.map((r) => r.human);
  const scored = rows.map((r) => r.score);
  const empties = rows.filter((r) => r.band === "empty");
  const byBand: Record<string, number> = {};
  for (const b of ["excellent", "partial", "wrong", "empty"]) {
    const xs = rows.filter((r) => r.band === b);
    byBand[`mean_${b}`] = xs.length ? xs.reduce((s, r) => s + r.score, 0) / xs.length : 0;
  }
  return { n: rows.length, spearman: spearman(human, scored), mae: mae(human, scored), empty_max: empties.length ? Math.max(...empties.map((r) => r.score)) : 0, ...byBand };
}

export async function run({ limit }: { limit: number | null }): Promise<SuiteResult> {
  const t = THRESHOLDS.grader;
  const thresholds = { spearman: t.spearman, mae: t.mae, empty_max: t.empty_max };
  const items = readJsonl<GraderItem>("fixtures/eval/grader.jsonl").slice(0, limit ?? undefined);
  const questions = new Map<string, GradeQuestion>();
  for (const it of items) if (!questions.has(it.question_slug)) questions.set(it.question_slug, loadQuestion(it.question_slug));
  const probe = await probeApi();
  if (!probe.ok) {
    const why = probe.reason === "billing" ? "NO API CREDIT" : probe.reason === "no-key" ? "NO API KEY" : `API ${probe.reason.toUpperCase()}`;
    console.warn(`  ${why} — grader suite skipped (${probe.message.slice(0, 120)}); running the fixture grader for information only`);
    const rows = items.map((it) => ({ id: it.id, band: it.band, human: it.human_score, score: gradeFixture({ question: questions.get(it.question_slug)!, answer: it.answer }).score }));
    for (const r of rows) console.log(`  ${r.id} ${r.band.padEnd(9)} human ${r.human}  fixture ${r.score}`);
    const m = summarise(rows);
    return {
      suite: "grader",
      passed: true,
      skipped: `${why} — live Opus 5 grading skipped; fixture-grader numbers printed (not gated)`,
      metrics: { n: m.n, judged: 0, fixture_spearman: m.spearman, fixture_mae: m.mae, fixture_empty_max: m.empty_max, fixture_mean_excellent: m.mean_excellent, fixture_mean_partial: m.mean_partial, fixture_mean_wrong: m.mean_wrong, fixture_mean_empty: m.mean_empty },
      thresholds,
      items: rows,
      notes: [isCredentialFailure(probe) ? "top up credit / set ANTHROPIC_API_KEY, then rerun `npm run eval -- --suite grader`" : "transient API error — rerun"],
    };
  }
  const rows: { id: string; band: string; human: number; score: number; hit: number; missed: number; cache_read: number }[] = [];
  for (const it of items) {
    const q = questions.get(it.question_slug)!;
    const g = await gradeLive({ question: q, answer: it.answer });
    rows.push({ id: it.id, band: it.band, human: it.human_score, score: g.score, hit: g.grade.hit.length, missed: g.grade.missed.length, cache_read: g.usage?.cache_read ?? 0 });
    console.log(`  ${it.id} ${it.band.padEnd(9)} human ${it.human_score}  opus ${g.score}  (a${g.grade.accuracy} s${g.grade.structure} d${g.grade.depth}; cache_read ${g.usage?.cache_read ?? 0})`);
  }
  const m = summarise(rows);
  const cacheHits = rows.filter((r) => r.cache_read > 0).length;
  const passed = m.spearman >= t.spearman && m.mae <= t.mae && m.empty_max <= t.empty_max;
  return {
    suite: "grader",
    passed,
    metrics: { n: m.n, judged: m.n, spearman: m.spearman, mae: m.mae, empty_max: m.empty_max, mean_excellent: m.mean_excellent, mean_partial: m.mean_partial, mean_wrong: m.mean_wrong, mean_empty: m.mean_empty, cache_hit_rows: cacheHits },
    thresholds,
    items: rows,
    notes: [cacheHits === 0 ? "WARNING: no cache reads — check the rubric prompt is ≥ 1024 tokens and static" : `prompt cache hit on ${cacheHits}/${rows.length} rows`],
  };
}
