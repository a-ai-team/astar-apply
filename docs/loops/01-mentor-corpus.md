# Loop 01 — Mentor corpus ingestion

_Status: in-progress. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
a mentor/admin uploads photos, PDFs, notes and Q&A pairs; each becomes a `corpus_source` with type-aware `corpus_chunks` (embeddings, tsvector, tags, page refs); staff browse, edit, tag, approve. Nothing student-facing.
## Out of scope
chat/retrieval API (02), voice memos, per-mentor namespaces, public mentor profiles.
## Research at start
Next `15-route-handlers.md`, `07-mutating-data.md`, `authentication.md` § DAL; Supabase Storage signed upload URLs + `storage.objects` RLS, pgvector HNSW; Claude skill `typescript/claude-api/README.md` (vision, PDF document blocks), `files-api.md`, `shared/prompt-caching.md`; `docs/research/rag-design.md`; `pdfjs-dist` legacy build in Node.
## User stories
mentor drops 5 photos → transcribed to markdown with confidence within a minute; pastes a Q&A pair → one atomic chunk; admin uploads a deck → one chunk per slide with page number; staff browse/filter/edit/approve at `/admin/corpus`; `npm run seed -- 01` yields ~40 approved synthetic chunks.
## Data model — `0002_corpus.sql`
`create extension vector`; `corpus_sources(id, mentor_id→mentors null, uploaded_by→profiles, kind enum photo|pdf|text|qa|voice, title, storage_path (bucket `corpus`, private), mime, bytes, page_count, raw_text, extraction jsonb, extraction_model, extraction_confidence, status content_status, topic_tags text[], timestamps)`; `corpus_chunks(id, source_id cascade, mentor_id, kind enum note|slide|qa|paragraph|formula|table, ordinal, text, question, answer, page_ref, region jsonb, topic_tags text[], entities jsonb, embedding vector(1024), embedding_model, tsv generated (question ∥ text), status, token_count, timestamps)`; HNSW cosine on embedding, GIN on tsv/topic_tags, btree (status, mentor_id); `set_updated_at()`, `is_admin/is_mentor/is_staff()`; storage bucket + staff policies; RLS staff-only (students reach chunks only via service role in Loop 02 handlers). SQL functions `match_corpus_chunks(query_embedding, n, status, kinds[])`, `search_corpus_fts(q, n)`.
## Routes/screens
`/admin/corpus` (table + filters), `/admin/corpus/upload` (`UploadDropzone` → signed upload URL → server action `createSources` → redirect; Q&A and text tabs), `/admin/corpus/[id]` (original viewer + `ChunkEditor`/`ChunkList`, Approve/Reject/Re-extract/Re-chunk); `POST /api/corpus/[id]/process` (staff, idempotent), `GET /api/corpus/[id]/signed-url`; `src/lib/corpus/{extract,chunk,ingest,tags}.ts`; `src/lib/ai/{client,embeddings,prompts/corpus-extract.v1,prompts/corpus-tag.v1}.ts`; components `src/components/corpus/*`.
## AI
Extract (photo): Opus 5, ≤ 4 images/call, `messages.parse` `CorpusExtractionSchema {pages:[{page, markdown, formulas[{latex,plain}], tables, confidence, illegible_regions}]}`, effort high. Extract (PDF): same schema, PDF `document` block (split > 100 pages) + `pdfjs-dist` text as hint. Chunk (code): `qa` → 1; pdf → per page, merge < 40 tokens; text/photo → heading-aware 200–400 tokens, 15 % overlap; formulas intact. Tag: Haiku structured `{topic_tags (from taxonomy slugs), entities{firms,programmes}}`, 20 chunks/call. Embed on approve only, 64/call. `scripts/dev/cache-check.ts` verifies cache reads.
## Scripts
`scripts/seed/01-corpus.ts` (ingests `fixtures/corpus/*` ≈ 40 original placeholder chunks: 15 mentor-voice Q&A, 2 text docs, `voice-guide.md` placeholder `TODO(tesleem)`; creates Tesleem mentor row `is_public=false`); `scripts/corpus/reembed.ts`; `scripts/corpus/process.ts <id>`.
## Env
`EMBEDDINGS_PROVIDER`, `VOYAGE_API_KEY` (optional), `ANTHROPIC_API_KEY`, `EVAL_HIDDEN_DIR`, `CORPUS_BUCKET=corpus`.
## Risks
handwriting confidence < 0.6 → `in_review`; Vercel 4.5 MB body → browser signed uploads; pdfjs legacy build pinned + unit test; local embeddings → retrieval eval labelled "FTS-only".
## Acceptance checks
- [ ] lint/typecheck/build
- [ ] `db:migrate` applies 0002 and `scripts/db/check.ts` confirms tables/HNSW/RLS
- [ ] `seed -- 01` ≥ 40 approved embedded chunks, idempotent
- [ ] vitest chunker (qa→1; 3-page fixture PDF→3 with `page_ref`; long text windows) + extraction parse with recorded fixture
- [ ] Playwright `e2e/01-corpus.spec.ts` (mentor upload `fixtures/corpus/sample-note.png` → ≥ 1 chunk within 60 s → approve; student redirected from `/admin/corpus`)
- [ ] unauthenticated `POST /api/corpus/x/process` → 401/403

## Tasks
- [x] deps + `test:unit/test:e2e/seed/eval` scripts + `e2e/helpers/auth.ts`
- [x] `client.ts`, `embeddings.ts` + tests
- [x] migration 0002 + `scripts/db/check.ts`
- [ ] `src/lib/content/taxonomy.ts` constant
- [ ] extraction pipeline + recorded fixture
- [ ] chunker/tagger/ingest + process route
- [ ] admin corpus list/upload/detail
- [ ] fixtures + seed
- [ ] Playwright + curl + CI
- [ ] docs/retro; pre-commit check that no `*.pdf|*.jpg|.eval/` is staged

## Blocked-on-human (defaults)
Tesleem's uploads → synthetic fixtures only; voice guide → placeholder; content licence → yes with attribution.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
