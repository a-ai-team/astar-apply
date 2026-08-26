# Loop 05 — Practice: question bank + flashcards

_Status: in-progress. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
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
- [ ] lint/typecheck/build
- [ ] vitest FSRS wrapper (Again resets; two Good → mastered), streak, search builder
- [ ] `seed -- 05` idempotent
- [ ] Playwright `e2e/05-practice.spec.ts` (filter difficulty 2 → reveal → self-grade → attempts row → ⌘K "enterprise value" ≥ 1 result → review 3 cards → progress shows streak 1, 3 reviewed)
- [ ] unauthenticated `/home/practice` → `/login`

## Tasks
- [x] migration + view
- [x] `src/lib/practice/srs.ts` + tests
- [x] derivation seed
- [ ] bank list/filters/card/`recordAttempt`
- [ ] palette + search
- [ ] decks + session + `reviewCard`
- [ ] lesson complete/practise links
- [ ] dashboard + streak
- [x] demo seed
- [ ] Playwright/docs/retro

## Blocked-on-human (defaults)
mastery rule → two-in-a-row; follow-ups → not separate attempts.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
