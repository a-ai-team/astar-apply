// Ingest pipeline: source row → (download) → extract → chunk → tag → chunk rows; approve → embed.
// Server-only. Callers verify the session first (verifyStaff) — this module uses the service-role
// client and is also driven by scripts (seed, process, reembed).
import type { SupabaseClient } from "@supabase/supabase-js";
import { embed, embeddingModel } from "@/lib/ai/embeddings";
import { chunkPdf, chunkPhoto, chunkQa, chunkText, parseQa, type DraftChunk } from "./chunk";
import { extractImages, extractPdf, type ImageMime } from "./extract";
import { tagChunks, type ChunkTags } from "./tags";
import { CORPUS_BUCKET, LOW_CONFIDENCE, type ContentStatus, type CorpusSourceRow } from "./types";

export type ProcessResult = { sourceId: string; status: ContentStatus; chunks: number; confidence: number | null; model: string | null };

const IMAGE_MIMES: ImageMime[] = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * (Re)processes one source: extraction (photo/pdf), chunking, tagging. Idempotent — existing
 * chunks for the source are replaced. Never embeds (that happens on approve).
 */
export async function processSource(db: SupabaseClient, sourceId: string): Promise<ProcessResult> {
  const { data: source, error } = await db.from("corpus_sources").select("*").eq("id", sourceId).single<CorpusSourceRow>();
  if (error || !source) throw new Error(`source ${sourceId} not found`);

  let drafts: DraftChunk[] = [];
  let status: ContentStatus = "generated";
  const update: Partial<CorpusSourceRow> = { extraction_error: null };

  try {
    if (source.kind === "qa") {
      const qa = parseQa(source.raw_text ?? "");
      if (!qa) throw new Error("Q&A source needs raw_text in 'Q: …\\n\\nA: …' form");
      drafts = chunkQa(qa.question, qa.answer);
    } else if (source.kind === "text" || source.kind === "voice") {
      drafts = chunkText(source.raw_text ?? "", "paragraph");
    } else if (source.kind === "photo") {
      const file = await download(db, source);
      const mime = (IMAGE_MIMES as string[]).includes(source.mime ?? "") ? (source.mime as ImageMime) : "image/jpeg";
      const r = await extractImages([{ data: file, mime }]);
      Object.assign(update, { extraction: r.extraction, extraction_model: r.model, extraction_confidence: r.confidence, page_count: r.extraction.pages.length, raw_text: r.extraction.pages.map((p) => p.markdown).join("\n\n") });
      drafts = chunkPhoto(r.extraction);
      if (r.confidence < LOW_CONFIDENCE) status = "in_review";
    } else if (source.kind === "pdf") {
      const file = await download(db, source);
      const r = await extractPdf(file);
      Object.assign(update, { extraction: r.extraction, extraction_model: r.model, extraction_confidence: r.confidence, page_count: r.pageCount, raw_text: r.rawText });
      drafts = chunkPdf(r.extraction);
      if (r.confidence < LOW_CONFIDENCE) status = "in_review";
    }
    if (drafts.length === 0) {
      status = "in_review";
      drafts = [{ kind: source.kind === "pdf" ? "slide" : "note", ordinal: 0, text: `(No text was extracted from "${source.title}". Edit this chunk with the content, or re-extract.)`, token_count: 12 }];
    }
  } catch (e) {
    // Extraction failed (API down / no credit / unreadable file): keep the source, park it in
    // review with one editable placeholder chunk so the mentor can transcribe by hand.
    const msg = e instanceof Error ? e.message : String(e);
    update.extraction_error = msg.slice(0, 1000);
    status = "in_review";
    drafts = [{ kind: source.kind === "pdf" ? "slide" : "note", ordinal: 0, text: `(Transcription unavailable — ${msg.slice(0, 200)}. Edit this chunk with the note's content.)`, token_count: 24 }];
  }

  const tags = await tagChunks(drafts.map((d) => ({ id: String(d.ordinal), text: d.text })));
  const allTags = new Set<string>();
  for (const t of tags.values()) t.topic_tags.forEach((x) => allTags.add(x));

  const { error: delError } = await db.from("corpus_chunks").delete().eq("source_id", sourceId);
  if (delError) throw delError;
  const rows = drafts.map((d) => toRow(source, d, status, tags.get(String(d.ordinal))));
  const { error: insError } = await db.from("corpus_chunks").insert(rows);
  if (insError) throw insError;

  const { error: upError } = await db
    .from("corpus_sources")
    .update({ ...update, status, topic_tags: [...allTags] })
    .eq("id", sourceId);
  if (upError) throw upError;

  return { sourceId, status, chunks: rows.length, confidence: update.extraction_confidence ?? null, model: update.extraction_model ?? null };
}

function toRow(source: CorpusSourceRow, d: DraftChunk, status: ContentStatus, tags?: ChunkTags) {
  return {
    source_id: source.id,
    mentor_id: source.mentor_id,
    kind: d.kind,
    ordinal: d.ordinal,
    text: d.text,
    question: d.question ?? null,
    answer: d.answer ?? null,
    page_ref: d.page_ref ?? null,
    region: d.region ?? null,
    topic_tags: tags?.topic_tags ?? [],
    entities: tags?.entities ?? {},
    status,
    token_count: d.token_count,
    embedding: null,
    embedding_model: null,
  };
}

async function download(db: SupabaseClient, source: CorpusSourceRow): Promise<Uint8Array> {
  if (!source.storage_path) throw new Error("source has no storage_path");
  const { data, error } = await db.storage.from(CORPUS_BUCKET).download(source.storage_path);
  if (error || !data) throw new Error(`download failed: ${error?.message ?? "no data"}`);
  return new Uint8Array(await data.arrayBuffer());
}

/** Embeds chunks (64/call) and writes embedding + embedding_model. Returns count embedded. */
export async function embedChunks(db: SupabaseClient, chunks: { id: string; text: string; question: string | null }[]): Promise<number> {
  let n = 0;
  const model = embeddingModel();
  for (let i = 0; i < chunks.length; i += 64) {
    const batch = chunks.slice(i, i + 64);
    const vectors = await embed(batch.map((c) => (c.question ? `${c.question}\n${c.text}` : c.text)), { inputType: "document" });
    for (let j = 0; j < batch.length; j++) {
      const { error } = await db.from("corpus_chunks").update({ embedding: JSON.stringify(vectors[j]), embedding_model: model }).eq("id", batch[j].id);
      if (error) throw error;
      n++;
    }
  }
  return n;
}

/** Approve: every chunk of the source → approved + embedded; source → approved. */
export async function approveSource(db: SupabaseClient, sourceId: string): Promise<{ embedded: number }> {
  const { data: chunks, error } = await db.from("corpus_chunks").select("id, text, question").eq("source_id", sourceId);
  if (error) throw error;
  const embedded = await embedChunks(db, chunks ?? []);
  const { error: e1 } = await db.from("corpus_chunks").update({ status: "approved" }).eq("source_id", sourceId);
  if (e1) throw e1;
  const { error: e2 } = await db.from("corpus_sources").update({ status: "approved" }).eq("id", sourceId);
  if (e2) throw e2;
  return { embedded };
}

export async function setSourceStatus(db: SupabaseClient, sourceId: string, status: ContentStatus) {
  const { error: e1 } = await db.from("corpus_chunks").update({ status }).eq("source_id", sourceId);
  if (e1) throw e1;
  const { error: e2 } = await db.from("corpus_sources").update({ status }).eq("id", sourceId);
  if (e2) throw e2;
}
