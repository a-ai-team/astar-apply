# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 02 Mentor chatbot v1 (`docs/loops/02-chatbot.md`) — in-progress
- **Branch:** `feat/chatbot` (from main 91f4272)
- **Task:** 7 / 11 done — `POST /api/chat` (SSE, cap, persistence), `/api/chat/feedback`, `/home/mentor` UI (threads, chips, drawer, thumbs), `/admin/feedback`; e2e 10/10 ✓ (workers=1 fixes magic-link race)
- **Last checks:** db:check 12/12 ✓
- **Blockers:** **ANTHROPIC_API_KEY has no credit** → `CHAT_MODE=fixture` is the effective mode; chat eval suite will print `NO API CREDIT — chat suite skipped`.
  Carried for James: `supabase config push`, `PRIVATE_ACCESS_KEY` in `.env.local`, Google OAuth, re-record extraction fixtures, `npm run cache:check`.
- **Decisions taken by default this loop:** bot name "Mentor"; single persona; `CHAT_MODE` auto→fixture on billing error.
- **Next action:** task 8 — eval harness core + retrieval/chat suites + fixtures (60 retrieval pairs, 20 mentor questions).

## Heartbeat (Stop hook appends here; keep last 10 lines)
