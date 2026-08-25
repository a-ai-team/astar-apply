# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 01 Mentor corpus ingestion (`docs/loops/01-mentor-corpus.md`) — merged (partial)
- **Branch:** `feat/mentor-corpus`
- **Task:** 10 / 10 done — taxonomy, extraction (+fixture mode), chunker/tagger/ingest, process + signed-url routes, admin corpus list/upload/detail, fixtures + seed 01 (42 approved embedded chunks, idempotent)
- **Last checks:** lint ✓ typecheck ✓ build ✓ test:unit 13/13 ✓ test:e2e 7/7 ✓ db:check 9/9 ✓ seed 01 ✓ (42) curl 401 ✓ — acceptance 6/6
- **Blockers:** ANTHROPIC_API_KEY has no credit balance (`credit balance is too low`) → no real Opus/Haiku calls this loop; extraction runs in `CORPUS_EXTRACTION_MODE=fixture`, recorded fixtures are hand-authored to the schema; `scripts/dev/record-extraction.ts` re-records once topped up. Carried for James: `supabase config push`, `PRIVATE_ACCESS_KEY`, Google OAuth.
- **Decisions taken by default this loop:** fixture PDF is generated at test time (pre-commit blocks `*.pdf`); `content_status` enum created in 0002; storage bucket + policies in SQL
- **Next action:** open PR, squash-merge, point CURRENT at Loop 02.

## Heartbeat (Stop hook appends here; keep last 10 lines)
