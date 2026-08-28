# Loop 18 — Technicals: LBO

_Status: planned. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md` § Technicals v2. Spec: `docs/research/technicals-v2/18-lbo.md`._

## Goal
The LBO chapter at summer-internship depth on the Loop 11 platform: 4 hand-authored lessons
(`lbo-overview`, `sources-and-uses`, `returns-irr-mom`, new `paper-lbo-walkthrough`), the
`lbo_returns` (real) and `paper_lbo` widgets, the `paper_lbo` printable template, 24 questions
(12 core · 8 stretch · 4 lens), TMT + Healthcare lens sections, the LBO cheat sheet — all on the
Pennard Logistics deal. As the last chapter loop it also closes the programme: the 10-week learning
path is re-sequenced onto the v2 lessons and cheat sheets, drills / mocks gain a "with lens" option,
and the docs are refreshed.

## Out of scope
Full debt schedules, cash sweeps, PIK, covenants, dividend recaps (cheat-sheet "you may hear" only);
`debt-tranches` and `lbo-mental-maths` lessons (folded into lessons 2 and 3; subtopics marked
`deferred`); FIG lens; any migration.

## Research at start
`18-lbo.md` (the spec — every number is there), `00-syllabus.md` § 2 LBO row and § 7, `01-interactive-
teaching.md` § 3 (`lbo_returns`, `paper_lbo`), Loop 11 retro (kit exports, `lib/finance/lbo.ts`
signatures, `template` block API), `src/lib/interviews/select.ts` and `src/app/home/interviews/actions.ts`
(`startInterview`) for the lens option, `DEFAULT_PATH` in `taxonomy.ts`.

## User stories
- A student answers "will MoM be nearer 1.5× / 2.5× / 3.5×?", then drags leverage and exit multiple on
  the returns widget and sees which bar moves.
- They narrate the paper LBO into the stepper; each step unlocks when it balances (±£2m tolerance).
- With the TMT lens on, they redo the paper LBO at 6.5× leverage; with Healthcare, with bolt-ons.
- They start a "Technicals drill · LBO · with TMT lens" and get the two TMT-tagged questions mixed in.
- Week 9 of the learning path is the four LBO lessons; day 5 is the cheat sheet + faded review.

## Data model
No migration. `taxonomy.ts`: add subtopic `paper-lbo-walkthrough` (kind `calculation`, source
"LBO models – calculations", `target_questions` 6), mark `debt-tranches` and `lbo-mental-maths`
`deferred: true`, set `target_questions` to 5 / 4 / 9 / 6 across the four lessons (Σ 24 incl. lens);
rewrite `DEFAULT_PATH` weeks 1–10 to the v2 lesson slugs (Loops 12–18) with day 5 = `cheatsheet:<topic>`
+ faded review (a `label`-only item — `learning_path_items.lesson_id` stays null and the week page
links the cheat-sheet route). `interviews.report` / `params` gain `lens` inside the existing jsonb —
no column.

## Routes / screens
- `src/lib/finance/lbo.ts` additions: `sourcesAndUses()`, `projectFcf()` (year grid), `debtRoll()`,
  `exitReturns()`, `decomposeReturns()` (growth / deleveraging / multiple / fees), `irrFromMom()`,
  `irrAnchor()` (nearest 2× / 2.5× / 3× anchor), tests pinned to the Pennard table (exit equity 394.7,
  MoM 2.47, IRR 19.8 %, decomposition sums to 234.7).
- `src/components/widgets/lbo-returns.tsx` (real, replaces placeholder; tabs S&U / Returns; sliders
  entry multiple, exit multiple, leverage, growth, hold; stacked sources bar + IRR / MoM dial; Pennard
  preset + TMT / Healthcare presets), `paper-lbo.tsx` (7-step stepper with numeric inputs, tolerance,
  reveal per step, keyboard-only path), `templates/paper-lbo.tsx` (print grid from the spec's row list).
- Content: `content/lessons/{lbo-overview,sources-and-uses,returns-irr-mom,paper-lbo-walkthrough}.json`
  (each: `why_here` → `concept` → `mechanics` → `predict` → `widget` → `worked_calc` → `fill_numbers`
  → `lens` × 2 → `trap` → `canonical_answer` → `your_turn` → `quick_fire` → `one_liner` → `now_you_can`;
  lesson 4 adds `order_steps` + `template`), `content/questions/lbo-*.json` × 24 with `depth:` /
  `lens:` / `format:` tags, `content/cheatsheets/lbo.json`.
- Learning path: `DEFAULT_PATH` re-sequenced (W1 Foundations · W2–3 Accounting · W4 EqV/EV · W5
  Valuation · W6–7 DCF · W8 M&A · W9 LBO · W10 fit + full mock with lens); `/home/path/[week]` renders
  cheat-sheet items as links.
- Interviews: `/home/interviews` drill picker and full-mock form gain a "with lens" select (Generalist /
  TMT / Healthcare); `select.ts` `drillQuestions` / `mockQuestions` accept `lens` and include
  `lens:<slug>` questions of the chosen topics (generalist runs still exclude them); `startInterview`
  stores `lens` in `interviews.report.params`; history shows "· TMT lens".
- Docs: `docs/TECHNICALS.md` rewritten "Technicals v2" section (block types, widgets, lens, cheat
  sheets, path); `docs/MASTER_PLAN.md` programme summary row; `.claude/rules/content.md` unchanged.

## Scripts
`npm run content:validate` → `npm run seed -- 03` (subtopic + lessons + questions + path) → `npm run
seed -- 05` (cards, lens questions skipped) → `npm run content:index` → `npm run eval -- --suite
lessons,questions`. No new scripts.

## Risks
- Paper-LBO tolerance: rounding rules in the spec (±£2m per year) must match the stepper — pin in tests.
- `DEFAULT_PATH` rewrite touches every chapter's slugs — resolve all 35 at seed time and print unresolved.
- Lens option in `select.ts` must not change the seeded RNG behaviour for existing e2e (`07`, `09`).
- Overlap: LBO prose is formulaic — run the 8-gram check after every lesson, not at the end.

## Acceptance checks
- [ ] lint / typecheck / build / test:unit / test:e2e green
- [ ] `content/lessons/` gains 4 LBO lessons, `content/questions/` 24 LBO questions, `content/cheatsheets/lbo.json` — `content:validate` 0 errors; every lesson has `predict`, its widget, both lens variants; lesson 4 has `order_steps` + `template`
- [ ] vitest `src/lib/finance/lbo.test.ts` pins the Pennard table; widget maths never re-implemented
- [ ] `eval --suite lessons,questions`: schema 100 %, overlap 0, mix within ±15 % (readability ≥ 4 when credit)
- [ ] `seed -- 03` idempotent; path resolves **35 / 35** v2 lessons + 7 cheat-sheet items; `seed -- 05` derives 20 cards (lens questions excluded); `content:index` adds the LBO chunks with lens prefixes
- [ ] Playwright `e2e/18-lbo.spec.ts`: `returns-irr-mom` renders → predict → `lbo_returns` slider changes MoM readout → lens picker TMT shows the TMT heading; `paper-lbo-walkthrough` stepper step 1 unlocks on a balancing S&U; cheat sheet renders; `/home/path/9` lists the four lessons + cheat sheet; drill "LBO · TMT lens" starts and includes a `lens:tmt` question (approve in `beforeAll`, restore after)
- [ ] All new rows load `generated` (LBO is not a free topic; nothing auto-approves) — recorded in the retro
- [ ] `docs/TECHNICALS.md` v2 section and MASTER_PLAN summary updated

## Tasks
- [ ] `lib/finance/lbo.ts` additions + tests (Pennard table)
- [ ] `lbo_returns` widget (real) + `paper_lbo` stepper + `templates/paper-lbo.tsx`
- [ ] taxonomy: `paper-lbo-walkthrough`, deferred flags, `target_questions`
- [ ] lessons 1–2 JSON (validate + overlap after each)
- [ ] lessons 3–4 JSON (validate + overlap after each)
- [ ] 24 questions JSON (+ tags) and `cheatsheets/lbo.json`
- [ ] lens blocks reviewed against `02-lens-design.md` § 3; lens questions tagged
- [ ] `DEFAULT_PATH` re-sequence + week page cheat-sheet items + seed resolution report
- [ ] drills / mocks "with lens" (`select.ts`, `startInterview`, forms, history label) + unit tests
- [ ] seeds (`03`, `05`), `content:index`, evals
- [ ] `e2e/18-lbo.spec.ts`, docs (`TECHNICALS.md`, `MASTER_PLAN.md`), retro, RUNLOG

## Blocked-on-human (defaults)
Approval → all LBO rows stay `generated` for James / Tesleem; lens presets on `lbo_returns` → TMT
6.5× / 90 % conversion, Healthcare 4.5× with £30m bolt-ons; Week 10 mock → full mock with lens
optional; `paper_lbo` tolerance → ±£2m per year, ±0.1× MoM, ±2 pp IRR.

## Blocked
_(record blockers here during the run)_

## Retro
_(written at the end of the loop)_
