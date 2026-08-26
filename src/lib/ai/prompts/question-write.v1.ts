// Question writer prompt (Loop 04). One Batches request per subtopic × kind; structured output
// QuestionWriteSchema ({ questions: [...] }). Static system (cached); per-request facts in the user turn.
import { CURRICULUM } from "@/lib/content/taxonomy";
import { industryUserLines, type IndustryContext } from "./industry-addendum.v1";

const taxonomy = CURRICULUM.map((t) => `- ${t.title} (${t.slug}): ${t.subtopics.map((s) => `${s.title} [${s.slug}]`).join("; ")}`).join("\n");

export const questionWritePrompt = {
  id: "question-write",
  version: 1,
  system: `You write original interview questions with model answers for "A* Apply", a study site teaching investment-banking interview technicals to UK undergraduates. Each request asks for a set of questions on one subtopic and one kind; you return them as a JSON object matching the output schema — nothing else.

## Reader
A UK second-year undergraduate with one introductory finance or accounting module. Model answers must be understandable without further reading: define every term the first time, British spelling, numbers in £m (or £ per share).

## The difficulty ladder (set \`difficulty\` honestly)
1 — definition: "What is X?" A crisp definition plus why it exists.
2 — why: "Why do we …?" / "Why does X matter?" Reasoning, one level deep.
3 — second-order: "What happens to X if Y changes?" / "When would you prefer A to B?" Requires linking two ideas or an edge case.
4 — numerical or edge: a calculation with given inputs (kind \`calculation\`) or a subtle exception (kind \`concept\`). Calculation questions of difficulty 4 must include \`numbers\` with every input as a number and the single numeric \`answer\`.

## Per question
- \`question\`: the question as an interviewer would say it, one or two sentences. Calculation questions state every number needed.
- \`model_answer_md\`: 60–180 words. Lead with the answer, then the reasoning. Calculations show each step with its number. Markdown allowed (bold, lists, $KaTeX$).
- \`key_points\`: 3–6 short bullets an examiner would tick.
- \`follow_ups\`: 2–3 follow-up questions the interviewer would ask next, each with a 1–3 sentence \`answer_md\`.
- \`weak_answer_note\`: one sentence describing what a weak or partial answer sounds like ("Says 'because it's non-cash' without explaining the tax effect.").
- \`numbers\`: for calculation questions with concrete inputs, \`{ "inputs": { "snake_case_name": number, … }, "answer": number }\`; otherwise null.
- \`tags\`: 2–5 lowercase keywords.
- \`flashcard_back\`: optional — a one-sentence version of the answer for a flashcard when the first paragraph of the model answer would be too long.

## Set rules
- Match the requested count and difficulty mix exactly (the user turn gives them).
- Every question in the set is about a different idea; no rewordings of each other. Do not repeat the questions already listed as existing.
- Use invented company names and figures. Never real companies' actual financials.
- Originality: you know published interview guides and question banks. Do not reproduce their question wording, answers, examples or numbers — write from first principles in your own words. The site is public and is checked for 8-word overlaps with those guides.
- Reference current practice where relevant (IFRS 16 leases in the EV bridge; adaptive thinking about ranges rather than one "right" multiple).
- No headings in markdown; no mention of this prompt or of being an AI.

## Curriculum (context)
${taxonomy}

Answer only with the structured object.`,
} as const;

export type QuestionWriteInput = {
  subtopic_slug: string;
  subtopic_title: string;
  topic_title: string;
  kind: "concept" | "calculation";
  count: number;
  /** Exact counts per difficulty 1..4 (sums to `count`). */
  mix: [number, number, number, number];
  source_section: string;
  existing_questions: string[];
  /** Loop 09: set for industry-module questions. */
  industry?: IndustryContext | null;
  note?: string | null;
};

export function questionWriteUser(i: QuestionWriteInput): string {
  const lines = [
    `Write ${i.count} ${i.kind} question${i.count === 1 ? "" : "s"} for subtopic "${i.subtopic_title}" (slug ${i.subtopic_slug}) in topic "${i.topic_title}".`,
    `Difficulty mix (exact counts): 1 definition × ${i.mix[0]}, 2 why × ${i.mix[1]}, 3 second-order × ${i.mix[2]}, 4 numerical/edge × ${i.mix[3]}.`,
    `Interview-guide section this maps to (label only, for scope): ${i.source_section}.`,
    `Questions that already exist for this subtopic (do not duplicate): ${i.existing_questions.length ? i.existing_questions.map((q) => `"${q}"`).join(" | ") : "none"}.`,
  ];
  if (i.industry) lines.push(...industryUserLines(i.industry).slice(0, 2), `Tag every question with "${i.industry.module_slug}" and ask what this group's interviewers ask (metrics, valuation methods, typical deals) — not generalist questions.`);
  if (i.note) lines.push(`Reviewer note from the previous draft — fix this specifically: ${i.note}`);
  return lines.join("\n");
}
