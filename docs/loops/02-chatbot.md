# Loop 02 — Mentor chatbot v1

_Status: merged (partial). Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
student asks in `/home/mentor`, gets a streamed answer in mentor voice with clickable citations, keeps threads, thumbs answers; eval harness exists and gates `src/lib/ai/**`.
## Out of scope
lesson retrieval (06), voice, sharing, multi-persona, rate limiting beyond a daily cap.
## Research at start
Next `15-route-handlers.md`, `02-guides/streaming.md`, `backend-for-frontend.md`; Claude skill `streaming.md`, `prompt-caching.md`, README § Citations (`document` blocks, `content_block_location`), `model-migration.md` § Opus 5 refusal fallbacks; `rag-design.md`; RRF (k=60).
## User stories
streamed answer with "[1] Tesleem – …" chips opening the quoted chunk; "Tesleem hasn't covered this — here's the standard answer" when nothing relevant; persistent renameable threads; `/admin/feedback` shows thumbs-down with retrieved chunks; `npm run eval -- --suite retrieval,chat` prints and gates.
## Data model — `0003_chat.sql`
`chat_threads(id, user_id, title, mentor_id, timestamps, last_message_at)`; `chat_messages(id, thread_id cascade, role, content jsonb, retrieval jsonb {queries,intent,candidates,reranked}, prompt_version, model, usage, latency_ms, created_at)`; `chat_feedback(id, message_id, user_id, vote ±1, comment; unique(message_id,user_id))`; `usage_daily(user_id, day, messages, input_tokens, output_tokens)` + `increment_usage()`. RLS own rows; staff read feedback.
## Routes/screens
`/home/mentor`, `/home/mentor/[threadId]` (`ChatLayout`: `ThreadList` + `ChatPanel`/`Composer`/`MessageBubble`/`CitationChip`/`CitationDrawer`/`FeedbackButtons`); `POST /api/chat` (session check, `CHAT_DAILY_CAP` 60, SSE events `retrieval|delta|citation|done`, persists both messages, `maxDuration = 60`); `POST /api/chat/feedback`; actions `renameThread`, `deleteThread`; `/admin/feedback`; `src/lib/chat/{pipeline,retrieve,rewrite,answer,cite}.ts`; prompts `chat-rewrite.v1`, `chat-mentor.v1`; `src/lib/ai/rerank.ts`.
## AI pipeline
(1) Haiku rewrite/route → `{queries[1..3], intent technical|fit|application|firm|offtopic, entities, standalone_question}` with last 6 turns. (2) Hybrid: per query `match_corpus_chunks` top-20 ∪ `search_corpus_fts` top-20 → RRF → top-12; intent filters kinds; vector weight 0.25 under `local`. (3) Rerank to top-6 with floor; empty → rung `prior`. (4) Opus 5 `beta.messages.stream`, fallbacks default, effort medium, max_tokens 4096; cached system = persona + citation rules + voice guide (≥ 1024 tokens); one `document` block per chunk (`type: content`, `title` = label, `citations: enabled`); state the rung in the first sentence when ≠ corpus. (5) Map API citations → `chunk_id`, emit events, store. (6) Refusal after fallback → fixed apology + log.
## Eval harness (created here)
`scripts/eval/{index,judge,thresholds,suites/retrieval,suites/chat,extract-400q,overlap}.ts`; `fixtures/eval/retrieval.jsonl` (60 pairs against fixture chunk slugs), `fixtures/eval/chat-mentor.jsonl` (20 original); `extract-400q.ts` writes `$EVAL_HIDDEN_DIR/.eval/400q.jsonl` and `chat-hidden.jsonl` (one Q per subtopic, ≈ 45); chat suite runs pipeline in-process; prints `HIDDEN SET MISSING` when absent.
## Scripts
above + `scripts/dev/chat-cli.ts`, `scripts/seed/02-chat.ts` (demo thread).
## Env
`CHAT_DAILY_CAP`, `CHAT_MODEL`, `EVAL_HIDDEN_DIR`, `EVAL_JUDGE_MODEL`.
## Risks
citation index mapping (recorded-response unit test); Node runtime + `maxDuration`; one persona keeps cache stable; local embeddings may miss 0.80 → 0.70 recorded.
## Acceptance checks
- [x] lint/typecheck/build
- [x] vitest RRF/citation mapper/SSE encoder (31 tests: rrf, cite via recorded fixture, sse, rewrite, overlap)
- [x] `seed -- 01 02` idempotent (01 needs `CORPUS_EXTRACTION_MODE=fixture` without credit; 02 run twice → same thread)
- [x] retrieval ≥ 0.80 (0.70 local) — **recall@5 = 0.883, recall@1 = 0.683** on `local` (FTS-only) — 60 pairs
- [ ] chat `--limit 20` correctness ≥ 3.8, faithfulness ≥ 4.2, citation ≥ 95 % — **not run: NO API CREDIT** (suite skips cleanly, exit 0)
- [x] Playwright `e2e/02-chat.spec.ts` (10/10 incl. 00/01 specs; chip click opens drawer; thumbs-up survives reload; thread in sidebar)
- [x] unauthenticated `POST /api/chat` → 401 (curl against `next start` + Playwright)
- [x] cap → 429 (`CHAT_DAILY_CAP=1` in playwright.config.ts; e2e resets `usage_daily` first)
- [ ] `cache-check` shows cache reads > 0 — **not run: NO API CREDIT**

