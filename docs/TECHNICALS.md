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

## Firm interview bank + Pulse (Loop 08)
Operator guide (approval workflow, commands): `docs/FIRMS_PULSE.md`.

Migration `0009_firms_pulse.sql`: `firms` (slug, type `bulge_bracket|elite_boutique|uk_mid|buy_side|other`,
dossier columns, `process jsonb [{stage, when, notes}]`, `sources`, `status content_status`),
`firm_questions` (category / stage `hirevue|interview|ac` / programme / frequency / `recency_year` /
`guidance_md` / `status` / `reported_by` / `generated_by`; unique on `(firm_id, question)`),
`firm_question_reports` (student reports, `pending|approved|rejected`, `reviewer_id`, `reviewed_at`,
`promoted_question_id`) and `pulse_digests` (`week_start date unique`, `body jsonb`, `status`, `model`,
`prompt_version`). `interview_turns.firm_question_id` (one-of check with `question_id`) lets a firm
question be drilled without a mirror `questions` row. RLS: students read `approved` firms, `approved`
questions of `approved` firms and `approved` digests; own-insert on reports; staff all. `db:check` 46/46.
- **Status gate.** Every row `seed -- 08` and `firms:author` writes is `generated` = **unverified and
  invisible to students**; the only approved Loop 08 row is the synthetic sample digest
  (`fixtures/pulse/sample-week.json`, week 2026-08-24, `prompt_version fixture:sample-week.v1`, which
  the pages flag with a "sample" banner). Approve firms + their questions in `/admin/firms/[slug]`
  (JSON editor with live `FirmSchema` validation, status select, per-question Approve/Reject, bulk
  "Approve all unverified"); approve digests in `/admin/pulse`. A question needs **both** its own and
  its firm's approval to be served.
- **Data**: `fixtures/firms/<slug>.json` (14 dossiers from the firms' own careers pages, sources
  listed) and `fixtures/firms/questions/<slug>.json` (15 hand-written questions each, 210 total,
  `recency_year: null` — no fake provenance; guidance = "what a strong answer covers" as dash bullets).
  Shapes: `src/lib/firms/schema.ts` (`FirmSchema`, `FirmQuestionSchema`, `AuthoredQuestionsSchema`).
  `npm run seed -- 08` upserts firms on slug and questions on `(firm_id, question)`, refreshing content
  but never touching `status` on an existing row; it also upserts the sample digest as `approved`.
- **Authoring** (`npm run firms:author -- [--firm <slug>|all] [--write] [--dry-run]`): Opus 5 structured output
  (`firm-questions.v1`), 10–15 questions per firm, written to `.eval/firms/<slug>.json` (`--write` replaces the fixture); without credit it
  prints `NO API CREDIT` and keeps the hand-written file. Re-seed afterwards.
- **Pages**: `/home/interviews/firms` (grid of approved firms with counts), `/home/interviews/firms/[slug]`
  (dossier, `ProcessTimeline`, `FirmQuestionList` with stage / programme / category / division chips,
  guidance accordion, **Practise this** → `startDrillFor(firmQuestionId)` creates a 1-question drill:
  `interviews {mode:'drill', question_ids:[id]}` + one turn with `firm_question_id`; the runner/grader/
  report load it through `getFirmInterviewQuestions`, deriving model answer + key points from
  `guidance_md` via `gradeMaterialFromGuidance`), `/home/interviews/report` (`reportQuestion`, 5 per UTC
  day counted on `firm_question_reports`), `/admin/reports` (approve → promoted to an `approved`
  `firm_questions` row with `reported_by`, `recency_year` from `asked_at`, `generated_by report:<id>`).
- **Pulse** (`src/lib/pulse/`): `generate.ts` — research pass (Opus 5 + server-side
  `web_search_20260209`, `max_uses 8`, `allowed_domains` from `PULSE_ALLOWED_DOMAINS`, resumed on
  `pause_turn`) then structured pass (`beta.messages.parse` + `DigestBodySchema`: 3–6 stories, each
  `headline, take_md, talking_points[3], anchors, practice_qs, sources`), `enforceSources` keeps only
  URLs the search actually returned (or allowed domains) and drops sourceless stories (fails under 3).
  Fixture branch (no credit / `CHAT_MODE=fixture` / `--fixture`): recorded `fixtures/recorded/pulse-search.v1.sample.json`
  + the sample body. `storeDigest` upserts on `week_start` as `generated` (`PULSE_AUTO_PUBLISH=true` →
  `approved`), never downgrades an approved week, skips an existing week unless `--force`.
  `npm run pulse:generate -- [--week YYYY-MM-DD] [--dry-run] [--force] [--fixture]` writes
  `.eval/pulse-<week>.json`. **Cron**: `GET /api/cron/pulse` (`vercel.json` `0 6 * * 1`, Monday 06:00
  UTC) requires `Authorization: Bearer <CRON_SECRET>` (401 otherwise, also when the var is unset;
  `?week=`, `?force=1`, `?dry=1`), `maxDuration 300`. Pages `/home/pulse` (latest approved + archive)
  and `/home/pulse/[week]` (Monday only; 404 otherwise) render `DigestView`.
