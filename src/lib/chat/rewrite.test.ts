import { describe, expect, it } from "vitest";
import { heuristicRewrite } from "./rewrite";
import { kindsForIntent } from "./retrieve";
import { firstSentence } from "./answer";

describe("heuristicRewrite", () => {
  it("routes technicals and strips stop words", () => {
    const r = heuristicRewrite("What is enterprise value?");
    expect(r.intent).toBe("technical");
    expect(r.queries[0]).toBe("enterprise value");
    expect(r.standalone_question).toBe("What is enterprise value?");
  });
  it("routes applications and extracts programmes", () => {
    const r = heuristicRewrite("When should I start applying for a spring week at Goldman Sachs?");
    expect(r.intent).toBe("application");
    expect(r.entities.firms).toContain("Goldman Sachs");
    expect(r.entities.programmes).toContain("spring week");
  });
  it("routes greetings off-topic", () => {
    expect(heuristicRewrite("hello!").intent).toBe("offtopic");
    expect(kindsForIntent("offtopic")).toEqual([]);
    expect(kindsForIntent("technical")).toBeNull();
  });
  it("borrows the previous user turn for short follow-ups", () => {
    const r = heuristicRewrite("and for EV?", [{ role: "user", text: "How do I calculate equity value from the balance sheet" }]);
    expect(r.queries.length).toBeGreaterThan(1);
    expect(r.queries[1]).toContain("equity value");
  });
});

describe("firstSentence", () => {
  it("skips headings and truncates", () => {
    expect(firstSentence("## Heading\n\nFirst one. Second one.")).toBe("First one.");
    expect(firstSentence("x".repeat(300)).length).toBeLessThanOrEqual(240);
  });
});
