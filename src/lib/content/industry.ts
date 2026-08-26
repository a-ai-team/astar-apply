// Industry modules (Loop 09): the grid's data. Prefers the `industry_modules` view (0010,
// security invoker → RLS decides what counts as visible) and falls back to aggregating the base
// tables when the view is not there yet, so the page, seed 09 and the e2e work either way. Kept
// free of `server-only` so scripts can import it; the pages pass their cookie client.
import type { SupabaseClient } from "@supabase/supabase-js";
import { INDUSTRY_FAMILY_LABELS, industryModule, type IndustryFamily } from "./taxonomy";

export type IndustryModuleRow = {
  topic_id: string;
  slug: string;
  title: string;
  summary: string;
  group_family: IndustryFamily;
  ordinal: number;
  is_free: boolean;
  status: string;
  subtopic_count: number;
  lesson_count: number;
  question_count: number;
  flashcard_count: number;
};

export type IndustryModulesResult = { modules: IndustryModuleRow[]; source: "view" | "tables" };

function familyOf(slug: string, fromDb: unknown): IndustryFamily {
  const f = (typeof fromDb === "string" ? fromDb : null) ?? industryModule(slug)?.family ?? "other";
  return (f === "coverage" || f === "product" ? f : "other") as IndustryFamily;
}

export async function listIndustryModules(db: SupabaseClient): Promise<IndustryModulesResult> {
  const view = await db.from("industry_modules").select("*").order("ordinal");
  if (!view.error) {
    const modules = (view.data ?? []).map((r) => ({
      topic_id: r.topic_id as string, slug: r.slug as string, title: r.title as string, summary: (r.summary as string) ?? "",
      group_family: familyOf(r.slug as string, r.group_family), ordinal: r.ordinal as number, is_free: Boolean(r.is_free), status: r.status as string,
      subtopic_count: Number(r.subtopic_count ?? 0), lesson_count: Number(r.lesson_count ?? 0), question_count: Number(r.question_count ?? 0), flashcard_count: Number(r.flashcard_count ?? 0),
    }));
    return { modules, source: "view" };
  }
  // TODO(james): remove the fallback once 0010_industry.sql is applied everywhere (Loop 09 § Blocked 1).
  const { data: topics, error } = await db.from("topics").select("id, slug, title, summary, ordinal, is_free, status").eq("kind", "industry").order("ordinal");
  if (error) throw error;
  const ids = (topics ?? []).map((t) => t.id as string);
  if (!ids.length) return { modules: [], source: "tables" };
  const [subs, questions, cards] = await Promise.all([
    db.from("subtopics").select("id, topic_id").in("topic_id", ids),
    db.from("questions").select("id, topic_id, status").in("topic_id", ids).eq("status", "approved"),
    db.from("flashcards").select("id, topic_id, status").in("topic_id", ids).eq("status", "approved"),
  ]);
  if (subs.error) throw subs.error;
  if (questions.error) throw questions.error;
  if (cards.error) throw cards.error;
  const subIds = (subs.data ?? []).map((s) => s.id as string);
  const lessons = subIds.length ? await db.from("lessons").select("id, subtopic_id, status").in("subtopic_id", subIds).eq("status", "approved") : { data: [], error: null };
  if (lessons.error) throw lessons.error;
  const subTopic = new Map((subs.data ?? []).map((s) => [s.id as string, s.topic_id as string]));
  const count = (rows: { topic_id: string }[] | null | undefined, id: string) => (rows ?? []).filter((r) => r.topic_id === id).length;
  const modules = (topics ?? []).map((t) => {
    const id = t.id as string;
    return {
      topic_id: id, slug: t.slug as string, title: t.title as string, summary: (t.summary as string) ?? "", group_family: familyOf(t.slug as string, null),
      ordinal: t.ordinal as number, is_free: Boolean(t.is_free), status: t.status as string,
      subtopic_count: count(subs.data as { topic_id: string }[], id),
      lesson_count: (lessons.data ?? []).filter((l) => subTopic.get(l.subtopic_id as string) === id).length,
      question_count: count(questions.data as { topic_id: string }[], id),
      flashcard_count: count(cards.data as { topic_id: string }[], id),
    };
  });
  return { modules, source: "tables" };
}

/** Modules grouped by family in display order (coverage → product → other). */
export function groupByFamily(modules: IndustryModuleRow[]): { family: IndustryFamily; label: string; modules: IndustryModuleRow[] }[] {
  return (["coverage", "product", "other"] as IndustryFamily[])
    .map((family) => ({ family, label: INDUSTRY_FAMILY_LABELS[family], modules: modules.filter((m) => m.group_family === family) }))
    .filter((g) => g.modules.length);
}
