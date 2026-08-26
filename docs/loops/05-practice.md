# Loop 05 — Practice: question bank + flashcards

_Status: merged. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
browse/filter approved questions (⌘K), attempt with reveal + self-grade, FSRS flashcard decks per topic, progress dashboard with streaks and lesson completion.
## Out of scope
AI grading (07), paid gating (10), leaderboards.
## Research at start
`ts-fsrs` API (`fsrs()`, `Rating`, `Card`, `repeat`); Next `04-linking-and-navigating.md`, `forms.md`, `08-caching.md` (user-specific = dynamic); `financefluency.md` § Practice/Flashcards; `cmdk`.
## Data model — `0006_practice.sql`
`flashcards(id, question_id unique, topic_id, front, back_md, status)`; `reviews(id, user_id, flashcard_id, rating 1–4, state, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, reviewed_at)`; `card_state(user_id, flashcard_id, due, stability, difficulty, state, reps, lapses, streak, mastered, last_review; pk)`; `attempts(id, user_id, question_id, mode practice|drill|mock|lesson_your_turn, self_grade, answer_text, ai_score, ai_feedback, interview_id, created_at)`; `lesson_progress(user_id, lesson_id, completed_at)`; view `user_stats`. RLS own rows; flashcards read when approved.
## Routes/screens
`/home/practice` (filters, pagination, `CommandPalette` in `/home` layout via `searchContent(q)` over approved tsvector); `/home/practice/[slug]` (`QuestionCard`: think timer → reveal → follow-ups → self-grade → next); `/home/flashcards`, `/home/flashcards/[topic]` (`FlashcardSession`: flip tap/space; Got it → Good, Still learning → Again; mastered = two consecutive Good); `/home/progress` (rings, streak, weak topics); lesson pages gain "Mark complete" + "Practise this"; actions `recordAttempt`, `reviewCard` (server-side FSRS), `completeLesson`.
## Scripts
`scripts/seed/05-flashcards.ts` (one card per approved question); `05-demo-progress.ts` for e2e student.
## Risks
FSRS defaults (`request_retention 0.9`); search only `approved`; flashcard keys must not hijack ⌘K.
## Acceptance checks
- [x] lint/typecheck/build
- [x] vitest FSRS wrapper (Again resets; two Good → mastered), streak, search builder — `src/lib/practice/srs.test.ts` 13/13; unit 81/81
- [x] `seed -- 05` idempotent (ran twice: 6 → 6 cards, demo progress unchanged)
- [x] Playwright `e2e/05-practice.spec.ts` 4/4 (filter difficulty 2 → reveal → self-grade → attempts row → ⌘K "enterprise value" ≥ 1 result → review 3 cards → progress shows streak 1, 3 reviewed; + lesson complete, draft isolation); full e2e 18/18
- [x] unauthenticated `/home/practice` → `/login?next=%2Fhome%2Fpractice` (e2e)

## Tasks
- [x] migration + view
- [x] `src/lib/practice/srs.ts` + tests
- [x] derivation seed
- [x] bank list/filters/card/`recordAttempt`
- [x] palette + search
- [x] decks + session + `reviewCard`
- [x] lesson complete/practise links
- [x] dashboard + streak
- [x] demo seed
- [x] Playwright/docs/retro

## Blocked-on-human (defaults)
mastery rule → two-in-a-row; follow-ups → not separate attempts.


## Blocked
_(record blockers here during the run)_

## Retro
- **Shipped:** migration `0006_practice` (`flashcards`, `reviews`, `card_state`, `attempts`, `lesson_progress`,
  views `user_stats`/`user_activity_days` with `security_invoker`, `search_content()` + `tsv` on
  questions/lessons, own-row + staff-read RLS, service_role grants; `db:check` 31/31);
  `src/lib/practice/{srs,search,queries,question-body}.ts` (ts-fsrs 5.4.1 wrapper, streak, search builder,
  bank/deck/progress queries); actions `recordAttempt`, `reviewCard` (server-side FSRS), `completeLesson`/
  `uncompleteLesson`, `searchContent`; `/home/practice` (+ `[slug]`, `QuestionCard`), `/home/flashcards`
  (+ `[topic]`, `FlashcardSession`), `/home/progress`; `CommandPalette` (cmdk) in the `/home` header;
  `LessonProgressControls` on lesson pages; nav enabled (Practice, Flashcards, Progress); seeds
  `05-flashcards.ts` + `practice/demo-progress.ts`; 13 new vitest (81 total); `e2e/05-practice.spec.ts`
  4/4 (18/18 overall); `docs/TECHNICALS.md` § Practice. No API calls, no new env vars.
- **Slipped:** nothing in scope. Content is thin (6 approved questions → 6 cards, 2 decks) until the
  Loop 04 batches run; the UI already handles ≈ 350 (pagination, 20-card sessions, ranked search).
  `search_content` ignores `tags` (array_to_string is not immutable in a generated column).
- **Decisions taken by default:** (1) mastery = two consecutive Good/Easy, Again resets (`MASTERY_STREAK`,
  `TODO(james)` in srs.ts); (2) follow-ups are not separate attempts; (3) `self_grade` is 1–3
  (Missed / Partly / Nailed it) — the FSRS 1–4 scale is only for cards; (4) FSRS fuzz off and
  `maximum_interval 365` for determinism; (5) think-timer seconds by difficulty 30/45/60/90; (6) streaks
  are UTC days and survive until the end of the day after the last activity; (7) `reviews.rating` accepts
  1–4 but the UI exposes only Again/Good (financefluency parity); (8) demo-progress seed lives in
  `scripts/seed/practice/` so `seed -- 05` resolves to the flashcard derivation; (9) `attempts.interview_id`
  has no FK yet — Loop 07's migration 0008 adds it.
- **Loop 06 must know:** (1) `attempts` shape: `{ user_id, question_id, mode, self_grade 1–3 | null,
  answer_text, ai_score numeric(4,1), ai_feedback jsonb, interview_id }` — Loop 07's grader fills
  `ai_score`/`ai_feedback` on the same row (`recordAttempt` accepts `answerText`, `mode`). (2) Mount
  `AskMentorButton` inside `QuestionCard` under the `data-testid="question-grade"` section (after reveal;
  pass `question` + `model_answer_md` as context) and in `FlashcardSession` below the rate buttons when
  `flipped`; both are client components — the button must be too. (3) `search_content()` is the FTS the
  fusion retriever can reuse for lesson/question candidates before embeddings land in `content_chunks`
  (0007); its `tsv` columns exist on `lessons` (title only) and `questions` (question + model answer).
  (4) Student pages use the cookie client — anything Loop 06 adds to `/home/**` should too. (5) Re-run
  `npm run seed -- 05` after any content load so new approvals get cards.
