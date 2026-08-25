// Row shapes for corpus_sources / corpus_chunks (supabase/migrations/0002_corpus.sql).
export type ContentStatus = "draft" | "generated" | "in_review" | "approved" | "rejected" | "archived";
export type SourceKind = "photo" | "pdf" | "text" | "qa" | "voice";
export type ChunkKind = "note" | "slide" | "qa" | "paragraph" | "formula" | "table";

export type CorpusSourceRow = {
  id: string;
  mentor_id: string | null;
  uploaded_by: string | null;
  kind: SourceKind;
  title: string;
  storage_path: string | null;
  mime: string | null;
  bytes: number | null;
  page_count: number | null;
  raw_text: string | null;
  extraction: unknown | null;
  extraction_model: string | null;
  extraction_confidence: number | null;
  extraction_error: string | null;
  status: ContentStatus;
  topic_tags: string[];
  created_at: string;
  updated_at: string;
};

export type CorpusChunkRow = {
  id: string;
  source_id: string;
  mentor_id: string | null;
  kind: ChunkKind;
  ordinal: number;
  text: string;
  question: string | null;
  answer: string | null;
  page_ref: number | null;
  region: Record<string, unknown> | null;
  topic_tags: string[];
  entities: { firms?: string[]; programmes?: string[] };
  embedding_model: string | null;
  status: ContentStatus;
  token_count: number | null;
  created_at: string;
  updated_at: string;
};

export const CORPUS_BUCKET = process.env.CORPUS_BUCKET ?? "corpus";
export const LOW_CONFIDENCE = 0.6;
