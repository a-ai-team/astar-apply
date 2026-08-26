// `npm run content:collect -- --run <id> | --batch <id> | --file <results.jsonl> [--out content]
//   [--no-critic] [--no-db] [--resubmit] [--force]`
// Fetches a batch's results (or reads a results JSONL), keeps the raw rows in .eval/batches/,
// runs the automatic checks, sends failing items through the critic (sync Opus 5) when the API
// has credit, writes content/ files, updates generation_runs, and resubmits retryable failures
// once (`--resubmit`). Exported `collectFromRows` is reused by generate.ts (--sync / --wait).
import { config as loadEnv } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClient, hasAnthropicKey } from "../../src/lib/ai/client";
import { fetchResults, parseResultRow, parseResultsJsonl, submitBatch, type ParsedRow, type ResultRow } from "../../src/lib/content/generate/batch";
import { collectRow, collectRows, summarise, type CollectedItem } from "../../src/lib/content/generate/collect";
import { runCritic } from "../../src/lib/content/generate/critic";
import { getRun, insertRun, updateRun } from "../../src/lib/content/generate/load";
import { buildRequest, contentModel } from "../../src/lib/content/generate/requests";
import { targetFromCustomId, type ExistingContent } from "../../src/lib/content/generate/targets";
import { isCredentialFailure, probeApi } from "../../src/lib/ai/probe";
import { loadReference } from "../eval/overlap";
import { existingFromDir } from "./existing";

loadEnv({ path: ".env.local" });

export const BATCH_DIR = path.resolve(".eval", "batches");

export function saveRaw(name: string, rows: ResultRow[]): string {
  mkdirSync(BATCH_DIR, { recursive: true });
  const file = path.join(BATCH_DIR, `${name}.results.jsonl`);
  writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  return file;
}

export function writeItems(items: CollectedItem[], out: string, opts: { force?: boolean } = {}): { written: string[]; skipped: string[] } {
  const written: string[] = [];
  const skipped: string[] = [];
  for (const item of items) {
    for (const f of item.files) {
      const file = path.join(out, f.path);
      if (existsSync(file) && !opts.force) {
        const current = JSON.parse(readFileSync(file, "utf8")) as { status?: string };
        // Never overwrite something a human approved/edited; generated/draft files are fair game.
        if (current.status === "approved" || current.status === "in_review") { skipped.push(f.path); continue; }
      }
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, JSON.stringify(f.json, null, 2) + "\n");
      written.push(f.path);
    }
  }
  return { written, skipped };
}

/** Re-runs the checks on the critic's corrected output; falls back to the original item on failure. */
export async function criticPass(client: Anthropic, items: CollectedItem[], ctx: { existing: ExistingContent; reference: Set<string> | null; model: string }): Promise<CollectedItem[]> {
  const out: CollectedItem[] = [];
  for (const item of items) {
    if (item.status === "written" || item.output === undefined) { out.push(item); continue; }
    const target = item.target ?? targetFromCustomId(item.custom_id, ctx.existing);
    const context = target?.kind === "lesson" ? `lesson for subtopic ${target.subtopic_slug}${target.walkthrough ? " (walkthrough: scenario required)" : ""}` : `${target?.count ?? "?"} ${target?.qkind ?? ""} questions for subtopic ${target?.subtopic_slug ?? "?"}, mix ${target?.mix.join("/") ?? "?"}`;
    try {
      console.log(`  critic: ${item.custom_id} (${item.problems.length} problem(s))`);
      const c = await runCritic(client, { kind: item.kind, draft: item.output, problems: item.problems, context, model: ctx.model });
      const row: ParsedRow = { custom_id: item.custom_id, ok: true, output: c.output, usage: c.usage, model: ctx.model, stop_reason: "end_turn" };
      const fixed = collectRow(row, { existing: ctx.existing, reference: ctx.reference, model: ctx.model, batch: false });
      fixed.cost_usd += item.cost_usd;
      for (const f of fixed.files) (f.json as { critic_notes?: string }).critic_notes = c.notes;
      out.push(fixed.status === "failed" ? { ...item, problems: [...item.problems, `critic could not fix: ${fixed.problems.join("; ")}`] } : fixed);
    } catch (e) {
      out.push({ ...item, warnings: [...item.warnings, `critic failed: ${(e as Error).message.slice(0, 200)}`] });
    }
  }
  return out;
}

export type CollectResult = { items: CollectedItem[]; summary: ReturnType<typeof summarise>; written: string[]; skipped: string[] };

export async function collectFromRows(rows: ResultRow[], opts: { out: string; critic: boolean; force?: boolean; model?: string; batch?: boolean; generatedBy?: string }): Promise<CollectResult> {
  const model = opts.model ?? contentModel();
  const existing = existingFromDir(opts.out);
  const reference = loadReference();
  if (!reference) console.warn("collect: HIDDEN SET MISSING — overlap check skipped (run scripts/eval/extract-400q.ts)");
  let items = collectRows(rows.map(parseResultRow), { existing, reference, model, batch: opts.batch ?? true, generatedBy: opts.generatedBy });
  const needCritic = items.filter((i) => i.status !== "written" && i.output !== undefined);
  if (needCritic.length && opts.critic) {
    const probe = hasAnthropicKey() ? await probeApi() : null;
    if (probe?.ok) items = await criticPass(getClient(), items, { existing, reference, model });
    else console.warn(`collect: critic skipped for ${needCritic.length} item(s) — ${probe ? (isCredentialFailure(probe) ? "NO API CREDIT" : probe.message) : "no ANTHROPIC_API_KEY"}; items kept as draft with check_problems`);
  }
  const { written, skipped } = writeItems(items, opts.out, { force: opts.force });
  return { items, summary: summarise(items), written, skipped };
}

