# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 03 Technicals taxonomy & content model (`docs/loops/03-technicals-model.md`) — in-progress
- **Branch:** `feat/technicals-model`
- **Task:** 3 / 10 — schemas (`lesson-schema.ts`, `question-schema.ts`, 16 vitest) + taxonomy (`CURRICULUM` 9 topics / 53 subtopics, `DEFAULT_PATH`, targets 347) done
- **Last checks:** migration pushed ✓ (`npm run db:migrate`)
- **Blockers:** ANTHROPIC_API_KEY has no credit — Loop 03 needs no API calls (lessons hand-written).
  Carried for James: top up credit then `npm run eval -- --suite chat` + `npm run cache:check`; `VOYAGE_API_KEY` + `npm run reembed`; `supabase config push`; `PRIVATE_ACCESS_KEY` in `.env.local`; Google OAuth; re-record extraction + chat fixtures.
- **Decisions taken by default this loop:** `subtopics.target_questions` column added for Loop 04; `~/.claude/skills/ib-daily-lesson` absent → default 10-week path.
- **Next action:** task 4 — `content/lessons/*.json` (2 hand-written), `content/questions/*.json` (6), `scripts/content/{validate,load}.ts`, `scripts/seed/03-taxonomy.ts`.

## Heartbeat (Stop hook appends here; keep last 10 lines)
