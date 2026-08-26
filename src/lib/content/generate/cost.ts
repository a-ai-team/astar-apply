// Cost model for the dry-run gate (CONTENT_MAX_BATCH_USD) and for the actual cost recorded on
// generation_runs after collection. Prices from the /claude-api skill (Aug 2026), USD per MTok.
export const PRICE_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};
export const BATCH_DISCOUNT = 0.5;
export const CACHE_READ_MULTIPLIER = 0.1;
export const CACHE_WRITE_MULTIPLIER = 1.25;

export function maxBatchUsd(): number {
  const v = Number(process.env.CONTENT_MAX_BATCH_USD);
  return Number.isFinite(v) && v > 0 ? v : 80;
}

/** Local fallback when count_tokens is unavailable (no credit): ≈ 3.5 characters per token. */
export function heuristicTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

export type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null };

/** USD for one message's usage (batch pricing when `batch`). */
export function usageCost(usage: Usage, model: string, opts: { batch?: boolean } = {}): number {
  const p = PRICE_PER_MTOK[model] ?? PRICE_PER_MTOK["claude-opus-5"];
  const disc = opts.batch ? BATCH_DISCOUNT : 1;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const usd =
    (usage.input_tokens * p.input + cacheRead * p.input * CACHE_READ_MULTIPLIER + cacheWrite * p.input * CACHE_WRITE_MULTIPLIER + usage.output_tokens * p.output) / 1_000_000;
  return usd * disc;
}

export type Estimate = {
  requests: number;
  input_tokens: number;
  output_tokens: number;
  usd: number;
  method: "count_tokens" | "heuristic";
  cap_usd: number;
  within_cap: boolean;
};

/**
 * Estimates a batch: system prompt counted once (cached after the first request → ~0.1×) plus
 * every user turn, plus expected output. `countTokens` (the API) is tried first; on any failure the
 * heuristic is used and `method` says so.
 */
export async function estimateBatch(
  reqs: { system: string; user: string; expected_output_tokens: number }[],
  model: string,
  countTokens?: (params: { system: string; user: string }) => Promise<number>,
): Promise<Estimate> {
  let method: Estimate["method"] = "heuristic";
  let input = 0;
  let output = 0;
  if (reqs.length === 0) return { requests: 0, input_tokens: 0, output_tokens: 0, usd: 0, method, cap_usd: maxBatchUsd(), within_cap: true };
  let systemTokens = heuristicTokens(reqs[0].system);
  let userTokens = reqs.map((r) => heuristicTokens(r.user));
  if (countTokens) {
    try {
      // One real count for the shared system + first user turn; scale the rest by the heuristic ratio.
      const real = await countTokens({ system: reqs[0].system, user: reqs[0].user });
      const ratio = real / (systemTokens + userTokens[0]);
      systemTokens = Math.round(systemTokens * ratio);
      userTokens = userTokens.map((u) => Math.round(u * ratio));
      method = "count_tokens";
    } catch {
      method = "heuristic";
    }
  }
  for (const [i, r] of reqs.entries()) {
    // First request writes the cache (1.25×); the rest read it (0.1×).
    input += userTokens[i] + (i === 0 ? systemTokens * CACHE_WRITE_MULTIPLIER : systemTokens * CACHE_READ_MULTIPLIER);
    output += r.expected_output_tokens;
  }
  const p = PRICE_PER_MTOK[model] ?? PRICE_PER_MTOK["claude-opus-5"];
  const usd = ((input * p.input + output * p.output) / 1_000_000) * BATCH_DISCOUNT;
  const cap = maxBatchUsd();
  return { requests: reqs.length, input_tokens: Math.round(input), output_tokens: output, usd, method, cap_usd: cap, within_cap: usd <= cap };
}