export function printSummary(r: CollectResult) {
  const s = r.summary;
  console.log(`collect: ${s.requested} result(s) → ${s.written} written, ${s.draft} draft (check problems), ${s.failed} failed; ${r.written.length} file(s) written, ${r.skipped.length} skipped (approved/in_review); cost $${s.cost_usd.toFixed(4)}`);
  for (const i of r.items) if (i.status !== "written") console.log(`  ${i.status.padEnd(6)} ${i.custom_id}: ${i.problems.join(" | ").slice(0, 300)}`);
  if (s.resubmit.length) console.log(`  resubmit: ${s.resubmit.join(", ")}`);
}

/** Resubmits retryable failures as a new batch (once — the child run records `parent_run`). */
export async function resubmit(client: Anthropic, db: SupabaseClient | null, parentRunId: string | null, customIds: string[], opts: { kind: "lessons" | "questions"; out: string; model: string }): Promise<string | null> {
  if (!customIds.length) return null;
  const existing = existingFromDir(opts.out);
  const requests = customIds.map((id) => targetFromCustomId(id, existing)).filter((t): t is NonNullable<typeof t> => Boolean(t)).map((t) => buildRequest(t, { model: opts.model }));
  const b = await submitBatch(client, requests);
  mkdirSync(BATCH_DIR, { recursive: true });
  writeFileSync(path.join(BATCH_DIR, `${b.id}.requests.jsonl`), requests.map((r) => JSON.stringify(r)).join("\n") + "\n");
  if (db) {
    const run = await insertRun(db, { kind: opts.kind, batch_id: b.id, params: { model: opts.model, custom_ids: customIds, parent_run: parentRunId, resubmit: true }, status: "submitted", requested: requests.length });
    console.log(`collect: resubmitted ${requests.length} request(s) as batch ${b.id} (run ${run.id})`);
  } else console.log(`collect: resubmitted ${requests.length} request(s) as batch ${b.id}`);
  return b.id;
}

function arg(argv: string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function main(argv = process.argv.slice(2)) {
  const runId = arg(argv, "--run");
  let batchId = arg(argv, "--batch");
  const file = arg(argv, "--file");
  const out = path.resolve(arg(argv, "--out") ?? "content");
  const noDb = argv.includes("--no-db");
  const critic = !argv.includes("--no-critic");
  const force = argv.includes("--force");
  if (!runId && !batchId && !file) {
    console.error("usage: npm run content:collect -- --run <id> | --batch <id> | --file <results.jsonl> [--out content] [--no-critic] [--no-db] [--resubmit] [--force]");
    process.exit(1);
  }
  const db = noDb ? null : (await import("../seed/env")).adminClient();
  const run = runId && db ? await getRun(db, runId) : null;
  if (runId && !run) throw new Error(`run ${runId} not found`);
  batchId = batchId ?? run?.batch_id ?? undefined;
  const kind = (run?.kind as "lessons" | "questions" | undefined) ?? (arg(argv, "--kind") as "lessons" | "questions" | undefined) ?? "lessons";
  const model = (run?.params?.model as string | undefined) ?? contentModel();

  let rows: ResultRow[];
  if (file) {
    rows = parseResultsJsonl(readFileSync(file, "utf8"));
    console.log(`collect: ${rows.length} row(s) from ${file}`);
  } else {
    if (!batchId) throw new Error("no batch id (run has none — was it a dry run?)");
    const client = getClient();
    const status = await client.messages.batches.retrieve(batchId);
    if (status.processing_status !== "ended") {
      console.log(`collect: batch ${batchId} is ${status.processing_status} (${JSON.stringify(status.request_counts)}) — not ended yet`);
      if (run && db) await updateRun(db, run.id, { status: "in_progress" });
      process.exit(4);
    }
    rows = await fetchResults(client, batchId);
    const raw = saveRaw(batchId, rows);
    console.log(`collect: ${rows.length} row(s) from batch ${batchId} → ${raw}`);
    if (run && db) await updateRun(db, run.id, { status: "ended" });
  }

  const r = await collectFromRows(rows, { out, critic, force, model, batch: true });
  printSummary(r);
  if (run && db) {
    await updateRun(db, run.id, { status: "collected", succeeded: r.summary.written + r.summary.draft, failed: r.summary.failed, cost_usd: r.summary.cost_usd, finished_at: new Date().toISOString(), params: { ...run.params, collect: { ...r.summary, out } } });
  }
  if (argv.includes("--resubmit") && r.summary.resubmit.length && !file) {
    if (run?.params?.resubmit) console.log("collect: this run was already a resubmission — not resubmitting again (fix by hand or --sync)");
    else await resubmit(getClient(), db, run?.id ?? null, r.summary.resubmit, { kind, out, model });
  }
  console.log(`collect: next → npm run content:validate && npm run content:load`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
