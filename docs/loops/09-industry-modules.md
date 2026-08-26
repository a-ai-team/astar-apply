# Loop 09 — Industry modules

_Status: merged (partial). Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
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
- [x] lint/typecheck/build
- [x] `seed -- 09` → 18 topics (PASS; counts via table fallback until 0010 is applied)
- [ ] ≥ 45 lessons, ≥ 180 questions under `content/industry/**`, schema-valid, overlap 0 — **targets exist (50 / 181, dry-run ≈ $12), files do not: no API credit (§ Blocked 2)**; the 1 lesson + 8 questions present are schema-valid with overlap 0
- [ ] `eval --suite industry` + readability ≥ 4/5 on 10 — suite PASSES on schema 1.0 / overlap 0 / key_metrics; readability **skipped** (NO API CREDIT)
- [ ] decks for all 18 — only Real Estate can have a deck (8 cards, e2e-approved then restored); others wait for the batch
- [x] `content:index` updated (re-run after the seed; nothing industry-approved yet → 0 new chunks)
- [x] Playwright `e2e/09-industry.spec.ts` 2/2 (approve RE lesson + questions in setup → grid by family → module → `key_metrics` renders → deck 8 cards → module drill starts → mock industry option → restored in `afterAll`)

## Tasks
- [x] migration + rows (0010 written; applied → § Blocked 1; seed 03/09 carry a fallback)
- [x] `key_metrics` block (already in the contract since Loop 03 — verified: `KeyMetricsBlock`, renderer, labels, writer schema; industry lessons now *require* it in `checks.ts`)
- [x] addendum + targets (`industry-addendum.v1`, `INDUSTRY_CURRICULUM`, `--kind industry`; dry-run lessons $8.84 + questions $3.49, heuristic)
- [x] dry-run → lessons batch → validate → critic (dry-run only: 50 lessons ≈ $8.84; batch blocked → § Blocked 2; ONE hand-written Real Estate lesson loaded `generated`)
- [x] questions batch (dry-run only: 81 requests / 181 questions ≈ $3.49; 8 hand-written Real Estate questions loaded `generated`)
- [x] load/decks/index (`seed -- 09` loads content/industry/**; decks/index follow approval via `seed -- 05` + `content:index`)
- [x] grid + module page (`/home/technicals/industry` grouped by family; `/home/technicals/[topic]` reused with family badge; generalist grid hides industry topics)
- [x] mock industry option (`startInterview` reads `industry`; mock round-robin adds the module; `interviews.topic_id` records it)
- [x] eval suite (`eval --suite industry`: 1 lesson + 8 questions, schema 1.0, overlap 0 (hidden set present), key_metrics present, readability skipped — no credit)
- [ ] Playwright/docs/retro

## Blocked-on-human (defaults)
auto-approve → no; all `generated`.


## Blocked
1. **Migration `0010_industry.sql` is written but NOT applied.** Every Postgres path is unreachable from this sandbox: `npm run db:migrate` (`supabase db push --linked`) → `failed to connect as temp role … unsupported or invalid secret format`, then with `SUPABASE_DB_PASSWORD` → `failed to write startup message … i/o timeout` on `aws-1-eu-west-1.pooler.supabase.com:5432`; `--db-url` against the direct host (`ENOTFOUND`, IPv6-only) and the session/transaction poolers (TLS/startup `i/o timeout`); `supabase db query --linked` and `migration list --linked` hang the same way. PostgREST works, so the seeds/e2e ran. **James:** from a normal shell run `npm run db:migrate` (0010 is idempotent; `on conflict` keeps the seeded rows), then `npm run seed -- 09` once more so `group_family` is written and `industry_modules` is used (`seed 09` prints `source: view`). Until then the code paths fall back (`TODO(james)` in `src/lib/content/industry.ts`, seed 03 warning).
2. **Industry batches never ran — `ANTHROPIC_API_KEY` has no credit.** Dry-runs recorded in `generation_runs`: lessons 50 requests ≈ $8.84, questions 81 requests / 181 questions ≈ $3.49 (chars/3.5 heuristic; expect 10–30 % more input). When credit exists:
   ```
   npx tsx scripts/dev/api-probe.ts                                           # must print OK
   npm run content:generate -- lessons --slug real-estate-valuation-methods --kind industry --sync   # one-lesson smoke (writes content/industry/real-estate/lessons/)
   npm run content:generate -- lessons --kind industry --all --dry-run       # re-estimate with count_tokens
   npm run content:generate -- lessons --kind industry --all                 # batch 1 (skips the hand-written RE lesson)
   npm run content:generate -- questions --kind industry --all               # batch 2 (tops Real Estate up from 8 to 10)
   npm run content:collect -- --run <lessons run id> --resubmit              # checks (incl. key_metrics) → critic → content/industry/**
   npm run content:collect -- --run <questions run id> --resubmit
   npm run content:validate && npm run seed -- 09                            # load; prints per-module counts
   npm run eval -- --suite industry                                          # schema 100 %, overlap 0, readability ≥ 4 on 10
   # approve in /admin/review (all industry rows land as `generated`; nothing auto-approves), then:
   npm run seed -- 05 && npm run content:index                               # decks for all 18 + mentor retrieval
   ```
3. **Nothing industry-related is approved for students.** The Real Estate lesson + 8 questions are `generated` (the e2e approves and restores them). Approve them in `/admin/review` to make the module live for real.

## Retro
- **Shipped:** `INDUSTRY_MODULES` / `INDUSTRY_CURRICULUM` (18 modules, families, 50 lesson subtopics, 181 question targets from the 400Q counts, `lessonTargetCount` / `questionTargetCount`), `ALL_CURRICULUM` + `findSubtopic` across both, `isContentTopicSlug`; migration `0010_industry.sql` (`group_family`, 18 rows, `industry_modules` view — unapplied, § Blocked 1) with fallbacks in seed 03 and `src/lib/content/industry.ts`; `scripts/seed/09-industry.ts`; `content/industry/<module>/{lessons,questions}` walked by `validateContentDir` / loaded by `loadContent`; `industry-addendum.v1` prompt + `industryUserLines`, `LessonWriteInput.industry` / `QuestionWriteInput.industry`, targets carry `industry` context, `--kind industry`, `contentPathFor`, `prompt_version …+industry-addendum.v1`, `checks.ts` requires `key_metrics` on industry lessons (admin regenerate too); hand-written Real Estate lesson (NOI → cap rate → NAV, Thameside Estates, `key_metrics` × 6) + 8 questions (2/3/2/1 difficulties, two with `numbers`); `eval --suite industry` (+ `THRESHOLDS.industry`); `/home/technicals/industry` grid by family, generalist grid link + filter, module page badge/back link; mock "Add an industry module" select + `startInterview` `industry`; `drillTopics` returns `kind`; `e2e/09-industry.spec.ts` 2/2; 2 new vitest blocks; docs (TECHNICALS § Loop 09, CONTRIBUTING, content-pipeline).
- **Slipped:** applying 0010 (network); the two batches + critic + readability (credit); decks for 17 modules; `content:index` has no industry chunks; no admin filter for industry modules in `/admin/review` (topic filter already lists them since they are topics); no `industry_topic_id` column (used `interviews.topic_id`).
- **Decisions taken by default:** (1) `group_family` is authored in `taxonomy.ts` and mirrored to the DB column when it exists — the page never depends on the column; (2) industry modules are **paid** (`is_free = false`; `FREE_TOPIC_SLUGS` unchanged = accounting, eqv-ev); (3) industry lessons must include `key_metrics` (a missing block is a check problem → `draft`, never `generated`); (4) a mock with an industry module stores the module in `interviews.topic_id` (history shows "Full mock · Real Estate") instead of a new column; (5) subtopic per lesson: `kind` calculation/mixed from the lesson subject, question targets split largest-first across a module's lessons; (6) industry topics get ordinals 100+ and are hidden from the generalist grid, but they appear in every topic-driven list (decks, drills, ⌘K, `/admin/review` topic filter) once content is approved; (7) hand-written content is `generated_by: human`, `prompt_version: null`, status `generated` — nothing auto-approved.
- **Loop 10 must know:** (1) **Free vs paid lives in `topics.is_free`** (seeded from `CURRICULUM[].is_free` / `INDUSTRY_CURRICULUM[].is_free`; `FREE_TOPIC_SLUGS` = `accounting`, `eqv-ev`; all 18 industry modules are paid) — lessons/questions have no `is_free` of their own, gate by their topic; the `industry_modules` view exposes `is_free` too. (2) Approved content today: 2 generalist lessons + 6 questions; the Real Estate lesson + 8 questions are `generated` and get approved/restored by the e2e only. (3) `resolveChatMode()` is still the single live/fixture switch; Loop 09 added no runtime Claude call (only batch targets). (4) Migration 0010 is pending — Loop 10's `0011` can assume it *after* James runs `db:migrate`; do not depend on `industry_modules` without the `listIndustryModules` fallback. (5) Postgres is unreachable from this sandbox (PostgREST only); plan migrations so the loop can proceed without them or ask James to apply them first.
