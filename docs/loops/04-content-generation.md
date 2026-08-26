# Loop 04 — Technicals content generation

_Status: merged (partial) — pipeline + review UI shipped; batches blocked on API credit. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
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
- [x] lint/typecheck/build
- [x] vitest arithmetic/overlap/batch parser (`src/lib/content/generate/{targets,pipeline}.test.ts`, 21 tests; 68/68 overall)
- [ ] `content/lessons/**` ≥ 40 and `content/questions/**` ≥ 320 files all validating — blocked (no credit); 2 + 6 hand-written files validate
- [ ] `eval --suite lessons,questions` passes — ran: schema 100 %, overlap 0 (hidden set present), mix reported (6 < 40, not gated); **readability skipped: NO API CREDIT** → not ticked
- [ ] `seed -- 04` → ≥ 40 lessons, ≥ 320 questions, free topics approved — ran (idempotent, reports FAIL/FAIL on counts as expected without a batch)
- [x] `generation_runs.cost_usd ≤ cap` — dry-run rows: lessons $8.99 (heuristic), cap 80; `content:generate` refuses to submit above the cap (exit 3, run recorded as `failed`)
- [x] Playwright `e2e/04-review.spec.ts` 1/1 (changes requested → `in_review` + `content_reviews` row → approve gate → student 404 + not listed + /admin/review redirect)

## Tasks
- [x] migration
- [x] prompts + targets
- [x] generate.ts + dry-run + one-lesson smoke (smoke blocked — no API credit, see Blocked)
- [x] checkers + tests
- [x] batch submit/poll/collect/resubmit (collect exercised on fixtures/recorded/batch-results.jsonl; submit/poll/resubmit code paths untested live — no credit)
- [ ] lessons batch → collect → validate → critic — **blocked — no API credit**
- [ ] questions batch → collect → validate — **blocked — no API credit**
- [x] load/seed/approve
- [x] review UI + regenerate-one (regenerate needs credit — wired, untested live)
- [x] eval suites + auto-approve free topics (suites run; readability skipped NO API CREDIT; approve.ts ready, nothing to approve yet)
- [x] Playwright, `docs/research/content-pipeline.md`, retro

## Blocked-on-human (defaults)
approval → only Accounting + EqV/EV auto-approve when evals pass (listed in retro); total ≈ 350.


## Blocked
- **lessons batch / questions batch / one-lesson smoke / critic / auto-approve — no API credit.**
  `npx tsx scripts/dev/api-probe.ts` → `BILLING — credit balance is too low` (probed once at the
  start of the run; not retried). Everything that does not call Claude is built and exercised against
  `fixtures/recorded/batch-results.jsonl` (hand-authored to the results shape: 2 good rows, 1 row with a
  wrong `worked_calc` value → draft path, 1 errored, 1 expired, 1 `max_tokens`). When credit is added,
  James runs, in this order:
  ```
  npx tsx scripts/dev/api-probe.ts
  npm run content:generate -- lessons --all --dry-run        # count_tokens estimate; must be ≤ $80
  npm run content:generate -- lessons --all                  # submits; prints the run id
  npm run content:generate -- questions --all                # (its own dry-run first if you like)
  npm run content:collect -- --run <lessons-run-id> --resubmit
  npm run content:collect -- --run <questions-run-id> --resubmit
  npm run content:validate && npm run content:load           # or npm run seed -- 04
  npm run eval -- --suite lessons,questions
  npm run content:approve -- --topic accounting,eqv-ev
  ```
  Then re-run the acceptance checks above and tick them; append the approvals to the retro.
- Readability judge (eval `lessons`) skipped for the same reason; overlap + schema ran for real.

