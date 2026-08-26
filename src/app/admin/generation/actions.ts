"use server";

// Server actions for /admin/generation: start (dry run or batch), refresh a run's batch status,
// collect an ended run into the DB. All staff-gated; API credit required except for dry runs
// (which fall back to the chars/3.5 heuristic when count_tokens fails).
import { refresh } from "next/cache";
import { verifyStaff } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClient, hasAnthropicKey } from "@/lib/ai/client";
import { getRun } from "@/lib/content/generate/load";
import { collectRun, refreshRun, startRun } from "@/lib/content/generate/service";

export type GenState = { ok: boolean; errors: string[]; message?: string };

export async function startGeneration(_prev: GenState, formData: FormData): Promise<GenState> {
  const session = await verifyStaff();
  const kind = String(formData.get("kind") ?? "lessons") as "lessons" | "questions";
  const topic = String(formData.get("topic") ?? "all");
  const dryRun = formData.get("dry_run") === "on";
  const force = formData.get("force") === "on";
  if (kind !== "lessons" && kind !== "questions") return { ok: false, errors: ["bad kind"] };
  try {
    const r = await startRun(createAdminClient(), hasAnthropicKey() ? getClient() : null, { kind, filter: topic === "all" ? { all: true, force } : { topics: [topic], force }, dryRun, userId: session.userId });
    refresh();
    if (r.run.status === "failed") return { ok: false, errors: [`estimate $${r.estimate.usd.toFixed(2)} exceeds the cap $${r.estimate.cap_usd} — narrow the topic or raise CONTENT_MAX_BATCH_USD`] };
    return { ok: true, errors: [], message: `${dryRun ? "Dry run" : "Batch submitted"}: ${r.targets.length} request(s), estimate $${r.estimate.usd.toFixed(2)} (${r.estimate.method})${r.run.batch_id ? `, batch ${r.run.batch_id}` : ""}` };
  } catch (e) {
    return { ok: false, errors: [(e as Error).message.slice(0, 300)] };
  }
}

export async function refreshGeneration(_prev: GenState, formData: FormData): Promise<GenState> {
  await verifyStaff();
  const id = String(formData.get("id") ?? "");
  if (!hasAnthropicKey()) return { ok: false, errors: ["ANTHROPIC_API_KEY is not set"] };
  const db = createAdminClient();
  const run = await getRun(db, id);
  if (!run) return { ok: false, errors: ["run not found"] };
  try {
    const r = await refreshRun(db, getClient(), run);
    refresh();
    return { ok: true, errors: [], message: `status ${r.status}` };
  } catch (e) {
    return { ok: false, errors: [(e as Error).message.slice(0, 300)] };
  }
}

export async function collectGeneration(_prev: GenState, formData: FormData): Promise<GenState> {
  await verifyStaff();
  const id = String(formData.get("id") ?? "");
  if (!hasAnthropicKey()) return { ok: false, errors: ["ANTHROPIC_API_KEY is not set"] };
  const db = createAdminClient();
  const run = await getRun(db, id);
  if (!run) return { ok: false, errors: ["run not found"] };
  try {
    const r = await collectRun(db, getClient(), run);
    refresh();
    return { ok: true, errors: [], message: `collected: ${r.summary.written} ok, ${r.summary.draft} draft, ${r.summary.failed} failed → ${r.loaded.lessons} lessons / ${r.loaded.questions} questions loaded. Write content/ files locally: npm run content:collect -- --run ${run.id}` };
  } catch (e) {
    return { ok: false, errors: [(e as Error).message.slice(0, 300)] };
  }
}
