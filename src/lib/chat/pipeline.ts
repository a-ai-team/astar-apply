// The chat pipeline, mode-agnostic and persistence-free so the route handler, the CLI and the eval
// harness all run the same code. Yields ChatEvents; the final `done` carries everything to store.
import type { SupabaseClient } from "@supabase/supabase-js";
import { chatMentorPrompt } from "@/lib/ai/prompts/chat-mentor.v1";
import { answerFixture, answerLive } from "./answer";
import { retrieve } from "./retrieve";
import { rewriteQuery } from "./rewrite";
import type { ChatEvent, ChatMode, HistoryTurn, RetrievedChunk, Rung } from "./types";

export const PROMPT_VERSION = `${chatMentorPrompt.id}.v${chatMentorPrompt.version}`;

export type PipelineInput = {
  db: SupabaseClient;
  message: string;
  history: HistoryTurn[];
  mode: ChatMode;
  mentorNames?: Map<string, string>;
};

export type DoneEvent = Extract<ChatEvent, { type: "done" }>;

export async function* runPipeline(input: PipelineInput): AsyncGenerator<ChatEvent, DoneEvent> {
  const started = Date.now();
  const rewrite = await rewriteQuery(input.message, input.history, input.mode);
  const { chunks, record } = await retrieve(input.db, rewrite, { mode: input.mode, mentorNames: input.mentorNames });
  const rung: Rung = chunks.length ? "corpus" : "prior";
  yield { type: "retrieval", rewrite, chunks: chunks.map((c) => ({ id: c.id, label: c.label })), rung };

  const answer = input.mode === "live" ? answerLive : answerFixture;
  const gen = answer({ question: input.message, history: input.history, chunks, rung });
  let result = await gen.next();
  while (!result.done) {
    yield result.value;
    result = await gen.next();
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
