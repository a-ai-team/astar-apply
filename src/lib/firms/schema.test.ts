import { describe, expect, it } from "vitest";
import { FirmSchema, FirmQuestionSchema, gradeMaterialFromGuidance, validateFirm } from "./schema";

describe("firm dossier schema", () => {
  it("accepts a minimal dossier and defaults the arrays", () => {
    const r = FirmSchema.parse({ slug: "acme-bank", name: "Acme Bank", type: "uk_mid" });
    expect(r.process).toEqual([]);
    expect(r.founded).toBeNull();
  });
  it("keeps the process timeline ordered and validates each stage", () => {
    const r = validateFirm({ slug: "acme", name: "Acme", type: "other", process: [{ stage: "Apply", when: "Sep" }, { stage: "Video interview" }, { stage: "Assessment centre", notes: "Group exercise" }] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.process.map((p) => p.stage)).toEqual(["Apply", "Video interview", "Assessment centre"]);
      expect(r.value.process[1].when).toBe("");
    }
  });
  it("rejects bad slugs, fake-looking sources and out-of-range years", () => {
    expect(validateFirm({ slug: "Acme Bank", name: "x", type: "other" }).ok).toBe(false);
    expect(validateFirm({ slug: "acme", name: "x", type: "other", sources: [{ title: "t", url: "not a url" }] }).ok).toBe(false);
    expect(FirmQuestionSchema.safeParse({ category: "motivation", question: "Why us and not them?", stage: "hirevue", programme: "spring", recency_year: 1999 }).success).toBe(false);
  });
});

describe("gradeMaterialFromGuidance", () => {
  it("turns guidance bullets into key points (max 6) and keeps the guidance as the model answer", () => {
    const g = "- Name a business\n- Mention a person you spoke to\n- Link to how you work\n- Never say prestige\n- Five\n- Six\n- Seven";
    const m = gradeMaterialFromGuidance("Why us?", g);
    expect(m.key_points).toHaveLength(6);
    expect(m.key_points[0]).toBe("Name a business");
    expect(m.model_answer_md).toBe(g);
    expect(m.weak_answer_note.length).toBeGreaterThan(20);
  });
  it("falls back to sentences, then to generic points, when there are no bullets", () => {
    expect(gradeMaterialFromGuidance("Q", "Be specific. Give an example. Link it back.").key_points).toEqual(["Be specific", "Give an example", "Link it back."]);
    expect(gradeMaterialFromGuidance("Q", "").key_points).toHaveLength(3);
  });
});
