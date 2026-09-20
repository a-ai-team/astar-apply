import { describe, expect, it } from "vitest";
import { packDownloadName, packObjectPath, pickRoundRobin } from "./pack-files";
import { DEFAULT_PATH } from "./taxonomy";
import { formatValue } from "@/components/lesson/blocks/worked-calc";

describe("pickRoundRobin", () => {
  it("covers every group before doubling up on any", () => {
    expect(pickRoundRobin([["a1", "a2", "a3"], ["b1"], ["c1", "c2"]], 5)).toEqual(["a1", "b1", "c1", "a2", "c2"]);
  });
  it("stops at the limit and survives empty groups", () => {
    expect(pickRoundRobin([[], ["b1", "b2"]], 1)).toEqual(["b1"]);
    expect(pickRoundRobin([[], []], 3)).toEqual([]);
  });
});

describe("pack file names", () => {
  it("gives every week a distinct object path and a readable download name", () => {
    const paths = DEFAULT_PATH.weeks.map((w) => packObjectPath(w.week));
    expect(new Set(paths).size).toBe(DEFAULT_PATH.weeks.length);
    for (const w of DEFAULT_PATH.weeks) expect(packDownloadName(w.week)).toMatch(/^astar-apply-week-\d{2}-[a-z0-9-]+\.pdf$/);
  });
});

describe("formatValue", () => {
  it("puts the sign before the currency symbol", () => {
    expect(formatValue(-10, "£m")).toBe("−£10m");
    expect(formatValue(1.306, "£")).toBe("£1.31");
  });
  it("hugs multiples and keeps spaced units spaced", () => {
    expect(formatValue(3.993, "×")).toBe("3.99×");
    expect(formatValue(43.8, "days")).toBe("43.8 days");
  });
  it("keeps unit-less rates distinguishable", () => {
    expect(formatValue(0.0802)).toBe("0.0802");
    expect(formatValue(0.0702)).toBe("0.0702");
    expect(formatValue(1.19)).toBe("1.19");
  });
});
