# Loop 07 — AI mock interviews

_Status: in-progress. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
text drills (5 Qs) and timed full mocks (15 Qs, 90 s each) graded per question against model answers with a rubric, focus-area report; voice mode (Web Speech API, audio never uploaded) with wpm/filler metrics behind `NEXT_PUBLIC_VOICE_MOCK=off`.
## Out of scope
video/eye contact, DCF workshop, mentor review of mocks.
## Research at start
Claude structured outputs + caching for the rubric; Web Speech API support matrix; Next `streaming.md`, `10-error-handling.md`, `preserving-ui-state.md`; `financefluency.md` § Practice (drill/mock shape, scorecard).
## Data model — `0008_interviews.sql`
`interviews(id, user_id, mode drill|mock, topic_id, question_ids uuid[], seconds_per_question, status in_progress|completed|abandoned, started_at, completed_at, overall_score, report jsonb {focus_areas[{topic, subtopic, reason, lesson_slug, deck}], summary_md})`; `interview_turns(id, interview_id, ordinal, question_id, answer_text, transcript_meta {wpm, filler_count, fillers, duration_s}, score, grade jsonb {hit[], missed[], structure 0–3, accuracy 0–4, depth 0–3, feedback_md, mentor_tip_md}, graded_at)`; each turn also writes `attempts`. RLS own rows.
## Routes/screens
`/home/interviews` (Drill topic picker / Full mock / history), `/home/interviews/[id]` (`InterviewRunner`: question, timer, textarea or `VoiceCapture`), `/home/interviews/[id]/report` (`ScoreCard`, per-question accordion, focus areas → lessons/decks); actions `startInterview` (drill = 5 random approved from topic, difficulties 1–3; mock = 15 stratified across 7 core topics, 1–4), `submitTurn` (grades sync < 10 s, ownership check, server-side timing), `finishInterview`; `src/lib/interviews/{select,grade,report,speech-metrics}.ts`; prompts `interview-grade.v1`, `interview-report.v1`.
## AI
Grade — Opus 5 `messages.parse` `GradeSchema`, effort medium, max_tokens 2000; cached rubric (accuracy 0–4, structure 0–3, depth 0–3 → /10; hard penalty for wrong numbers); user = question, model answer, key points, weak-answer note, student answer, metrics. Report — Opus 5 structured `{summary_md, focus_areas[3]}`; slugs validated, invalid → lowest-scoring subtopics.
## Scripts
`fixtures/eval/grader.jsonl` (40 original: 10 excellent, 15 partial, 10 wrong, 5 empty/off-topic with human scores); suite `grader` (Spearman ≥ 0.7, MAE ≤ 1.0, empty ≤ 1); `scripts/seed/07-demo-interview.ts`.
## Env
`NEXT_PUBLIC_VOICE_MOCK=off`, `INTERVIEW_GRADER_MODEL`.
## Risks
grading latency (grade previous while reading next; polling); server-side timer of record; Safari voice partial (flag off; e2e text only).
## Acceptance checks
- [ ] lint/typecheck/build
- [ ] vitest stratification, speech metrics, report validation
- [ ] `eval --suite grader` passes
- [ ] Playwright `e2e/07-interviews.spec.ts` (Accounting drill 5 fixture answers → scores ≤ 10 within 20 s each → report with 3 focus areas with working links; mock abandon → `abandoned`)
- [ ] other user's interview → 403 (unit-tested wrapper)

## Tasks
- [x] migration
- [x] selection + tests
- [ ] grader + recorded test
- [ ] report + validation
- [ ] actions with ownership/timing
- [ ] runner UI
- [ ] report UI
- [ ] speech metrics + `VoiceCapture` behind flag
- [ ] grader fixtures + suite (+ one rubric-anchor tune)
- [ ] demo seed, Playwright, docs, retro

## Blocked-on-human (defaults)
voice default → off; scales → Content /10 per question, Delivery /100 when metrics exist.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
