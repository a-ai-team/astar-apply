// DB side of the pipeline: upsert collected items straight into `lessons`/`questions` (used by
// the /api/admin/generate/[runId]/collect route, where content/ is read-only on Vercel) and the
// `generation_runs` helpers shared by the CLI and the admin pages. Rows never go in as
// `approved` here — approval is `scripts/content/approve.ts` or a mentor review.
import type { SupabaseClient } from "@supabase/supabase-js";
import { splitQuestion } from "../question-schema";
import type { CollectedItem, LessonFileOut, QuestionFileOut } from "./collect";

export type RunKind = "lessons" | "questions" | "industry";
export type RunStatus = "dry_run" | "submitted" | "in_progress" | "ended" | "collected" | "failed" | "canceled";

export type GenerationRun = {
  id: string; kind: RunKind; batch_id: string | null; params: Record<string, unknown>; status: RunStatus;
  requested: number; succeeded: number; failed: number; cost_usd: number; created_by: string | null; created_at: string; finished_at: string | null;
};

export async function insertRun(db: SupabaseClient, run: { kind: RunKind; batch_id?: string | null; params: Record<string, unknown>; status: RunStatus; requested: number; cost_usd?: number; created_by?: string | null }): Promise<GenerationRun> {
  const { data, error } = await db.from("generation_runs").insert({ ...run, batch_id: run.batch_id ?? null, cost_usd: run.cost_usd ?? 0, created_by: run.created_by ?? null, finished_at: run.status === "dry_run" ? new Date().toISOString() : null }).select("*").single();
  if (error) throw new Error(`generation_runs insert: ${error.message}`);
  return data as GenerationRun;
}

export async function updateRun(db: SupabaseClient, id: string, patch: Partial<Pick<GenerationRun, "status" | "succeeded" | "failed" | "cost_usd" | "finished_at" | "params" | "batch_id">>): Promise<void> {
  const { error } = await db.from("generation_runs").update(patch).eq("id", id);
  if (error) throw new Error(`generation_runs update: ${error.message}`);
}

export async function getRun(db: SupabaseClient, id: string): Promise<GenerationRun | null> {
  const { data, error } = await db.from("generation_runs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`generation_runs select: ${error.message}`);
  return (data as GenerationRun | null) ?? null;
}

/** Upserts the files of collected items (never as approved). Returns counts. */
export async function upsertCollected(db: SupabaseClient, items: CollectedItem[]): Promise<{ lessons: number; questions: number }> {
  const { data: topics, error: tErr } = await db.from("topics").select("id, slug");
  if (tErr) throw tErr;
  const { data: subtopics, error: sErr } = await db.from("subtopics").select("id, slug");
  if (sErr) throw sErr;
  const topicId = new Map((topics ?? []).map((t) => [t.slug as string, t.id as string]));
  const subtopicId = new Map((subtopics ?? []).map((s) => [s.slug as string, s.id as string]));
  let lessons = 0;
  let questions = 0;
  for (const item of items) {
    for (const f of item.files) {
      if (item.kind === "lesson") {
        const l = f.json as LessonFileOut;
        const sid = subtopicId.get(l.subtopic_slug);
        if (!sid) throw new Error(`lesson ${l.slug}: subtopic ${l.subtopic_slug} not seeded`);
        const { error } = await db.from("lessons").upsert(
          { slug: l.slug, subtopic_id: sid, title: l.title, ordinal: l.ordinal, body: l.body, body_version: l.body.version, reading_minutes: l.body.reading_minutes, status: l.status, generated_by: l.generated_by, prompt_version: l.prompt_version, review_note: l.check_problems?.join("\n") ?? null },
          { onConflict: "slug" },
        );
        if (error) throw new Error(`lesson ${l.slug}: ${error.message}`);
        lessons++;
      } else {
        const q = f.json as QuestionFileOut;
        const { row, body } = splitQuestion(q);
        const tid = topicId.get(row.topic_slug);
        if (!tid) throw new Error(`question ${row.slug}: topic ${row.topic_slug} not seeded`);
        const { generated_by, prompt_version, check_problems, check_warnings, critic_notes, ...rest } = body as typeof body & Partial<Pick<QuestionFileOut, "generated_by" | "prompt_version" | "check_problems" | "check_warnings" | "critic_notes">>;
        void check_warnings; void critic_notes;
        const { error } = await db.from("questions").upsert(
          { slug: row.slug, topic_id: tid, subtopic_id: row.subtopic_slug ? (subtopicId.get(row.subtopic_slug) ?? null) : null, kind: row.kind, difficulty: row.difficulty, question: row.question, body: rest, status: row.status, source_topic: row.source_topic, tags: row.tags, generated_by: generated_by ?? null, prompt_version: prompt_version ?? null, review_note: check_problems?.join("\n") ?? null },
          { onConflict: "slug" },
        );
        if (error) throw new Error(`question ${row.slug}: ${error.message}`);
        questions++;
      }
    }
  }
  return { lessons, questions };
}
