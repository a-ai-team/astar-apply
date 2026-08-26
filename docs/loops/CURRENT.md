# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 08 Firm interview bank + Pulse (`docs/loops/08-firms-pulse.md`) — in-progress
- **Branch:** `feat/firms-pulse` (from `main` after Loop 07 #14)
- **Task:** 9 / 10 done — `/admin/firms` (status + per-status question counts), `/admin/firms/[slug]` (`FirmEditor` JSON + live FirmSchema validation + status select + `unverified` badge; per-question Approve/Reject, bulk Approve-all-unverified/Unapprove-all), `/admin/pulse` (list, approve/reject/unpublish, preview); next: Playwright + docs + retro + merge
- **Last checks:** db:migrate ✓ db:check 46/46 ✓
- **Blockers:** **ANTHROPIC_API_KEY still has no credit** — firm-question authoring and the Pulse digest run their fixture branches; live re-run commands go under Loop 08 § Blocked. Carried: Loop 04 § Blocked, 06 § Blocked 1–3, 07 § Blocked 1–4; `VOYAGE_API_KEY` + reembed; `supabase config push`; `PRIVATE_ACCESS_KEY`; Google OAuth; free-topic confirmation; staff view of students' interviews.
- **Decisions taken by default this loop:** (1) `interview_turns.firm_question_id` + `question_id` nullable with a one-of check (Loop 07 retro option 2) so "Practise this" drills a firm question without a mirror `questions` row; (2) `firm_questions` unique on `(firm_id, question)` as the seed's natural key; (3) `firm_question_reports` gains `reviewed_at` + `promoted_question_id` for traceability.
- **Next action:** `e2e/08-firms.spec.ts`, docs (`docs/FIRMS_PULSE.md` + TECHNICALS link), run every acceptance check, retro, MASTER_PLAN `merged (partial)`, RUNLOG, PR + squash merge.

## Heartbeat (Stop hook appends here; keep last 10 lines)
