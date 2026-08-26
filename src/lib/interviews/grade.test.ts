import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { interviewGradePrompt } from "@/lib/ai/prompts/interview-grade.v1";
import { buildGradeInput, gradeFixture, gradeTurn, keyPointHit, parseGrade, type GradeQuestion } from "./grade";
import { scoreFromGrade } from "./types";

// Hand-authored recorded response (no API credit in Loop 07) — see the _note in the fixture.
const fixture = JSON.parse(readFileSync(path.join(process.cwd(), "fixtures", "recorded", "interview-grade.v1.sample.json"), "utf8")) as {
  question: GradeQuestion; answer: string; metrics: { wpm: number; filler_count: number; fillers: string[]; duration_s: number; voice: boolean }; parsed_output: unknown; response: { content: { text: string }[] };
};
const q = fixture.question;

describe("grader (recorded Opus 5 response)", () => {
  it("rubric prompt is static and long enough to cache (≥ 1024 tokens ≈ 4k chars)", () => {
    expect(interviewGradePrompt.system.length).toBeGreaterThan(4000);
    expect(interviewGradePrompt.system).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
  it("builds the user turn from the Loop 06 question bundle + answer + delivery metrics", () => {
    const s = buildGradeInput({ question: q, answer: fixture.answer, metrics: fixture.metrics, secondsAllowed: 90 });
    expect(s).toContain("<rubric_material>");
    expect(s).toContain(`Question: ${q.question}`);
    expect(s).toContain("Key points: EV = equity value + net debt;");
    expect(s).toContain("What a weak answer looks like:");
    expect(s).toContain("Numerical answer expected: 1300");
    expect(s).toContain("<student_answer>\nSo EV is equity value");
    expect(s).toContain("<delivery>seconds used: 22 of 90; pace: 148 wpm; fillers: 1 (um); speech transcript</delivery>");
    expect(s).not.toContain("If their message is short or ambiguous"); // the chat-only instruction line is dropped
    expect(buildGradeInput({ question: q, answer: "   " })).toContain("(no answer given)");
  });
  it("parses the recorded structured output (and the raw text block) into a Grade scoring 9/10", () => {
    const g = parseGrade(fixture.parsed_output, q.key_points)!;
    expect(g.hit).toHaveLength(4);
    expect(g.missed).toEqual([]);
    expect(scoreFromGrade(g)).toBe(9);
    expect(parseGrade(JSON.parse(fixture.response.content[0].text), q.key_points)).toEqual(g);
    expect(parseGrade({ accuracy: 9 }, q.key_points)).toBeNull();
  });
  it("moves any key point the model forgot to place into missed, never hit", () => {
    const g = parseGrade({ ...(fixture.parsed_output as object), hit: ["EV = £1,300m"], missed: [] }, q.key_points)!;
    expect(g.hit).toEqual(["EV = £1,300m"]);
    expect(g.missed).toHaveLength(3);
  });
});

describe("fixture grader (keyword coverage)", () => {
  it("scores the model answer 9–10, a partial answer 4–7, a wrong number ≤ 3 and an empty answer 0", async () => {
    const full = gradeFixture({ question: q, answer: q.model_answer_md + " " + q.key_points.join(". ") + " This matters because the acquirer effectively gets the cash back and can pay down the debt, so the price of the operating business is what enterprise value measures." });
    expect(full.score).toBeGreaterThanOrEqual(9);
    expect(full.grade.missed).toEqual([]);
    const partial = gradeFixture({ question: q, answer: "Enterprise value is equity value plus net debt. So net debt is debt minus cash which is 300, giving 1,300." });
    expect(partial.score).toBeGreaterThanOrEqual(4);
    expect(partial.score).toBeLessThanOrEqual(7);
    expect(partial.grade.missed.length).toBeGreaterThanOrEqual(1);
    const wrong = gradeFixture({ question: q, answer: "Enterprise value is equity value plus net debt, so 1,000 plus 400 plus 100 gives 1,500. You add cash because it belongs to shareholders." });
    expect(wrong.grade.accuracy).toBeLessThanOrEqual(1);
    expect(wrong.score).toBeLessThanOrEqual(3);
    expect(wrong.grade.feedback_md).toContain("1300");
    const empty = gradeFixture({ question: q, answer: "" });
    expect(empty.score).toBe(0);
    const off = gradeFixture({ question: q, answer: "I think the weather in London is quite nice today." });
    expect(off.score).toBeLessThanOrEqual(1);
    expect((await gradeTurn({ question: q, answer: "" }, "fixture")).prompt_version).toBe("fixture-keyword-coverage.v1");
  });
  it("key-point hit needs half the content words (stemmed)", () => {
    const words = new Set(["equit", "value", "debt"]);
    expect(keyPointHit("EV = equity value + net debt", words)).toBe(true);
    expect(keyPointHit("Cash is subtracted because the acquirer gets it back", words)).toBe(false);
  });
});
