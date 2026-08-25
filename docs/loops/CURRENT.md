# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 03 Technicals taxonomy & content model (`docs/loops/03-technicals-model.md`) — in-progress
- **Branch:** `feat/technicals-model`
- **Task:** 4 / 10 — content (`content/lessons/{ev-bridge-basics,three-statement-links}.json`, 6 questions), `scripts/content/{validate,load}.ts`, `seed -- 03` idempotent (9 topics / 53 subtopics / 50 path items), db:check 21/21
- **Last checks:** lint ✓ typecheck ✓ test:unit 16 new ✓ seed 03 ×2 ✓ db:check 21/21 ✓
- **Blockers:** ANTHROPIC_API_KEY has no credit — Loop 03 needs no API calls (lessons hand-written).
  Carried for James: top up credit then `npm run eval -- --suite chat` + `npm run cache:check`; `VOYAGE_API_KEY` + `npm run reembed`; `supabase config push`; `PRIVATE_ACCESS_KEY` in `.env.local`; Google OAuth; re-record extraction + chat fixtures.
- **Decisions taken by default this loop:** `subtopics.target_questions` column added for Loop 04; `~/.claude/skills/ib-daily-lesson` absent → default 10-week path.
- **Next action:** task 5 — `src/components/lesson/{markdown,LessonRenderer,blocks/*,Reveal,QuickFire,YourTurn}` with react-markdown + KaTeX.

## Heartbeat (Stop hook appends here; keep last 10 lines)
