import { describe, expect, it } from "vitest";
import { approvalProblems, assertApprovable, BLOCK_TYPES, evalExpr, validateLessonBody, type LessonBody } from "./lesson-schema";

const full: LessonBody = {
  version: 1,
  reading_minutes: 8,
  blocks: [
    { type: "why_here", md: "Interviewers open here because it is quick to test." },
    { type: "concept", heading: "The idea", md: "Enterprise value is the price of the whole business." },
    { type: "mechanics", md: "Start from equity value and add the claims that rank ahead of shareholders." },
    { type: "worked_calc", md: "Bridge it.", steps: [{ label: "Net debt", expr: "500 - 120", value: 380, unit: "£m" }] },
    { type: "trap", md: "Cash is not a claim." },
    { type: "canonical_answer", md: "Say this.", seconds: 45 },
    { type: "scenario", prompt: "Depreciation rises by £10m.", statements: { is: [{ line: "Net income", delta: -7.5 }], cfs: [], bs: [] }, check: "Balance sheet balances." },
    { type: "your_turn", prompt: "Compute EV.", model_answer_md: "EV = 1,000.", rubric: ["adds net debt"] },
    { type: "quick_fire", pairs: [{ q: "a", a: "b" }, { q: "c", a: "d" }, { q: "e", a: "f" }, { q: "g", a: "h" }] },
    { type: "one_liner", md: "EV is the price of the whole business." },
    { type: "now_you_can", items: ["Bridge equity to enterprise value."] },
    { type: "widget", widget: "ev_bridge", props: {} },
  ],
};

describe("lesson-schema", () => {
  it("lists every block type in the contract", () => {
    expect(BLOCK_TYPES).toEqual([
      "why_here", "concept", "mechanics", "worked_calc", "trap", "canonical_answer", "scenario", "your_turn", "quick_fire", "one_liner", "now_you_can", "widget", "key_metrics",
    ]);
  });

  it("accepts a full lesson and it is approvable", () => {
    expect(validateLessonBody(full).ok).toBe(true);
    expect(approvalProblems(full, { walkthrough: true })).toEqual([]);
    expect(() => assertApprovable(full)).not.toThrow();
  });

  it("rejects an unknown block type and a 3-pair quick_fire", () => {
    const bad = { ...full, blocks: [...full.blocks, { type: "video", url: "x" }] };
    const r = validateLessonBody(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/blocks\.12/);
    const three = { ...full, blocks: full.blocks.map((b) => (b.type === "quick_fire" ? { ...b, pairs: b.pairs.slice(0, 3) } : b)) };
    expect(validateLessonBody(three).ok).toBe(false);
  });

  it("missing one_liner fails approvable but still validates", () => {
    const body = { ...full, blocks: full.blocks.filter((b) => b.type !== "one_liner") };
    expect(validateLessonBody(body).ok).toBe(true);
    expect(approvalProblems(body)).toEqual(['missing required block "one_liner"']);
    expect(() => assertApprovable(body)).toThrow(/one_liner/);
  });

  it("walkthrough lessons need a scenario", () => {
    const body = { ...full, blocks: full.blocks.filter((b) => b.type !== "scenario") };
    expect(approvalProblems(body)).toEqual([]);
    expect(approvalProblems(body, { walkthrough: true })).toEqual(['walkthrough lessons need a "scenario" block']);
  });

  it("re-evaluates worked_calc arithmetic", () => {
    const body = { ...full, blocks: full.blocks.map((b) => (b.type === "worked_calc" ? { ...b, steps: [{ label: "Net debt", expr: "500 - 120", value: 390 }] } : b)) };
    expect(approvalProblems(body)[0]).toMatch(/500 - 120 = 380, not 390/);
  });

  it("evalExpr handles the £m arithmetic we use and skips prose", () => {
    expect(evalExpr("500 - 120")).toBe(380);
    expect(evalExpr("1,200 × 8.5")).toBe(10200);
    expect(evalExpr("(100 - 20) * (1 - 25%)")).toBe(60);
    expect(evalExpr("2 ^ 3")).toBe(8);
    expect(evalExpr("EBITDA minus capex")).toBeNull();
    expect(evalExpr("10 / 0")).toBeNull();
  });
});