- **Env**: `CRON_SECRET`, `PULSE_AUTO_PUBLISH` (default false), `PULSE_ALLOWED_DOMAINS`, `PULSE_MODEL`.
- **Tests**: `e2e/08-firms.spec.ts` (3; approves one firm in `beforeAll`, restores `generated` after);
  vitest in `src/lib/firms`, `src/lib/pulse`, `src/components/firms`.

## Industry / group modules (Loop 09)
Migration `0010_industry.sql`: `topics.group_family` (`coverage | product | other`), the 18 industry
`topics` rows (`kind = 'industry'`, ordinals 100+, `is_free = false`, `status approved`) and the view
`industry_modules` (security invoker: per-module subtopic / approved lesson / approved question /
flashcard counts). **Not yet applied** — see `docs/loops/09-industry-modules.md` § Blocked 1; until
then `seed 03` upserts the rows without `group_family` and `listIndustryModules()` aggregates the
same counts from the base tables (the family always comes from `taxonomy.ts`).
- **Source of truth**: `INDUSTRY_MODULES` in `src/lib/content/taxonomy.ts` — slug, title, family,
  400Q section *label* + question *count*, summary, lesson subjects. `INDUSTRY_CURRICULUM` turns each
  module into a `CurriculumTopic` with one subtopic per lesson: lessons 2 / 3 / 4 by source count
  (< 8 / 8–12 / > 12), questions = count to the nearest 5 (min 8) split across the lessons →
  **50 lessons, 181 questions** across 18 modules. `ALL_CURRICULUM` = generalist + industry;
  `findSubtopic()` searches both; `isContentTopicSlug()` accepts either for `topic_slug`.
- **Content** lives in `content/industry/<module>/{lessons,questions}/*.json` (same file shapes;
  `validateContentDir` walks it; `loadContent` loads it). An industry lesson **must** carry a
  `key_metrics` block (`checks.ts` and the `industry` eval suite enforce it; the renderer's
  `KeyMetrics` table has existed since Loop 03).
- **Generation**: `npm run content:generate -- lessons|questions --kind industry --all` targets the
  modules; `systemFor()` appends `src/lib/ai/prompts/industry-addendum.v1.ts` (metrics that replace
  EBITDA → valuation methods → typical deals → what interviewers probe) to the static writer prompt,
  `industryUserLines()` adds the module facts to the user turn, and `prompt_version` records
  `lesson-write.v1+industry-addendum.v1`. Dry-run (heuristic, no credit): lessons ≈ $8.84,
  questions ≈ $3.49. `npm run eval -- --suite industry`: schema 100 %, overlap 0, `key_metrics`
  present, readability ≥ 4 on ≤ 10 lessons (skipped without credit).
- **Pages**: `/home/technicals/industry` (grid grouped by family, "Coming soon" until a module has an
  approved lesson; `data-testid="industry-card"`), module page = `/home/technicals/<module>` (the
  topic page with a family badge and a link back to the grid); the generalist grid hides industry
  topics and links to the industry grid. Decks (`/home/flashcards`) and drills (`/home/interviews`)
  pick industry modules up automatically once questions are approved (`drillTopics` returns `kind`).
- **Mock interviews**: the full-mock form has an "Add an industry module" select (`mock-industry`);
  `startInterview` adds that module to the round-robin topics and stores it in `interviews.topic_id`
  (default decision — no new column without a migration; a mock with a topic shows as
  "Full mock · <module>").
- **Seeds/tests**: `npm run seed -- 09` (seed 03 + report per module); `e2e/09-industry.spec.ts`
  (approves the Real Estate lesson + 8 questions and derives their cards in `beforeAll`, restores in
  `afterAll`); vitest in `taxonomy.test.ts`, `targets.test.ts`.

## Technicals v2 — the summer-internship prep pack (Loops 11–18, planned 2026-08-28)
Research and per-chapter content specs: `docs/research/technicals-v2/` (`README.md` there is the
index). Contract additions (new block types `predict`, `fill_numbers`, `order_steps`, `lens`,
`template`; widget names; question tags `depth:` / `lens:` / `format:`; cheat sheets):
`docs/loops/CONTRACTS.md` § Technicals v2. Loop 11 builds the platform (`src/lib/finance/`, the widget
kit, the lens picker, the cheat-sheet route); Loops 12–18 hand-author one chapter each from its spec —
35 lessons, ~130 core + 39 stretch + ~28 lens questions. This section is rewritten by Loop 18.
