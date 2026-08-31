import { describe, expect, it } from "vitest";
import { findSubtopic } from "@/lib/content/taxonomy";
import { CURRICULUM, TOTAL_TARGET_QUESTIONS } from "../taxonomy";
import { difficultyMix, lessonTargets, parseCustomId, questionTargets, targetFromCustomId } from "./targets";
import { estimateBatch, heuristicTokens, usageCost } from "./cost";
import { lessonWritePrompt } from "@/lib/ai/prompts/lesson-write.v1";
import { questionWritePrompt } from "@/lib/ai/prompts/question-write.v1";

const none = { lessons: [], questions: [] };

describe("targets", () => {
  it("one lesson per subtopic when nothing exists", () => {
    const n = CURRICULUM.reduce((a, t) => a + t.subtopics.length, 0);
    expect(lessonTargets(none)).toHaveLength(n);
    expect(lessonTargets(none)[0].custom_id).toMatch(/^lesson:/);
  });
  it("skips subtopics that already have a lesson unless forced", () => {
    const existing = { lessons: [{ slug: "ev-bridge-basics", subtopic_slug: "ev-bridge-calculations", title: "x", one_liner: "EV is what a buyer pays for the whole business." }], questions: [] };
    const all = lessonTargets(none).length;
    expect(lessonTargets(existing)).toHaveLength(all - 1);
    expect(lessonTargets(existing, { force: true })).toHaveLength(all);
    expect(lessonTargets(existing, { slugs: ["ev-bridge-calculations"] })).toHaveLength(1);
    expect(lessonTargets(existing, { topics: ["eqv-ev"] }).every((t) => t.topic_slug === "eqv-ev")).toBe(true);
    expect(lessonTargets(existing)[0].input.prior_one_liners).toContain("EV is what a buyer pays for the whole business.");
  });
  it("question targets sum to TOTAL_TARGET_QUESTIONS and mix sums per request", () => {
    const ts = questionTargets(none);
    expect(ts.reduce((a, t) => a + t.count, 0)).toBe(TOTAL_TARGET_QUESTIONS);
    // The total is derived from `target_questions` in taxonomy.ts, which each Technicals v2 chapter
    // loop rewrites to its own scope (it was 347 under the Loop 03/04 plan). Assert the invariant —
    // targets equal the taxonomy — and a sane range, not a frozen figure that every chapter breaks.
    expect(TOTAL_TARGET_QUESTIONS).toBeGreaterThan(100);
    expect(TOTAL_TARGET_QUESTIONS).toBeLessThan(400);
    for (const t of ts) expect(t.mix.reduce((a, b) => a + b, 0)).toBe(t.count);
  });
  it("subtracts existing questions per kind", () => {
    const existing = { lessons: [], questions: [{ slug: "q", subtopic_slug: "ev-bridge-calculations", kind: "calculation" as const, question: "Compute EV." }] };
    const t = questionTargets(existing, { slugs: ["ev-bridge-calculations"] });
    expect(t).toHaveLength(1);
    // Derived, not pinned: every Technicals v2 chapter rewrites `target_questions`. The invariant
    // is that the target drops by exactly the number of questions that already exist.
    const target = findSubtopic("ev-bridge-calculations")!.subtopic.target_questions;
    expect(t[0].count).toBe(target - 1);
    expect(t[0].input.existing_questions).toEqual(["Compute EV."]);
  });
  it("difficultyMix uses largest remainder", () => {
    expect(difficultyMix(4)).toEqual([1, 1, 1, 1]);
    expect(difficultyMix(20)).toEqual([5, 6, 6, 3]);
    expect(difficultyMix(0)).toEqual([0, 0, 0, 0]);
  });
  it("custom ids round-trip", () => {
    expect(parseCustomId("lesson:wacc")).toEqual({ kind: "lesson", slug: "wacc" });
    expect(parseCustomId("questions:wacc:concept")).toEqual({ kind: "questions", subtopic_slug: "wacc", qkind: "concept" });
    expect(parseCustomId("nope")).toBeNull();
    expect(targetFromCustomId("lesson:wacc", none)?.kind).toBe("lesson");
    expect(targetFromCustomId("questions:wacc:calculation", none)?.custom_id).toBe("questions:wacc:calculation");
    expect(targetFromCustomId("questions:not-a-subtopic:calculation", none)).toBeNull();
  });
});

