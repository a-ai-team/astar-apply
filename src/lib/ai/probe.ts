// One cheap Haiku call to find out whether the API key is usable. Classifies the failure so the
// chat pipeline (src/lib/chat/mode.ts) and the eval harness (scripts/eval) can fall back to fixture
// mode / skip cleanly instead of failing on every request. Result is memoised per process.
import Anthropic from "@anthropic-ai/sdk";
import { MODEL_FAST, getClient, hasAnthropicKey } from "./client";

export type ProbeResult =
  | { ok: true; model: string }
  | { ok: false; reason: "no-key" | "billing" | "auth" | "other"; message: string };

let cached: Promise<ProbeResult> | null = null;

export function classifyApiError(e: unknown): ProbeResult {
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return { ok: false, reason: "auth", message: e.message };
  }
  if (e instanceof Anthropic.APIError && /credit balance|billing|payment/i.test(e.message)) {
    return { ok: false, reason: "billing", message: e.message };
  }
  return { ok: false, reason: "other", message: e instanceof Error ? e.message : String(e) };
}

/** True when the failure means "no point retrying this process": missing key, no credit, bad key. */
export function isCredentialFailure(r: ProbeResult): boolean {
  return !r.ok && (r.reason === "no-key" || r.reason === "billing" || r.reason === "auth");
}

export function probeApi(opts: { force?: boolean } = {}): Promise<ProbeResult> {
  if (cached && !opts.force) return cached;
  cached = (async (): Promise<ProbeResult> => {
    if (!hasAnthropicKey()) return { ok: false, reason: "no-key", message: "ANTHROPIC_API_KEY is not set" };
    try {
      const res = await getClient().messages.create(
        { model: MODEL_FAST, max_tokens: 1, messages: [{ role: "user", content: "ping" }] },
        { maxRetries: 0, timeout: 15_000 },
      );
      return { ok: true, model: res.model };
    } catch (e) {
      return classifyApiError(e);
    }
  })();
  return cached;
}
