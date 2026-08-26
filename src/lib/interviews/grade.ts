// Per-turn grader (Loop 07). Live: Opus 5 `beta.messages.parse` with the cached rubric prompt
// (interview-grade.v1) and GradeSchema as the output format, effort medium, refusal fallbacks.
// Fixture (no API credit, Playwright, CI): a deterministic grade computed from key-point keyword
// coverage — crude, but monotone in how much of the model answer the student reproduced, so the
// e2e flow and the grader eval's shape checks are meaningful without spend. Both paths return the
// same Grade shape; `scoreFromGrade` turns it into the /10 stored on the turn and the attempt.
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL_JUDGE, OPUS_BETAS, OPUS_FALLBACKS, getClient } from "@/lib/ai/client";
import { interviewGradePrompt } from "@/lib/ai/prompts/interview-grade.v1";
import { renderQuestionContext } from "@/lib/chat/context";
import { GradeSchema, scoreFromGrade, type Grade, type TranscriptMeta } from "./types";

export const GRADER_PROMPT_VERSION = `${interviewGradePrompt.id}.v${interviewGradePrompt.version}`;
export const FIXTURE_PROMPT_VERSION = "fixture-keyword-coverage.v1";

export type GradeQuestion = {
  id: string;
  slug: string;
  question: string;
  difficulty: number;
  topic_slug: string;
  topic_title: string;
  model_answer_md: string;
  key_points: string[];
  weak_answer_note: string;
  numbers?: { inputs?: Record<string, unknown>; answer?: number | string | null } | null;
};

export type GradeInput = { question: GradeQuestion; answer: string; metrics?: Partial<TranscriptMeta> | null; secondsAllowed?: number };
export type GradeResult = { grade: Grade; score: number; prompt_version: string; usage?: { input: number; output: number; cache_read: number } };

export function graderModel(): string {
  return process.env.INTERVIEW_GRADER_MODEL || MODEL_JUDGE;
}

/** The user turn: the Loop 06 question bundle (question, model answer, key points, weak-answer note) + the answer + metrics. */
export function buildGradeInput(input: GradeInput): string {
  const q = input.question;
  const ctx = renderQuestionContext({ ...q, attempt: null });
  const numbers = q.numbers?.answer != null ? `Numerical answer expected: ${String(q.numbers.answer)}${q.numbers.inputs ? ` (inputs: ${JSON.stringify(q.numbers.inputs)})` : ""}` : "";
  const m = input.metrics;
  const metrics = m
    ? [
        m.duration_s != null ? `seconds used: ${Math.round(m.duration_s)}${input.secondsAllowed ? ` of ${input.secondsAllowed}` : ""}` : "",
        m.wpm != null ? `pace: ${Math.round(m.wpm)} wpm` : "",
        m.filler_count != null ? `fillers: ${m.filler_count}${m.fillers?.length ? ` (${m.fillers.slice(0, 6).join(", ")})` : ""}` : "",
        m.late ? "answer arrived after the timer" : "",
        m.voice ? "speech transcript" : "typed",
      ].filter(Boolean).join("; ")
    : "";
  return [
    `<rubric_material>\n${ctx.text.split("\n").slice(0, -1).join("\n")}${numbers ? `\n${numbers}` : ""}\n</rubric_material>`,
    `<student_answer>\n${input.answer.trim() ? input.answer.trim().slice(0, 6000) : "(no answer given)"}\n</student_answer>`,
    metrics ? `<delivery>${metrics}</delivery>` : "",
  ].filter(Boolean).join("\n\n");
}

/** Validates a (recorded or live) parsed structured output; null when unusable. Keeps every key point in exactly one list. */
export function parseGrade(parsed: unknown, keyPoints: string[]): Grade | null {
  const r = GradeSchema.safeParse(parsed);
  if (!r.success) return null;
  const g = r.data;
  const hit = new Set(g.hit.map((s) => s.trim()).filter(Boolean));
  const missed = g.missed.map((s) => s.trim()).filter((s) => s && !hit.has(s));
  // Any key point the model forgot to place counts as missed (never silently as hit).
  for (const kp of keyPoints) if (![...hit].some((h) => same(h, kp)) && !missed.some((m) => same(m, kp))) missed.push(kp);
  return { ...g, hit: [...hit], missed, feedback_md: g.feedback_md.trim().slice(0, 2000), mentor_tip_md: g.mentor_tip_md.trim().slice(0, 500) };
}

function same(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9£%\s]/g, " ").replace(/\s+/g, " ").trim();
}

export async function gradeLive(input: GradeInput): Promise<GradeResult> {
  const res = await getClient().beta.messages.parse({
    model: graderModel(),
    max_tokens: 2000,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    output_config: { effort: "medium", format: betaZodOutputFormat(GradeSchema) },
    system: [{ type: "text", text: interviewGradePrompt.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildGradeInput(input) }],
  });
  if (res.stop_reason === "refusal") throw new Error(`grader refused (${res.stop_details?.category ?? "unknown"})`);
  const grade = parseGrade(res.parsed_output, input.question.key_points);
  if (!grade) throw new Error(`grader returned no usable grade (stop_reason=${res.stop_reason})`);
  return {
    grade,
    score: scoreFromGrade(grade),
    prompt_version: GRADER_PROMPT_VERSION,
    usage: { input: res.usage.input_tokens, output: res.usage.output_tokens, cache_read: res.usage.cache_read_input_tokens ?? 0 },
  };
}

