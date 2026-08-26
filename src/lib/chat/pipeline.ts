// The chat pipeline, mode-agnostic and persistence-free so the route handler, the CLI and the eval
// harness all run the same code. Yields ChatEvents; the final `done` carries everything to store.
import type { SupabaseClient } from "@supabase/supabase-js";
import { chatMentorPrompt } from "@/lib/ai/prompts/chat-mentor.v2";
import type { ContextBundle } from "./context";
import { answerFixture, answerLive } from "./answer";
import { detectDisagreement, splitByOrigin, type Disagreement } from "./disagreement";
import { retrieve, rungFor } from "./retrieve";
import { rewriteQuery } from "./rewrite";
import type { ChatEvent, ChatMode, HistoryTurn, RetrievedChunk, Rewrite, Rung } from "./types";

export const PROMPT_VERSION = `${chatMentorPrompt.id}.v${chatMentorPrompt.version}`;

export type PipelineInput = {
  db: SupabaseClient;
  message: string;
  history: HistoryTurn[];
  mode: ChatMode;
  mentorNames?: Map<string, string>;
  /** Loop 06: the question / lesson block the thread was opened from (already loaded). */
  context?: ContextBundle | null;
  /** Loop 06: called with a detected corpus-vs-curriculum conflict and the curriculum chunks involved; returns review ids. */
  onDisagreement?: (d: Disagreement, content: RetrievedChunk[]) => Promise<string[]>;
};

export type DoneEvent = Extract<ChatEvent, { type: "done" }>;

export async function* runPipeline(input: PipelineInput): AsyncGenerator<ChatEvent, DoneEvent> {
  const started = Date.now();
  const rewrite = withContextHint(await rewriteQuery(input.message, input.history, input.mode), input.context);
  const { chunks, record } = await retrieve(input.db, rewrite, { mode: input.mode, mentorNames: input.mentorNames });
  const rung: Rung = rungFor(chunks);
  yield { type: "retrieval", rewrite, chunks: chunks.map((c) => ({ id: c.id, label: c.label })), rung };

  const answer = input.mode === "live" ? answerLive : answerFixture;
  const gen = answer({ question: input.message, history: input.history, chunks, rung, context: input.context ?? null });
  let result = await gen.next();
  while (!result.done) {
    yield result.value;
    result = await gen.next();
  }
  // Loop 06: when both rungs contributed, ask Haiku whether they contradict each other. Live
  // mode only (null in fixture mode); the route files the content_reviews row.
  const disagreement = result.value.refused ? null : await detectDisagreement({ question: input.message, answer: result.value.content.text, chunks, citations: result.value.content.citations }, input.mode);
  record.disagreement = disagreement;
  if (disagreement?.disagreement && input.onDisagreement) {
    try {
      const ids = await input.onDisagreement(disagreement, splitByOrigin(chunks, result.value.content.citations).content);
      record.disagreement = { ...disagreement, review_id: ids[0] ?? null };
    } catch (e) {
      console.warn("chat: could not file disagreement review", e);
    }
  }
  const done: DoneEvent = {
    type: "done",
    messageId: null,
    threadId: null,
    content: result.value.content,
    retrieval: record,
    latency_ms: Date.now() - started,
    prompt_version: PROMPT_VERSION,
  };
  yield done;
  return done;
}

/**
 * A thread opened from a question or lesson block: the item's text becomes an extra retrieval
 * query and short follow-ups ("explain this") are treated as technical, so the ladder reaches
 * the curriculum even when the message itself carries no keywords.
 */
export function withContextHint(rewrite: Rewrite, context?: ContextBundle | null): Rewrite {
  if (!context) return rewrite;
  const queries = [...new Set([...rewrite.queries, context.hint])].slice(0, 4);
  const intent = rewrite.intent === "offtopic" || rewrite.intent === "application" ? "technical" : rewrite.intent;
  const standalone = rewrite.standalone_question.length < 40 ? `${rewrite.standalone_question} (re: ${context.hint.slice(0, 160)})` : rewrite.standalone_question;
  return { ...rewrite, queries, intent, standalone_question: standalone };
}

/** Loads a mentor_id → display name map for citation labels. */
export async function loadMentorNames(db: SupabaseClient, chunksOrIds?: (RetrievedChunk | string)[]): Promise<Map<string, string>> {
  let q = db.from("profiles").select("id, display_name");
  if (chunksOrIds?.length) {
    const ids = [...new Set(chunksOrIds.map((c) => (typeof c === "string" ? c : c.mentor_id)).filter((x): x is string => Boolean(x)))];
    q = q.in("id", ids);
  }
  const { data } = await q;
  const map = new Map<string, string>();
  for (const row of data ?? []) if (row.display_name) map.set(row.id, row.display_name);
  return map;
}
