import "server-only";

// The complete technicals guide (Loop 21): every technical chapter on one page — each lesson's
// one-line takeaway, the chapter cheat sheet, and the rapid-fire questions with short answers.
// Built from approved content only, so it never runs ahead of what students can open. Rendered by
// /home/technicals/guide and printed to a PDF by `npm run packs:build -- --guide`.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LessonBody } from "./lesson-schema";
import { flashcardBack, type QuestionBody } from "./question-schema";
import { getCheatSheet } from "./cheatsheets";
import type { CheatSheet } from "./cheatsheet-schema";
import { CURRICULUM, type CurriculumTopic } from "./taxonomy";

/** Rapid-fire = definitional and "why" questions (difficulty 1–2): the ones you must answer in 30 seconds. */
export const GUIDE_RAPID_FIRE_MAX_DIFFICULTY = 2;

export type GuideLesson = { slug: string; title: string; subtopic_title: string; one_liner: string | null };
export type GuideQuestion = { slug: string; question: string; answer: string };
export type GuideChapter = { topic: CurriculumTopic; lessons: GuideLesson[]; sheet: CheatSheet | null; rapid: GuideQuestion[] };

type LessonRow = { slug: string; title: string; body: LessonBody; subtopic: { slug: string } | null };
type QuestionRow = { slug: string; question: string; difficulty: number; tags: string[]; body: QuestionBody; topic: { slug: string } | null; subtopic: { slug: string } | null };

/** Technical chapters in curriculum order, plus brain teasers (the one fit subtopic that is technical). */
export const GUIDE_TOPICS = CURRICULUM.filter((t) => t.kind === "core" || t.kind === "foundation");
export const GUIDE_EXTRA_SUBTOPICS = ["brain-teasers"];

export async function getGuide(db: SupabaseClient): Promise<{ chapters: GuideChapter[]; extras: GuideLesson[] }> {
  // Explicit `approved` filter: the shared team session is staff, and staff RLS can read drafts.
  const [{ data: lessonRows, error }, { data: questionRows, error: qErr }] = await Promise.all([
    db.from("lessons").select("slug, title, body, subtopic:subtopics(slug)").eq("status", "approved"),
    db.from("questions").select("slug, question, difficulty, tags, body, topic:topics(slug), subtopic:subtopics(slug)").eq("status", "approved").lte("difficulty", GUIDE_RAPID_FIRE_MAX_DIFFICULTY).order("difficulty").order("slug"),
  ]);
  if (error) throw error;
  if (qErr) throw qErr;
  const lessons = lessonRows as unknown as LessonRow[];
  // Generalist bank only, and spoken questions only (fill / order / spot formats need the page).
  const questions = (questionRows as unknown as QuestionRow[]).filter((q) => !q.tags.some((t) => t.startsWith("lens:") || (t.startsWith("format:") && t !== "format:verbal")));

  const toLesson = (subtopic: { slug: string; title: string }) =>
    lessons
      .filter((l) => l.subtopic?.slug === subtopic.slug)
      .map((l): GuideLesson => ({ slug: l.slug, title: l.title, subtopic_title: subtopic.title, one_liner: oneLiner(l.body) }));

  const chapters = GUIDE_TOPICS.map((topic): GuideChapter => {
    const order = new Map(topic.subtopics.map((s, i) => [s.slug, i]));
    return {
      topic,
      lessons: topic.subtopics.flatMap(toLesson),
      sheet: getCheatSheet(topic.slug),
      rapid: questions
        .filter((q) => q.topic?.slug === topic.slug)
        .sort((a, b) => (order.get(a.subtopic?.slug ?? "") ?? 99) - (order.get(b.subtopic?.slug ?? "") ?? 99))
        .map((q) => ({ slug: q.slug, question: q.question, answer: flashcardBack(q.body) })),
    };
  }).filter((c) => c.lessons.length > 0);

  const extras = CURRICULUM.flatMap((t) => t.subtopics.filter((s) => GUIDE_EXTRA_SUBTOPICS.includes(s.slug))).flatMap(toLesson);
  return { chapters, extras };
}

function oneLiner(body: LessonBody): string | null {
  const b = body.blocks.find((x) => x.type === "one_liner");
  return b && "md" in b ? b.md : null;
}
