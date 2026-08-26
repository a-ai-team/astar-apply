import { describe, expect, it } from "vitest";
import { filterQuestions } from "./firm-question-list";
import type { FirmQuestionRow } from "@/lib/firms/queries";

const q = (over: Partial<FirmQuestionRow>): FirmQuestionRow => ({ id: "x", firm_id: "f", category: "motivation", division: null, question: "Why?", stage: "hirevue", programme: "spring", frequency: "common", recency_year: null, guidance_md: "", sources: [], status: "approved", reported_by: null, generated_by: null, created_at: "", ...over });
const rows = [q({ id: "1", stage: "hirevue" }), q({ id: "2", stage: "ac", programme: "graduate", division: "Markets" }), q({ id: "3", stage: "interview", category: "technical", division: "Investment Banking" })];

describe("filterQuestions", () => {
  it("returns everything with all filters open", () => {
    expect(filterQuestions(rows, { stage: "all", programme: "all", category: "all", division: "all" })).toHaveLength(3);
  });
  it("filters by stage, programme, category and division (null division = 'Any division')", () => {
    expect(filterQuestions(rows, { stage: "hirevue", programme: "all", category: "all", division: "all" }).map((r) => r.id)).toEqual(["1"]);
    expect(filterQuestions(rows, { stage: "all", programme: "graduate", category: "all", division: "all" }).map((r) => r.id)).toEqual(["2"]);
    expect(filterQuestions(rows, { stage: "all", programme: "all", category: "technical", division: "Investment Banking" }).map((r) => r.id)).toEqual(["3"]);
    expect(filterQuestions(rows, { stage: "all", programme: "all", category: "all", division: "Any division" }).map((r) => r.id)).toEqual(["1"]);
  });
});
