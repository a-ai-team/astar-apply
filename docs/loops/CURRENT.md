# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 05 Practice: question bank + flashcards (`docs/loops/05-practice.md`) — done, PR opening
- **Branch:** `feat/practice`
- **Task:** 10 / 10 — docs + retro written; acceptance 5/5
- **Last checks:** Loop 05: lint ✓ typecheck ✓ build ✓ test:unit 81/81 ✓ test:e2e 18/18 ✓ db:check 31/31 ✓ seed 05 idempotent ✓ · acceptance 5/5
- **Blockers:** **ANTHROPIC_API_KEY still has no credit** (probed once in Loop 04; do not re-probe every wake-up — `npx tsx scripts/dev/api-probe.ts` when James says it is topped up). Loop 04 batches are blocked: the exact command sequence is in `docs/loops/04-content-generation.md` § Blocked. Loop 05 needs no API calls; it has only **6 approved questions + 2 approved lessons** to derive flashcards from until the batches run — build against `status = 'approved'` and expect ≈ 350 later.
  Carried for James: top up credit → Loop 04 § Blocked sequence, then `npm run eval -- --suite chat` + `npm run cache:check`; `VOYAGE_API_KEY` + `npm run reembed`; `supabase config push`; `PRIVATE_ACCESS_KEY` in `.env.local`; Google OAuth; re-record extraction + chat fixtures; confirm free topics (Accounting + EqV/EV).
- **Decisions taken by default this loop:** mastery two-in-a-row; follow-ups not attempts; self_grade 1–3; FSRS fuzz off / max 365 d; UTC streak days (see loop doc retro)
- **Next action:** open PR, squash-merge, move to Loop 06.

## Heartbeat (Stop hook appends here; keep last 10 lines)