describe("prompts", () => {
  it("system prompts are static and long enough to cache (≥ 1024 tokens)", () => {
    for (const p of [lessonWritePrompt, questionWritePrompt]) {
      expect(heuristicTokens(p.system)).toBeGreaterThan(1024);
      expect(p.system).not.toMatch(/20\d\d-\d\d-\d\d/);
    }
  });
});

describe("cost", () => {
  it("heuristic estimate applies batch discount and caching", async () => {
    const e = await estimateBatch([{ system: "s".repeat(3500), user: "u".repeat(350), expected_output_tokens: 1000 }, { system: "s".repeat(3500), user: "u".repeat(350), expected_output_tokens: 1000 }], "claude-opus-5");
    expect(e.method).toBe("heuristic");
    expect(e.requests).toBe(2);
    // system 1000 tok: 1.25× write + 0.1× read = 1350; users 2 × 100 = 200 → 1550 input
    expect(e.input_tokens).toBe(1550);
    expect(e.usd).toBeCloseTo(((1550 * 5 + 2000 * 25) / 1e6) * 0.5, 6);
    expect(e.within_cap).toBe(true);
  });
  it("falls back to heuristic when count_tokens throws", async () => {
    const e = await estimateBatch([{ system: "s", user: "u", expected_output_tokens: 1 }], "claude-opus-5", async () => { throw new Error("no credit"); });
    expect(e.method).toBe("heuristic");
  });
  it("usageCost halves for batch and discounts cache reads", () => {
    const full = usageCost({ input_tokens: 1_000_000, output_tokens: 0 }, "claude-opus-5");
    expect(full).toBe(5);
    expect(usageCost({ input_tokens: 1_000_000, output_tokens: 0 }, "claude-opus-5", { batch: true })).toBe(2.5);
    expect(usageCost({ input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000 }, "claude-opus-5")).toBeCloseTo(0.5);
  });
});

describe("industry targets (Loop 09)", () => {
  it("--kind industry selects the 18 modules: 50 lessons / 181 questions with the addendum context and content/industry paths", async () => {
    const { lessonTargets, questionTargets, contentPathFor, targetFromCustomId } = await import("./targets");
    const empty = { lessons: [], questions: [] };
    const lessons = lessonTargets(empty, { all: true, kind: "industry" });
    expect(lessons).toHaveLength(50);
    expect(lessons.every((t) => t.industry && t.input.industry?.module_slug === t.topic_slug)).toBe(true);
    const re = lessons.find((t) => t.slug === "real-estate-noi-cap-rates")!;
    expect(re.industry?.family).toBe("coverage");
    expect(re.industry?.sibling_lessons).toHaveLength(2);
    expect(contentPathFor(re, "x.json")).toBe("industry/real-estate/lessons/x.json");
    const questions = questionTargets(empty, { all: true, kind: "industry" });
    expect(questions.reduce((n, t) => n + t.count, 0)).toBe(181);
    expect(questions.every((t) => t.industry)).toBe(true);
    // Generalist runs are unchanged.
    expect(lessonTargets(empty, { all: true }).every((t) => t.industry === null)).toBe(true);
    expect(contentPathFor(lessonTargets(empty, { all: true })[0], "x.json")).toBe("lessons/x.json");
    // custom_id round-trip finds industry subtopics too.
    const back = targetFromCustomId("lesson:real-estate-noi-cap-rates", empty);
    expect(back?.kind === "lesson" && back.industry?.module_title).toBe("Real Estate");
  });
});
