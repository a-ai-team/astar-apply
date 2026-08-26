// Disagreement detector (Loop 06). When an answer drew on both rungs — mentor corpus AND
// curriculum — Haiku checks whether the two sources contradict each other on the student's point.
// A hit files a `content_reviews` row (decision changes_requested, reviewer = the system-bot
// profile) against the lesson/question so a mentor sees a badge in /admin/review. The content is
// never edited (plan default: answer with the corpus, flag the lesson, never silently edit).
// Fixture mode (no API credit, Playwright, CI) never calls the API: `detectDisagreement` returns
// null; the parsing + filing path is unit-tested with a recorded Haiku response.
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MODEL_FAST, getClient } from "@/lib/ai/client";
import { chatDisagreementPrompt } from "@/lib/ai/prompts/chat-disagreement.v1";
import { documentText } from "./cite";
import type { ChatMode, Citation, RetrievedChunk } from "./types";

export const DisagreementSchema = z.object({ disagreement: z.boolean(), summary: z.string() });
export type Disagreement = z.infer<typeof DisagreementSchema>;

export const SYSTEM_BOT_EMAIL = "system-bot@astar.test";
export const DISAGREEMENT_PROMPT_VERSION = `${chatDisagreementPrompt.id}.v${chatDisagreementPrompt.version}`;

/** Chunks the answer actually cited (falls back to everything retrieved), split by origin. */
export function splitByOrigin(chunks: RetrievedChunk[], citations: Citation[]): { corpus: RetrievedChunk[]; content: RetrievedChunk[] } {
  const cited = new Set(citations.map((c) => c.chunk_id));
  const used = cited.size ? chunks.filter((c) => cited.has(c.id)) : chunks;
  return { corpus: used.filter((c) => c.origin !== "content"), content: used.filter((c) => c.origin === "content") };
}

/** Both rungs contributed → worth a check. */
export function shouldCheck(chunks: RetrievedChunk[], citations: Citation[]): boolean {
  const { corpus, content } = splitByOrigin(chunks, citations);
  return corpus.length > 0 && content.length > 0;
}

export function buildDisagreementInput(question: string, answer: string, corpus: RetrievedChunk[], content: RetrievedChunk[]): string {
  const block = (tag: string, cs: RetrievedChunk[]) => cs.map((c) => `<${tag} title="${c.label.replace(/"/g, "'")}">\n${documentText(c).slice(0, 2500)}\n</${tag}>`).join("\n");
  return `<question>${question}</question>\n\n${block("mentor", corpus)}\n\n${block("curriculum", content)}\n\n<answer>\n${answer.slice(0, 3000)}\n</answer>`;
}

/** Parses a (recorded or live) Haiku structured-output message into a Disagreement, or null when unusable. */
export function parseDisagreement(parsed: unknown): Disagreement | null {
  const r = DisagreementSchema.safeParse(parsed);
  if (!r.success) return null;
  return { disagreement: r.data.disagreement, summary: r.data.disagreement ? r.data.summary.trim().slice(0, 600) : "" };
}

export async function detectDisagreement(
  input: { question: string; answer: string; chunks: RetrievedChunk[]; citations: Citation[] },
  mode: ChatMode,
): Promise<Disagreement | null> {
  if (mode !== "live" || !shouldCheck(input.chunks, input.citations)) return null;
  const { corpus, content } = splitByOrigin(input.chunks, input.citations);
  try {
    const res = await getClient().beta.messages.parse({
      model: MODEL_FAST,
      max_tokens: 400,
      system: [{ type: "text", text: chatDisagreementPrompt.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildDisagreementInput(input.question, input.answer, corpus, content) }],
      output_config: { format: betaZodOutputFormat(DisagreementSchema) },
    });
    return parseDisagreement(res.parsed_output);
  } catch (e) {
    console.warn("chat: disagreement check failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

export type DisagreementTarget = { target_type: "lesson" | "question"; target_id: string; label: string };

/** The curriculum items to flag: one per distinct lesson/question among the content chunks. */
export function disagreementTargets(content: RetrievedChunk[]): DisagreementTarget[] {
  const out = new Map<string, DisagreementTarget>();
  for (const c of content) {
    if (!c.content) continue;
    const id = c.content.kind === "lesson_block" ? c.content.lesson_id : c.content.question_id;
    if (!id || out.has(id)) continue;
    out.set(id, { target_type: c.content.kind === "lesson_block" ? "lesson" : "question", target_id: id, label: c.label });
  }
  return [...out.values()];
}

export function disagreementComment(d: Disagreement, ref: { threadId: string | null; messageId: string | null; question: string }): string {
  return [
    `[system-bot] Mentor corpus disagrees with this content (${DISAGREEMENT_PROMPT_VERSION}).`,
    d.summary,
    `Student asked: "${ref.question.slice(0, 200)}"`,
    ref.threadId ? `Thread: /home/mentor/${ref.threadId}${ref.messageId ? ` (message ${ref.messageId})` : ""}` : "",
    "The answer used the mentor's version; the content was not changed — review and edit if the lesson is wrong.",
  ].filter(Boolean).join("\n");
}

/** Looks up (memoised per process) the system-bot reviewer profile; null when seed 00 has not created it. */
let botId: Promise<string | null> | null = null;
export function systemBotId(db: SupabaseClient): Promise<string | null> {
  if (!botId) {
    botId = (async () => {
      const { data } = await db.from("profiles").select("id").eq("display_name", "System bot").limit(1).maybeSingle();
      return (data?.id as string | undefined) ?? null;
    })();
  }
  return botId;
}

/** Files one content_reviews row per flagged item. Returns the review ids. */
export async function fileDisagreement(
  db: SupabaseClient,
  d: Disagreement,
  content: RetrievedChunk[],
  ref: { threadId: string | null; messageId: string | null; question: string },
): Promise<string[]> {
  if (!d.disagreement) return [];
  const targets = disagreementTargets(content);
  if (!targets.length) return [];
  const reviewer = await systemBotId(db);
  const comment = disagreementComment(d, ref);
  const { data, error } = await db
    .from("content_reviews")
    .insert(targets.map((t) => ({ target_type: t.target_type, target_id: t.target_id, reviewer_id: reviewer, decision: "changes_requested", comment })))
    .select("id");
  if (error) throw error;
  return (data ?? []).map((r) => r.id as string);
}
