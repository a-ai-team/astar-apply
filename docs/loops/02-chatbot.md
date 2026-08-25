# Loop 02 — Mentor chatbot v1

_Status: planned. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
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
- [ ] lint/typecheck/build
- [ ] vitest RRF/citation mapper/SSE encoder
- [ ] `seed -- 01 02` idempotent
- [ ] retrieval ≥ 0.80 (0.70 local)
- [ ] chat `--limit 20` correctness ≥ 3.8, faithfulness ≥ 4.2, citation ≥ 95 %
- [ ] Playwright `e2e/02-chat.spec.ts` (student sends "what is enterprise value" → bubble with ≥ 1 chip in 45 s → thumbs-up persists → thread in sidebar)
- [ ] unauthenticated `POST /api/chat` → 401
- [ ] cap → 429 (cap=1 in test env)
- [ ] `cache-check` shows cache reads > 0

## Tasks
- [x] migration 0003 + cap fn
- [ ] rewrite + tests
- [ ] retrieve/RRF/rerank
- [ ] answer + cite + recorded test
- [ ] SSE route + persistence + feedback route
- [ ] chat UI
- [ ] `/admin/feedback`
- [ ] eval core + suites + fixtures
- [ ] extract-400q + overlap
- [ ] CI eval job
- [ ] Playwright/curl/docs/retro

## Blocked-on-human (defaults)
bot name → "Mentor"; voice → single "A* mentor who has done the process" persona, citations attribute the actual mentor.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
