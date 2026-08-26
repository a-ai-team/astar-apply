// Message Batches plumbing (docs/loops/04 § AI, /claude-api batches.md): build → submit → poll →
// results, keyed by `custom_id` (results arrive in any order). The raw result rows are the
// same shape the API streams back (`{ custom_id, result }`), which is also the shape of
// fixtures/recorded/batch-results.jsonl, so `parseResultRow` is shared by the live collector,
// the fixture path and the unit tests. Batches omit `betas`/`fallbacks` (CONTRACTS.md).
import type Anthropic from "@anthropic-ai/sdk";
import type { BatchRequest } from "./requests";
import type { Usage } from "./cost";

export const POLL_INTERVAL_MS = 60_000;
export const POLL_MAX_MS = 4 * 60 * 60 * 1000;

/** One line of a batch results JSONL (mirrors Anthropic.Messages.Batches.MessageBatchIndividualResponse). */
export type ResultRow = {
  custom_id: string;
  result:
    | { type: "succeeded"; message: { content: { type: string; text?: string }[]; stop_reason: string | null; usage: Usage; model?: string } }
    | { type: "errored"; error: { type: string; error?: { type: string; message: string } } }
    | { type: "canceled" }
    | { type: "expired" };
};

export type ParsedRow =
  | { custom_id: string; ok: true; output: unknown; usage: Usage; model: string | null; stop_reason: string | null }
  | { custom_id: string; ok: false; error: string; retryable: boolean; usage: Usage | null };

/** Extracts the structured-output JSON from a result row. Never throws. */
export function parseResultRow(row: ResultRow): ParsedRow {
  const id = row.custom_id;
  const r = row.result;
  if (r.type === "errored") {
    const msg = r.error.error?.message ?? r.error.type;
    return { custom_id: id, ok: false, error: `errored: ${msg}`, retryable: r.error.type !== "invalid_request", usage: null };
  }
  if (r.type === "expired") return { custom_id: id, ok: false, error: "expired", retryable: true, usage: null };
  if (r.type === "canceled") return { custom_id: id, ok: false, error: "canceled", retryable: true, usage: null };
  const usage = r.message.usage;
  if (r.message.stop_reason === "refusal") return { custom_id: id, ok: false, error: "refusal", retryable: false, usage };
  if (r.message.stop_reason === "max_tokens") return { custom_id: id, ok: false, error: "max_tokens: output truncated", retryable: true, usage };
  const text = r.message.content.filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
  try {
    return { custom_id: id, ok: true, output: JSON.parse(text), usage, model: r.message.model ?? null, stop_reason: r.message.stop_reason };
  } catch (e) {
    return { custom_id: id, ok: false, error: `invalid JSON in output: ${(e as Error).message}`, retryable: true, usage };
  }
}

export function parseResultsJsonl(text: string): ResultRow[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as ResultRow & { _note?: string })
    .filter((r) => !("_note" in r) && typeof r.custom_id === "string");
}

export async function submitBatch(client: Anthropic, requests: BatchRequest[]): Promise<{ id: string; processing_status: string }> {
  const batch = await client.messages.batches.create({ requests });
  return { id: batch.id, processing_status: batch.processing_status };
}

export type BatchStatus = { id: string; processing_status: string; counts: { processing: number; succeeded: number; errored: number; canceled: number; expired: number }; ended_at: string | null };

export async function batchStatus(client: Anthropic, id: string): Promise<BatchStatus> {
  const b = await client.messages.batches.retrieve(id);
  return { id: b.id, processing_status: b.processing_status, counts: b.request_counts, ended_at: b.ended_at };
}

/** Polls every `intervalMs` until `ended` or `maxMs` elapses (returns the last status either way). */
export async function pollBatch(client: Anthropic, id: string, opts: { intervalMs?: number; maxMs?: number; onTick?: (s: BatchStatus) => void; sleep?: (ms: number) => Promise<void> } = {}): Promise<BatchStatus> {
  const interval = opts.intervalMs ?? POLL_INTERVAL_MS;
  const max = opts.maxMs ?? POLL_MAX_MS;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const start = Date.now();
  for (;;) {
    const s = await batchStatus(client, id);
    opts.onTick?.(s);
    if (s.processing_status === "ended") return s;
    if (Date.now() - start >= max) return s;
    await sleep(interval);
  }
}

/** Streams every result row for an ended batch. */
export async function fetchResults(client: Anthropic, id: string): Promise<ResultRow[]> {
  const rows: ResultRow[] = [];
  for await (const r of await client.messages.batches.results(id)) rows.push(r as unknown as ResultRow);
  return rows;
}
