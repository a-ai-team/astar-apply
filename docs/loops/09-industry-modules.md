# Loop 09 — Industry modules

_Status: planned. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
18 industry/group modules (Consumer/Retail, DCM & LevFin, Distressed, ECM, FIG, FSG, Healthcare, Industrials, Metals & Mining, Oil & Gas, Power & Utilities, Secondaries, Private Companies, Project Finance, Real Estate, REITs, Renewables, TMT), each 2–4 lessons + 8–15 questions via the Loop 04 pipeline, under an "Industry" tab; decks and drills work automatically.
## Out of scope
industry widgets beyond `key_metrics`, firm↔industry mapping, live data.
## Research at start
Loop 04 retro + cost; taxonomy industry counts; `batches.md`.
## Data model — `0010_industry.sql`
18 `topics` rows `kind='industry'`, `topics.group_family coverage|product|other`; `key_metrics` block; view `industry_modules`.
## Routes/screens
`/home/technicals/industry` grid by family; module page reuses topic page; `KeyMetricsBlock`; `startInterview` gains optional `industry_topic_id`.
## AI
`generate.ts --kind industry` with industry addendum (how the generalist framework changes: metrics, valuation methods, typical deals, what interviewers probe). Targets: lessons 2/3/4 by source count (< 8 / 8–12 / > 12); questions = source count to nearest 5, min 8. Same checks + `eval --suite industry`.
## Scripts
generate/collect/load; `scripts/seed/09-industry.ts`; re-run `seed 05` and `content:index`.
## Risks
~$40 (dry-run gate); thin modules may drop to 1 lesson if judge flags padding.
## Acceptance checks
- [ ] lint/typecheck/build
- [ ] `seed -- 09` → 18 topics
- [ ] ≥ 45 lessons, ≥ 180 questions under `content/industry/**`, schema-valid, overlap 0
- [ ] `eval --suite industry` + readability ≥ 4/5 on 10
- [ ] decks for all 18
- [ ] `content:index` updated
- [ ] Playwright `e2e/09-industry.spec.ts` (approve one RE lesson in setup → visible → `key_metrics` renders → deck exists → module drill starts)

## Tasks
- [x] migration + rows (0010 written; applied → § Blocked 1; seed 03/09 carry a fallback)
- [x] `key_metrics` block (already in the contract since Loop 03 — verified: `KeyMetricsBlock`, renderer, labels, writer schema; industry lessons now *require* it in `checks.ts`)
- [x] addendum + targets (`industry-addendum.v1`, `INDUSTRY_CURRICULUM`, `--kind industry`; dry-run lessons $8.84 + questions $3.49, heuristic)
- [ ] dry-run → lessons batch → validate → critic
- [ ] questions batch
- [ ] load/decks/index
- [ ] grid + module page
- [ ] mock industry option
- [ ] eval suite
- [ ] Playwright/docs/retro

## Blocked-on-human (defaults)
auto-approve → no; all `generated`.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
