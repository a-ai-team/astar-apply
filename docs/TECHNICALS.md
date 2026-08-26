# Technicals — curriculum & content model (Loop 03)

How the Technicals section is structured, where content lives, and how to add or edit a lesson.
Contracts (Lesson JSON, Question JSON) are in `docs/loops/CONTRACTS.md`; the plan and retro in
`docs/loops/03-technicals-model.md`.

## Data model (`supabase/migrations/0004_technicals.sql`)
`topics` (9) → `subtopics` (53) → `lessons` (body = Lesson JSON). `questions` hang off a topic and
optionally a subtopic. `learning_paths` + `learning_path_items` (week × day → lesson) hold the
default 10-week path. RLS: authenticated users read `approved` rows only; staff read/write all.
Drafts are therefore a 404 for students.

## Source of truth
- Taxonomy: `src/lib/content/taxonomy.ts` — `CURRICULUM` (topics/subtopics, `is_free`,
  `source_section` label, `target_questions` for Loop 04, `walkthrough` flag) and `DEFAULT_PATH`.
  Never rename a slug once seeded; add freely.
- Content: `content/lessons/<slug>.json` and `content/questions/<slug>.json` — the reviewable
  artefact. Validate with `npm run content:validate`; load with `npm run content:load` (or the seed).
- Seed: `npm run seed -- 03` (idempotent) upserts topics, subtopics, content and the path.

## Validators (`src/lib/content/`)
- `lesson-schema.ts` — `LessonBodySchema`, `LessonBlockSchema`, `BLOCK_TYPES`,
  `validateLessonBody()`, `approvalProblems()`, `assertApprovable(body, { walkthrough })`,
  `evalExpr()` (re-checks `worked_calc` arithmetic).
- `question-schema.ts` — `QuestionSchema`, `validateQuestion()`, `splitQuestion()` (row vs body),
  `assertQuestionApprovable()`, `flashcardBack()`.
Required for `approved`: `trap`, `canonical_answer`, `your_turn`, `quick_fire` (exactly 4 pairs),
`one_liner`; `scenario` too for walkthrough subtopics; `reading_minutes ≤ 12`.

## Rendering
`src/components/lesson/lesson-renderer.tsx` renders any valid body in the order the JSON gives;
one component per block type in `blocks/`, each wrapped in `<Section data-testid="block-<type>">`.
Markdown via `markdown.tsx` (react-markdown + GFM + KaTeX; CSS classes `.prose-lesson` in
`globals.css`; KaTeX CSS imported only by the renderer). Reveal interactions: `reveal.tsx`
(canonical answer, your-turn, scenario check) and the `quick-fire` flip cards. Widgets:
`src/components/widgets/ev-bridge.tsx` is live; the other four names render a placeholder.

## Routes
Student: `/home/technicals` (topic cards) → `/[topic]` (subtopics + lessons) → `/[topic]/[lesson]`;
`/home/path` → `/home/path/[week]`. Staff: `/admin/lessons` → `/admin/lessons/[id]` (JSON editor
with live zod errors, approval warnings, preview; `saveLesson` server action).

## Adding a lesson by hand
1. Copy `content/lessons/ev-bridge-basics.json`, change `slug`, `subtopic_slug`, `title`, body.
2. `npm run content:validate` → fix errors → `npm run seed -- 03`.
3. Open `/admin/lessons`, set status, save. Students see it once `approved`.

## Generated content & review (Loop 04)
Lessons and questions are written by Claude through the Batches pipeline described in
`docs/research/content-pipeline.md` (`npm run content:generate` → `content:collect` → `content:load`
→ `eval --suite lessons,questions` → `content:approve`). Generated rows land as `generated` (or
`draft` with `review_note` when the automatic checks failed) and wait in `/admin/review`, where a
mentor approves, requests changes (→ `in_review`, note stored on the row + `content_reviews`) or
rejects, or regenerates the item synchronously with a note. `/admin/generation` shows every
`generation_runs` row (dry-run estimates included). Migration `0005_content_review.sql`.

