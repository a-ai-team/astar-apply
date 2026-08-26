# Firm interview bank + Pulse (Loop 08) — operator guide

Implementation notes live in `docs/TECHNICALS.md` § "Firm interview bank + Pulse". This page is the
short "how do I run it" for James / mentors.

## What students see
- `/home/interviews/firms` — grid of **approved** firms with question counts; `/home/interviews/firms/<slug>`
  — dossier, process timeline, questions filterable by stage (HireVue / interview / AC), programme,
  category, division; each question has "what a strong answer covers" guidance and **Practise this**
  (a 1-question timed drill graded like a mock interview).
- `/home/interviews/report` — "I was asked this" form (5 per day). Reports wait for a mentor.
- `/home/pulse`, `/home/pulse/<monday>` — the weekly digest (**approved** weeks only).

## The status gate (read this before approving anything)
Everything `npm run seed -- 08` and `npm run firms:author` write is `generated` = **unverified and
invisible to students**. The only approved Loop 08 row is the clearly-labelled synthetic sample
digest for week 2026-08-24. A firm question is served only when **both** the question and its firm
are `approved`.

1. `/admin/firms` — list with status and per-status question counts.
2. `/admin/firms/<slug>` — check the dossier against the firm's careers page (sources are listed in
   the JSON), edit in the JSON editor (live schema validation), set status → `approved`, then
   "Approve all unverified" or approve questions one by one.
3. `/admin/reports` — pending student reports; pick category/frequency (+ optional guidance) and
   **Approve → bank** (creates an `approved` firm question, recency = year asked) or Reject.
4. `/admin/pulse` — preview each generated digest; Approve publishes it, Unpublish hides it again.

## Commands
| Command | Does |
|---|---|
| `npm run seed -- 08` | upserts 14 firms + 210 questions from `fixtures/firms/` (keeps existing `status`) and the sample digest |
| `npm run firms:author -- --firm <slug> [--write]` | Opus 5 drafts 10–15 questions → `.eval/firms/<slug>.json` (`--write` replaces the fixture; re-seed after). Prints `NO API CREDIT` and keeps the hand-written file without credit |
| `npm run pulse:generate -- [--week YYYY-MM-DD] [--dry-run] [--force] [--fixture]` | research (web search on `PULSE_ALLOWED_DOMAINS`) + structured digest → `.eval/pulse-<week>.json`; stored `generated` unless `PULSE_AUTO_PUBLISH=true` |
| `curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/pulse` | what Vercel Cron runs Mondays 06:00 UTC (`vercel.json`); `?dry=1`, `?week=`, `?force=1` |

## Env (`.env.example`)
`CRON_SECRET` (must exist in Vercel for the cron to authenticate), `PULSE_AUTO_PUBLISH=false`,
`PULSE_ALLOWED_DOMAINS`, `PULSE_MODEL`. Also `ANTHROPIC_API_KEY` with credit for live authoring / Pulse.

## Tests
`e2e/08-firms.spec.ts` approves Goldman Sachs + its questions in `beforeAll` and sets them back to
`generated` in `afterAll` (the linked project is the only environment). Unit tests: `src/lib/firms`,
`src/lib/pulse`, `src/components/firms`.
