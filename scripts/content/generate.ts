// `npm run content:generate -- lessons|questions (--all | --topic a,b | --slug s1,s2) [--kind industry]
//   [--dry-run] [--sync] [--wait] [--force] [--no-db] [--out content] [--model id]`
// `--kind industry` (Loop 09) targets the 18 industry modules (INDUSTRY_CURRICULUM) instead of the
// generalist curriculum: the system prompt gains the industry addendum and files land under
// content/industry/<module>/{lessons,questions}/.
// Builds one request per target (lesson per subtopic; questions per subtopic × kind, counts from
// taxonomy.ts), estimates the cost (count_tokens, or a chars/3.5 heuristic when that call fails),
// refuses to submit above CONTENT_MAX_BATCH_USD, then either submits a Message Batch (default),
// runs the targets one by one (`--sync`), or stops after the estimate (`--dry-run`). Every run
// (including dry runs) is recorded in generation_runs; requests go to .eval/batches/.
import { config as loadEnv } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getClient, hasAnthropicKey } from "../../src/lib/ai/client";
import { pollBatch, submitBatch, fetchResults, type ResultRow } from "../../src/lib/content/generate/batch";
import { estimateBatch, maxBatchUsd, type Estimate } from "../../src/lib/content/generate/cost";
import { insertRun, updateRun } from "../../src/lib/content/generate/load";
import { buildRequest, contentModel, promptVersionFor, systemFor, userFor } from "../../src/lib/content/generate/requests";
import { generateSync } from "../../src/lib/content/generate/sync";
import { lessonTargets, questionTargets, type Target, type TargetFilter } from "../../src/lib/content/generate/targets";
import { BATCH_DIR, collectFromRows, printSummary, saveRaw } from "./collect";
import { existingFromDir } from "./existing";

loadEnv({ path: ".env.local" });

function arg(argv: string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}
const list = (s?: string) => s?.split(",").map((x) => x.trim()).filter(Boolean);

export function buildTargets(kind: "lessons" | "questions", out: string, f: TargetFilter): Target[] {
  const existing = existingFromDir(out);
  return kind === "lessons" ? lessonTargets(existing, f) : questionTargets(existing, f);
}

export async function estimateTargets(targets: Target[], model: string): Promise<Estimate> {
  const reqs = targets.map((t) => ({ system: systemFor(t), user: userFor(t), expected_output_tokens: t.expected_output_tokens }));
  const counter = hasAnthropicKey()
    ? async (p: { system: string; user: string }) => (await getClient().messages.countTokens({ model, system: p.system, messages: [{ role: "user", content: p.user }] })).input_tokens
    : undefined;
  return estimateBatch(reqs, model, counter);
}

export function printEstimate(e: Estimate, kind: string, model: string) {
  console.log(`estimate (${kind}, ${model}, ${e.method}): ${e.requests} request(s), ~${e.input_tokens.toLocaleString()} input + ~${e.output_tokens.toLocaleString()} output tokens → $${e.usd.toFixed(2)} at batch prices (cap $${e.cap_usd}) ${e.within_cap ? "OK" : "OVER CAP"}`);
  if (e.method === "heuristic") console.log("  (count_tokens unavailable — chars/3.5 heuristic; real input counts are typically 10–30 % higher)");
}

