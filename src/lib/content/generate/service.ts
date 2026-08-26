// Server-side pipeline used by the admin pages and /api/admin/generate: the same target builder,
// estimate, batch submit/poll and checks as the CLI, but with `existing` read from the DB and the
// results loaded straight into `lessons`/`questions` (content/ is read-only on Vercel — run
// `npm run content:collect -- --run <id>` locally to write the JSON files). Never imports fs.
import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { batchStatus, fetchResults, parseResultRow, submitBatch } from "./batch";
import { collectRows, summarise, type CollectedItem } from "./collect";
import { estimateBatch, type Estimate } from "./cost";
import { getRun, insertRun, updateRun, upsertCollected, type GenerationRun, type RunKind } from "./load";
import { buildRequest, contentModel, promptVersionFor, systemFor, userFor } from "./requests";
import { lessonTargets, questionTargets, type ExistingContent, type Target, type TargetFilter } from "./targets";

export async function existingFromDb(db: SupabaseClient): Promise<ExistingContent> {
  const { data: lessons, error: lErr } = await db.from("lessons").select("slug, title, body, subtopic:subtopics(slug)");
  if (lErr) throw lErr;
  const { data: questions, error: qErr } = await db.from("questions").select("slug, kind, question, subtopic:subtopics(slug)");
  if (qErr) throw qErr;
  return {
    lessons: (lessons ?? []).map((l) => {
      const body = l.body as { blocks?: { type: string; md?: string }[] } | null;
      return { slug: l.slug as string, subtopic_slug: (l.subtopic as unknown as { slug: string } | null)?.slug ?? "", title: l.title as string, one_liner: body?.blocks?.find((b) => b.type === "one_liner")?.md ?? null };
    }),
    questions: (questions ?? []).map((q) => ({ slug: q.slug as string, subtopic_slug: (q.subtopic as unknown as { slug: string } | null)?.slug ?? null, kind: q.kind as "concept" | "calculation", question: q.question as string })),
  };
}

export function targetsFor(kind: RunKind, existing: ExistingContent, f: TargetFilter): Target[] {
  if (kind === "industry") return []; // Loop 09
  return kind === "lessons" ? lessonTargets(existing, f) : questionTargets(existing, f);
}

export async function estimateTargets(targets: Target[], model: string, client: Anthropic | null): Promise<Estimate> {
  const reqs = targets.map((t) => ({ system: systemFor(t), user: userFor(t), expected_output_tokens: t.expected_output_tokens }));
  const counter = client ? async (p: { system: string; user: string }) => (await client.messages.countTokens({ model, system: p.system, messages: [{ role: "user", content: p.user }] })).input_tokens : undefined;
  return estimateBatch(reqs, model, counter);
}

export type StartResult = { run: GenerationRun; estimate: Estimate; targets: string[] };

/** Estimate → cap gate → (dry run | submit). Mirrors scripts/content/generate.ts. */
export async function startRun(db: SupabaseClient, client: Anthropic | null, input: { kind: RunKind; filter: TargetFilter; dryRun: boolean; userId: string | null; model?: string }): Promise<StartResult> {
  const model = input.model ?? contentModel();
  const existing = await existingFromDb(db);
  const targets = targetsFor(input.kind, existing, input.filter);
  if (!targets.length) throw new Error("nothing to generate for that filter (everything exists — use force)");
  const estimate = await estimateTargets(targets, model, client);
  const params = { model, prompt_version: promptVersionFor(input.kind === "lessons" ? "lesson" : "questions"), filter: input.filter, custom_ids: targets.map((t) => t.custom_id), estimate, source: "admin" };
  if (!estimate.within_cap) {
    const run = await insertRun(db, { kind: input.kind, params: { ...params, aborted: "over cap" }, status: "failed", requested: targets.length, cost_usd: estimate.usd, created_by: input.userId });
    return { run, estimate, targets: params.custom_ids };
  }
  if (input.dryRun) {
    const run = await insertRun(db, { kind: input.kind, params, status: "dry_run", requested: targets.length, cost_usd: estimate.usd, created_by: input.userId });
    return { run, estimate, targets: params.custom_ids };
  }
  if (!client) throw new Error("ANTHROPIC_API_KEY is not set");
  const requests = targets.map((t) => buildRequest(t, { model }));
  const b = await submitBatch(client, requests);
  const run = await insertRun(db, { kind: input.kind, batch_id: b.id, params, status: "submitted", requested: targets.length, cost_usd: estimate.usd, created_by: input.userId });
  return { run, estimate, targets: params.custom_ids };
}

/** One poll: updates the run's status from the batch. */
export async function refreshRun(db: SupabaseClient, client: Anthropic, run: GenerationRun): Promise<GenerationRun> {
  if (!run.batch_id) return run;
  const s = await batchStatus(client, run.batch_id);
  const status = s.processing_status === "ended" ? (run.status === "collected" ? "collected" : "ended") : s.processing_status === "canceling" ? "canceled" : "in_progress";
  await updateRun(db, run.id, { status, succeeded: s.counts.succeeded, failed: s.counts.errored + s.counts.expired + s.counts.canceled, params: { ...run.params, batch_counts: s.counts } });
  return (await getRun(db, run.id))!;
}

export type CollectRunResult = { run: GenerationRun; items: CollectedItem[]; summary: ReturnType<typeof summarise>; loaded: { lessons: number; questions: number } };

/** Fetches an ended batch's results, runs the checks, upserts into the DB (no critic — that is the CLI's job). */
export async function collectRun(db: SupabaseClient, client: Anthropic, run: GenerationRun): Promise<CollectRunResult> {
  if (!run.batch_id) throw new Error("run has no batch (dry run?)");
  const s = await batchStatus(client, run.batch_id);
  if (s.processing_status !== "ended") throw new Error(`batch is ${s.processing_status} — not ended yet`);
  const rows = await fetchResults(client, run.batch_id);
  const existing = await existingFromDb(db);
  const model = (run.params.model as string | undefined) ?? contentModel();
  const items = collectRows(rows.map(parseResultRow), { existing, reference: null, model, batch: true });
  const loaded = await upsertCollected(db, items);
  const summary = summarise(items);
  await updateRun(db, run.id, { status: "collected", succeeded: summary.written + summary.draft, failed: summary.failed, cost_usd: summary.cost_usd, finished_at: new Date().toISOString(), params: { ...run.params, collect: { ...summary, loaded, overlap: "skipped (no hidden set on server)" } } });
  return { run: (await getRun(db, run.id))!, items, summary, loaded };
}
