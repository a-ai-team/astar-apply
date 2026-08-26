// Loads content/ JSON into the DB (idempotent upserts on slug). Used by `npm run seed -- 03` and
// by Loop 04's collector. `npx tsx scripts/content/load.ts [dir]` runs it standalone.
// Lessons: upsert on `lessons.slug`; questions: upsert on `questions.slug`. Rows marked `approved`
// in the file must pass assertApprovable() (validateContentDir enforces this before any write).
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { splitQuestion } from "../../src/lib/content/question-schema";
import { validateContentDir } from "./validate";

export async function loadContent(db: SupabaseClient, root = path.resolve("content")) {
  const { lessons, questions, questionMeta, errors } = validateContentDir(root);
  if (errors.length) throw new Error(`content invalid:\n${errors.join("\n")}`);

  const { data: topics, error: tErr } = await db.from("topics").select("id, slug");
  if (tErr) throw tErr;
  const { data: subtopics, error: sErr } = await db.from("subtopics").select("id, slug");
  if (sErr) throw sErr;
  const topicId = new Map((topics ?? []).map((t) => [t.slug as string, t.id as string]));
  const subtopicId = new Map((subtopics ?? []).map((s) => [s.slug as string, s.id as string]));

  let nLessons = 0;
  for (const l of lessons) {
    const sid = subtopicId.get(l.subtopic_slug);
    if (!sid) throw new Error(`lesson ${l.slug}: subtopic ${l.subtopic_slug} not seeded — run \`npm run seed -- 03\``);
    const body = l.body as { reading_minutes: number; version: number };
    const { error } = await db.from("lessons").upsert(
      {
        slug: l.slug, subtopic_id: sid, title: l.title, ordinal: l.ordinal ?? 1, body: l.body, body_version: body.version,
        reading_minutes: body.reading_minutes, status: l.status, generated_by: l.generated_by ?? "human", prompt_version: l.prompt_version ?? null,
        review_note: l.check_problems?.length ? l.check_problems.join("\n") : null,
      },
      { onConflict: "slug" },
    );
    if (error) throw new Error(`lesson ${l.slug}: ${error.message}`);
    nLessons++;
  }

  let nQuestions = 0;
  for (const v of questions) {
    if (!v.ok) continue;
    const { row, body } = splitQuestion(v.value);
    const meta = questionMeta.get(row.slug);
    const tid = topicId.get(row.topic_slug);
    if (!tid) throw new Error(`question ${row.slug}: topic ${row.topic_slug} not seeded`);
    const { error } = await db.from("questions").upsert(
      {
        slug: row.slug, topic_id: tid, subtopic_id: row.subtopic_slug ? (subtopicId.get(row.subtopic_slug) ?? null) : null,
        kind: row.kind, difficulty: row.difficulty, question: row.question, body, status: row.status,
        source_topic: row.source_topic, tags: row.tags, generated_by: meta?.generated_by ?? "human", prompt_version: meta?.prompt_version ?? null,
        review_note: meta?.check_problems?.length ? meta.check_problems.join("\n") : null,
      },
      { onConflict: "slug" },
    );
    if (error) throw new Error(`question ${row.slug}: ${error.message}`);
    nQuestions++;
  }
  return { lessons: nLessons, questions: nQuestions };
}

if (require.main === module) {
  import("../seed/env").then(async ({ adminClient }) => {
    const r = await loadContent(adminClient(), path.resolve(process.argv[2] ?? "content"));
    console.log(`loaded ${r.lessons} lesson(s), ${r.questions} question(s)`);
  }).catch((e) => { console.error(e); process.exit(1); });
}