// --- Fixture branch -------------------------------------------------------------------------------

const STOP = new Set("the a an and or of to in on for with by from as at is are was were be been it its this that these those which what when why how does do did not no into than then there their they them we you your our can will would should could also more less very over under about between each per".split(" "));

export function contentWords(s: string): string[] {
  return norm(s).split(" ").filter((w) => w.length >= 3 && !STOP.has(w)).map(stem);
}
function stem(w: string): string {
  return w.length > 5 ? w.slice(0, 5) : w.replace(/s$/, "");
}

/** True when ≥ 50 % of a key point's content words (min 1) appear in the answer. */
export function keyPointHit(keyPoint: string, answerWords: Set<string>): boolean {
  const kw = contentWords(keyPoint);
  if (!kw.length) return false;
  const found = kw.filter((w) => answerWords.has(w)).length;
  return found / kw.length >= 0.5;
}

function numbersIn(s: string): number[] {
  return (s.match(/-?\d[\d,]*(?:\.\d+)?/g) ?? []).map((x) => Number(x.replace(/,/g, ""))).filter((n) => Number.isFinite(n));
}

/** Deterministic grade from key-point coverage, sentence count and (for numerical questions) the expected number. */
export function gradeFixture(input: GradeInput): GradeResult {
  const q = input.question;
  const answer = input.answer.trim();
  const words = answer ? answer.split(/\s+/).filter(Boolean) : [];
  const set = new Set(contentWords(answer));
  const hit = q.key_points.filter((k) => keyPointHit(k, set));
  const missed = q.key_points.filter((k) => !hit.includes(k));
  const ratio = q.key_points.length ? hit.length / q.key_points.length : 0;
  const sentences = answer ? answer.split(/[.!?]+\s|\n+/).filter((s) => s.trim().length > 12).length : 0;
  const offTopic = words.length < 3 || (hit.length === 0 && words.length < 60);

  let accuracy = offTopic ? 0 : Math.round(ratio * 4);
  const expected = q.numbers?.answer != null ? Number(q.numbers.answer) : null;
  let wrongNumber = false;
  if (expected != null && Number.isFinite(expected) && !offTopic) {
    const given = numbersIn(answer);
    if (given.length && !given.some((n) => Math.abs(n - expected) <= Math.abs(expected) * 0.005 + 1e-9)) {
      wrongNumber = true;
      accuracy = Math.min(accuracy, 1);
    }
  }
  let structure = offTopic ? (words.length >= 3 ? 1 : 0) : sentences >= 3 && words.length >= 40 ? 3 : words.length >= 20 ? 2 : 1;
  let depth = offTopic ? 0 : ratio >= 0.999 && words.length >= 80 ? 3 : ratio >= 0.5 ? 2 : hit.length ? 1 : 0;
  // Rubric calibration: a confidently wrong answer (accuracy ≤ 1) cannot be rescued above 3 by structure or depth.
  if (accuracy <= 1) {
    structure = Math.min(structure, 1);
    depth = Math.min(depth, 1);
  }

  const feedback = offTopic
    ? words.length === 0
      ? "You did not give an answer. In an interview, always say something: restate the question, give the headline you are most sure of, then build out from there."
      : "This did not address the question that was asked. Start with the direct answer in one sentence, then give the reasons — an interviewer will not credit an answer to a different question."
    : [
        hit.length ? `You covered ${hit.length} of ${q.key_points.length} key points (${hit.slice(0, 2).map((h) => `“${h}”`).join(", ")}).` : "You did not land any of the key points the interviewer was listening for.",
        wrongNumber ? `The number you gave does not match the expected answer (${expected}) — a wrong number costs more than a missing explanation.` : missed.length ? `Next time make sure you mention: ${missed.slice(0, 3).join("; ")}.` : "Nothing important was missing.",
        sentences < 3 ? "Structure it as headline → reasons → wrap so the interviewer hears the answer in your first sentence." : "Good structure: the headline came first and the reasons followed.",
      ].join(" ");
  const tip = missed.length ? `An interviewer would push on: ${missed[0]}` : `An interviewer would now ask a follow-up to test the second-order effect of ${q.topic_title.toLowerCase()}.`;
  const grade: Grade = { hit, missed, accuracy, structure, depth, feedback_md: feedback, mentor_tip_md: tip };
  return { grade, score: scoreFromGrade(grade), prompt_version: FIXTURE_PROMPT_VERSION };
}

export async function gradeTurn(input: GradeInput, mode: "live" | "fixture"): Promise<GradeResult> {
  if (mode !== "live") return gradeFixture(input);
  try {
    return await gradeLive(input);
  } catch (e) {
    console.warn("interviews: live grading failed, using fixture grade:", e instanceof Error ? e.message : e);
    return gradeFixture(input);
  }
}
