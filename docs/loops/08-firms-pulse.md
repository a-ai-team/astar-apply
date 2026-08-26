# Loop 08 — Firm interview bank + Pulse

_Status: merged (partial). Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
firm-by-firm question bank with stage/programme/frequency/recency tags, dossiers with process timelines, reviewed "report a question" form, and a weekly AI-written Pulse digest with interview framing. Merges, but **all firm rows and Pulse digests stay `generated` (student-invisible) until James approves them in admin.**
## Out of scope
live tiles (FMP), per-ticker pages, scraping forums, logos.
## Research at start
Claude `web_search_20260209` (allowed domains, citations); Next `09-revalidating.md`, `instrumentation.md`; Vercel Cron (`vercel.json` crons); `financefluency.md` § Interviews/Pulse; firms' own careers pages only for facts.
## Data model — `0009_firms_pulse.sql`
`firms(id, slug, name, type bulge_bracket|elite_boutique|uk_mid|buy_side|other, founded, hq, headcount, scale_note, divisions[], values[], process jsonb [{stage, when, notes}], sources jsonb, status, updated_at)`; `firm_questions(id, firm_id, category motivation|behavioural|commercial|about_you|technical, division, question, stage hirevue|interview|ac, programme spring|summer|graduate|offcycle, frequency very_common|common|occasional, recency_year, guidance_md, sources, status, reported_by, created_at)`; `firm_question_reports(id, user_id, firm_id, programme, stage, division, asked_at, context, question, status pending|approved|rejected, reviewer_id, created_at)`; `pulse_digests(id, week_start unique, status, body jsonb {stories[{headline, take_md, talking_points[3], anchors[], practice_qs[{q,a}], sources[{title,url}]}]}, model, generated_at)`. RLS: approved readable; reports own-insert, staff all.
## Routes/screens
`/home/interviews/firms`, `/home/interviews/firms/[slug]` (dossier, `ProcessTimeline`, `FirmQuestionList` filters, guidance accordion, "Practise this" → 1-Q drill); `/home/interviews/report` (`reportQuestion`, 5/day); `/admin/reports` (approve → promote); `/home/pulse`, `/home/pulse/[week]`; `GET /api/cron/pulse` (`CRON_SECRET`, cron `0 6 * * 1`); `/admin/firms/[slug]` JSON editor.
## AI
firm question authoring — Opus 5 structured, 10–15 per firm from public knowledge of programmes, `status='generated'`, `recency_year=null` (no fake provenance), guidance = "what a strong answer covers". Pulse — Opus 5 + web search (`max_uses 8`, allowed: ft.com, reuters.com, bloomberg.com, bbc.co.uk, economist.com, wsj.com) then structured call; stored `generated`; `PULSE_AUTO_PUBLISH=false`.
## Scripts
`scripts/seed/08-firms.ts` (14 firms: GS, MS, JPM, Citi, Barclays, UBS, DB, BofA, Lazard, Evercore, PJT, PWP, Rothschild, Blackstone; `fixtures/pulse/sample-week.json` clearly synthetic, approved so the page renders); `scripts/pulse/generate.ts --week`.
## Env
`CRON_SECRET`, `PULSE_AUTO_PUBLISH=false`, `PULSE_ALLOWED_DOMAINS`.
## Risks
stale facts → "unverified" badge until approved; search cost capped; names in plain text.
## Acceptance checks
- [x] lint/typecheck/build
- [x] vitest rate limit, digest schema, timeline (147/147 unit, 28 files)
- [x] `seed -- 08` → 14 firms, ≥ 140 generated questions, 1 sample digest (PostgREST counts: firms 14, firm_questions 210 seeded — 195 `generated` while e2e held Goldman approved — pulse_digests 1 approved)
- [x] `pulse/generate.ts --dry-run` produces a schema-valid digest with ≥ 3 sourced stories into `.eval/` — **fixture branch only** (`NO API CREDIT — fixture digest`, `3 stories (3 sourced), 3 searches, 0 dropped` → `.eval/pulse-2026-08-24.json`); the live web-search run is § Blocked 1
- [x] Playwright `e2e/08-firms.spec.ts` 3/3 (27/27) (test setup approves one firm → grid → filter HireVue → submit report → admin approves → visible; `/home/pulse` renders sample)
- [x] `/api/cron/pulse` without secret → 401 (curl against `next start :3100`: no header 401, wrong bearer 401, `Bearer $CRON_SECRET&dry=1` → 200 `{mode:"fixture", stories:3}`)

## Tasks
- [x] migration
- [x] dossier fixtures + seed
- [x] question authoring script + load
- [x] firm pages + timeline + filters + drill bridge
- [x] report form + rate limit + admin promote
- [x] Pulse prompts + generate
- [x] cron route + `vercel.json`
- [x] Pulse pages
- [x] admin firm editor
- [x] Playwright/docs/retro; merge (data gated by status)

