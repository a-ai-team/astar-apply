import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseLessonBody } from "./lesson-schema";
import { parseQuestion, splitQuestion } from "./question-schema";
import { blockText, contentTitle, lessonChunks, MIN_BLOCK_TOKENS, questionChunk } from "./index-chunks";

const lesson = JSON.parse(readFileSync("content/lessons/ev-bridge-basics.json", "utf8"));
const question = JSON.parse(readFileSync("content/questions/what-is-enterprise-value.json", "utf8"));

describe("lessonChunks", () => {
  const body = parseLessonBody(lesson.body);
  const chunks = lessonChunks({ slug: lesson.slug, title: lesson.title, body, topic_title: "Equity value vs enterprise value" });
  it("one chunk per prose block, widgets skipped, block_index preserved for anchors", () => {
    const widgetIdx = body.blocks.findIndex((b) => b.type === "widget");
    expect(widgetIdx).toBeGreaterThanOrEqual(0);
    expect(chunks.some((c) => c.block_index === widgetIdx)).toBe(false);
    expect(chunks.every((c) => c.kind === "lesson_block" && c.block_index != null && c.block_index < body.blocks.length)).toBe(true);
    expect(chunks.length).toBeGreaterThanOrEqual(6);
    expect(chunks.length).toBeLessThanOrEqual(body.blocks.length);
    // block indexes strictly increase → anchors are stable
    for (let i = 1; i < chunks.length; i++) expect(chunks[i].block_index!).toBeGreaterThan(chunks[i - 1].block_index!);
  });
  it("titles follow Technicals › Topic › Lesson › Block", () => {
    const trap = chunks.find((c) => c.block_type === "trap")!;
    expect(trap.title).toBe("Technicals › Equity value vs enterprise value › The EqV → EV bridge › The trap");
    const concept = chunks.find((c) => c.block_type === "concept")!;
    expect(concept.title).toMatch(/^Technicals › Equity value vs enterprise value › The EqV → EV bridge › /);
  });
  it("merges tiny blocks into the previous chunk", () => {
    const tiny = parseLessonBody({ version: 1, reading_minutes: 5, blocks: [
      { type: "concept", heading: "Big", md: "The bridge from equity value to enterprise value adds debt-like claims and subtracts cash. ".repeat(4) },
      { type: "one_liner", md: "EV = EqV + net debt." },
    ] });
    const out = lessonChunks({ slug: "t", title: "T", body: tiny, topic_title: "X" });
    expect(out).toHaveLength(1);
    expect(out[0].text).toContain("The one-liner to memorise: EV = EqV + net debt.");
    expect(out[0].block_index).toBe(0);
  });
  it("worked_calc steps are rendered with numbers", () => {
    const wc = body.blocks.find((b) => b.type === "worked_calc")!;
    expect(blockText(wc)).toContain("Net debt: 500 - 120 = 380 £m");
  });
  it("MIN_BLOCK_TOKENS is 30", () => expect(MIN_BLOCK_TOKENS).toBe(30));
});

describe("questionChunk", () => {
  it("one chunk with question, answer, key points and follow-ups", () => {
    const q = parseQuestion(question);
    const { body } = splitQuestion(q);
    const c = questionChunk({ slug: q.slug, question: q.question, body, topic_title: "Equity value vs enterprise value" });
    expect(c.kind).toBe("question");
    expect(c.title).toBe("Technicals › Equity value vs enterprise value › Q: What is enterprise value, and how is it different from equity value?");
    expect(c.text.startsWith("Q: What is enterprise value")).toBe(true);
    expect(c.text).toContain("Key points:");
    expect(c.text).toContain("Follow-up: Why do we subtract cash?");
    expect(c.block_index).toBeNull();
  });
  it("contentTitle drops empty parts", () => {
    expect(contentTitle(["A", "", " B "])).toBe("Technicals › A › B");
  });
});

describe("blockText — Technicals v2 blocks (Loop 11)", () => {
  it("prefixes each lens variant with its lens name so citations read 'the TMT lens'", () => {
    const text = blockText({
      type: "lens",
      slot: "after-mechanics",
      variants: {
        tmt: { heading: "Software bills up front", md: "Cash arrives before revenue.", example_q: "Walk me through a £12m annual bill.", answer_md: "Deferred revenue rises." },
        healthcare: { heading: "R&D is expensed", md: "No asset is created." },
      },
    });
    expect(text).toContain("[TMT lens] Software bills up front");
    expect(text).toContain("[HEALTHCARE lens] R&D is expensed");
    expect(text).toContain("Q: Walk me through a £12m annual bill.");
    expect(text).toContain("Deferred revenue rises.");
  });

  it("indexes predict, fill_numbers and order_steps, and skips template", () => {
    expect(blockText({ type: "predict", prompt: "Does cash rise?", options: [{ label: "Yes", correct: true }, { label: "No", correct: false }], explain_md: "It rises by the tax shield." })).toContain("It rises by the tax shield.");
    expect(blockText({ type: "fill_numbers", md: "Fill it in.", steps: [{ label: "Tax saved", expr: "10 * 25%", value: 2.5, unit: "£m", blank: true }] })).toContain("Tax saved: 10 * 25% = 2.5 £m");
    expect(blockText({ type: "order_steps", prompt: "Order them.", steps: ["Project", "Discount", "Add TV"] })).toContain("2. Discount");
    expect(blockText({ type: "template", kind: "dcf_sheet", props: {} })).toBe("");
  });
});
