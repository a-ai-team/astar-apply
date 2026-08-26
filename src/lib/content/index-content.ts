// content_chunks writer (0007). Rebuilds retrieval chunks from approved lessons/questions and
// embeds them (src/lib/ai/embeddings.ts, 64 per call). Called by `npm run content:index`
// (everything), by the review/approve paths (one item) and by scripts/content/approve.ts.
// Always runs with the service-role client — callers verify the staff session first.
import type { SupabaseClient } from "@supabase/supabase-js";
import { embed, embeddingModel } from "@/lib/ai/embeddings";
import { lessonChunks, questionChunk, type ContentChunkDraft } from "./index-chunks";
import { validateLessonBody } from "./lesson-schema";
import { QuestionBodySchemaLoose } from "@/lib/practice/question-body";

const EMBED_BATCH = 64;

type LessonRow = { id: string; slug: string; title: string; status: string; body: unknown; subtopic: { id: string; topic: { id: string; slug: string; title: string } } | null };
type QuestionRow = { id: string; slug: string; question: string; status: string; body: unknown; subtopic_id: string | null; topic: { id: string; slug: string; title: string } | null };

const LESSON_SELECT = "id, slug, title, status, body, subtopic:subtopics(id, topic:topics(id, slug, title))";
const QUESTION_SELECT = "id, slug, question, status, body, subtopic_id, topic:topics(id, slug, title)";

export type IndexReport = { lessons: number; questions: number; chunks: number; removed: number; skipped: string[] };

/** Re-indexes one lesson: approved → chunks replaced; anything else → chunks removed. */
export async function indexLesson(db: SupabaseClient, lessonId: string): Promise<number> {
  const { data, error } = await db.from("lessons").select(LESSON_SELECT).eq("id", lessonId).maybeSingle();
  if (error) throw error;
  if (!data) return 0;
  return writeLesson(db, data as unknown as LessonRow);
}

export async function indexQuestion(db: SupabaseClient, questionId: string): Promise<number> {
  const { data, error } = await db.from("questions").select(QUESTION_SELECT).eq("id", questionId).maybeSingle();
  if (error) throw error;
  if (!data) return 0;
  return writeQuestion(db, data as unknown as QuestionRow);
}

/** Rebuilds every chunk from approved content and removes chunks whose item is no longer approved. */
export async function indexAllContent(db: SupabaseClient, log: (s: string) => void = () => {}): Promise<IndexReport> {
  const report: IndexReport = { lessons: 0, questions: 0, chunks: 0, removed: 0, skipped: [] };
  const { data: lessons, error: lErr } = await db.from("lessons").select(LESSON_SELECT).order("slug");
  if (lErr) throw lErr;
  for (const l of (lessons ?? []) as unknown as LessonRow[]) {
    const n = await writeLesson(db, l);
    if (l.status === "approved") {
      if (n === 0) report.skipped.push(`lesson ${l.slug}: invalid body`);
      else { report.lessons++; report.chunks += n; }
    }
    log(`lesson ${l.slug} (${l.status}) → ${n} chunk(s)`);
  }
  const { data: questions, error: qErr } = await db.from("questions").select(QUESTION_SELECT).order("slug");
  if (qErr) throw qErr;
  for (const q of (questions ?? []) as unknown as QuestionRow[]) {
    const n = await writeQuestion(db, q);
    if (q.status === "approved") {
      if (n === 0) report.skipped.push(`question ${q.slug}: invalid body`);
      else { report.questions++; report.chunks += n; }
    }
    log(`question ${q.slug} (${q.status}) → ${n} chunk(s)`);
  }
  // Orphans: chunks whose lesson/question row disappeared are removed by FK cascade; chunks of
  // rows that lost approval are removed in writeLesson/writeQuestion. Count what is left.
  const { count } = await db.from("content_chunks").select("id", { count: "exact", head: true });
  report.removed = Math.max(0, (count ?? 0) - report.chunks);
  return report;
}

async function writeLesson(db: SupabaseClient, l: LessonRow): Promise<number> {
  const { error: dErr } = await db.from("content_chunks").delete().eq("lesson_id", l.id);
  if (dErr) throw dErr;
  if (l.status !== "approved" || !l.subtopic) return 0;
  const v = validateLessonBody(l.body);
  if (!v.ok) return 0;
  const drafts = lessonChunks({ slug: l.slug, title: l.title, body: v.value, topic_title: l.subtopic.topic.title });
  return insertChunks(db, drafts, { lesson_id: l.id, question_id: null, topic_id: l.subtopic.topic.id, subtopic_id: l.subtopic.id, slug: l.slug, topic_slug: l.subtopic.topic.slug });
}

async function writeQuestion(db: SupabaseClient, q: QuestionRow): Promise<number> {
  const { error: dErr } = await db.from("content_chunks").delete().eq("question_id", q.id);
  if (dErr) throw dErr;
  if (q.status !== "approved" || !q.topic) return 0;
  const body = QuestionBodySchemaLoose.safeParse(q.body);
  if (!body.success) return 0;
  const draft = questionChunk({ slug: q.slug, question: q.question, body: body.data, topic_title: q.topic.title });
  return insertChunks(db, [draft], { lesson_id: null, question_id: q.id, topic_id: q.topic.id, subtopic_id: q.subtopic_id, slug: q.slug, topic_slug: q.topic.slug });
}

async function insertChunks(
  db: SupabaseClient,
  drafts: ContentChunkDraft[],
  ref: { lesson_id: string | null; question_id: string | null; topic_id: string; subtopic_id: string | null; slug: string; topic_slug: string },
): Promise<number> {
  if (!drafts.length) return 0;
  const model = embeddingModel();
  for (let i = 0; i < drafts.length; i += EMBED_BATCH) {
    const batch = drafts.slice(i, i + EMBED_BATCH);
    const vectors = await embed(batch.map((d) => `${d.title}\n\n${d.text}`), { inputType: "document" });
    const rows = batch.map((d, j) => ({
      kind: d.kind, lesson_id: ref.lesson_id, question_id: ref.question_id, block_index: d.block_index, block_type: d.block_type,
      topic_id: ref.topic_id, subtopic_id: ref.subtopic_id, title: d.title, slug: ref.slug, topic_slug: ref.topic_slug, text: d.text,
      token_count: d.token_count, embedding: JSON.stringify(vectors[j]), embedding_model: model, status: "approved",
    }));
    const { error } = await db.from("content_chunks").insert(rows);
    if (error) throw error;
  }
  return drafts.length;
}
