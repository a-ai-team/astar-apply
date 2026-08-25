// One Anthropic client for the whole app (docs/loops/CONTRACTS.md § AI module, .claude/rules/ai.md).
// Import only from server code (route handlers, server actions, scripts) — never from the browser.
import Anthropic from "@anthropic-ai/sdk";

export const MODEL_CHAT = "claude-opus-5";
export const MODEL_JUDGE = "claude-opus-5";
export const MODEL_FAST = "claude-haiku-4-5";

/** Every Opus 5 call goes through `client.beta.messages.*` with these (server-side refusal fallbacks). */
export const OPUS_BETAS = ["server-side-fallback-2026-07-01"] as const;
export const OPUS_FALLBACKS = "default" as const;

let _client: Anthropic | null = null;

/** Lazily constructed so importing this module never throws when ANTHROPIC_API_KEY is unset. */
export function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set (see .env.example)");
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 });
  }
  return _client;
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
