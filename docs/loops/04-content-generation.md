# Loop 04 — Technicals content generation

_Status: planned. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
Claude writes every core lesson (≈ 45) and an original question bank (≈ 350) via Batches into `content/` JSON, validated + overlap-checked, loaded as `generated`, with a mentor review queue; Accounting + EqV/EV auto-approve after evals.
## Out of scope
industry (09), video, new widgets.
## Research at start
Claude skill `batches.md`, `tool-use.md` § structured outputs, `prompt-caching.md`, `token-counting.md`; `400q-taxonomy.md` § feeds the product; Loop 03 retro + `lesson-schema.ts`.
## Data model — `0005_content_review.sql`
`content_reviews(id, target_type lesson|question, target_id, reviewer_id, decision approved|changes_requested|rejected, comment, created_at)`; `generation_runs(id, kind lessons|questions|industry, batch_id, params, status, requested, succeeded, failed, cost_usd, created_at, finished_at)`; `lessons/questions.review_note`. Staff-only RLS.
## Routes/screens
`/admin/review` (queue + filters), `/admin/review/[type]/[id]` (preview + `decideReview` + "Regenerate with note" sync), `/admin/generation` (runs, polls batch status); `POST /api/admin/generate`, `POST /api/admin/generate/[runId]/collect`; `src/lib/content/generate/{lesson,question,batch,load}.ts`; prompts `lesson-write.v1`, `question-write.v1`, `content-critic.v1`.
## AI
Lesson writer — Opus 5 in Batches, `zodOutputFormat(LessonBodySchema)`, effort high, max_tokens 12000; shared cached system (audience: UK second-year with one finance module; template order; block rules; £m worked numbers; British spelling; originality rule; taxonomy); user = subtopic, source_section label, sibling titles, prior one-liners, required widget. Question writer — one request per subtopic × kind, targets from `taxonomy.ts` `target_questions` (proportional to 400Q counts, ≈ 350), difficulty mix 25/30/30/15, follow_ups 2–3, weak_answer_note. Critic — Opus 5 effort medium on items failing auto-checks. Auto-checks: schema; `worked_calc` arithmetic re-evaluated; 4 quick-fire pairs; 8-gram overlap vs hidden 400Q (skip with warning if absent; ignore formula/stopword-only grams); reading ≤ 12 min. Batches: poll 60 s up to 4 h, `custom_id` = `lesson:<slug>` / `questions:<subtopic>:<kind>`, raw to `.eval/batches/`, parsed to `content/`; failed → resubmit once then sync.
## Scripts
`scripts/content/generate.ts` (`lessons|questions`, `--topic`, `--all`, `--sync`, `--dry-run` cost via `countTokens`); `collect.ts`; `load.ts`; `approve.ts --topic …`; eval suites `lessons`, `questions`; `scripts/seed/04-content.ts`.
## Env
`CONTENT_MAX_BATCH_USD` (80), `CONTENT_MODEL`.
## Risks
cost (dry-run gate); batch wait (build review UI meanwhile, Monitor on the poll file); large schemas (test one sync request first); overlap false positives logged.
## Acceptance checks
- [ ] lint/typecheck/build
- [ ] vitest arithmetic/overlap/batch parser
- [ ] `content/lessons/**` ≥ 40 and `content/questions/**` ≥ 320 files all validating
- [ ] `eval --suite lessons,questions` passes (readability ≥ 4/5 on 15 sample, overlap 0, difficulty ±15 %)
- [ ] `seed -- 04` → ≥ 40 lessons, ≥ 320 questions, free topics approved
- [ ] `generation_runs.cost_usd ≤ cap`
- [ ] Playwright `e2e/04-review.spec.ts` (mentor requests changes → `in_review` + review row → student cannot open)

## Tasks
- [x] migration
- [x] prompts + targets
- [x] generate.ts + dry-run + one-lesson smoke (smoke blocked — no API credit, see Blocked)
- [x] checkers + tests
- [x] batch submit/poll/collect/resubmit (collect exercised on fixtures/recorded/batch-results.jsonl; submit/poll/resubmit code paths untested live — no credit)
- [ ] lessons batch → collect → validate → critic
- [ ] questions batch → collect → validate
- [x] load/seed/approve
- [ ] review UI + regenerate-one
- [ ] eval suites + auto-approve free topics
- [ ] Playwright, `docs/research/content-pipeline.md`, retro

## Blocked-on-human (defaults)
approval → only Accounting + EqV/EV auto-approve when evals pass (listed in retro); total ≈ 350.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
