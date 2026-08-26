import { describe, expect, it } from "vitest";
import { buildReportInput, lessonFor, reportFixture, validateReport, weakestBuckets, type LessonRef, type ReportTurn } from "./report";
import { interviewReportPrompt } from "@/lib/ai/prompts/interview-report.v1";

const lessons: LessonRef[] = [
  { slug: "ev-bridge-basics", title: "The EqV → EV bridge", topic_slug: "eqv-ev", subtopic_slug: "ev-bridge" },
  { slug: "three-statements-linkage", title: "How the statements link", topic_slug: "accounting", subtopic_slug: "three-statements" },
  { slug: "depreciation-walkthrough", title: "Depreciation walkthrough", topic_slug: "accounting", subtopic_slug: "walkthroughs" },
];
const g = (hit: string[], missed: string[]) => ({ hit, missed, accuracy: 2, structure: 2, depth: 1, feedback_md: "f", mentor_tip_md: "t" });
const turns: ReportTurn[] = [
  { ordinal: 0, question: "What is EV?", topic_slug: "eqv-ev", topic_title: "EqV/EV", subtopic_slug: "ev-bridge", difficulty: 1, score: 9, grade: g(["a", "b"], []), answer_text: "…" },
  { ordinal: 1, question: "Walk me through £10 of depreciation.", topic_slug: "accounting", topic_title: "Accounting", subtopic_slug: "walkthroughs", difficulty: 3, score: 3, grade: g(["x"], ["net income falls £7.5", "cash rises £2.5"]), answer_text: "…" },
  { ordinal: 2, question: "How do the statements link?", topic_slug: "accounting", topic_title: "Accounting", subtopic_slug: "three-statements", difficulty: 2, score: 6, grade: g(["ni"], ["cash flow ties to bs"]), answer_text: "…" },
  { ordinal: 3, question: "Second walkthrough", topic_slug: "accounting", topic_title: "Accounting", subtopic_slug: "walkthroughs", difficulty: 3, score: 5, grade: g([], ["deferred tax"]), answer_text: null },
];

describe("report", () => {
  it("prompt is static", () => {
    expect(interviewReportPrompt.system).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
  it("ranks subtopics by mean score ascending", () => {
    const b = weakestBuckets(turns);
    expect(b.map((x) => x.subtopic_slug)).toEqual(["walkthroughs", "three-statements", "ev-bridge"]);
    expect(b[0].mean).toBe(4);
    expect(b[0].missed).toHaveLength(3);
  });
  it("fixture report links the lowest-scoring subtopics to approved lessons and decks", () => {
    const r = reportFixture({ mode: "drill", turns, lessons }).report;
    expect(r.focus_areas).toHaveLength(3);
    expect(r.focus_areas[0]).toMatchObject({ topic: "accounting", subtopic: "walkthroughs", lesson_slug: "depreciation-walkthrough", deck: "accounting" });
    expect(r.focus_areas[0].reason).toContain("net income falls £7.5");
    expect(r.focus_areas[2]).toMatchObject({ topic: "eqv-ev", lesson_slug: "ev-bridge-basics" });
    expect(r.summary_md).toContain("5.8/10");
    expect(lessonFor(lessons, "accounting", "unknown")!.topic_slug).toBe("accounting");
    expect(lessonFor(lessons, "dcf", null)).toBeNull();
  });
  it("keeps valid model focus areas and replaces invented slugs with the weakest uncovered subtopic", () => {
    const parsed = {
      summary_md: "Solid on definitions, shaky on walkthroughs.",
      focus_areas: [
        { topic: "accounting", subtopic: "walkthroughs", reason: "You said net income falls by £10.", lesson_slug: "depreciation-walkthrough", deck: "accounting" },
        { topic: "accounting", subtopic: "three-statements", reason: "Invented", lesson_slug: "made-up-lesson", deck: "accounting" },
        { topic: "dcf", subtopic: "wacc", reason: "Wrong topic entirely", lesson_slug: "ev-bridge-basics", deck: "dcf" },
      ],
    };
    const r = validateReport(parsed, { mode: "mock", turns, lessons })!;
    expect(r.summary_md).toBe("Solid on definitions, shaky on walkthroughs.");
    expect(r.focus_areas).toHaveLength(3);
    expect(r.focus_areas[0].lesson_slug).toBe("depreciation-walkthrough");
    expect(r.focus_areas.map((f) => f.lesson_slug)).toEqual(["depreciation-walkthrough", "three-statements-linkage", "ev-bridge-basics"]);
    expect(r.focus_areas.every((f) => lessons.some((l) => l.slug === f.lesson_slug && l.topic_slug === f.topic))).toBe(true);
    expect(validateReport({ nope: 1 }, { mode: "mock", turns, lessons })).toBeNull();
    // A bad deck falls back to the topic; an empty subtopic takes the lesson's.
    const one = validateReport({ summary_md: "s", focus_areas: [{ topic: "eqv-ev", subtopic: "", reason: "r", lesson_slug: "ev-bridge-basics", deck: "nope" }] }, { mode: "drill", turns, lessons })!;
    expect(one.focus_areas[0]).toMatchObject({ subtopic: "ev-bridge", deck: "eqv-ev" });
  });
  it("user turn lists every turn with hit/missed and the allowed lesson slugs", () => {
    const s = buildReportInput({ mode: "mock", turns, lessons });
    expect(s).toContain('<turn n="2" topic="accounting" subtopic="walkthroughs" difficulty="3" score="3">');
    expect(s).toContain("Missed: net income falls £7.5; cash rises £2.5");
    expect(s).toContain("- depreciation-walkthrough (topic accounting, subtopic walkthroughs): Depreciation walkthrough");
    expect(s).toContain("<decks>\neqv-ev, accounting\n</decks>");
  });
});
