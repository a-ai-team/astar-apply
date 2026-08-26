// Shapes shared by the chat pipeline, the SSE route, the UI and the eval harness.
// Message content contract: docs/loops/CONTRACTS.md § Chat message.
import type { ChunkKind } from "@/lib/corpus/types";

export type ChatMode = "live" | "fixture";

export type Intent = "technical" | "fit" | "application" | "firm" | "offtopic";

export type Rewrite = {
  queries: string[];
  intent: Intent;
  entities: { firms: string[]; programmes: string[] };
  standalone_question: string;
};

/** Where a retrieved chunk came from: the mentor corpus (corpus_chunks) or the curriculum (content_chunks). */
export type ChunkOrigin = "corpus" | "content";

/** Deep-link data carried by curriculum chunks (Loop 06). */
export type ContentRef = {
  kind: "lesson_block" | "question";
  lesson_id: string | null;
  question_id: string | null;
  block_index: number | null;
  block_type: string | null;
  slug: string;
  topic_slug: string;
};

export type RetrievedChunk = {
  id: string;
  /** corpus: corpus_sources.id · content: lessons.id / questions.id */
  source_id: string;
  mentor_id: string | null;
  kind: ChunkKind | ContentRef["kind"];
  origin: ChunkOrigin;
  /** Present when origin === "content". */
  content?: ContentRef;
  ordinal: number;
  text: string;
  question: string | null;
  answer: string | null;
  page_ref: number | null;
  topic_tags: string[];
  entities: { firms?: string[]; programmes?: string[] };
  /** Fused score (RRF) — higher is better. */
  score: number;
  /** Signals that fed the fusion, for /admin/feedback and the eval harness. */
  signals: { fts_rank?: number; similarity?: number };
  /** "<Mentor> – <question or heading>" shown on the citation chip and used as the document title. */
  label: string;
};

export type Rung = "corpus" | "lesson" | "prior";

export type Citation = {
  chunk_id: string;
  source_id: string;
  kind: "corpus" | "lesson" | "question";
  label: string;
  quote: string;
  start: number;
  end: number;
  /** lesson|question citations: where the chip deep-links (`/home/technicals/<topic>/<lesson>#block-n` or `/home/practice/<slug>`). */
  href?: string;
};

/** Where "Ask Mentor" was pressed (chat_threads.context). */
export type ThreadContext = { lesson_id?: string; question_id?: string; attempt_id?: string; block_index?: number };

export type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens: number | null };

export type MessageContent = {
  text: string;
  citations: Citation[];
  rung: Rung;
  model: string;
  usage: Usage | null;
};

export type RetrievalRecord = {
  queries: string[];
  intent: Intent;
  candidates: { id: string; label: string; score: number; signals: RetrievedChunk["signals"]; origin?: ChunkOrigin }[];
  reranked: { id: string; label: string; origin?: ChunkOrigin }[];
  provider: { embeddings: string; rerank: string; mode: ChatMode };
  /** Loop 06: which sources the ladder searched for this intent. */
  sources?: ChunkOrigin[];
  /** Loop 06: Haiku disagreement check ({ disagreement, summary }) when both rungs contributed. */
  disagreement?: { disagreement: boolean; summary: string; review_id?: string | null } | null;
};

export type HistoryTurn = { role: "user" | "assistant"; text: string };

/** Events streamed over SSE (`POST /api/chat`) and yielded by the in-process pipeline. */
export type ChatEvent =
  | { type: "retrieval"; rewrite: Rewrite; chunks: { id: string; label: string }[]; rung: Rung }
  | { type: "delta"; text: string }
  | { type: "citation"; citation: Citation; index: number }
  | {
      type: "done";
      messageId: string | null;
      threadId: string | null;
      content: MessageContent;
      retrieval: RetrievalRecord;
      latency_ms: number;
      prompt_version: string;
    }
  | { type: "error"; message: string };
