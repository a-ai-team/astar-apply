# Loop 06 — Chatbot ↔ Technicals fusion

_Status: in-progress. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
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
- [ ] lint/typecheck/build
- [ ] vitest ladder + bias
- [ ] `content:index` populates chunks
- [ ] `eval --suite retrieval,chat` keeps Loop 02 thresholds + lesson-citation ≥ 0.80
- [ ] Playwright `e2e/06-fusion.spec.ts` (Ask Mentor from a question → thread quotes it → answer has a `lesson` chip → chip navigates to anchor)
- [ ] disagreement path unit-tested with recorded response

## Tasks
- [x] migration + fns
- [x] indexer + approve hook
- [x] union/ladder/bias/cap
- [ ] prompt v2 + context injection
- [ ] thread context + `/new`
- [ ] `AskMentorButton` placements
- [ ] content chips + anchors
- [ ] disagreement detector + badge
- [ ] fixture + suite
- [ ] Playwright, `rag-design.md` as-built, retro

## Blocked-on-human (defaults)
conflicts → answer with corpus, flag lesson, never silently edit.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
