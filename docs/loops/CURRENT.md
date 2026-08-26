# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 08 Firm interview bank + Pulse (`docs/loops/08-firms-pulse.md`) — in-progress
- **Branch:** `feat/firms-pulse` (from `main` after Loop 07 #14)
- **Task:** 4 / 10 done — `/home/interviews/firms` grid + `[slug]` dossier/`ProcessTimeline`/`FirmQuestionList` filters/guidance accordion/Practise this → `startDrillFor` (turn `firm_question_id`, no attempts row, Ask Mentor hidden); next: report form + 5/day limit + `/admin/reports`
- **Last checks:** db:migrate ✓ db:check 46/46 ✓
- **Blockers:** **ANTHROPIC_API_KEY still has no credit** — firm-question authoring and the Pulse digest run their fixture branches; live re-run commands go under Loop 08 § Blocked. Carried: Loop 04 § Blocked, 06 § Blocked 1–3, 07 § Blocked 1–4; `VOYAGE_API_KEY` + reembed; `supabase config push`; `PRIVATE_ACCESS_KEY`; Google OAuth; free-topic confirmation; staff view of students' interviews.
- **Decisions taken by default this loop:** (1) `interview_turns.firm_question_id` + `question_id` nullable with a one-of check (Loop 07 retro option 2) so "Practise this" drills a firm question without a mirror `questions` row; (2) `firm_questions` unique on `(firm_id, question)` as the seed's natural key; (3) `firm_question_reports` gains `reviewed_at` + `promoted_question_id` for traceability.
- **Next action:** `/home/interviews/report` form + `reportQuestion` action (5/day via count on `firm_question_reports`), `/admin/reports` list + approve (promote to `firm_questions` `approved`, `reported_by`) / reject; vitest for the rate limit.

## Heartbeat (Stop hook appends here; keep last 10 lines)
