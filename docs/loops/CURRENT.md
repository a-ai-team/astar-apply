# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 04 Technicals content generation (`docs/loops/04-content-generation.md`) — planned
- **Branch:** — (create `feat/content-generation` from `main`; Loop 03 merged as #10)
- **Task:** 0 / — — nothing started
- **Last checks:** Loop 03: lint ✓ typecheck ✓ build ✓ test:unit 47/47 ✓ test:e2e 13/13 ✓ db:check 21/21 ✓ acceptance 5/5
- **Blockers:** **ANTHROPIC_API_KEY has no credit** (`credit balance is too low`, `npx tsx scripts/dev/api-probe.ts`). Loop 04 is a Batches loop — it cannot generate content without credit. Build everything that does not call Claude (migration 0005, prompts, checkers + tests, batch parser with recorded fixtures, review UI, load/approve scripts) and run `--dry-run`; mark generation tasks blocked and leave status `merged (partial)` if credit is still absent.
  Carried for James: top up credit then `npm run eval -- --suite chat` + `npm run cache:check`; `VOYAGE_API_KEY` + `npm run reembed`; `supabase config push`; `PRIVATE_ACCESS_KEY` in `.env.local`; Google OAuth; re-record extraction + chat fixtures; confirm free topics (Accounting + EqV/EV).
- **Decisions taken by default this loop:** none yet
- **Next action:** read Loop 03 retro in `docs/loops/03-technicals-model.md` (schema export names, `CURRICULUM[].subtopics[].target_questions` Σ 347, `walkthrough` flag, `validateContentDir` + `loadContent` in `scripts/content/{validate,load}.ts`, content file shape) and `docs/TECHNICALS.md`; do Loop 04 "Research at start"; branch `feat/content-generation`; task 1 (migration 0005). Seeds before e2e: `npm run seed -- 00 && CORPUS_EXTRACTION_MODE=fixture npm run seed -- 01 && npm run seed -- 02 && npm run seed -- 03`; e2e uses `workers: 1`.

## Heartbeat (Stop hook appends here; keep last 10 lines)
