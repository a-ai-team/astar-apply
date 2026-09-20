import "server-only";

// Week packs (Loop 20): everything one week of the 10-week path needs on paper — its lessons, the
// chapter cheat sheet when the week closes one, and a practice set with answers. Rendered by
// /home/path/[week]/pack and turned into PDFs by `npm run packs:build`.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LessonBody } from "./lesson-schema";
import type { QuestionBody } from "./question-schema";
import { getCheatSheet } from "./cheatsheets";
import type { CheatSheet } from "./cheatsheet-schema";
import { pickRoundRobin } from "./pack-files";
import { CURRICULUM, DEFAULT_PATH, type PathDay, type PathWeek } from "./taxonomy";

/** Week 10's cross-chapter mock. Technical weeks have no cap: they print every core question. */
export const PACK_MOCK_SIZE = 15;
/**
 * What a technical week prints: the `depth:sa-core` questions — the ones asked of everyone
 * (docs/research/technicals-v2/00-syllabus.md § 2). Stretch questions stay on the site, `order` and
 * `spot` formats repeat a block the lesson already prints, and `pack:skip` marks a question that
 * restates another in the same week.
 */
const PACK_EXCLUDED_TAGS = ["format:order", "format:spot", "pack:skip"];

export type PackLesson = { id: string; slug: string; title: string; reading_minutes: number; body: LessonBody; subtopic_slug: string | null };
export type PackQuestion = { slug: string; difficulty: number; question: string; body: QuestionBody; topic_title: string };
export type PackDay = PathDay & { lesson: PackLesson | null };
export type WeekPack = {
  plan: PathWeek;
  days: PackDay[];
  cheatsheet: { topic_title: string; sheet: CheatSheet } | null;
  practice: { kind: "week" | "mock"; questions: PackQuestion[] };
};

type LessonJoin = { id: string; slug: string; title: string; reading_minutes: number; body: LessonBody; status: string; subtopic: { slug: string } | null };
type QuestionJoin = { slug: string; difficulty: number; question: string; body: QuestionBody; tags: string[]; status: string; topic: { slug: string; title: string } | null; subtopic: { slug: string } | null };

/**
 * One week's pack, or null for a week the path does not have. Filters on `approved` explicitly:
 * the shared team session is staff, and staff RLS can also read drafts.
 */
export async function getWeekPack(db: SupabaseClient, week: number): Promise<WeekPack | null> {
  const plan = DEFAULT_PATH.weeks.find((w) => w.week === week);
  if (!plan) return null;

  const lessonSlugs = plan.days.flatMap((d) => (d.lesson_slug ? [d.lesson_slug] : []));
  const { data: lessonRows, error } = await db
    .from("lessons")
    .select("id, slug, title, reading_minutes, body, status, subtopic:subtopics(slug)")
    .in("slug", lessonSlugs)
    .eq("status", "approved");
  if (error) throw error;
  const lessons = new Map((lessonRows as unknown as LessonJoin[]).map((l) => [l.slug, l]));
  const days: PackDay[] = plan.days.map((d) => {
    const l = d.lesson_slug ? lessons.get(d.lesson_slug) : undefined;
    return { ...d, lesson: l ? { id: l.id, slug: l.slug, title: l.title, reading_minutes: l.reading_minutes, body: l.body, subtopic_slug: l.subtopic?.slug ?? null } : null };
  });

  const sheetTopic = plan.days.find((d) => d.cheatsheet)?.cheatsheet;
  const sheet = sheetTopic ? getCheatSheet(sheetTopic) : null;
  const cheatsheet = sheetTopic && sheet ? { topic_title: CURRICULUM.find((t) => t.slug === sheetTopic)?.title ?? sheetTopic, sheet } : null;

  // Generalist bank only: lens questions are hidden from it (CONTRACTS.md § Technicals v2).
  const { data: questionRows, error: qErr } = await db
    .from("questions")
    .select("slug, difficulty, question, body, tags, status, topic:topics(slug, title), subtopic:subtopics(slug)")
    .eq("status", "approved")
    .order("difficulty")
    .order("slug");
  if (qErr) throw qErr;
  const bank = (questionRows as unknown as QuestionJoin[]).filter((q) => !q.tags.some((t) => t.startsWith("lens:")));
  const toPack = (q: QuestionJoin): PackQuestion => ({ slug: q.slug, difficulty: q.difficulty, question: q.question, body: q.body, topic_title: q.topic?.title ?? "" });

  const subtopics = days.flatMap((d) => (d.lesson?.subtopic_slug ? [d.lesson.subtopic_slug] : []));
  // In lesson order, easiest first inside each lesson (the bank query is already sorted that way).
  const core = bank.filter((q) => q.tags.includes("depth:sa-core") && !q.tags.some((t) => PACK_EXCLUDED_TAGS.includes(t)));
  const weekSet = subtopics.flatMap((s) => core.filter((q) => q.subtopic?.slug === s));
  if (weekSet.length > 0) return { plan, days, cheatsheet, practice: { kind: "week", questions: weekSet.map(toPack) } };

  // No lesson questions this week (week 10): a spoken mock dealt across every technical chapter.
  // Inside a chapter the deal rotates second-order → numerical → why → definition, so the fifteen
  // are a spread rather than a wall of one kind; fill/order/spot formats are not spoken questions.
  const spoken = bank.filter((q) => !q.tags.some((t) => t.startsWith("format:") && t !== "format:verbal"));
  const byTopic = CURRICULUM.filter((t) => t.kind !== "fit").map((t) => {
    const inTopic = spoken.filter((q) => q.topic?.slug === t.slug);
    return pickRoundRobin([3, 4, 2, 1].map((d) => inTopic.filter((q) => q.difficulty === d)), inTopic.length);
  });
  return { plan, days, cheatsheet, practice: { kind: "mock", questions: pickRoundRobin(byTopic, PACK_MOCK_SIZE).map(toPack) } };
}
