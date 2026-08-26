# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-25 23:13 (14 h cap → 2026-08-26 13:13)
- **Loop:** 08 Firm interview bank + Pulse (`docs/loops/08-firms-pulse.md`) — in-progress
- **Branch:** `feat/firms-pulse` (from `main` after Loop 07 #14)
- **Task:** 7 / 10 done — `GET /api/cron/pulse` (Bearer `CRON_SECRET`, constant-time; 401 without/wrong header verified with curl; `?week`, `?force=1`, `?dry=1`; `resolveChatMode()` → fixture branch; `storeDigest`), `vercel.json` cron `0 6 * * 1`, `maxDuration 300`; next: Pulse pages
- **Last checks:** db:migrate ✓ db:check 46/46 ✓
- **Blockers:** **ANTHROPIC_API_KEY still has no credit** — firm-question authoring and the Pulse digest run their fixture branches; live re-run commands go under Loop 08 § Blocked. Carried: Loop 04 § Blocked, 06 § Blocked 1–3, 07 § Blocked 1–4; `VOYAGE_API_KEY` + reembed; `supabase config push`; `PRIVATE_ACCESS_KEY`; Google OAuth; free-topic confirmation; staff view of students' interviews.
- **Decisions taken by default this loop:** (1) `interview_turns.firm_question_id` + `question_id` nullable with a one-of check (Loop 07 retro option 2) so "Practise this" drills a firm question without a mirror `questions` row; (2) `firm_questions` unique on `(firm_id, question)` as the seed's natural key; (3) `firm_question_reports` gains `reviewed_at` + `promoted_question_id` for traceability.
- **Next action:** `/home/pulse` (latest approved digest + archive) and `/home/pulse/[week]` rendering `pulse_digests.body` (stories → take, talking points, anchors, practice Qs, sources); `src/lib/pulse/queries.ts`.

## Heartbeat (Stop hook appends here; keep last 10 lines)
