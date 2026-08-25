import { describe, expect, it } from "vitest";
import { rrf } from "./rrf";

describe("rrf", () => {
  it("fuses ranks with k=60 and weights", () => {
    const out = rrf([
      { ids: ["a", "b", "c"], weight: 1 },
      { ids: ["b", "d"], weight: 1 },
    ]);
    expect(out[0].id).toBe("b"); // 1/62 + 1/61 beats 1/61
    expect(out.map((x) => x.id)).toEqual(["b", "a", "d", "c"]);
    expect(out[0].score).toBeCloseTo(1 / 62 + 1 / 61, 6);
  });
  it("down-weights a list", () => {
    const out = rrf([
      { ids: ["v1", "v2"], weight: 0.25 },
      { ids: ["f1"], weight: 1 },
    ]);
    expect(out[0].id).toBe("f1");
    expect(out[1].id).toBe("v1");
  });
  it("is deterministic on ties", () => {
    const out = rrf([{ ids: ["z"], weight: 1 }, { ids: ["a"], weight: 1 }]);
    expect(out.map((x) => x.id)).toEqual(["a", "z"]);
  });
  it("handles empty input", () => {
    expect(rrf([])).toEqual([]);
  });
});
