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
