import { describe, expect, it } from "vitest";
import { applyReview, computeStreak, Rating, State, toFsrsCard } from "./srs";
import { buildSearchQuery, searchHitHref } from "./search";

const T0 = new Date("2026-08-26T09:00:00Z");
const later = (days: number) => new Date(T0.getTime() + days * 86_400_000);

describe("applyReview (FSRS)", () => {
  it("new card + Good → due in the future, streak 1, not mastered", () => {
    const { next, log } = applyReview(null, Rating.Good, T0);
    expect(next.reps).toBe(1);
    expect(next.streak).toBe(1);
    expect(next.mastered).toBe(false);
    expect(new Date(next.due).getTime()).toBeGreaterThan(T0.getTime());
    expect(log.rating).toBe(Rating.Good);
    expect(log.state).toBe(State.New);
    expect(log.reviewed_at).toEqual(T0);
  });

  it("two Good in a row → mastered", () => {
    const a = applyReview(null, Rating.Good, T0).next;
    const b = applyReview(a, Rating.Good, later(1)).next;
    expect(b.streak).toBe(2);
    expect(b.mastered).toBe(true);
    expect(b.reps).toBe(2);
  });

  it("Again resets the streak and mastery", () => {
    let s = applyReview(null, Rating.Good, T0).next;
    s = applyReview(s, Rating.Good, later(1)).next;
    expect(s.mastered).toBe(true);
    const again = applyReview(s, Rating.Again, later(5)).next;
    expect(again.streak).toBe(0);
    expect(again.mastered).toBe(false);
    expect(again.reps).toBe(3);
    // Good again after a miss starts the streak from 1.
    expect(applyReview(again, Rating.Good, later(6)).next.streak).toBe(1);
  });

  it("intervals grow with successive Good ratings and never exceed maximum_interval", () => {
    let s = applyReview(null, Rating.Good, T0).next;
    let prevGap = 0;
    let when = T0;
    for (let i = 0; i < 6; i++) {
      when = new Date(s.due);
      s = applyReview(s, Rating.Good, when).next;
      const gap = new Date(s.due).getTime() - when.getTime();
      expect(gap).toBeGreaterThanOrEqual(prevGap);
      expect(gap).toBeLessThanOrEqual(366 * 86_400_000);
      prevGap = gap;
    }
    expect(s.state).toBe(State.Review);
  });

  it("round-trips a stored row (ISO strings) into a ts-fsrs card", () => {
    const stored = { ...applyReview(null, Rating.Good, T0).next, due: T0.toISOString(), last_review: T0.toISOString() };
    const card = toFsrsCard(stored);
    expect(card.due).toEqual(T0);
    expect(card.last_review).toEqual(T0);
    expect(card.reps).toBe(1);
  });
});

describe("computeStreak", () => {
  const now = new Date("2026-08-26T22:00:00Z");
  it("0 with no activity", () => expect(computeStreak([], now)).toBe(0));
  it("counts consecutive days ending today", () => expect(computeStreak(["2026-08-24", "2026-08-25", "2026-08-26"], now)).toBe(3));
  it("survives until the end of the day after the last activity", () => expect(computeStreak(["2026-08-24", "2026-08-25"], now)).toBe(2));
  it("breaks after a missed day", () => expect(computeStreak(["2026-08-20", "2026-08-21", "2026-08-24"], now)).toBe(0));
  it("ignores gaps further back", () => expect(computeStreak(["2026-08-10", "2026-08-25", "2026-08-26"], now)).toBe(2));
});

describe("search builder", () => {
  it("normalises whitespace and rejects short input", () => {
    expect(buildSearchQuery("  enterprise   value ")).toBe("enterprise value");
    expect(buildSearchQuery("e")).toBeNull();
    expect(buildSearchQuery("   ")).toBeNull();
  });
  it("caps length", () => {
    expect(buildSearchQuery("a b".repeat(100))!.length).toBeLessThanOrEqual(120);
  });
  it("routes hits", () => {
    expect(searchHitHref({ kind: "question", slug: "what-is-enterprise-value", topic_slug: "eqv-ev" })).toBe("/home/practice/what-is-enterprise-value");
    expect(searchHitHref({ kind: "lesson", slug: "ev-bridge-basics", topic_slug: "eqv-ev" })).toBe("/home/technicals/eqv-ev/ev-bridge-basics");
  });
});
