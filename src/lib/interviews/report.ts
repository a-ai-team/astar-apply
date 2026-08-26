// End-of-interview report (Loop 07): summary + up to three focus areas, each pointing at an approved
// lesson and a flashcard deck. Live: Opus 5 structured output (interview-report.v1); fixture: the
// lowest-scoring subtopics. Either way `validateReport` checks every slug against the approved
// lesson index and replaces anything invalid with the lowest-scoring subtopic's lesson — the model
// can suggest, it cannot invent a link.
import type { SupabaseClient } from "@supabase/supabase-js";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL_JUDGE, OPUS_BETAS, OPUS_FALLBACKS, getClient } from "@/lib/ai/client";
import { interviewReportPrompt } from "@/lib/ai/prompts/interview-report.v1";
import { ReportSchema, type FocusArea, type Grade, type Report } from "./types";

export const REPORT_PROMPT_VERSION = `${interviewReportPrompt.id}.v${interviewReportPrompt.version}`;
export const FIXTURE_REPORT_VERSION = "fixture-lowest-subtopics.v1";
export const MAX_FOCUS_AREAS = 3;

export type LessonRef = { slug: string; title: string; topic_slug: string; subtopic_slug: string };
export type ReportTurn = {
  ordinal: number;
  question: string;
  topic_slug: string;
  topic_title: string;
  subtopic_slug: string | null;
  difficulty: number;
  score: number | null;
  grade: Grade | null;
  answer_text: string | null;
};
export type ReportInput = { mode: "drill" | "mock"; turns: ReportTurn[]; lessons: LessonRef[] };
export type ReportResult = { report: Report; prompt_version: string };

export async function loadLessonIndex(db: SupabaseClient): Promise<LessonRef[]> {
  const { data, error } = await db.from("lessons").select("slug, title, status, subtopic:subtopics!inner(slug, topic:topics!inner(slug))").eq("status", "approved");
  if (error) throw error;
  return (data ?? []).map((l) => {
    const sub = l.subtopic as unknown as { slug: string; topic: { slug: string } };
    return { slug: l.slug as string, title: l.title as string, topic_slug: sub.topic.slug, subtopic_slug: sub.slug };
  });
}

/** Subtopic (falling back to topic) buckets ordered by mean score ascending, then by number of missed points. */
export function weakestBuckets(turns: ReportTurn[]): { topic_slug: string; subtopic_slug: string; mean: number; missed: string[]; n: number }[] {
  const m = new Map<string, { topic_slug: string; subtopic_slug: string; scores: number[]; missed: string[] }>();
  for (const t of turns) {
    const sub = t.subtopic_slug ?? t.topic_slug;
    const key = `${t.topic_slug}/${sub}`;
    const b = m.get(key) ?? { topic_slug: t.topic_slug, subtopic_slug: sub, scores: [], missed: [] };
    b.scores.push(t.score ?? 0);
    b.missed.push(...(t.grade?.missed ?? []));
    m.set(key, b);
  }
  return [...m.values()]
    .map((b) => ({ topic_slug: b.topic_slug, subtopic_slug: b.subtopic_slug, mean: b.scores.reduce((s, x) => s + x, 0) / b.scores.length, missed: b.missed, n: b.scores.length }))
    .sort((a, b) => a.mean - b.mean || b.missed.length - a.missed.length || a.subtopic_slug.localeCompare(b.subtopic_slug));
}

/** Best lesson for a (topic, subtopic): same subtopic first, then same topic, then null. */
export function lessonFor(lessons: LessonRef[], topic: string, subtopic: string | null): LessonRef | null {
  return lessons.find((l) => l.topic_slug === topic && l.subtopic_slug === subtopic) ?? lessons.find((l) => l.topic_slug === topic) ?? null;
}

/** Deterministic report: lowest-scoring subtopics with their lessons; used offline and as the fallback for invalid model output. */
export function reportFixture(input: ReportInput): ReportResult {
  const buckets = weakestBuckets(input.turns);
  const scored = input.turns.filter((t) => t.score != null);
  const mean = scored.length ? scored.reduce((s, t) => s + (t.score ?? 0), 0) / scored.length : 0;
  const best = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const worst = [...scored].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
  const focus_areas: FocusArea[] = [];
  for (const b of buckets) {
    if (focus_areas.length >= MAX_FOCUS_AREAS) break;
    const lesson = lessonFor(input.lessons, b.topic_slug, b.subtopic_slug);
    if (!lesson) continue;
    const missed = [...new Set(b.missed)];
    focus_areas.push({
      topic: b.topic_slug,
      subtopic: b.subtopic_slug,
      reason: missed.length ? `Averaged ${b.mean.toFixed(1)}/10 here and missed: ${missed.slice(0, 2).join("; ")}.` : `Averaged ${b.mean.toFixed(1)}/10 across ${b.n} question${b.n === 1 ? "" : "s"} — solid, so this is polish rather than repair.`,
      lesson_slug: lesson.slug,
      deck: b.topic_slug,
    });
  }
  if (!focus_areas.length && input.lessons.length) {
    const l = input.lessons[0];
    focus_areas.push({ topic: l.topic_slug, subtopic: l.subtopic_slug, reason: scored.length ? "These questions are not mapped to a lesson yet (firm questions) — keep the fundamentals sharp." : "No graded answers to analyse yet — start with the fundamentals.", lesson_slug: l.slug, deck: l.topic_slug });
  }
  const summary = [
    `You averaged ${mean.toFixed(1)}/10 across ${scored.length} graded question${scored.length === 1 ? "" : "s"} in this ${input.mode}.`,
    best && worst && best !== worst ? `Your strongest answer was on "${short(best.question)}" (${best.score}/10) and your weakest on "${short(worst.question)}" (${worst.score}/10).` : "",
    focus_areas.length ? `The pattern behind the lower scores was missing key points rather than wrong claims, so the fix is coverage: reread the lessons below and say every key point out loud before you reveal the model answer.` : "",
    `Next session, give the headline in your first sentence, then the reasons, then one implication — and always say the number with its units.`,
  ].filter(Boolean).join(" ");
  return { report: { summary_md: summary, focus_areas: focus_areas.length ? focus_areas : [] }, prompt_version: FIXTURE_REPORT_VERSION };
}

