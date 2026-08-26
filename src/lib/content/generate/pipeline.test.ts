// Checkers + batch parser + collector, exercised against fixtures/recorded/batch-results.jsonl
// (hand-authored to the Batches results shape — no API calls in unit tests).
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseResultRow, parseResultsJsonl } from "./batch";
import { checkLesson, checkQuestionSet, difficultyShares, lessonProblems } from "./checks";
import { collectRows, summarise } from "./collect";
import { ngrams } from "../overlap";
import { validateLessonBody } from "../lesson-schema";
import type { LessonFileOut, QuestionFileOut } from "./collect";

const fixture = readFileSync(path.resolve(__dirname, "../../../../fixtures/recorded/batch-results.jsonl"), "utf8");
const rows = parseResultsJsonl(fixture);
const parsed = rows.map(parseResultRow);
const none = { lessons: [], questions: [] };

describe("batch parser", () => {
  it("drops the _note header and keeps 6 rows", () => {
    expect(rows).toHaveLength(6);
  });
  it("classifies succeeded / errored / expired / max_tokens", () => {
    const by = Object.fromEntries(parsed.map((p) => [p.custom_id, p]));
    expect(by["lesson:income-statement"].ok).toBe(true);
    expect(by["lesson:balance-sheet"]).toMatchObject({ ok: false, retryable: true });
    expect(by["questions:balance-sheet:concept"]).toMatchObject({ ok: false, error: "expired", retryable: true });
    expect(by["lesson:working-capital"]).toMatchObject({ ok: false, retryable: true });
    expect((by["lesson:working-capital"] as { error: string }).error).toMatch(/max_tokens/);
  });
  it("invalid_request errors are not retryable; refusals are not retryable", () => {
    expect(parseResultRow({ custom_id: "lesson:wacc", result: { type: "errored", error: { type: "invalid_request", error: { type: "invalid_request_error", message: "bad" } } } })).toMatchObject({ ok: false, retryable: false });
    expect(parseResultRow({ custom_id: "lesson:wacc", result: { type: "succeeded", message: { content: [], stop_reason: "refusal", usage: { input_tokens: 1, output_tokens: 0 } } } })).toMatchObject({ ok: false, error: "refusal", retryable: false });
  });
});

describe("checkers", () => {
  const good = parsed.find((p) => p.custom_id === "lesson:income-statement")!;
  const bad = parsed.find((p) => p.custom_id === "lesson:cash-flow-statement")!;
  it("accepts the good lesson and flags no problems (overlap skipped without the hidden set)", () => {
    const r = checkLesson(good.ok ? good.output : null, { walkthrough: false, reference: null });
    expect(r.ok).toBe(true);
    expect(r.problems).toEqual([]);
    expect(r.warnings.join(" ")).toMatch(/overlap check skipped/);
    expect(r.value?.body.blocks.find((b) => b.type === "widget")).toMatchObject({ widget: "filings_toggle", props: {} });
  });
  it("catches a wrong worked_calc value", () => {
    const r = checkLesson(bad.ok ? bad.output : null, { walkthrough: false, reference: null });
    expect(r.ok).toBe(false);
    expect(r.problems.join(" ")).toMatch(/worked_calc step "EBITDA": 120 \+ 40 = 160, not 150/);
  });
  it("catches quick-fire count, missing scenario for walkthroughs, reading time and word-exprs", () => {
    const body = validateLessonBody((good.ok ? (good.output as { body: unknown }).body : null));
    expect(body.ok).toBe(true);
    const b = structuredClone(body.value!);
    b.reading_minutes = 14;
    const qf = b.blocks.find((x) => x.type === "quick_fire")!;
    if (qf.type === "quick_fire") qf.pairs = qf.pairs.slice(0, 3);
    const wc = b.blocks.find((x) => x.type === "worked_calc")!;
    if (wc.type === "worked_calc") wc.steps[0].expr = "revenue minus cogs";
    const { problems } = lessonProblems(b, { walkthrough: true, reference: new Set() });
    expect(problems.join("\n")).toMatch(/quick_fire has 3 pairs/);
    expect(problems.join("\n")).toMatch(/scenario/);
    expect(problems.join("\n")).toMatch(/reading_minutes 14 > 12/);
    expect(problems.join("\n")).toMatch(/not pure arithmetic/);
  });
  it("flags 8-gram overlap with the reference (count only, never the text)", () => {
    const body = validateLessonBody((good.ok ? (good.output as { body: unknown }).body : null)).value!;
    const ref = ngrams("The income statement records what a company earned and what it used up over a period usually a year");
    const { problems } = lessonProblems(body, { reference: ref });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/^\d+ 8-word passage/);
    expect(problems[0]).not.toMatch(/income statement records/);
  });
  it("question set: schema + count + kinds + d4 numbers", () => {
    const q = parsed.find((p) => p.custom_id === "questions:income-statement:concept")!;
    const ctx = { topic_slug: "accounting", subtopic_slug: "income-statement", source_topic: "Accounting – concepts", qkind: "concept" as const, count: 4, mix: [1, 1, 1, 1] as [number, number, number, number], reference: null };
    const r = checkQuestionSet(q.ok ? q.output : null, ctx);
    expect(r.ok).toBe(true);
    expect(r.value).toHaveLength(4);
    expect(r.value!.map((x) => x.difficulty)).toEqual([1, 2, 3, 4]);
    expect(new Set(r.value!.map((x) => x.slug)).size).toBe(4);
    const short = checkQuestionSet(q.ok ? q.output : null, { ...ctx, count: 5, qkind: "calculation" });
    expect(short.ok).toBe(false);
    expect(short.problems.join("\n")).toMatch(/set has 4 question\(s\), requested 5/);
    expect(short.problems.join("\n")).toMatch(/kind concept, requested calculation/);
  });
  it("difficultyShares measures distance from 25/30/30/15", () => {
    const r = difficultyShares([{ difficulty: 1 }, { difficulty: 2 }, { difficulty: 3 }, { difficulty: 4 }]);
    expect(r.max_abs_diff).toBeCloseTo(0.1);
  });
});

describe("collector", () => {
  const items = collectRows(parsed, { existing: none, reference: null, model: "claude-opus-5" });
  it("writes good items, drafts failed-check items, reports failures with resubmit ids", () => {
    const s = summarise(items);
    expect(s).toMatchObject({ requested: 6, written: 2, draft: 1, failed: 3, files: 6 });
    expect(s.resubmit.sort()).toEqual(["lesson:balance-sheet", "lesson:working-capital", "questions:balance-sheet:concept"]);
    expect(s.cost_usd).toBeGreaterThan(0);
  });
  it("shapes lesson + question files to the content/ contract", () => {
    const lesson = items.find((i) => i.custom_id === "lesson:income-statement")!.files[0].json as LessonFileOut;
    expect(lesson).toMatchObject({ slug: "income-statement", subtopic_slug: "income-statement", status: "generated", generated_by: "claude-opus-5", prompt_version: "lesson-write.v1" });
    const draft = items.find((i) => i.custom_id === "lesson:cash-flow-statement")!.files[0].json as LessonFileOut;
    expect(draft.status).toBe("draft");
    expect(draft.check_problems?.[0]).toMatch(/worked_calc/);
    const qs = items.find((i) => i.custom_id === "questions:income-statement:concept")!.files.map((f) => f.json as QuestionFileOut);
    expect(qs.every((q) => q.status === "generated" && q.topic_slug === "accounting" && q.source_topic === "Accounting – concepts")).toBe(true);
    expect(qs[3].flashcard_back).toMatch(/Same net income/);
  });
});
