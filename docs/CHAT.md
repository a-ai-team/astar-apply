# Mentor chatbot (Loop 02)

How a student question becomes a cited, streamed answer. Plan: `docs/loops/02-chatbot.md`.
Contracts (message shape, thresholds): `docs/loops/CONTRACTS.md`.

## Flow (`src/lib/chat/pipeline.ts`)
1. **Rewrite / route** — `rewrite.ts`: Haiku `messages.parse` (`chat-rewrite.v1`) turns the message +
   last 6 turns into `{ queries[1..3], intent, entities, standalone_question }`. In fixture mode (or
   when Haiku fails) `heuristicRewrite()` does the same with regexes.
2. **Hybrid retrieval** — `retrieve.ts`: per query `match_corpus_chunks` (top-20, vector) ∪
   `search_corpus_fts` (top-20; content words OR-ed, `ftsQuery()`) → `rrf.ts` (k = 60; vector
   weight 0.25 under `local` embeddings, 1.0 under Voyage) → floor (FTS hit or cosine ≥ 0.3/0.55)
   → top-12 candidates. Intent filters chunk kinds; `offtopic` skips retrieval.
3. **Rerank** — `src/lib/ai/rerank.ts`: Voyage `rerank-2` → Haiku listwise → identity. Top-6.
   Empty → rung `prior`.
4. **Answer** — `answer.ts`. Live: Opus 5 `client.beta.messages.stream` with
   `betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`, adaptive thinking (default),
   `output_config.effort: "medium"`, `max_tokens: 4096`, cached system prompt (`chat-mentor.v1`,
   ≥ 1024 tokens), one `document` block per chunk (`source.type: "content"`, `title` = label,
   `citations: { enabled: true }`). Fixture: deterministic answer quoting the top chunks.
5. **Cite** — `cite.ts`: `content_block_location` / `char_location` → `{ chunk_id, source_id,
   label, quote, start, end }`. Recorded shape: `fixtures/recorded/chat-mentor.v1.sample.json`.
6. **Refusal after fallback** → fixed apology, logged, rung `prior`.

## Modes — `CHAT_MODE=live|fixture` (default `auto`)
`auto` probes the API once per process (`src/lib/ai/probe.ts`, CLI `scripts/dev/api-probe.ts`) and
falls back to `fixture` on a missing key / no credit / bad key. Playwright and CI force `fixture`.
Fixture mode still runs the real retrieval, so UI, persistence, feedback, caps and e2e are real.

## HTTP / UI
- `POST /api/chat` `{ threadId?, message }` → SSE `retrieval | delta | citation | done | error`
  (`sse.ts`). 401 without a session; 429 above `CHAT_DAILY_CAP` (default 60, `usage_daily` +
  `increment_usage()`); `maxDuration = 60`. Persists both messages (`store.ts`).
- `POST /api/chat/feedback` `{ messageId, vote: ±1, comment? }` → `chat_feedback` (one per user/message).
- `/home/mentor`, `/home/mentor/[threadId]` — `ChatPanel` (streams via `createSseParser`),
  `ThreadList` (rename/delete server actions), `CitationChip` → `CitationDrawer`, `FeedbackButtons`.
- `/admin/feedback` — staff view of votes with question, answer, citations and retrieved chunks.

## Evals — `npm run eval -- --suite retrieval,chat [--limit N]`
- `retrieval`: recall@5 over `fixtures/eval/retrieval.jsonl` (60 pairs) — 0.80, or 0.70 while
  `EMBEDDINGS_PROVIDER=local` ("FTS-only"). Runs real retrieval against the linked project.
- `chat`: pipeline in-process (live) over `fixtures/eval/chat-mentor.jsonl` (20) + hidden
  `$EVAL_HIDDEN_DIR/.eval/chat-hidden.jsonl`; Opus 5 judge (`judge.ts`). Prints
  `NO API CREDIT — chat suite skipped` (exit 0) when the key is unusable; `HIDDEN SET MISSING`
  when the hidden file is absent.
- `scripts/eval/extract-400q.ts` is the only code that reads the private PDF; it writes only to
  `$EVAL_HIDDEN_DIR/.eval/`. `scripts/eval/overlap.ts` reports 8-gram overlap (must be 0).
- CI runs both suites on PRs touching `src/lib/ai/**`, `src/lib/chat/**`, `scripts/eval/**` when
  the secrets exist.

## Scripts
`scripts/dev/chat-cli.ts "question" [--mode live|fixture]`, `scripts/dev/api-probe.ts`,
`scripts/dev/dump-chunks.ts`, `scripts/seed/02-chat.ts` (demo thread, `npm run seed -- 02`).
