import { describe, expect, it } from "vitest";
import { checklistKeys, loadPlaybook } from "./content";

describe("non-target playbook content", () => {
  it("has 7 sections in order with unique checklist keys", () => {
    const s = loadPlaybook();
    expect(s.map((x) => x.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(s.map((x) => x.slug)).toEqual(["the-reality", "networking", "cv-positioning", "alternative-routes", "building-your-edge", "timeline", "case-study"]);
    const keys = checklistKeys(s);
    expect(keys.length).toBeGreaterThanOrEqual(15);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
