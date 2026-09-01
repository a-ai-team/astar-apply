// Shared types for Loop 07 mock interviews (docs/loops/07-mock-interviews.md § Data model).
import { z } from "zod";
import type { LensSlug } from "@/lib/content/lesson-schema";

export type InterviewMode = "drill" | "mock";
export type InterviewStatus = "in_progress" | "completed" | "abandoned";

export const DRILL_SIZE = 5;
export const MOCK_SIZE = 15;
export const DRILL_SECONDS = 120;
export const MOCK_SECONDS = 90;
/** Seconds after the per-question limit during which a late answer is still accepted (flagged `late`). */
export const LATE_GRACE_SECONDS = 10;

/** Grader output — CONTRACTS-fixed shape stored on `interview_turns.grade` and `attempts.ai_feedback`. */
export const GradeSchema = z.object({
  hit: z.array(z.string()).describe("Key points the answer covered, quoted or paraphrased from the key-points list"),
  missed: z.array(z.string()).describe("Key points the answer missed or got wrong"),
  accuracy: z.number().int().min(0).max(4).describe("0–4: are the claims and numbers right?"),
  structure: z.number().int().min(0).max(3).describe("0–3: headline first, then reasons, then a wrap"),
  depth: z.number().int().min(0).max(3).describe("0–3: second-order reasoning, caveats, worked numbers"),
  feedback_md: z.string().describe("2–4 sentences to the student, British English, specific to what they said"),
  mentor_tip_md: z.string().describe("One sentence: what an interviewer would push on next"),
});
export type Grade = z.infer<typeof GradeSchema>;

export const FocusAreaSchema = z.object({
  topic: z.string().describe("Topic slug"),
  subtopic: z.string().describe("Subtopic slug, or the topic slug when unknown"),
  reason: z.string().describe("One sentence on why this needs work, citing what the student said"),
  lesson_slug: z.string().describe("Slug of the lesson to reread, from the allowed list"),
  deck: z.string().describe("Flashcard deck (topic slug) to review"),
});
export const ReportSchema = z.object({
  summary_md: z.string().describe("A 4–6 sentence debrief in the mentor's voice"),
  focus_areas: z.array(FocusAreaSchema).min(1).max(3),
});
export type FocusArea = z.infer<typeof FocusAreaSchema>;
export type Report = z.infer<typeof ReportSchema>;

/**
 * What actually sits in `interviews.report` (Loop 18): the built report plus run parameters that
 * exist from creation — currently just the chosen industry lens. Stored inside the existing jsonb,
 * no column. A row that is still in progress may hold only `{ params }`.
 */
export type StoredReport = Partial<Report> & { params?: { lens?: LensSlug } };

export type TranscriptMeta = { wpm: number | null; filler_count: number; fillers: string[]; duration_s: number; late?: boolean; voice?: boolean };

export type InterviewRow = {
  id: string;
  user_id: string;
  mode: InterviewMode;
  topic_id: string | null;
  question_ids: string[];
  seconds_per_question: number;
  status: InterviewStatus;
  started_at: string;
  completed_at: string | null;
  overall_score: number | null;
  report: StoredReport | null;
};

export type TurnRow = {
  id: string;
  interview_id: string;
  ordinal: number;
  question_id: string;                 // effective id: questions.id or firm_questions.id (see getTurns)
  firm_question_id: string | null;     // Loop 08: set when the turn drills a firm question
  attempt_id: string | null;
  shown_at: string | null;
  answered_at: string | null;
  answer_text: string | null;
  transcript_meta: TranscriptMeta | null;
  score: number | null;
  grade: Grade | null;
  graded_at: string | null;
};

/** Content score /10 from the three rubric axes (accuracy 0–4 + structure 0–3 + depth 0–3). */
export function scoreFromGrade(g: Pick<Grade, "accuracy" | "structure" | "depth">): number {
  return Math.max(0, Math.min(10, g.accuracy + g.structure + g.depth));
}
