import { describe, expect, it } from "vitest";
import { CURRICULUM, DEFAULT_PATH, findSubtopic, FREE_TOPIC_SLUGS, isTopicSlug, TOTAL_TARGET_QUESTIONS } from "./taxonomy";

describe("curriculum taxonomy", () => {
  it("has 9 topics, ≥ 40 unique subtopics, and every topic slug is a known TopicSlug", () => {
    expect(CURRICULUM).toHaveLength(9);
    const subs = CURRICULUM.flatMap((t) => t.subtopics.map((s) => s.slug));
    expect(subs.length).toBeGreaterThanOrEqual(40);
    expect(new Set(subs).size).toBe(subs.length);
    for (const t of CURRICULUM) expect(isTopicSlug(t.slug)).toBe(true);
    for (const s of subs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("free topics are Accounting and EqV/EV", () => {
    expect([...FREE_TOPIC_SLUGS].sort()).toEqual(["accounting", "eqv-ev"]);
  });

  it("question targets add up to roughly the 400Q generalist count", () => {
    expect(TOTAL_TARGET_QUESTIONS).toBeGreaterThanOrEqual(240);
    expect(TOTAL_TARGET_QUESTIONS).toBeLessThanOrEqual(400);
  });

  it("default path is 10 weeks × 5 days with day 5 a review and every lesson slug a subtopic or a hand-written lesson", () => {
    expect(DEFAULT_PATH.weeks).toHaveLength(10);
    const handWritten = new Set(["ev-bridge-basics"]);
    for (const w of DEFAULT_PATH.weeks) {
      expect(w.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
      expect(w.days[4].lesson_slug).toBeNull();
      for (const d of w.days) if (d.lesson_slug && !handWritten.has(d.lesson_slug)) expect(findSubtopic(d.lesson_slug), d.lesson_slug).toBeDefined();
    }
  });
});
