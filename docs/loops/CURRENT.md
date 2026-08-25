# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 02 Mentor chatbot v1 (`docs/loops/02-chatbot.md`) — in-progress
- **Branch:** `feat/chatbot` (from main 91f4272)
- **Task:** 4 / 11 done — lib: types, mode+probe, rewrite, rrf, retrieve, rerank, cite, answer (live+fixture), pipeline, sse; 30 unit tests ✓; chat-cli works in fixture mode
- **Last checks:** db:check 12/12 ✓
- **Blockers:** **ANTHROPIC_API_KEY has no credit** → `CHAT_MODE=fixture` is the effective mode; chat eval suite will print `NO API CREDIT — chat suite skipped`.
  Carried for James: `supabase config push`, `PRIVATE_ACCESS_KEY` in `.env.local`, Google OAuth, re-record extraction fixtures, `npm run cache:check`.
- **Decisions taken by default this loop:** bot name "Mentor"; single persona; `CHAT_MODE` auto→fixture on billing error.
- **Next action:** task 5 — `POST /api/chat` (SSE, persistence, cap) + `POST /api/chat/feedback`.

## Heartbeat (Stop hook appends here; keep last 10 lines)
