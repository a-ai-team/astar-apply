# Loop 06 — Chatbot ↔ Technicals fusion

_Status: merged (partial) — live Opus/Haiku paths, judged chat thresholds and cache verification blocked on API credit. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
bot also retrieves from approved lessons/questions with "Technicals › EqV/EV › The bridge" citations; "Ask Mentor about this" on every question card/lesson block/flashcard opens a pre-contextualised thread; full ladder corpus → lesson → prior, evaluated.
## Out of scope
bot editing content, multi-persona, tools beyond retrieval.
## Research at start
Loop 02 retro; `retrieve.ts`; Claude README § mid-conversation system messages (Opus 5 `role: "system"` in `messages` for lesson context without breaking cache).
## Data model — `0007_chat_technicals.sql`
`content_chunks(id, kind lesson_block|question, lesson_id, question_id, block_index, topic_id, subtopic_id, title, text, embedding vector(1024), tsv, status, updated_at)`; `chat_threads.context jsonb {lesson_id?, question_id?, attempt_id?}`; citation kinds gain `lesson|question`; `match_content_chunks`, `search_content_fts`. `scripts/content/index-content.ts` rebuilds from approved content (one chunk per block, merge < 30 tokens) and embeds; approve action re-indexes one item.
## Routes/screens
`/api/chat` accepts `context`; ladder by intent (`technical` → corpus then content; `fit/application/firm` → corpus; `offtopic` → prior + nudge); `AskMentorButton` → `/home/mentor/new?question=&attempt=`; content chips deep-link to `#block-n` or question page; disagreement detector (Haiku `{disagreement, summary}`) → `content_reviews` row from `system-bot` + admin badge; `/admin/feedback` gains Rung column.
## AI
system prompt v2 (ladder + content citation format, same cached structure); context via appended system message; rerank over union capped at 24 with +0.05 RRF bias to corpus.
## Scripts
`index-content.ts`; `fixtures/eval/chat-curriculum.jsonl` (30 Qs with expected lesson slug); chat suite gains `lesson_citation_rate`.
## Acceptance checks
- [x] lint/typecheck/build
- [x] vitest ladder + bias (`src/lib/chat/retrieve.test.ts`: sourcesForIntent, fuseUnion bias 0.05 + cap 24, rungFor, contentHref; 103 unit tests total)
- [x] `content:index` populates chunks (2 lessons + 6 questions → 29 `content_chunks`; `db:check` all green)
- [ ] `eval --suite retrieval,chat` keeps Loop 02 thresholds + lesson-citation ≥ 0.80 — **partial**: retrieval recall@5 0.867 (local, ≥ 0.70 ✓; identical to `main` on this DB), `lesson_citation_rate` 0.958 / `expected_hit_rate` 0.917 **in fixture mode** ✓; correctness / faithfulness / corpus-citation judged parts skipped (`NO API CREDIT`) → see Blocked
- [x] Playwright `e2e/06-fusion.spec.ts` 3/3 (21/21 overall): Ask Mentor from a question → thread quotes it → `lesson` chip → anchor in view + highlighted; lesson-block + flashcard placements; `/new` 404s for drafts/unknown ids, 400 for bad context
- [x] disagreement path unit-tested with recorded response (`fixtures/recorded/chat-disagreement.v1.sample.json`, 7 tests — the response is hand-authored in Haiku's structured-output shape; re-record with `scripts/dev/record-disagreement.ts` when credit exists)

## Tasks
- [x] migration + fns
- [x] indexer + approve hook
- [x] union/ladder/bias/cap
- [x] prompt v2 + context injection
- [x] thread context + `/new`
- [x] `AskMentorButton` placements
- [x] content chips + anchors
- [x] disagreement detector + badge
- [x] fixture + suite
- [x] Playwright, `rag-design.md` as-built, retro

## Blocked-on-human (defaults)
conflicts → answer with corpus, flag lesson, never silently edit.


## Blocked
- **No API credit** (`ANTHROPIC_API_KEY` → 400 "credit balance is too low"; `CHAT_MODE=auto` resolves to `fixture`). Blocked live checks, in the order to run them once James tops up:
  1. `npm run eval -- --suite retrieval,chat` — judged correctness ≥ 3.8 / faithfulness ≥ 4.2 / corpus-citation ≥ 95 % and the **live** `lesson_citation_rate` (Opus 5 with `chat-mentor.v2`, Haiku rewrite + rerank). Fixture-mode numbers: 0.958 / 0.917.
  2. `npm run cache:check` — confirm `usage.cache_read_input_tokens > 0` with the v2 prompt and that the appended `role: "system"` context message does not invalidate the prefix (`src/lib/chat/answer.ts`).
  3. `npx tsx scripts/dev/record-disagreement.ts` — replace the hand-authored Haiku response in `fixtures/recorded/chat-disagreement.v1.sample.json`; then `npx vitest run src/lib/chat/disagreement.test.ts`.
  4. Exercise the disagreement path end to end: ask a technical question whose mentor note contradicts a lesson (none exists in the synthetic corpus yet) and check `/admin/review` for `⚠ mentor disagrees`.
  5. The `role: "system"` mid-conversation message is Opus 5 / Fable 5 only; the 400 fallback (`isSystemRoleRejected`) is untested live.
- `content_chunks` is small (29 rows) until the Loop 04 batches run; re-run `npm run content:index` after `content:load` / `content:approve` (approve.ts already indexes what it approves) and extend `fixtures/eval/chat-curriculum.jsonl` (24 rows now; the plan said 30).

## Retro
- **Shipped:** migration `0007_chat_technicals` (`content_chunks` + HNSW/GIN, `chat_threads.context`, `match_content_chunks`, `search_content_fts`, staff-only RLS, service_role grants; `db:check` +6); chunker heading carry-over fix (Loop 02 retro bug, +1 test); `src/lib/content/{block-labels,index-chunks,index-content}.ts` + `npm run content:index` (29 chunks) with re-index hooks in `decideReview`, `regenerateOne`, `saveLesson`, `scripts/content/approve.ts`; `retrieve.ts` union (ladder by intent, per-source-normalised RRF + `CORPUS_BIAS` 0.05, `UNION_CAP` 24, offline ladder guarantee, `rungFor`, `contentHref`); `chat-mentor.v2` prompt; `context.ts` (question/attempt/lesson-block bundles → `role: "system"` message after the user turn, 400 fallback to a `<context>` block); `/api/chat` `context` → `chat_threads.context`; `/home/mentor/new` landing with auto-sent opening message + header chip; `AskMentorButton` on `QuestionCard` (carries `attemptId` once graded), every lesson block (`#block-<n>` anchors with `:target` highlight), flipped flashcards; `CitationChip` deep-links for `lesson|question`; `/admin/feedback` rung badge + curriculum candidates; `disagreement.ts` + `chat-disagreement.v1` + `system-bot@astar.test` profile (seed 00) + `⚠ mentor disagrees` badge in `/admin/review`; `fixtures/eval/chat-curriculum.jsonl` (24) + chat-suite fusion pass; `e2e/06-fusion.spec.ts` (3); 22 new unit tests (103 total); docs `CHAT.md` § Fusion, `TECHNICALS.md` § Mentor fusion, `rag-design.md` § As built, CONTRACTS `href?` note.
- **Slipped:** every live-API check (see Blocked); the recorded Haiku disagreement response is hand-authored; the `/admin/feedback` "Rung column" is a badge on the existing row rather than a table column; `chat-curriculum.jsonl` has 24 rows not 30 (only 8 approved items to write against).
- **Decisions taken by default:** (1) `+0.05` bias is applied to **per-source-normalised** RRF scores (best corpus = best curriculum = 1.0), because +0.05 on raw RRF (~1/61 per list) let any weak corpus window bury every lesson block — with it, `lesson_citation_rate` was 0 in fixture mode. (2) Offline ladder guarantee: with the identity reranker the best lesson block and best question stay in the top-6; a real reranker's order stands. (3) The retrieval eval measures corpus recall only (`sources: ["corpus"]`); curriculum recall lives in the chat suite. (4) `lesson_citation_rate` counts any lesson|question citation; `expected_hit_rate` (exact slug) is printed, not gated. (5) The fixture answer cites up to 3 corpus + 2 curriculum chunks so chips exist offline. (6) Opening message of an Ask-Mentor thread is `Explain this question|lesson section to me: <item>` and is auto-sent (one click, thread title = the item). (7) Thread context is re-loaded from `chat_threads.context` every turn (approved rows only) rather than trusted from the client. (8) Disagreement rows use decision `changes_requested` with a `[system-bot]` comment prefix and never change the item's status; reviewer = a real `system-bot` profile (role mentor, never signs in). (9) The heuristic `TECHNICAL` intent regex grew (three statements, inventory, payables, assets…) so fixture-mode retrieval reaches the curriculum; Haiku decides intent live. (10) Widgets produce no chunk and no Ask-Mentor link. (11) `blockLabel`/`BLOCK_LABELS` moved to `src/lib/content/block-labels.ts` (React-free) and `Section` re-exports it.
- **Loop 07 must know:** (1) **Grading reuse points:** `src/lib/chat/context.ts` `renderQuestionContext()` already renders question + model answer + key points + weak-answer note + the student's attempt (`self_grade`, `answer_text`) as model-ready text — the mock-interview grader can reuse it as the rubric block; `disagreement.ts` is the template for a small Haiku/Opus structured-output call with a fixture branch (`mode !== "live"` → null) and a recorded-response unit test; `answerLive` shows the streaming + `role: "system"` context pattern for an interviewer persona. (2) **`attempts` linkage:** `recordAttempt` returns `attemptId`; `QuestionCard` keeps it in state and `AskMentorButton` passes it as `?attempt=` → `chat_threads.context.attempt_id`; Loop 07 should fill `attempts.ai_score`/`ai_feedback` on that same row and set `interview_id` (0008 adds the FK) so a thread opened from a mock turn can carry `{ question_id, attempt_id }` unchanged. (3) Every new Claude call needs the fixture branch (`resolveChatMode()` → `"fixture"` without credit) or Playwright/CI fail. (4) `content_chunks` must be re-indexed after content loads (`npm run content:index`); `seed -- 05` after that for cards. (5) Citation `href` is the deep-link contract for chips; anchors are `#block-<n>` on `/home/technicals/[topic]/[lesson]`.
