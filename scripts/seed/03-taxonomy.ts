// Seed 03 — curriculum skeleton: 9 topics, ~50 subtopics (from src/lib/content/taxonomy.ts), the
// default 10-week learning path (50 items), the two hand-written lessons and six questions from
// content/. Idempotent: upserts on slug / (topic_id, slug) / (path_id, week, day).
import path from "node:path";
import { adminClient } from "./env";
import { CURRICULUM, DEFAULT_PATH } from "../../src/lib/content/taxonomy";
import { loadContent } from "../content/load";

export async function seedTaxonomy() {
  const db = adminClient();

  // Topics
  const topicId = new Map<string, string>();
  for (const [i, t] of CURRICULUM.entries()) {
    const { data, error } = await db
      .from("topics")
      .upsert(
        { slug: t.slug, title: t.title, kind: t.kind, ordinal: i, level: t.level, is_free: t.is_free, summary: t.summary, source_section: t.source_section, status: "approved" },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error(`topic ${t.slug}`);
    topicId.set(t.slug, data.id);
  }

  // Subtopics
  let nSub = 0;
  for (const t of CURRICULUM) {
    for (const [j, s] of t.subtopics.entries()) {
      const { error } = await db.from("subtopics").upsert(
        { topic_id: topicId.get(t.slug)!, slug: s.slug, title: s.title, ordinal: j, kind: s.kind, source_section: s.source_section, target_questions: s.target_questions, status: "approved" },
        { onConflict: "topic_id,slug" },
      );
      if (error) throw new Error(`subtopic ${s.slug}: ${error.message}`);
      nSub++;
    }
  }
  console.log(`seed 03: ${CURRICULUM.length} topics, ${nSub} subtopics`);

  // Content (lessons + questions) from content/
  const loaded = await loadContent(db, path.resolve("content"));
  console.log(`seed 03: ${loaded.lessons} lessons, ${loaded.questions} questions loaded from content/`);

  // Learning path
  const { data: p, error: pErr } = await db
    .from("learning_paths")
    .upsert({ slug: DEFAULT_PATH.slug, title: DEFAULT_PATH.title, weeks: DEFAULT_PATH.weeks.length, description: DEFAULT_PATH.description }, { onConflict: "slug" })
    .select("id")
    .single();
  if (pErr || !p) throw pErr ?? new Error("path");
  const { data: lessons, error: lErr } = await db.from("lessons").select("id, slug");
  if (lErr) throw lErr;
  const lessonId = new Map((lessons ?? []).map((l) => [l.slug as string, l.id as string]));
  let nItems = 0;
  for (const w of DEFAULT_PATH.weeks) {
    for (const d of w.days) {
      const { error } = await db.from("learning_path_items").upsert(
        { path_id: p.id, week: w.week, day: d.day, lesson_id: d.lesson_slug ? (lessonId.get(d.lesson_slug) ?? null) : null, question_set: d.question_set ?? [], label: d.label },
        { onConflict: "path_id,week,day" },
      );
      if (error) throw new Error(`path item w${w.week}d${d.day}: ${error.message}`);
      nItems++;
    }
  }
  console.log(`seed 03: path ${DEFAULT_PATH.slug} with ${nItems} items (${[...lessonId.keys()].length} lessons resolvable)`);
}
