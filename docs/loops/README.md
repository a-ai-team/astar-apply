# Loop protocol

A* Apply is built in **loops**. One loop = one shippable slice of the product. Every loop runs
the same five stages, and nothing is built before the research and plan for that loop exist.

```
RESEARCH ──▶ PLAN ──▶ BUILD ──▶ VERIFY ──▶ RETRO
 (docs/research/)  (docs/loops/NN-*.md)  (branch+PR)  (lint/build/evals/preview)  (append to loop doc)
```

## Stages

1. **Research** — read the relevant `node_modules/next/dist/docs/` guides (Next 16 differs from
   training data), read the prior loop's retro, study competitors/references for this slice, and
   write findings to `docs/research/<slug>.md`. Cite sources. No code yet.
2. **Plan** — write `docs/loops/NN-<slug>.md` with: goal, out of scope, user stories, data model,
   API/route list, UI screens, risks, acceptance checks, and a task list. If a decision genuinely
   needs James/Tesleem (pricing, brand, legal), list it under **Decisions needed** and pick a
   stated default so work continues.
3. **Build** — branch `feat/<slug>` from `main`, small commits, `npm run lint && npm run build`
   before every push. Secrets in `.env.local`; add every new var to `.env.example`.
4. **Verify** — acceptance checks from the plan, run on the Vercel preview. Content loops also run
   the eval harness (`npm run eval` once Loop 2 lands). Record results in the loop doc.
5. **Retro** — 5 lines at the bottom of the loop doc: what shipped, what slipped, what the next loop
   must know. Update `docs/MASTER_PLAN.md` status table. Open the PR for squash-merge.

## Running a loop with Claude Code

Use the self-paced `/loop` with the prompt below (swap the loop number). Claude will pace itself,
re-reading the plan each wake-up and stopping when the loop's acceptance checks all pass.

```
/loop Work on A* Apply loop NN as described in docs/loops/README.md and docs/MASTER_PLAN.md.
If docs/loops/NN-*.md does not exist, do RESEARCH then PLAN and stop for review.
If it exists, do the next unchecked task in its task list, verify, commit on the feat branch,
tick the task, and continue. When all acceptance checks pass, write the RETRO, open the PR,
update MASTER_PLAN.md status, and stop the loop.
```

## Rules that apply to every loop
- **Original content only.** The 400Q guide and financefluency.co.uk are *structural references*.
  Never copy their text. The repo is public.
- **Mentor voice wins.** When the mentor corpus (Tesleem's notes) and Claude's prior disagree,
  the corpus wins and the answer cites it.
- **Second-year reader.** All content is written for a UK second-year undergrad with one finance
  module behind them. No unexplained jargon; every formula has a worked number.
- **Everything discoverable.** New collaborators must be able to read `MASTER_PLAN.md` → the loop
  doc → the code and understand it. Keep docs in sync with what shipped.

## Status vocabulary (MASTER_PLAN status table)
`planned` · `in-progress` · `merged` · `merged (partial)` (shipped, some tasks blocked) · `open-pr`
(done, awaiting James) · `blocked`.

## Overnight run

The run is one self-paced `/loop`. Every loop it executes already has a full plan in this folder
and follows `CONTRACTS.md`. Live state lives in `CURRENT.md` (rewritten after every task); each
finished loop appends a line to `RUNLOG.md`. Merge policy (James, 2026-08-25): loops 00–09
squash-merge on green acceptance checks; loop 10 stays an open PR labelled `needs-james`.

### Overnight prompt (paste after `/loop`)
```
Run the A* Apply overnight run per docs/loops/README.md § Overnight run. Each wake-up: read
docs/loops/CURRENT.md first; `git checkout main && git pull`; take the loop CURRENT.md names (or the
first `planned` loop in docs/MASTER_PLAN.md). Read its plan in docs/loops/ and CONTRACTS.md; do its
"Research at start" items; branch `feat/<slug>`; execute the task list in order, ticking each task
in the loop doc and rewriting CURRENT.md after every task; run `npm run lint && npm run typecheck &&
npm run build` (+ test:unit, test:e2e, and eval where the plan requires) before each push; run every
acceptance check and tick it only when it actually passed; write the Retro incl. "Decisions taken by
default"; set the status in MASTER_PLAN.md; open the PR from the template. Loops 00–09:
`gh pr merge --squash --delete-branch --admin`. Loop 10: leave open, label `needs-james`, status
`open-pr`. Blocked-on-human items: take the plan's default, record it, never wait. If `npm run build`
fails three times on one task, mark the task blocked with the error and move on. Append a RUNLOG.md
line after every loop. Rails: never read or copy anything from ~/Desktop except the 400Q PDF via
scripts/eval/extract-400q.ts writing only to $EVAL_HIDDEN_DIR/.eval/; never commit .env*, .eval/,
supabase/.temp, PDFs, or images outside fixtures/; never force-push, `supabase db reset`, drop
tables, or `vercel env rm`; stay inside the loop's task list; before Loops 04 and 09 run --dry-run
and abort the batch if the estimate exceeds CONTENT_MAX_BATCH_USD. Stop when Loop 10 is open-pr,
when every remaining loop is blocked, or 14 h after the run start recorded in CURRENT.md; then
publish a private artifact status page built from RUNLOG.md and the loop retros, and print the
recap.
```

### Runner notes
1. Order 00 → 10; 09 branches from `main` regardless of 08's approval state; 10 last, left open.
2. Before 04 and 09: `--dry-run`; abort the batch if the estimate exceeds `CONTENT_MAX_BATCH_USD`;
   record the estimate in the retro.
3. If `EVAL_HIDDEN_DIR` or the 400Q PDF is missing: evals print `HIDDEN SET MISSING`, overlap
   checks skip with a warning, note it in the retro.
4. `scripts/dev/precommit-check.sh` runs before every commit/push (Claude Code hook); it blocks
   `.env*`, PDFs, stray images, `.eval/`, secret-shaped strings, and 400Q text.
5. RUNLOG line format: `2026-08-26 02:14 | 03 technicals-model | merged | #12 | checks 7/7 | notes`.
6. Budget reality: the full set is ~24–30 h of agent time and ~$130–160 API spend. Night one
   should reach roughly Loop 05; restart the same prompt the next evening — it resumes from
   `CURRENT.md`.
