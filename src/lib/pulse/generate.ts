// Pulse digest generation (Loop 08). Live: (1) a research pass — Opus 5 with the server-side
// `web_search_20260209` tool (max_uses 8, allowed_domains from PULSE_ALLOWED_DOMAINS), resumed on
// `pause_turn`; (2) a structured pass — `beta.messages.parse` with DigestBodySchema over the notes,
// with every cited URL checked against the URLs the search actually returned. Fixture (no credit,
// CI, --dry-run): the recorded research sample + the synthetic sample-week body. Both paths return
// the same shape; `storeDigest` writes `pulse_digests` as `generated` unless PULSE_AUTO_PUBLISH=true.
import { readFileSync } from "node:fs";
import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MODEL_CHAT, OPUS_BETAS, OPUS_FALLBACKS, getClient } from "@/lib/ai/client";
import { pulseDigestPrompt } from "@/lib/ai/prompts/pulse-digest.v1";
import { pulseSearchPrompt } from "@/lib/ai/prompts/pulse-search.v1";
import { allowedDomains, DigestBodySchema, validateDigest, type DigestBody } from "./schema";

export const PULSE_SEARCH_VERSION = `${pulseSearchPrompt.id}.v${pulseSearchPrompt.version}`;
export const PULSE_DIGEST_VERSION = `${pulseDigestPrompt.id}.v${pulseDigestPrompt.version}`;
export const FIXTURE_DIGEST_VERSION = "fixture:sample-week.v1";
export const MAX_SEARCHES = 8;

export type SearchResult = { title: string; url: string };
export type ResearchResult = { notes: string; results: SearchResult[]; searches_used: number; usage?: { input: number; output: number } };
export type DigestResult = { body: DigestBody; model: string; prompt_version: string; research: ResearchResult; dropped: string[] };

export function pulseModel(): string {
  return process.env.PULSE_MODEL || MODEL_CHAT;
}

export function autoPublish(): boolean {
  return /^(1|true|yes)$/i.test(process.env.PULSE_AUTO_PUBLISH ?? "");
}

/** Pulls every web_search_result (title + url) out of a response; error blocks are skipped, not thrown. */
export function collectSearchResults(content: Anthropic.Beta.BetaContentBlock[]): { results: SearchResult[]; errors: string[]; searches: number } {
  const results: SearchResult[] = [];
  const errors: string[] = [];
  let searches = 0;
  for (const b of content) {
    if (b.type === "server_tool_use") searches++;
    if (b.type !== "web_search_tool_result") continue;
    if (Array.isArray(b.content)) {
      for (const r of b.content) if (r.type === "web_search_result") results.push({ title: r.title, url: r.url });
    } else {
      errors.push(b.content.error_code);
    }
  }
  const seen = new Set<string>();
  return { results: results.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true))), errors, searches };
}

export function textOf(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("\n");
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Keeps only stories whose sources are URLs the research pass actually saw (or, failing that, on an
 * allowed domain); stories left with no source are dropped. Returns the digest and what was dropped.
 */
export function enforceSources(body: DigestBody, seen: SearchResult[], domains: string[]): { body: DigestBody | null; dropped: string[] } {
  const seenUrls = new Set(seen.map((s) => s.url));
  const dropped: string[] = [];
  const stories = body.stories.flatMap((s) => {
    const sources = s.sources.filter((src) => seenUrls.has(src.url) || domains.some((d) => hostOf(src.url) === d || hostOf(src.url).endsWith(`.${d}`)));
    if (!sources.length) {
      dropped.push(s.headline);
      return [];
    }
    return [{ ...s, sources }];
  });
  if (stories.length < 3) return { body: null, dropped };
  return { body: { ...body, stories }, dropped };
}

export async function researchLive(weekStart: string): Promise<ResearchResult> {
  const client = getClient();
  const domains = allowedDomains();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: `Week starting Monday ${weekStart}. Allowed publications: ${domains.join(", ")}. Research the week and write the notes.` }];
  const content: Anthropic.Beta.BetaContentBlock[] = [];
  let usage = { input: 0, output: 0 };
  for (let i = 0; i < 6; i++) {
    const res = await client.beta.messages.stream({
      model: pulseModel(),
      max_tokens: 16000,
      betas: [...OPUS_BETAS],
      fallbacks: OPUS_FALLBACKS,
      output_config: { effort: "high" },
      system: [{ type: "text", text: pulseSearchPrompt.system, cache_control: { type: "ephemeral" } }],
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES, allowed_domains: domains }],
      messages,
    }).finalMessage();
    usage = { input: usage.input + res.usage.input_tokens, output: usage.output + res.usage.output_tokens };
    if (res.stop_reason === "refusal") throw new Error(`pulse research refused (${res.stop_details?.category ?? "unknown"})`);
    content.push(...res.content);
    if (res.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: res.content });
  }
  const { results, errors, searches } = collectSearchResults(content);
  if (errors.length) console.warn(`pulse research: search errors ${errors.join(", ")}`);
  return { notes: textOf(content), results, searches_used: searches, usage };
}

