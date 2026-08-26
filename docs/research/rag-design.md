# Mentor chatbot — RAG design (research note, feeds Loops 1–2)

## What "well thought out" means here
Generic RAG (chunk 512 tokens, cosine top-k, stuff into prompt) fails on our corpus because the
corpus is small, heterogeneous and *opinionated*. The value is Tesleem's judgement, not facts Claude
already knows. So the design optimises for: (a) surfacing the mentor's actual take when one exists,
(b) admitting when it doesn't and falling back to curriculum content, (c) citing everything.

## Corpus shapes we expect from a mentor
| Shape | Example | Ingestion |
|---|---|---|
| Photos of handwritten/printed notes | Phone snaps of technicals notes | Claude vision → structured markdown (headings, formulas as LaTeX, tables) + confidence; human fix-up UI |
| PDFs / slides | Society workshop decks (e.g. LBO workshop) | PDF → per-page text + page images; slides chunk per slide |
| Q&A pairs | "What do they ask at Evercore?" → answer | Stored as atomic `question`/`answer` chunks, best retrieval unit |
| Long-form text | Application tips doc | Semantic chunking on headings, 200–400 tokens, 15% overlap |
| Voice memos (later) | Tesleem explaining a concept | Transcribe → long-form path |

Every chunk: `id, source_id, mentor_id, kind, text, embedding, topic_tags[], entities[]
(firms, programmes), page_ref, created_at, review_status`.

## Retrieval
1. **Query rewrite** (Haiku): expand the student's message into 2–3 search queries + detect
   intent (`technical | fit | application | firm-specific | off-topic`) + extract entities.
2. **Hybrid search**: pgvector cosine (Voyage `voyage-3-large`) ∪ Postgres `tsvector` BM25-ish, each
   top-20, reciprocal-rank-fusion, filter by intent-appropriate `kind`.
3. **Rerank** (Voyage rerank-2) to top-6; drop anything under a relevance floor rather than pad.
4. **Answer** (`claude-opus-5`, adaptive thinking, streaming): system prompt holds mentor persona
   + citation rules; retrieved chunks passed as `document` blocks with `citations: {enabled: true}`
   so the API returns verified citations instead of hallucinated ones.
5. **Fallback ladder**: mentor corpus → Technicals lessons (Loop 6) → Claude's own knowledge, and
   the answer *says which rung it used* ("Tesleem hasn't covered this; here's the standard answer").

### As built (Loops 02 + 06)
- Rewrite: Haiku live, regex heuristic offline. Intent decides the ladder: `technical` searches
  corpus ∪ curriculum; `fit/application/firm` corpus only; `offtopic` nothing.
- Curriculum retrieval unit = `content_chunks`: one chunk per approved lesson block (merged when
  < 30 tokens, widgets skipped; anchor `#block-<n>`) and one per approved question, embedded with
  the same provider as the corpus. Titles double as citation chips: `Technicals › Topic › Lesson ›
  Section`.
- Fusion: RRF per list → normalise per source (best = 1.0) → `+0.05` bias on corpus ids → floor
  → cap 24 → rerank → top-6. The additive bias is on normalised scores because raw RRF scores are
  ~1/61 per list; +0.05 on raw scores would be an override. Offline (identity rerank) the best
  lesson block and best question are guaranteed a slot so the lesson rung is reachable.
- Rung = corpus if any corpus chunk survived → lesson → prior; the prompt (`chat-mentor.v2`) tells
  the model to say which rung it is on and how curriculum documents are titled.
- Page context ("Ask Mentor about this") travels as a `role: "system"` message after the user
  turn — never in the cached system prompt.
- Corpus-vs-curriculum conflicts: Haiku detector → `content_reviews` row from `system-bot`; the
  answer keeps the mentor's version, the content is flagged, never edited.

## Prompting notes
- Persona prompt is stable and cached (`cache_control`); chunks and the question come after the
  breakpoint. Verify `usage.cache_read_input_tokens` > 0 in dev.
- Mentor voice guide: written by Tesleem in Loop 1 onboarding (a 300-word "how I'd say it").
- Refusal fallbacks on (`fallbacks: "default"`), so a safety refusal degrades gracefully.

## Evaluation (built in Loop 2, run in CI)
- **Retrieval**: 60 hand-labelled (question → expected chunk) pairs from the corpus; recall@5.
- **Answers**: hidden set derived from the 400Q taxonomy (one question per subtopic) + 20 mentor
  questions; LLM judge scores correctness (vs. reference standard), citation faithfulness,
  and voice. Thresholds gate merges to `src/lib/ai/`.
- **Feedback loop**: thumbs on each answer → `chat_feedback`; weekly mentor review of thumbs-down.

## Open questions for Loop 1 plan
- Storage bucket policy for raw photos (private; signed URLs, 1-hour).
- Whether mentors edit OCR'd markdown before or after embedding (recommend: embed on approve).
- Per-mentor namespaces vs shared corpus when mentor #2 joins (recommend: shared, `mentor_id`
  filter available; bot can be asked "what would X say").
