# RUNLOG — one line per loop attempt (append-only; source for the morning report)

Format: `YYYY-MM-DD HH:MM | NN slug | outcome | PR | checks passed/total | notes`
Outcomes: `merged`, `merged (partial)`, `open-pr`, `blocked`, `abandoned`.

2026-08-25 23:40 | 00 foundations | merged | #7 | checks 4/4 | magic link only; JWT claim user_role; hook enabled; James: supabase config push + PRIVATE_ACCESS_KEY + Google OAuth
2026-08-26 00:05 | 01 mentor-corpus | merged (partial) | #8 | checks 6/6 | no API credit → fixture-mode extraction, hand-authored recorded fixtures; 42 seeded chunks; James: top up credit, run record-extraction + cache:check
2026-08-26 00:17 | 02 chatbot | merged (partial) | #9 | checks 7/9 | no API credit → CHAT_MODE fixture, chat eval + cache:check skipped; retrieval recall@5 0.883 (local/FTS-only); 400Q → 413 Qs / 40 hidden; James: top up credit, run `npm run eval -- --suite chat` + `cache:check`, set VOYAGE_API_KEY + reembed