export async function digestLive(research: ResearchResult): Promise<{ body: DigestBody; dropped: string[] }> {
  const res = await getClient().beta.messages.parse({
    model: pulseModel(),
    max_tokens: 16000,
    betas: [...OPUS_BETAS],
    fallbacks: OPUS_FALLBACKS,
    output_config: { effort: "high", format: betaZodOutputFormat(DigestBodySchema) },
    system: [{ type: "text", text: pulseDigestPrompt.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `<research_notes>\n${research.notes}\n</research_notes>\n\n<seen_urls>\n${research.results.map((r) => `- ${r.title} — ${r.url}`).join("\n") || "(none)"}\n</seen_urls>` }],
  });
  if (res.stop_reason === "refusal") throw new Error(`pulse digest refused (${res.stop_details?.category ?? "unknown"})`);
  const v = validateDigest(res.parsed_output);
  if (!v.ok) throw new Error(`pulse digest failed schema: ${v.errors.join("; ")}`);
  const enforced = enforceSources(v.value, research.results, allowedDomains());
  if (!enforced.body) throw new Error(`pulse digest: fewer than 3 sourced stories after dropping [${enforced.dropped.join("; ")}]`);
  return { body: enforced.body, dropped: enforced.dropped };
}

export function loadFixtureResearch(): ResearchResult {
  const p = path.join(process.cwd(), "fixtures", "recorded", "pulse-search.v1.sample.json");
  const raw = JSON.parse(readFileSync(p, "utf8")) as ResearchResult;
  return { notes: raw.notes, results: raw.results, searches_used: raw.searches_used };
}

export function digestFixture(): DigestResult {
  const p = path.join(process.cwd(), "fixtures", "pulse", "sample-week.json");
  const raw = JSON.parse(readFileSync(p, "utf8")) as { body: unknown };
  const v = validateDigest(raw.body);
  if (!v.ok) throw new Error(`fixtures/pulse/sample-week.json: ${v.errors.join("; ")}`);
  const research = loadFixtureResearch();
  const enforced = enforceSources(v.value, research.results, ["example.com"]);
  if (!enforced.body) throw new Error("fixture digest lost its sources");
  return { body: enforced.body, model: "fixture", prompt_version: FIXTURE_DIGEST_VERSION, research, dropped: enforced.dropped };
}

export async function generateDigest(weekStart: string, mode: "live" | "fixture"): Promise<DigestResult> {
  if (mode === "fixture") return digestFixture();
  const research = await researchLive(weekStart);
  const { body, dropped } = await digestLive(research);
  return { body, model: pulseModel(), prompt_version: `${PULSE_SEARCH_VERSION}+${PULSE_DIGEST_VERSION}`, research, dropped };
}

/** Upserts the week's digest. Never downgrades an approved row; status is `generated` unless PULSE_AUTO_PUBLISH. */
export async function storeDigest(db: SupabaseClient, weekStart: string, d: DigestResult, opts: { force?: boolean } = {}): Promise<{ id: string; status: string; skipped?: string }> {
  const { data: existing } = await db.from("pulse_digests").select("id, status").eq("week_start", weekStart).maybeSingle();
  if (existing && existing.status === "approved" && !opts.force) return { id: existing.id as string, status: "approved", skipped: "already approved" };
  if (existing && !opts.force) return { id: existing.id as string, status: existing.status as string, skipped: "already generated (use --force)" };
  const status = autoPublish() ? "approved" : "generated";
  const { data, error } = await db.from("pulse_digests").upsert({ week_start: weekStart, status, body: d.body, model: d.model, prompt_version: d.prompt_version, generated_at: new Date().toISOString() }, { onConflict: "week_start" }).select("id, status").single();
  if (error) throw error;
  return { id: data.id as string, status: data.status as string };
}
