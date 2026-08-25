# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 00 Foundations (`docs/loops/00-foundations.md`) — in-progress
- **Branch:** `feat/foundations`
- **Task:** 7 / 7 done — docs, retro, acceptance 4/4
- **Last checks:** lint ✓ typecheck ✓ build ✓ test:unit 3/3 ✓ test:e2e 4/4 ✓ (2026-08-25 23:35)
- **Blockers:** `supabase config push` now blocked by permission classifier; first push applied local auth defaults to remote (see TODO(james) in supabase/config.toml)
- **Decisions taken by default this loop:** JWT role claim is `user_role` (not `role`, which Supabase reserves for the Postgres role); magic link only (no Google)
- **Next action:** open PR, squash-merge, point CURRENT at Loop 01

## Heartbeat (Stop hook appends here; keep last 10 lines)