## Practice: question bank, flashcards, progress (Loop 05)
Migration `0006_practice.sql`: `flashcards` (one per approved question, derived by `npm run seed -- 05`
from `flashcardBack()`), `reviews` (append-only FSRS log), `card_state` (current memory state +
`streak`/`mastered`), `attempts` (`mode practice|drill|mock|lesson_your_turn`, `self_grade 1–3`,
`answer_text`, `ai_score`/`ai_feedback`/`interview_id` reserved for Loop 07), `lesson_progress`,
views `user_stats` + `user_activity_days` (security invoker → own row only), function
`search_content(q, n)` (websearch FTS over `questions.tsv` + `lessons.tsv`, approved only).
Students read/write through the cookie client under RLS; `db:check` covers all of it.

- Scheduler: `src/lib/practice/srs.ts` wraps `ts-fsrs` (`request_retention 0.9`, `maximum_interval 365`,
  fuzz off). `applyReview(row, rating, now)` → next `card_state` row + `reviews` row; mastery = two
  consecutive Good/Easy, Again resets. `computeStreak(days)` = consecutive active UTC days ending today
  or yesterday. Server action `reviewCard` is the only writer — the browser never computes a schedule.
- Routes: `/home/practice` (topic × difficulty × kind chips, 12/page), `/home/practice/[slug]`
  (`QuestionCard`: think timer by difficulty 30/45/60/90 s → reveal → follow-ups → self-grade →
  next in the same filter), `/home/flashcards` (decks per topic), `/home/flashcards/[topic]`
  (`FlashcardSession`: Space flips, 1 = Still learning, 2 = Got it; due → new → rest, 20 per session),
  `/home/progress` (rings, day streak, focus-next, per-topic table). Lesson pages gain
  `LessonProgressControls` (Mark complete / Undo, Practise this, Flashcards).
- ⌘K: `CommandPalette` (cmdk, server-side filtering) in the `/home` header → action `searchContent`.
- Actions live in `src/app/home/practice/actions.ts`; queries in `src/lib/practice/queries.ts`.
- Seeds: `npm run seed -- 05` (idempotent; archives cards whose question lost approval; then seeds demo
  progress for `e2e-student` via `scripts/seed/practice/demo-progress.ts`). Re-run after every content load.

## Mentor fusion (Loop 06)
Approved lessons and questions are also retrievable by the Mentor chatbot through `content_chunks`
(migration `0007_chat_technicals.sql`; `npm run content:index` rebuilds it, and approving, regenerating
or saving an item re-indexes just that item). Every lesson block has a stable anchor `#block-<n>`
(its index in `body.blocks`) that citation chips deep-link to, and an "Ask Mentor about this" link
(also on question cards and flipped flashcards) that opens `/home/mentor/new?…` with the item as thread
context. When the mentor corpus contradicts a lesson or question in a chat answer, a `system-bot`
`content_reviews` row is filed and `/admin/review` shows `⚠ mentor disagrees`. Details: `docs/CHAT.md`
§ Fusion.

## Mock interviews (Loop 07)
Migration `0008_interviews.sql`: `interviews` (mode `drill|mock`, `question_ids uuid[]` fixed at start,
`seconds_per_question`, status `in_progress|completed|abandoned`, `overall_score`, `report jsonb`) and
`interview_turns` (one per question: `shown_at`/`answered_at` on the **server clock**, `answer_text`,
`transcript_meta {wpm, filler_count, fillers, duration_s, late, voice}`, `score` /10, `grade jsonb`,
`attempt_id`); `attempts.interview_id` gains its FK. Own-row RLS + staff read; `db:check` +4.
- **Selection** (`src/lib/interviews/select.ts`, pure + seeded RNG): drill = up to 5 approved questions
  from one topic without replacement (difficulties 1–3, any difficulty if that leaves fewer than 5);
  mock = up to 15 round-robin across the 7 technical topics (`MOCK_TOPICS`), ordered easy → hard. With
  today's 6 approved questions a drill has 3 turns and a mock 6 — the hub says so.
