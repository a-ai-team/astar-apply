# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 07 AI mock interviews (`docs/loops/07-mock-interviews.md`) — in-progress
- **Branch:** `feat/mock-interviews` (from `main`; Loop 06 merged as #13)
- **Task:** 5 / 10 — actions (`startInterview`/`submitTurn`/`markTurnShown`/`finishInterview`/`abandonInterview`, admin-load + `checkOwnership` 403, server clock, attempts row per turn), `queries.ts`, `speech-metrics.ts` (+ tests; 23 vitest in `src/lib/interviews`)
- **Last checks:** db:check 41/41 ✓ (Loop 06: lint ✓ typecheck ✓ build ✓ unit 103/103 ✓ e2e 21/21 ✓)
- **Blockers:** **ANTHROPIC_API_KEY still has no credit** — grader/report ship with a fixture branch (keyword coverage); `eval --suite grader` will print `NO API CREDIT — grader suite skipped`. Carried for James: top up credit → Loop 04 § Blocked sequence, Loop 06 § Blocked 1–3, then Loop 07 § Blocked; `VOYAGE_API_KEY` + `npm run reembed`; `supabase config push`; Google OAuth.
- **Decisions taken by default this loop:** turns carry `attempt_id` + `shown_at` (server clock); mock topics = the 7 technical curriculum topics; late answers accepted but flagged.
- **Next action:** task 6 — runner UI: `/home/interviews` hub (drill picker / mock / history), `/home/interviews/[id]` `InterviewRunner` (timer, progress, textarea, grade reveal, Ask Mentor with attempt), nav enabled.

## Heartbeat (Stop hook appends here; keep last 10 lines)
