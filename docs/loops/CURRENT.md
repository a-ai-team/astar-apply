# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 05 Practice: question bank + flashcards (`docs/loops/05-practice.md`) — in-progress
- **Branch:** `feat/practice`
- **Task:** 2 / 10 — srs.ts (applyReview/computeStreak/retrievability, ts-fsrs 5.4.1, fuzz off, max 365 d) + search.ts builder; vitest 13/13
- **Last checks:** Loop 04: lint ✓ typecheck ✓ build ✓ test:unit 68/68 ✓ test:e2e 14/14 ✓ db:check 25/25 ✓ eval lessons/questions (schema 100 %, overlap 0; readability skipped) · acceptance 4/7 (3 blocked on credit)
- **Blockers:** **ANTHROPIC_API_KEY still has no credit** (probed once in Loop 04; do not re-probe every wake-up — `npx tsx scripts/dev/api-probe.ts` when James says it is topped up). Loop 04 batches are blocked: the exact command sequence is in `docs/loops/04-content-generation.md` § Blocked. Loop 05 needs no API calls; it has only **6 approved questions + 2 approved lessons** to derive flashcards from until the batches run — build against `status = 'approved'` and expect ≈ 350 later.
  Carried for James: top up credit → Loop 04 § Blocked sequence, then `npm run eval -- --suite chat` + `npm run cache:check`; `VOYAGE_API_KEY` + `npm run reembed`; `supabase config push`; `PRIVATE_ACCESS_KEY` in `.env.local`; Google OAuth; re-record extraction + chat fixtures; confirm free topics (Accounting + EqV/EV).
- **Decisions taken by default this loop:** none yet
- **Next action:** task 3 `scripts/seed/05-flashcards.ts` (one card per approved question via `flashcardBack`), then task 4 question bank UI + `recordAttempt`. Seeds before e2e: `npm run seed -- 00 && CORPUS_EXTRACTION_MODE=fixture npm run seed -- 01 && npm run seed -- 02 && npm run seed -- 03 && npm run seed -- 04 && npm run seed -- 05`; e2e uses `workers: 1`.

## Heartbeat (Stop hook appends here; keep last 10 lines)