- **Grader** (`grade.ts`, prompt `interview-grade.v1`): Opus 5 `beta.messages.parse` +
  `betaZodOutputFormat(GradeSchema)`, effort medium, `max_tokens` 2000, cached rubric (≥ 1024 tokens),
  refusal fallbacks. User turn = `renderQuestionContext()` from Loop 06 (question, model answer, key
  points, weak-answer note) + the answer + delivery metrics. Score /10 = accuracy 0–4 + structure 0–3
  + depth 0–3; wrong numbers cap accuracy at 1 and the total at 3. **Fixture branch** (`CHAT_MODE`
  resolution → `fixture` without credit, always in Playwright/CI): keyword coverage of the key points
  (`gradeFixture`) — deterministic, monotone in coverage; against `fixtures/eval/grader.jsonl` it scores
  Spearman 0.92 / MAE 1.00. A live failure also falls back to it (`prompt_version` records which ran).
- **Report** (`report.ts`, prompt `interview-report.v1`): `{summary_md, focus_areas[≤3]}`; every
  `lesson_slug` is validated against approved lessons in the same topic and invalid entries are
  replaced by the lowest-scoring subtopics' lessons (`validateReport`); fixture = `reportFixture`.
- **Actions** (`src/app/home/interviews/actions.ts`): `startInterview` (form → redirect to runner),
  `submitTurn` (loads with the service-role client → `checkOwnership` gives a stranger an explicit 403;
  duration from `shown_at`; late = over the limit + 10 s grace, accepted but flagged; grades; writes the
  `attempts` row with `ai_score`/`ai_feedback`/`interview_id`; serves the next turn), `markTurnShown`,
  `finishInterview` (overall = mean of graded turns, report, `completed`), `abandonInterview`.
- **UI**: `/home/interviews` (drill picker per topic with pool counts, full mock, history),
  `/home/interviews/[id]` (`InterviewRunner`: countdown from the server-stamped `shown_at`, textarea,
  mocks auto-submit at zero, grade reveal with hit/missed/feedback/tip and **Ask Mentor** carrying
  `{question_id, attempt_id}`), `/home/interviews/[id]/report` (score card incl. Delivery /100 when
  metrics exist, focus areas → lesson / deck / practice links, per-question accordion). Pages are
  own-only (a stranger, staff included, gets 404).
- **Voice** (`VoiceCapture`, `NEXT_PUBLIC_VOICE_MOCK=on`): Web Speech API dictation in the browser
  (Chrome/Edge; Safari partial; Firefox none); audio never leaves the device — only the transcript and
  `speech-metrics.ts` numbers (wpm, fillers, `deliveryScore` /100) are sent with the answer.
- **Eval**: `npm run eval -- --suite grader` — 40 hand-scored answers (10 excellent / 15 partial /
  10 wrong / 5 empty); live thresholds Spearman ≥ 0.7, MAE ≤ 1.0, empty ≤ 1; without credit it prints
  `NO API CREDIT — grader suite skipped` and the fixture grader's numbers (not gated).
- **Seeds/tests**: `npm run seed -- 07` (a completed Accounting drill for the e2e student);
  `e2e/07-interviews.spec.ts` (3); 26 vitest in `src/lib/interviews` + `scripts/eval/suites/grader.test.ts`.
- **Loop 08 "Practise this"**: create a 1-question drill by inserting `interviews {mode:'drill',
  question_ids:[id], seconds_per_question}` + one `interview_turns` row (ordinal 0, `shown_at: now`) —
  `startInterview` only knows topics; add a `questionIds` path or a `startDrillFor(questionId)` action.
