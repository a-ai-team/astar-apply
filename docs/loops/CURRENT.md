# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-26 (2.5 h budget)
- **Loop:** 10 Launch (`docs/loops/10-launch.md`) — in progress
- **Branch:** `feat/launch`
- **Task:** 4 / 10 done — entitlements + gates, Stripe stub/real + webhook tests, /pricing + /billing/success
- **Last checks:** lint ✓ typecheck ✓ build ✓ unit billing 12/12
- **Blockers:** Postgres unreachable (0010 + 0011 unapplied); no Anthropic credit; no Stripe keys.
- **Decisions taken by default this loop:** prices £0/£4.99/£9.99; feature keys per plan in `src/lib/billing/plans.ts`.
- **Next action:** task 5 — landing `/` + `/api/demo-chat`.

## Heartbeat (Stop hook appends here; keep last 10 lines)
