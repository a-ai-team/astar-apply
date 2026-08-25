import { describe, expect, it } from "vitest";
import { assertQuestionApprovable, flashcardBack, splitQuestion, validateQuestion, type QuestionInput } from "./question-schema";

const q: QuestionInput = {
  slug: "why-add-net-debt",
  topic_slug: "eqv-ev",
  subtopic_slug: "ev-bridge-calculations",
  kind: "concept",
  difficulty: 2,
  question: "Why do we add net debt when moving from equity value to enterprise value?",
  model_answer_md: "Because enterprise value prices the whole business, not just the slice owned by shareholders.\n\nDebt holders have a claim too.",
  key_points: ["EV = all capital providers", "debt is a claim", "cash offsets debt"],
  follow_ups: [
    { question: "And why subtract cash?", answer_md: "Cash could repay debt on day one." },
    { question: "What about leases?", answer_md: "Under IFRS 16 they are debt-like." },
  ],
  weak_answer_note: "Says 'because that's the formula' with no reason.",
  numbers: null,
  source_topic: "EqV & EV – concepts",
  tags: ["ev", "bridge"],
};

describe("question-schema", () => {
  it("accepts a valid question and defaults status to generated", () => {
    const r = validateQuestion(q);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe("generated");
  });

  it("rejects bad difficulty, too few key points, and a non-kebab slug", () => {
    expect(validateQuestion({ ...q, difficulty: 5 }).ok).toBe(false);
    expect(validateQuestion({ ...q, key_points: ["one"] }).ok).toBe(false);
    expect(validateQuestion({ ...q, slug: "Not Kebab" }).ok).toBe(false);
    expect(validateQuestion({ ...q, follow_ups: [] }).ok).toBe(false);
  });

  it("splits row columns from body", () => {
    const r = validateQuestion(q);
    if (!r.ok) throw new Error("invalid");
    const { row, body } = splitQuestion(r.value);
    expect(Object.keys(row).sort()).toEqual(["difficulty", "kind", "question", "slug", "source_topic", "status", "subtopic_slug", "tags", "topic_slug"]);
    expect(body.key_points.length).toBe(3);
    expect("slug" in body).toBe(false);
  });

  it("flashcard back is the first paragraph unless overridden", () => {
    expect(flashcardBack({ model_answer_md: q.model_answer_md })).toMatch(/^Because enterprise value/);
    expect(flashcardBack({ model_answer_md: q.model_answer_md, flashcard_back: "short" })).toBe("short");
  });

  it("difficulty-4 calculation needs numbers to be approvable", () => {
    expect(() => assertQuestionApprovable({ ...q, kind: "calculation", difficulty: 4 })).toThrow(/numbers/);
    expect(() => assertQuestionApprovable({ ...q, kind: "calculation", difficulty: 4, numbers: { inputs: { debt: 500, cash: 120 }, answer: 380 } })).not.toThrow();
  });
});
