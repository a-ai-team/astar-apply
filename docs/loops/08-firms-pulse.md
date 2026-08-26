# Loop 08 — Firm interview bank + Pulse

_Status: in-progress. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
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
- [ ] lint/typecheck/build
- [ ] vitest rate limit, digest schema, timeline
- [ ] `seed -- 08` → 14 firms, ≥ 140 generated questions, 1 sample digest
- [ ] `pulse/generate.ts --dry-run` produces a schema-valid digest with ≥ 3 sourced stories into `.eval/`
- [ ] Playwright `e2e/08-firms.spec.ts` (test setup approves one firm → grid → filter HireVue → submit report → admin approves → visible; `/home/pulse` renders sample)
- [ ] `/api/cron/pulse` without secret → 401

## Tasks
- [x] migration
- [x] dossier fixtures + seed
- [x] question authoring script + load
- [x] firm pages + timeline + filters + drill bridge
- [x] report form + rate limit + admin promote
- [ ] Pulse prompts + generate
- [ ] cron route + `vercel.json`
- [ ] Pulse pages
- [ ] admin firm editor
- [ ] Playwright/docs/retro; merge (data gated by status)

## Blocked-on-human (defaults)
verification → all `generated`; auto-publish → off.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
