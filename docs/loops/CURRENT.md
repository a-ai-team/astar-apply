# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 03 Technicals taxonomy & content model (`docs/loops/03-technicals-model.md`) — in-progress
- **Branch:** `feat/technicals-model`
- **Task:** 1 / 10 — migration 0004 applied (topics, subtopics, lessons, questions, learning_paths, learning_path_items; RLS; grants); db:check extended
- **Last checks:** migration pushed ✓ (`npm run db:migrate`)
- **Blockers:** ANTHROPIC_API_KEY has no credit — Loop 03 needs no API calls (lessons hand-written).
  Carried for James: top up credit then `npm run eval -- --suite chat` + `npm run cache:check`; `VOYAGE_API_KEY` + `npm run reembed`; `supabase config push`; `PRIVATE_ACCESS_KEY` in `.env.local`; Google OAuth; re-record extraction + chat fixtures.
- **Decisions taken by default this loop:** `subtopics.target_questions` column added for Loop 04; `~/.claude/skills/ib-daily-lesson` absent → default 10-week path.
- **Next action:** task 2 — zod schemas `src/lib/content/{lesson,question}-schema.ts` + `assertApprovable()` + vitest.

## Heartbeat (Stop hook appends here; keep last 10 lines)