## Blocked-on-human (defaults)
verification → all `generated`; auto-publish → off.


## Blocked
1. **Live Pulse digest never ran — `ANTHROPIC_API_KEY` has no credit.** `pulse:generate` and `GET /api/cron/pulse` take the fixture branch (`resolveChatMode()` → fixture, `prompt_version fixture:sample-week.v1`). When credit exists: `npm run pulse:generate -- --dry-run` (expect `mode: live`, ≥ 3 sourced stories from `PULSE_ALLOWED_DOMAINS`, `searches_used ≤ 8`), then `npm run pulse:generate -- --force` and approve the week in `/admin/pulse`. Set `CRON_SECRET` in Vercel so the Monday cron authenticates.
2. **Firm-question authoring never ran live.** The 210 questions in `fixtures/firms/questions/*.json` are hand-written. When credit exists: `npm run firms:author -- --firm goldman-sachs --dry-run`, read `.eval/firms/goldman-sachs.json`, then `--write` + `npm run seed -- 08` per firm you want replaced (existing rows keep their `status`).
3. **`supabase db query --linked` hangs in this environment** (interactive prompt) — the FK name for the `/admin/reports` embed was confirmed via PostgREST instead (`profiles!firm_question_reports_user_id_fkey` resolves).
4. **Nothing is approved for students.** All 14 firms and every question are `generated`; only the synthetic sample digest is `approved`. James: follow `docs/FIRMS_PULSE.md` § status gate.

## Retro
- **Shipped:** migration `0009_firms_pulse` (`firms`, `firm_questions`, `firm_question_reports`, `pulse_digests`, `interview_turns.firm_question_id` one-of check, RLS approved-only for students, `db:check` 46/46); `src/lib/firms/{schema,queries,reports}.ts`, `src/lib/pulse/{schema,prompts,generate,store}`; 14 dossier fixtures + 210 hand-written questions + synthetic sample digest, `seed 08` (status-preserving upserts); `firms:author` (Opus 5 structured, fixture fallback) and `pulse:generate` (Opus 5 + `web_search_20260209`, `enforceSources`, fixture fallback); `GET /api/cron/pulse` (bearer `CRON_SECRET`, 401 otherwise) + `vercel.json` `0 6 * * 1`; pages `/home/interviews/firms`, `/home/interviews/firms/[slug]` (`ProcessTimeline`, `FirmQuestionList` filters, guidance accordion, **Practise this** → `startDrillFor` 1-question drill graded from `guidance_md`), `/home/interviews/report` (5/day), `/home/pulse`, `/home/pulse/[week]` (`DigestView`, Monday-only); admin `/admin/firms`, `/admin/firms/[slug]` (JSON editor + live `FirmSchema` validation, status, `unverified` badge, per-question + bulk approvals), `/admin/reports` (approve → promoted `approved` question; fixed the two-FK `profiles` embed), `/admin/pulse`; `e2e/08-firms.spec.ts` 3/3 (27/27 overall), unit 147/147; docs `FIRMS_PULSE.md`, TECHNICALS § Loop 08, CONTRIBUTING, `.env.example` +4.
- **Slipped:** live Pulse research + live question authoring (no credit, § Blocked 1–2); no `/admin/firms` e2e beyond the editor render + unverified badge; Pulse archive pagination (lists every approved week); no per-firm practice stats from `attempts`.
- **Decisions taken by default:** (1) `interview_turns.firm_question_id` + nullable `question_id` with a one-of check (Loop 07 retro option 2) — firm questions are drilled without mirror `questions` rows; (2) `firm_questions` unique on `(firm_id, question)`; (3) `firm_question_reports.reviewed_at` + `promoted_question_id`; (4) hand-written questions carry `recency_year: null` and `generated_by: 'fixture'` — no fake provenance; (5) a promoted report becomes an `approved` question immediately (mentor approval *is* the review) but stays invisible until its firm is approved; (6) `PULSE_AUTO_PUBLISH=false`, digests never downgraded from `approved`, `week_start` must be a Monday (else 404); (7) `decideReport` revalidates the list rather than showing an inline "Approved" message (the e2e asserts the row moves to `?status=approved`); (8) the sample digest is `approved` so the page renders, flagged with a "sample" banner.
- **Loop 09 must know:** (1) `resolveChatMode()` is still the single live/fixture switch — every new Claude call needs a fixture branch or Playwright/CI fail; (2) the Loop 04 pipeline (`content:generate` → batches → critic → sync/load) has never run live, so Loop 09's 18 industry modules will be fixture-thin until credit exists — build the `topics kind='industry'` migration, targets and seed so one command fills them later; (3) firm dossiers carry `divisions[]` — a firm↔industry mapping is out of scope but the column is there if Loop 09 wants "firms active in this group"; (4) `supabase db query --linked` hangs here — inspect schema via PostgREST or `db:check`; (5) e2e specs mutate shared rows on the linked project — always restore in `afterAll`.
