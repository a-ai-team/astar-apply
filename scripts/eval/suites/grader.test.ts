import { describe, expect, it } from "vitest";
import { mae, spearman, summarise } from "./grader";

describe("grader suite maths", () => {
  it("spearman handles ties and perfect/inverse order", () => {
    expect(spearman([1, 2, 3, 4], [10, 20, 30, 40])).toBeCloseTo(1);
    expect(spearman([1, 2, 3, 4], [40, 30, 20, 10])).toBeCloseTo(-1);
    expect(spearman([1, 1, 2, 2], [1, 1, 2, 2])).toBeCloseTo(1);
    expect(spearman([1, 2], [1])).toBe(0);
  });
  it("mae + per-band summary", () => {
    expect(mae([0, 5, 10], [1, 5, 8])).toBeCloseTo(1);
    const s = summarise([
      { id: "a", band: "excellent", human: 10, score: 9 },
      { id: "b", band: "empty", human: 0, score: 1 },
      { id: "c", band: "wrong", human: 2, score: 3 },
    ]);
    expect(s.n).toBe(3);
    expect(s.empty_max).toBe(1);
    expect(s.mean_excellent).toBe(9);
    expect(s.mae).toBeCloseTo(1);
  });
});
