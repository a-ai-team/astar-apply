import { describe, expect, it } from "vitest";
import { ngrams, overlapCount } from "./overlap";

describe("overlap", () => {
  it("counts shared 8-grams", () => {
    const ref = ngrams("one two three four five six seven eight nine ten");
    expect(ref.size).toBe(3);
    expect(overlapCount("zero one two three four five six seven eight", ref)).toBe(1);
    expect(overlapCount("nothing in common here at all with the reference set", ref)).toBe(0);
  });
});