## Tasks
- [x] migration 0003 + cap fn
- [x] rewrite + tests
- [x] retrieve/RRF/rerank
- [x] answer + cite + recorded test
- [x] SSE route + persistence + feedback route
- [x] chat UI
- [x] `/admin/feedback`
- [x] eval core + suites + fixtures
- [x] extract-400q + overlap
- [x] CI eval job
- [x] Playwright/curl/docs/retro

## Blocked-on-human (defaults)
bot name → "Mentor"; voice → single "A* mentor who has done the process" persona, citations attribute the actual mentor.


## Blocked
- **NO API CREDIT** (`ANTHROPIC_API_KEY` valid, `credit balance is too low`, verified by
  `scripts/dev/api-probe.ts` at 00:0x and again at 00:2x). Consequences: the live answer path
  (Opus 5 stream + citations), the Haiku rewrite/rerank, the chat eval suite, the judge and
  `cache:check` have never executed against the API. Everything is implemented per the contracts
  and compiles/typechecks, but is unverified end-to-end. `CHAT_MODE=auto` resolves to `fixture`
  until James tops up. The recorded citation fixture (`fixtures/recorded/chat-mentor.v1.sample.json`)
  is hand-authored in the documented response shape — re-record once live.
  Output of the probe:
  `api-probe: BILLING — 400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."}}`
- `VOYAGE_API_KEY` empty → embeddings `local-hash-v1`, rerank `identity`; retrieval eval labelled
  FTS-only. Set the key and `npm run reembed` to get the real hybrid path.
- 400Q section assignment: `docs/research/400q-taxonomy.md` counts sum to 419 vs 413 extracted
  questions, so the last (industry) section labels drift by a few questions. 40 hidden questions
  were written (target ≈ 45); good enough for a judge set, tidy up when the chat suite first runs.

## Retro
- **Shipped:** migration `0003_chat` (4 tables, RLS, `increment_usage()`), `src/lib/chat/{types,mode,
  rewrite,rrf,retrieve,cite,answer,pipeline,sse,store}`, `src/lib/ai/{probe,rerank}`, prompts
  `chat-rewrite.v1` + `chat-mentor.v1` (cached, ≥ 1024 tokens), `POST /api/chat` (SSE, cap 60/day,
  persistence), `POST /api/chat/feedback`, `/home/mentor` + `/[threadId]` (ThreadList w/ rename/delete,
  ChatPanel streaming, CitationChip/Drawer, FeedbackButtons), `/admin/feedback`, eval harness
  (`scripts/eval/{index,run,judge,thresholds,overlap,extract-400q,suites/*}`), 60 retrieval pairs +
  20 mentor questions, `api-probe`, `chat-cli`, `dump-chunks`, `seed -- 02`, CI eval job,
  `e2e/02-chat.spec.ts`, `docs/CHAT.md`, db:check 12/12. Retrieval recall@5 0.883 (local).
- **Slipped:** live Opus/Haiku path, chat eval + judge, `cache:check` (no credit — see Blocked);
  Haiku rerank + Voyage rerank untested; hidden set is 40 not ≈ 45 questions.
- **Decisions taken by default:** bot name "Mentor"; one persona, citations carry the real
  mentor's `display_name` (falls back to "Mentor"); `CHAT_MODE` auto→fixture on billing/auth
  failure (fixture = real retrieval + deterministic quoted answer); FTS terms are OR-ed
  (`ftsQuery`) — AND-ing every term gave recall@5 0.52, OR-ing 0.88; relevance floor = FTS hit or
  cosine ≥ 0.3 (local) / 0.55 (voyage); intent `fit|application|firm` searches `qa|note|paragraph|
  slide` only; `offtopic` → no retrieval, rung `prior`; cap check increments first and rolls back
  on 429; e2e runs with `workers: 1` because two concurrent magic links for the same user
  invalidate each other (this was a latent race in 00/01 specs); `seed -- 02` re-creates the demo
  thread's messages on every run; `/admin/feedback` defaults to thumbs-down.
- **Loop 03 must know:** (1) `verifySession()` + `createAdminClient()` pattern now has a chat
  example in `src/app/api/chat/route.ts`; the SSE bridge (`sseResponse` + async generator) and
  `createSseParser` are reusable for any streamed feature. (2) Everything that calls Claude must
  keep working offline: check `resolveChatMode()` / `probeApi()` and provide a fixture path, or
  Playwright/CI will fail. (3) Loop 01's text chunker attaches the *previous* section's heading to
  each overlap window (see `dump-chunks`: "## Equity value to enterprise value" chunk starts with
  the depreciation walk) — labels for text sources are therefore off by one section; fix in the
  chunker (Loop 01 code) before the curriculum lessons are chunked in Loop 06.
