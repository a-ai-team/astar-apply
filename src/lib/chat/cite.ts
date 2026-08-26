// Documents in, citations out. Each retrieved chunk becomes one `document` block
// (`source.type: "content"`, one text block, `title` = label, `citations.enabled`). The API returns
// `content_block_location` citations whose `document_index` maps straight back to the chunk.
import type Anthropic from "@anthropic-ai/sdk";
import type { Citation, RetrievedChunk } from "./types";
import { contentHref } from "./retrieve";

export function buildDocuments(chunks: RetrievedChunk[]): Anthropic.Beta.BetaRequestDocumentBlock[] {
  return chunks.map((c) => ({
    type: "document",
    source: { type: "content", content: [{ type: "text", text: documentText(c) }] },
    title: c.label,
    citations: { enabled: true },
  }));
}

/** Q&A chunks are presented as question + answer so the model can quote either. */
export function documentText(c: Pick<RetrievedChunk, "text" | "question" | "answer">): string {
  if (c.question && c.answer) return `Q: ${c.question}\n\nA: ${c.answer}`;
  return c.text;
}

type ApiCitation = Anthropic.Beta.BetaTextCitation;

/**
 * Maps an API citation to our Citation. Handles `content_block_location` (what content documents
 * return) and `char_location` (plain-text documents); anything else → null.
 */
export function mapCitation(c: ApiCitation, chunks: RetrievedChunk[]): Citation | null {
  if (c.type !== "content_block_location" && c.type !== "char_location") return null;
  const chunk = chunks[c.document_index];
  if (!chunk) return null;
  const full = documentText(chunk);
  const quote = (c.cited_text ?? "").trim();
  let start = 0;
  let end = full.length;
  if (c.type === "char_location") {
    start = c.start_char_index;
    end = c.end_char_index;
  } else if (quote) {
    const idx = full.indexOf(quote);
    if (idx >= 0) {
      start = idx;
      end = idx + quote.length;
    }
  }
  return citationFor(chunk, quote || full.slice(start, end), start, end);
}

/** Builds a Citation for a chunk: `kind` and the deep link follow the chunk's origin (corpus | lesson | question). */
export function citationFor(chunk: RetrievedChunk, quote: string, start: number, end: number): Citation {
  const base = { chunk_id: chunk.id, source_id: chunk.source_id, label: chunk.label, quote, start, end };
  if (chunk.origin === "content" && chunk.content) {
    return { ...base, kind: chunk.content.kind === "lesson_block" ? "lesson" : "question", href: contentHref(chunk.content) };
  }
  return { ...base, kind: "corpus" };
}

/** De-duplicates by chunk (first quote wins) and assigns 1-based display indexes in order of appearance. */
export function dedupeCitations(citations: Citation[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of citations) {
    if (seen.has(c.chunk_id)) continue;
    seen.add(c.chunk_id);
    out.push(c);
  }
  return out;
}