function short(s: string): string {
  return s.length > 60 ? s.slice(0, 57).trimEnd() + "…" : s;
}

/**
 * Validates a (recorded or live) parsed report: every focus area must name an approved lesson in
 * the same topic; invalid entries are replaced, in order, by the lowest-scoring subtopics that are
 * not already covered. Returns null only when the object is not a report at all.
 */
export function validateReport(parsed: unknown, input: ReportInput): Report | null {
  const r = ReportSchema.safeParse(parsed);
  if (!r.success) return null;
  const lessons = input.lessons;
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  const topics = new Set(lessons.map((l) => l.topic_slug));
  const out: FocusArea[] = [];
  let replaced = 0;
  for (const fa of r.data.focus_areas.slice(0, MAX_FOCUS_AREAS)) {
    const lesson = bySlug.get(fa.lesson_slug);
    const ok = lesson && lesson.topic_slug === fa.topic && topics.has(fa.topic);
    if (ok) {
      out.push({ ...fa, subtopic: fa.subtopic || lesson.subtopic_slug, deck: topics.has(fa.deck) ? fa.deck : fa.topic, reason: fa.reason.trim().slice(0, 400) });
    } else replaced++;
  }
  if (replaced || !out.length) {
    const fallback = reportFixture(input).report.focus_areas.filter((f) => !out.some((o) => o.topic === f.topic && o.subtopic === f.subtopic));
    while (out.length < Math.min(MAX_FOCUS_AREAS, out.length + replaced) && fallback.length) out.push(fallback.shift()!);
    if (!out.length && fallback.length) out.push(fallback.shift()!);
  }
  return { summary_md: r.data.summary_md.trim().slice(0, 3000), focus_areas: out };
}

export function buildReportInput(input: ReportInput): string {
  const turns = input.turns
    .map((t) => {
      const g = t.grade;
      return `<turn n="${t.ordinal + 1}" topic="${t.topic_slug}" subtopic="${t.subtopic_slug ?? t.topic_slug}" difficulty="${t.difficulty}" score="${t.score ?? "ungraded"}">
Q: ${t.question}
Hit: ${g?.hit.join("; ") || "—"}
Missed: ${g?.missed.join("; ") || "—"}
Feedback: ${g?.feedback_md ?? "—"}
Answer excerpt: ${(t.answer_text ?? "").slice(0, 400) || "(none)"}
</turn>`;
    })
    .join("\n");
  const lessons = input.lessons.map((l) => `- ${l.slug} (topic ${l.topic_slug}, subtopic ${l.subtopic_slug}): ${l.title}`).join("\n");
  return `<interview mode="${input.mode}">\n${turns}\n</interview>\n\n<allowed_lessons>\n${lessons || "(none)"}\n</allowed_lessons>\n\n<decks>\n${[...new Set(input.lessons.map((l) => l.topic_slug))].join(", ") || "(none)"}\n</decks>`;
}

export async function reportLive(input: ReportInput): Promise<ReportResult> {
  const res = await getClient().beta.messages.parse({
    model: process.env.INTERVIEW_GRADER_MODEL || MODEL_JUDGE,
    max_tokens: 2000,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    output_config: { effort: "medium", format: betaZodOutputFormat(ReportSchema) },
    system: [{ type: "text", text: interviewReportPrompt.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildReportInput(input) }],
  });
  if (res.stop_reason === "refusal") throw new Error(`report refused (${res.stop_details?.category ?? "unknown"})`);
  const report = validateReport(res.parsed_output, input);
  if (!report) throw new Error(`report returned no usable object (stop_reason=${res.stop_reason})`);
  return { report, prompt_version: REPORT_PROMPT_VERSION };
}

export async function buildReport(input: ReportInput, mode: "live" | "fixture"): Promise<ReportResult> {
  if (mode !== "live") return reportFixture(input);
  try {
    return await reportLive(input);
  } catch (e) {
    console.warn("interviews: live report failed, using fixture report:", e instanceof Error ? e.message : e);
    return reportFixture(input);
  }
}
