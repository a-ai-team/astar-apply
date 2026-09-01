import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_CURRICULUM, CURRICULUM, DEFAULT_PATH, findSubtopic, FREE_TOPIC_SLUGS, INDUSTRY_CURRICULUM, INDUSTRY_MODULES, isContentTopicSlug, isTopicSlug, lessonTargetCount, questionTargetCount, TOTAL_TARGET_QUESTIONS } from "./taxonomy";

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

  it("default path is 10 weeks × 5 days and no lesson slug points at a deferred subtopic", () => {
    expect(DEFAULT_PATH.weeks).toHaveLength(10);
    // `ev-bridge-basics` is the hand-written Loop 03 lesson (its subtopic is ev-bridge-calculations).
    const handWritten = new Set(["ev-bridge-basics"]);
    for (const w of DEFAULT_PATH.weeks) {
      expect(w.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
      for (const d of w.days) {
        if (!d.lesson_slug || handWritten.has(d.lesson_slug)) continue;
        const hit = findSubtopic(d.lesson_slug);
        expect(hit, d.lesson_slug).toBeDefined();
        expect(hit?.subtopic.deferred, `${d.lesson_slug} is deferred`).not.toBe(true);
      }
    }
  });

  it("the technicals weeks (1–9) name all 35 v2 lessons, each written in content/", () => {
    const slugs = DEFAULT_PATH.weeks
      .filter((w) => w.week <= 9)
      .flatMap((w) => w.days.map((d) => d.lesson_slug).filter((s): s is string => s !== null));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toHaveLength(35);
    for (const s of slugs) {
      expect(existsSync(path.resolve(__dirname, "../../../content/lessons", `${s}.json`)), `content/lessons/${s}.json`).toBe(true);
    }
  });

  it("exactly 7 days carry a cheat sheet, one per chapter with a sheet on disk", () => {
    const sheets = DEFAULT_PATH.weeks.flatMap((w) => w.days.filter((d) => d.cheatsheet));
    expect(sheets).toHaveLength(7);
    const topics = sheets.map((d) => d.cheatsheet!);
    expect(new Set(topics).size).toBe(topics.length);
    for (const t of topics) {
      expect(existsSync(path.resolve(__dirname, "../../../content/cheatsheets", `${t}.json`)), `content/cheatsheets/${t}.json`).toBe(true);
    }
  });
});

describe("industry modules (Loop 09)", () => {
  it("has 18 modules with unique slugs and subtopics that do not collide with the generalist curriculum", () => {
    expect(INDUSTRY_MODULES).toHaveLength(18);
    const slugs = ALL_CURRICULUM.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const subs = ALL_CURRICULUM.flatMap((t) => t.subtopics.map((s) => s.slug));
    expect(new Set(subs).size).toBe(subs.length);
    for (const m of INDUSTRY_MODULES) { expect(isContentTopicSlug(m.slug)).toBe(true); expect(isTopicSlug(m.slug)).toBe(false); }
  });

  it("targets follow the loop plan: lessons 2/3/4 by source count, questions to the nearest 5 (min 8), totals ≥ 45 / ≥ 180, never free", () => {
    expect([lessonTargetCount(4), lessonTargetCount(8), lessonTargetCount(12), lessonTargetCount(15)]).toEqual([2, 3, 3, 4]);
    expect([questionTargetCount(4), questionTargetCount(9), questionTargetCount(10), questionTargetCount(14)]).toEqual([8, 10, 10, 15]);
    let lessons = 0, questions = 0;
    for (const t of INDUSTRY_CURRICULUM) {
      const m = INDUSTRY_MODULES.find((x) => x.slug === t.slug)!;
      expect(t.kind).toBe("industry");
      expect(t.is_free).toBe(false);
      expect(t.group_family).toBe(m.family);
      expect(t.subtopics).toHaveLength(lessonTargetCount(m.source_count));
      expect(t.subtopics.reduce((n, s) => n + s.target_questions, 0)).toBe(questionTargetCount(m.source_count));
      lessons += t.subtopics.length;
      questions += t.subtopics.reduce((n, s) => n + s.target_questions, 0);
    }
    expect(lessons).toBeGreaterThanOrEqual(45);
    expect(questions).toBeGreaterThanOrEqual(180);
    expect(findSubtopic("real-estate-noi-cap-rates")?.topic.slug).toBe("real-estate");
  });
});
