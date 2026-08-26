# Content generation pipeline (Loop 04)

How lessons and questions get written by Claude, checked, reviewed and approved. Plan + retro:
`docs/loops/04-content-generation.md`. Contracts: `docs/loops/CONTRACTS.md`. Rules: `.claude/rules/{ai,content}.md`.

## Shape
```
taxonomy.ts ──▶ targets.ts ──▶ requests.ts ──▶ Message Batch (Opus 5, structured output)
  (53 subtopics,   lesson:<slug>      cached system         │ poll 60 s ≤ 4 h
   Σ 347 Qs)       questions:<sub>:<kind>                    ▼
                                            .eval/batches/<batch>.results.jsonl  (raw, gitignored)
                                                             │ batch.ts parseResultRow
                                                             ▼
                                   checks.ts: schema → approval rules (required blocks, worked_calc
                                   arithmetic via evalExpr, reading ≤ 12) → 4 quick-fire pairs →
                                   8-gram overlap vs $EVAL_HIDDEN_DIR/.eval/400q.jsonl
                                                             │ collect.ts
                        ┌────────────────────────────────────┼───────────────────────────┐
                   passes → content/**  status generated   fails checks → critic.ts (Opus 5,   schema fails / errored /
                                                            medium) → re-check → generated,   expired / max_tokens →
                                                            else draft + check_problems       resubmit once (custom_id)
                                                             │
                                          scripts/content/load.ts (npm run content:load / seed -- 04)
                                                             │
                             /admin/review queue → mentor decision (content_reviews) → approved
                             scripts/content/approve.ts --topic accounting,eqv-ev (after evals pass)
```

## Where things live
| Piece | File |
|---|---|
| Targets (what to write, counts, difficulty mix, required widgets) | `src/lib/content/generate/targets.ts` |
| Request params (model, max_tokens, cached system, `zodOutputFormat`) | `src/lib/content/generate/requests.ts` |
| Writer output schemas (API-safe subset of the contracts) + converters | `src/lib/content/generate/schemas.ts` |
| Cost model + dry-run estimate (`count_tokens`, chars/3.5 fallback) | `src/lib/content/generate/cost.ts` |
| Batch submit / poll / results / row parser | `src/lib/content/generate/batch.ts` |
| Automatic checks | `src/lib/content/generate/checks.ts` (+ `src/lib/content/overlap.ts`) |
| Rows → content files (pure) | `src/lib/content/generate/collect.ts` |
| Critic (sync) · single-target sync writer | `critic.ts` · `sync.ts` |
| DB helpers (`generation_runs`, upsert collected items) | `load.ts` |
| Server-side orchestration for admin/API (existing from DB) | `service.ts` |
| Prompts | `src/lib/ai/prompts/{lesson-write,question-write,content-critic}.v1.ts` |
| CLIs | `scripts/content/{generate,collect,approve}.ts`, `scripts/seed/04-content.ts` |
| Evals | `scripts/eval/suites/{lessons,questions}.ts`, `scripts/eval/readability.ts` |
| Admin | `/admin/review`, `/admin/review/[type]/[id]`, `/admin/generation`, `POST /api/admin/generate`, `POST /api/admin/generate/[runId]/collect` |
| Recorded fixture (hand-authored, results shape) | `fixtures/recorded/batch-results.jsonl` |

## Running it (the order James runs once credit exists)
```
npx tsx scripts/dev/api-probe.ts                                   # must print OK
npm run content:generate -- lessons --all --dry-run                # estimate; aborts above CONTENT_MAX_BATCH_USD (80)
npm run content:generate -- lessons --all                          # submits the batch, records generation_runs
npm run content:generate -- questions --all                        # second batch
npm run content:collect -- --run <lessons run id> --resubmit       # when ended: checks → critic → content/ (+ resubmit failures)
npm run content:collect -- --run <questions run id> --resubmit
npm run content:validate && npm run content:load                   # or: npm run seed -- 04
npm run eval -- --suite lessons,questions                          # schema 100 %, overlap 0, readability ≥ 4, mix ±15 %
npm run content:approve -- --topic accounting,eqv-ev               # only after the evals pass
```
Industry modules (Loop 09) use the same pipeline with `--kind industry` (adds the industry addendum,
writes to `content/industry/<module>/`); the sequence is in `docs/loops/09-industry-modules.md` § Blocked 2.

`--sync` runs targets one at a time (streamed, with refusal fallbacks) — use `--slug wacc --sync` for
the one-lesson smoke test. `--wait` polls and collects in one go. `/admin/generation` can start,
refresh and collect runs too (it loads the DB directly; content/ files still come from the CLI).

## Design notes
- **Structured output** uses a writer schema (`schemas.ts`) that avoids the JSON-schema features the
  API rejects (`z.record`): `widget.props` is filled with `{}`, `numbers.inputs` is a list of
  `{name, value}` converted to a record. Everything else is the contract schema verbatim, so
  `validateLessonBody`/`validateQuestion` are the final gate.
- **Prompt caching**: the system block is static (taxonomy + rules, > 1024 tokens) and marked
  `cache_control`; every per-request fact is in the user turn. Estimates assume 1 cache write + N reads.
- **custom_id** is the only key: `lesson:<subtopic-slug>` / `questions:<subtopic>:<concept|calculation>`;
  `targetFromCustomId` rebuilds the target from the taxonomy, so a results file is self-describing.
- **Failure policy**: retryable (server error, expired, `max_tokens`, bad JSON) → resubmit once;
  `invalid_request` / refusal → never retried, reported. Items that fail checks after the critic are
  kept as `draft` with `check_problems`/`review_note` so a mentor can fix them in the editor.
- **Never overwrite** an `approved`/`in_review` file (collector skips it unless `--force`).
- **Provenance**: `generated_by` = model id from the result (or `fixture:<file>` for recorded runs),
  `prompt_version` = `<prompt id>.v<version>`; both stored on the file and the row.
- **Cost**: Opus 5 batch prices ($2.50 in / $12.50 out per MTok); thinking tokens are output tokens,
  so `EXPECTED_OUTPUT_TOKENS` (14 k per lesson, 1.5 k per question) is deliberately generous.
  Heuristic dry run (no credit): lessons ≈ $9, questions ≈ $8; expect the real `count_tokens`
  estimate to be 10–30 % higher on input, well under the $80 cap.
