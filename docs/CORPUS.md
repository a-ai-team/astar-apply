# Mentor corpus (Loop 01)

How a mentor's material becomes retrievable chunks. Plan: `docs/loops/01-mentor-corpus.md`.

## Flow
1. **Upload** at `/admin/corpus/upload` (staff only). Files go browser → Supabase Storage (private
   bucket `corpus`) via a signed upload URL from the `prepareUploads` server action, so Vercel's
   body limit never applies. Q&A and pasted text are inserted directly.
2. **Process** — `POST /api/corpus/[id]/process` (idempotent): `src/lib/corpus/ingest.ts`
   `processSource()` downloads the file, runs `extract.ts` (Opus 5 `messages.parse` with
   `CorpusExtractionSchema`; PDFs also get a `pdfjs-dist` text hint), chunks with `chunk.ts`
   (qa → 1 · pdf → per page · text/photo → heading-aware 200–400 tokens, 15 % overlap), tags with
   `tags.ts` (Haiku, or a keyword heuristic offline), and replaces the source's `corpus_chunks`.
   Confidence < 0.6 or a failed extraction → status `in_review` with an editable placeholder chunk.
3. **Review** at `/admin/corpus/[id]`: original (signed URL) beside the chunks; edit text/tags,
   approve/reject per chunk or per source, Re-extract.
4. **Approve** → `approveSource()` embeds every chunk (`src/lib/ai/embeddings.ts`, 64/call) and
   sets `approved`. Only approved chunks are retrievable.

## Retrieval surface for Loop 02 (service-role rpc)
- `match_corpus_chunks(query_embedding vector(1024), n int = 8, p_status content_status = 'approved', kinds corpus_chunks_kind[] = null)` → rows + `similarity`
- `search_corpus_fts(q text, n int = 8, p_status content_status = 'approved')` → rows + `rank`
Pass the embedding as `JSON.stringify(number[])`. Both return
`id, source_id, mentor_id, kind, ordinal, text, question, answer, page_ref, topic_tags, entities`.

## Offline mode
`CORPUS_EXTRACTION_MODE=fixture` (default when `ANTHROPIC_API_KEY` is unset; forced in Playwright
and CI) returns `fixtures/recorded/corpus-extract.v1.*.json` instead of calling the API, and tags
heuristically. `EMBEDDINGS_PROVIDER=local` is a deterministic hashed 1024-d embedding; switch to
Voyage by setting `VOYAGE_API_KEY` and running `npm run reembed`.

## Fixtures
Everything under `fixtures/corpus/` is synthetic and headed "PLACEHOLDER". The 3-page sample PDF is
built in memory by `fixtures/corpus/sample-pdf.ts` (PDFs are never committed).
