// CHAT_MODE=live|fixture|auto (default auto). "fixture" runs the real retrieval but composes the
// answer deterministically from the top chunks (no API spend) — Playwright and CI force it, and
// "auto" falls back to it when the probe fails on a missing key / no credit / bad key.
import { isCredentialFailure, probeApi } from "@/lib/ai/probe";
import type { ChatMode } from "./types";

export function configuredChatMode(): ChatMode | "auto" {
  const m = process.env.CHAT_MODE;
  if (m === "live" || m === "fixture") return m;
  return "auto";
}

let resolved: ChatMode | null = null;

/** Resolves once per process; "auto" probes the API a single time. */
export async function resolveChatMode(): Promise<ChatMode> {
  const configured = configuredChatMode();
  if (configured !== "auto") return configured;
  if (resolved) return resolved;
  const r = await probeApi();
  if (!r.ok) {
    if (!isCredentialFailure(r)) console.warn(`chat: API probe failed (${r.reason}: ${r.message}) — using fixture mode`);
    else console.warn(`chat: ${r.reason === "billing" ? "NO API CREDIT" : r.reason} — using fixture mode`);
  }
  resolved = r.ok ? "live" : "fixture";
  return resolved;
}

export function chatDailyCap(): number {
  const n = Number(process.env.CHAT_DAILY_CAP ?? 60);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60;
}