## Retro
- **Shipped:** migration `0005_content_review` (`content_reviews`, `generation_runs`, `review_note`
  on lessons/questions, staff RLS + service_role grants; `db:check` 25/25); prompts `lesson-write.v1`,
  `question-write.v1`, `content-critic.v1` (static cached system, per-request user turn);
  `src/lib/content/generate/` — `targets` (51 lesson + 64 question requests = 341 questions against
  Σ 347 with 6 existing; largest-remainder 25/30/30/15 mix; required widgets per subtopic), `requests`
  (`zodOutputFormat`, effort high, 12 k / 16 k max_tokens), `schemas` (API-safe writer schemas →
  contract converters), `cost` (count_tokens with chars/3.5 fallback, batch + cache pricing, cap gate),
  `batch` (submit/poll/results/row parser), `checks` (schema, approval rules incl. `evalExpr` arithmetic,
  4 quick-fire pairs, pure-arithmetic exprs, 8-gram overlap by count only), `collect` (rows → files,
  draft + `check_problems` on failed checks, resubmit list), `critic`, `sync` (streamed, fallbacks),
  `load` (runs + DB upsert), `service` (admin/API orchestration with DB-sourced existing content);
  `scripts/content/{generate,collect,approve,existing}.ts`, `scripts/seed/04-content.ts`,
  `content:generate|collect|approve` npm scripts, `CONTENT_MAX_BATCH_USD`/`CONTENT_MODEL` in
  `.env.example`; load/validate carry `generated_by`/`prompt_version`/`check_problems` from files;
  `/admin/review` (filters type/status/topic), `/admin/review/[type]/[id]` (preview, history,
  `decideReview` with the editor's approval gate, `regenerateOne`), `/admin/generation` (runs, start
  dry-run/batch, refresh, collect), `POST /api/admin/generate`, `POST /api/admin/generate/[runId]/collect`;
  eval suites `lessons` (schema, overlap, Opus 5 readability judge on a deterministic 15-sample) and
  `questions` (schema, mix ±15 % gated at n ≥ 40, overlap); `fixtures/recorded/batch-results.jsonl`;
  21 new vitest; `e2e/04-review.spec.ts`; `docs/research/content-pipeline.md`; `docs/TECHNICALS.md` §.
- **Slipped (blocked, not abandoned):** the two batches, the one-lesson smoke, the critic pass, the
  content counts and the auto-approval — all need API credit (command sequence under Blocked).
  Live-untested code paths: `submitBatch`/`pollBatch`/`fetchResults`, `resubmit`, `runCritic`,
  `generateSync`, `refreshRun`/`collectRun`, `countTokens`. They follow the `/claude-api` skill docs
  (batches.md, tool-use.md § structured outputs) and are typed against the SDK, but the first live run
  should start with `npm run content:generate -- lessons --slug wacc --sync`.
- **Decisions taken by default:** (1) items that fail checks after the critic (or when the critic
  cannot run) are kept as `draft` with `check_problems` on the file and `review_note` on the row —
  visible in the queue and editor, never auto-approved. (2) Retry policy: retryable failures
  (server error, expired, `max_tokens`, bad JSON) are resubmitted once via `--resubmit`; a resubmitted
  run is never resubmitted again. (3) The collector never overwrites `approved`/`in_review` files.
  (4) Difficulty-mix mismatch inside one request is a warning, not a critic trigger (the eval gates the
  global mix). (5) Regenerate-one for a question regenerates one question of the same kind and
  difficulty into the same row/slug. (6) `EXPECTED_OUTPUT_TOKENS` 14 k/lesson, 1.5 k/question to
  cover adaptive-thinking output; heuristic dry run ≈ $9 + $8. (7) `/admin/generation` collect loads
  the DB only (Vercel FS is read-only); content/ files come from the CLI. (8) The fixture-derived rows
  (`income-statement` generated, `cash-flow-statement` draft, 4 income-statement questions,
  `generated_by = fixture:batch-results.jsonl`) were loaded into the DB to exercise load + the review
  queue and were left there; they are not in `content/`, and a real `lesson:income-statement` run
  overwrites them (same slugs). (9) Overlap check on the server (API collect route) is skipped —
  the hidden set only exists locally; the CLI collect re-checks.
- **Loop 05 must know:** (1) **Approved questions today: 6** (all hand-written, `content/questions/*`,
  topics accounting + eqv-ev, difficulties 1–4) and 2 approved lessons — flashcard derivation has only
  those until James runs the batches; build Loop 05 against `status = 'approved'` and expect the count to
  jump to ≈ 350 later. (2) Flashcards: `flashcardBack(q)` from `src/lib/content/question-schema.ts` =
  `body.flashcard_back ?? first paragraph of model_answer_md`; the writer emits `flashcard_back` only
  when the first paragraph is too long (one of the 4 fixture questions has it). (3) Question rows carry
  `review_note` (checker/reviewer text) and `generated_by`/`prompt_version`; `status` flow is
  `generated → in_review → approved` with `content_reviews` as the audit trail. (4) Nothing non-approved
  is readable under RLS with the cookie client; the practice UI should query with it, not the admin
  client. (5) `difficultyShares()` in `generate/checks.ts` gives the mix for a progress dashboard.