async function main(argv = process.argv.slice(2)) {
  const kind = argv[0] as "lessons" | "questions";
  if (kind !== "lessons" && kind !== "questions") {
    console.error("usage: npm run content:generate -- lessons|questions (--all | --topic a,b | --slug s1,s2) [--kind industry] [--dry-run] [--sync] [--wait] [--force] [--no-db] [--out content]");
    process.exit(1);
  }
  const out = path.resolve(arg(argv, "--out") ?? "content");
  const kindArg = arg(argv, "--kind");
  if (kindArg && kindArg !== "industry" && kindArg !== "generalist") { console.error("generate: --kind must be industry or generalist"); process.exit(1); }
  const filter: TargetFilter = { topics: list(arg(argv, "--topic")), slugs: list(arg(argv, "--slug")), all: argv.includes("--all"), force: argv.includes("--force"), kind: (kindArg as TargetFilter["kind"]) ?? "generalist" };
  if (!filter.all && !filter.topics?.length && !filter.slugs?.length) {
    console.error("generate: pick --all, --topic <slugs> or --slug <subtopic slugs>");
    process.exit(1);
  }
  const dryRun = argv.includes("--dry-run");
  const sync = argv.includes("--sync");
  const noDb = argv.includes("--no-db");
  const model = arg(argv, "--model") ?? contentModel();
  const targets = buildTargets(kind, out, filter);
  console.log(`generate: ${targets.length} ${kind} target(s)${targets.length ? `: ${targets.slice(0, 8).map((t) => t.custom_id).join(", ")}${targets.length > 8 ? ", …" : ""}` : ""}`);
  if (!targets.length) { console.log("generate: nothing to do (everything exists — use --force to regenerate)"); return; }

  const estimate = await estimateTargets(targets, model);
  printEstimate(estimate, kind, model);
  const db = noDb ? null : (await import("../seed/env")).adminClient();
  const params = { model, prompt_version: promptVersionFor(kind === "lessons" ? "lesson" : "questions", filter.kind === "industry"), filter, custom_ids: targets.map((t) => t.custom_id), estimate, out };

  if (!estimate.within_cap) {
    if (db) await insertRun(db, { kind, params: { ...params, aborted: "over cap" }, status: "failed", requested: targets.length, cost_usd: estimate.usd });
    console.error(`generate: ABORT — estimate $${estimate.usd.toFixed(2)} exceeds CONTENT_MAX_BATCH_USD=${maxBatchUsd()}. Narrow with --topic or raise the cap.`);
    process.exit(3);
  }
  if (dryRun) {
    if (db) { const r = await insertRun(db, { kind, params, status: "dry_run", requested: targets.length, cost_usd: estimate.usd }); console.log(`generate: dry run recorded as generation_runs ${r.id}`); }
    console.log("generate: dry run — nothing submitted. Re-run without --dry-run to submit the batch.");
    return;
  }
  if (!hasAnthropicKey()) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = getClient();

  if (sync) {
    const run = db ? await insertRun(db, { kind, params: { ...params, sync: true }, status: "in_progress", requested: targets.length, cost_usd: estimate.usd }) : null;
    const rows: ResultRow[] = [];
    let ok = 0;
    for (const t of targets) {
      console.log(`generate: sync ${t.custom_id} …`);
      const r = await generateSync(client, t, { model });
      if (r.ok) ok++;
      // Re-wrap as a result row so the collector + raw log see one shape.
      rows.push(r.ok
        ? { custom_id: r.custom_id, result: { type: "succeeded", message: { content: [{ type: "text", text: JSON.stringify(r.output) }], stop_reason: r.stop_reason, usage: r.usage, model: r.model ?? model } } }
        : { custom_id: r.custom_id, result: { type: "errored", error: { type: "sync_error", error: { type: "sync_error", message: r.error } } } });
      console.log(`  ${r.ok ? "ok" : `failed: ${r.error}`}`);
    }
    const name = `sync-${Date.now()}`;
    saveRaw(name, rows);
    const c = await collectFromRows(rows, { out, critic: true, force: filter.force, model, batch: false });
    printSummary(c);
    if (run && db) await updateRun(db, run.id, { status: "collected", succeeded: ok, failed: targets.length - ok, cost_usd: c.summary.cost_usd, finished_at: new Date().toISOString(), params: { ...run.params, collect: c.summary, raw: name } });
    return;
  }

  const requests = targets.map((t) => buildRequest(t, { model }));
  const b = await submitBatch(client, requests);
  mkdirSync(BATCH_DIR, { recursive: true });
  writeFileSync(path.join(BATCH_DIR, `${b.id}.requests.jsonl`), requests.map((r) => JSON.stringify(r)).join("\n") + "\n");
  const run = db ? await insertRun(db, { kind, batch_id: b.id, params, status: "submitted", requested: targets.length, cost_usd: estimate.usd }) : null;
  console.log(`generate: submitted batch ${b.id} (${b.processing_status})${run ? `, run ${run.id}` : ""}`);
  if (!argv.includes("--wait")) {
    console.log(`generate: poll with \`npm run content:collect -- ${run ? `--run ${run.id}` : `--batch ${b.id}`} --resubmit\` (or /admin/generation)`);
    return;
  }
  const status = await pollBatch(client, b.id, { onTick: (s) => console.log(`  ${new Date().toISOString()} ${s.processing_status} ${JSON.stringify(s.counts)}`) });
  if (status.processing_status !== "ended") { console.error("generate: batch not ended after 4 h — collect later"); process.exit(4); }
  const rows = await fetchResults(client, b.id);
  saveRaw(b.id, rows);
  const c = await collectFromRows(rows, { out, critic: true, force: filter.force, model, batch: true });
  printSummary(c);
  if (run && db) await updateRun(db, run.id, { status: "collected", succeeded: c.summary.written + c.summary.draft, failed: c.summary.failed, cost_usd: c.summary.cost_usd, finished_at: new Date().toISOString(), params: { ...run.params, collect: c.summary } });
  if (c.summary.resubmit.length) console.log(`generate: ${c.summary.resubmit.length} retryable failure(s) — run \`npm run content:collect -- --run ${run?.id ?? "?"} --resubmit\``);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
