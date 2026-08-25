import "server-only";

// Read queries for the curriculum. Student pages use the cookie client (RLS: approved rows only);
// pass `createAdminClient()` from admin pages to see drafts. All shapes are plain rows.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LessonBody } from "./lesson-schema";

export type TopicRow = { id: string; slug: string; title: string; kind: string; ordinal: number; level: string; is_free: boolean; summary: string; source_section: string | null; status: string };
export type SubtopicRow = { id: string; topic_id: string; slug: string; title: string; ordinal: number; kind: string; source_section: string | null; target_questions: number; status: string };
export type LessonRow = { id: string; subtopic_id: string; slug: string; title: string; ordinal: number; body: LessonBody; body_version: number; reading_minutes: number; status: string; generated_by: string | null; prompt_version: string | null; updated_at: string };
export type LessonSummary = Pick<LessonRow, "id" | "subtopic_id" | "slug" | "title" | "ordinal" | "reading_minutes" | "status">;

export async function listTopics(db: SupabaseClient): Promise<TopicRow[]> {
  const { data, error } = await db.from("topics").select("*").order("ordinal");
  if (error) throw error;
  return (data ?? []) as TopicRow[];
}

export async function listSubtopics(db: SupabaseClient, topicId?: string): Promise<SubtopicRow[]> {
  let q = db.from("subtopics").select("*").order("ordinal");
  if (topicId) q = q.eq("topic_id", topicId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as SubtopicRow[];
}

export async function listLessonSummaries(db: SupabaseClient, subtopicIds?: string[]): Promise<LessonSummary[]> {
  let q = db.from("lessons").select("id, subtopic_id, slug, title, ordinal, reading_minutes, status").order("ordinal");
  if (subtopicIds) q = q.in("subtopic_id", subtopicIds);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as LessonSummary[];
}

export async function getTopic(db: SupabaseClient, slug: string): Promise<TopicRow | null> {
  const { data, error } = await db.from("topics").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as TopicRow | null) ?? null;
}

/** Lesson by slug; null when it does not exist *or* RLS hides it (draft → student 404). */
export async function getLesson(db: SupabaseClient, slug: string): Promise<(LessonRow & { subtopic: SubtopicRow & { topic: TopicRow } }) | null> {
  const { data, error } = await db.from("lessons").select("*, subtopic:subtopics(*, topic:topics(*))").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as unknown as (LessonRow & { subtopic: SubtopicRow & { topic: TopicRow } }) | null) ?? null;
}

/** Topic overview: counts of subtopics and approved lessons per topic (one query each). */
export async function topicOverview(db: SupabaseClient) {
  const [topics, subtopics, lessons] = await Promise.all([listTopics(db), listSubtopics(db), listLessonSummaries(db)]);
  const subByTopic = new Map<string, SubtopicRow[]>();
  for (const s of subtopics) subByTopic.set(s.topic_id, [...(subByTopic.get(s.topic_id) ?? []), s]);
  const lessonsBySub = new Map<string, LessonSummary[]>();
  for (const l of lessons) lessonsBySub.set(l.subtopic_id, [...(lessonsBySub.get(l.subtopic_id) ?? []), l]);
  return topics.map((t) => {
    const subs = subByTopic.get(t.id) ?? [];
    const lessonCount = subs.reduce((n, s) => n + (lessonsBySub.get(s.id)?.length ?? 0), 0);
    return { topic: t, subtopics: subs, lessonCount, lessonsBySub };
  });
}

export type PathItemRow = { id: string; week: number; day: number; lesson_id: string | null; question_set: unknown; label: string; lesson: { slug: string; title: string; reading_minutes: number } | null };

export async function getPath(db: SupabaseClient, slug = "default-10-week") {
  const { data: path, error } = await db.from("learning_paths").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!path) return null;
  const { data: items, error: iErr } = await db
    .from("learning_path_items")
    .select("id, week, day, lesson_id, question_set, label, lesson:lessons(slug, title, reading_minutes)")
    .eq("path_id", path.id)
    .order("week")
    .order("day");
  if (iErr) throw iErr;
  return { path: path as { id: string; slug: string; title: string; weeks: number; description: string }, items: (items ?? []) as unknown as PathItemRow[] };
}
