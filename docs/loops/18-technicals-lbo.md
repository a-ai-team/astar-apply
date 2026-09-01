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
- [x] lint / typecheck / build / test:unit (403/403) / test:e2e (**79/79**) green
- [x] `content/lessons/` gains 4 LBO lessons, `content/questions/` 24 LBO questions, `content/cheatsheets/lbo.json` — `content:validate` 0 errors (36 lessons / 210 questions / 7 sheets); every lesson has `predict`, its widget, both lens variants; lesson 4 has `order_steps` + `template`
- [x] vitest `lbo.test.ts` pins the whole Pennard table (S&U 410/250/160, year 1 £15m interest / £20.6m FCF, exit ≈ £395m / 2.47× / 19.8 %, decomposition 110.5 + 134.5 + 0 − 10, the 7× case, the TMT redo, both your-turns, the anchors); widget maths never re-implemented
- [x] `eval --suite lessons,questions`: lessons schema 1.00, overlap 0, readability **4.50**; questions schema 1.00, overlap 0, mix **0.126** at n = 202 (improved from 0.132 — two honest d1 promotions)
- [x] `seed -- 03` idempotent; path resolves **35/35** v2 lessons + **7** cheat-sheet items (3 unresolved are week 10's fit lessons, which have never had lessons — printed by the new warning); `seed -- 05` unchanged for now — flashcards derive at approval (20 eligible; 4 lens excluded); `content:index` run
- [x] Playwright `e2e/18-lbo.spec.ts` 6/6: topic page + cheat sheet + print-surviving `paper_lbo` template; `lbo_returns` defaults 2.47×/19.8 %, 7× exit → 2.07×, 0× leverage → 1.25×; stepper stays locked on an unbalanced S&U and unlocks on 160; `?lens=tmt` heading; `/home/path/9` lists 4 lessons + the cheat-sheet link; TMT-lens LBO drill draws a `lens:tmt` question, stores `params.lens`, labels history (statuses restored after)
- [x] All new rows load `generated` (paid topic; the e2e restores what it approves)
- [x] `docs/TECHNICALS.md` v2 section rewritten and MASTER_PLAN summary updated (including fixing an unresolved merge-conflict marker found live in MASTER_PLAN's loop table)

## Tasks
- [x] `lib/finance/lbo.ts` additions + tests (flat `daAmount`/`capexAmount`/`nwcAmount` on `paperLbo`; `irrAnchor`/`IRR_ANCHORS`; 12 Pennard-pinned cases)
- [x] `lbo_returns` widget (real) + `paper_lbo` 7-step stepper (the printable template rows shipped in Loop 11; lesson 4 authors the block)
- [x] taxonomy: `paper-lbo-walkthrough` added, `debt-tranches` + `lbo-mental-maths` deferred, targets 5/4/6/5
- [x] lessons 1–2 JSON (validated)
- [x] lessons 3–4 JSON (validated)
- [x] 24 questions JSON (+ tags) and `cheatsheets/lbo.json`
- [x] lens blocks in every lesson with both variants; 4 lens questions tagged
- [x] `DEFAULT_PATH` re-sequence + week-page cheat-sheet items + seed resolution report
- [x] drills / mocks "with lens" (`select.ts`, `startInterview`, forms, history label) + unit tests (27/27)
- [x] seeds (`03`, `05`), `content:index`, evals
- [x] `e2e/18-lbo.spec.ts`, docs (`TECHNICALS.md`, `MASTER_PLAN.md`), retro, RUNLOG

## Blocked-on-human (defaults)
Approval → all LBO rows stay `generated` for James / Tesleem; lens presets on `lbo_returns` → TMT
6.5× / 90 % conversion, Healthcare 4.5× with £30m bolt-ons; Week 10 mock → full mock with lens
optional; `paper_lbo` tolerance → ±£2m per year, ±0.1× MoM, ±2 pp IRR.

## Blocked
1. **Lighthouse a11y not run** — no headless Chrome in this sandbox (standing gap since Loop 11).
2. **Nothing approved for students.** LBO is a **paid** topic: 4 lessons, 24 questions and the cheat
   sheet load as `generated`. **James/Tesleem:** approve in `/admin/review`, then
   `npm run seed -- 05 && npm run content:index`. Valuation, DCF and M&A are queued there too.

## Retro
- **Shipped (chapter):** four lessons on the Pennard Logistics deal — what an LBO is, sources & uses,
  returns and the three levers (with the IRR anchors and rule of 72), and the paper-LBO capstone with
  its 7-step graded stepper — plus **24 questions** (12 core / 8 stretch / 4 lens; 6 fill with
  `numbers`, 2 order, 1 spot), the `lbo` cheat sheet, widgets `lbo_returns` (3 presets, three-lever
  decomposition bars) and `paper_lbo`, and `paperLbo` flat-amount overrides + `irrAnchor` in
  `lbo.ts` (12 new pinned tests).
- **Shipped (programme close):** `DEFAULT_PATH` re-sequenced onto all 35 v2 lessons with a
  cheat-sheet day ending each chapter (35/35 + 7 resolve at seed); a Generalist / TMT / Healthcare
  lens option on drills and full mocks (`params.lens` in the existing jsonb, no migration; 27/27
  unit tests incl. a seeded-order regression guard); `docs/TECHNICALS.md` v2 section and
  `docs/MASTER_PLAN.md` rewritten to the shipped state.
- **Verification:** eval lessons PASS (schema 1.00, overlap 0, readability **4.50** — the
  programme's best) and questions PASS (schema 1.00, overlap 0, mix **0.126** at n = 202); unit
  403/403; e2e **79/79** (18-lbo 6/6); build ✓.
- **Four more spec errors (18–21), all caught before authoring:** (18) the loop plan's
  `target_questions` 5/4/9/6 contradicts the spec table's own lesson assignment — 5/4/6/5 non-lens
  implemented; (19) the paper-LBO TMT redo's "~£200m of paydown → 4.5×" — the library gives £149m
  of paydown, **≈ 3.9× / ≈ 31 % IRR** on the £85m cheque; (20) lesson 2's TMT lens "35 % equity" —
  its own numbers give **≈ 21 %** (85/410); (21) the claimed difficulty mix "6/7/6/5" does not sum
  from the spec's own table (2/8/8/6 incl. lens). Programme total: **21 spec errors** caught by
  verifying against `src/lib/finance/*` before writing prose.
- **The mix gate went the right way for once.** Two genuinely definitional questions (`irr-vs-mom`,
  `debt-tranches-order`) were promoted to d1 — the band the bank was short of — taking the gate from
  0.132 to **0.126** while absorbing an otherwise d3-heavy chapter.
- **A latent contract violation fixed in passing:** the interviews pool had no tag awareness, so the
  8 approved lens-tagged questions could surface in *generalist* drills, against the CONTRACTS rule.
  The lens gate now filters them; a seeded-order regression test proves generalist runs are
  otherwise byte-identical, and e2e 07/09 passed unchanged.
- **A stalled agent, recovered cleanly:** the first questions agent wrote 10 of 24 files and stalled
  (no progress for 600 s). The 10 on disk validated and matched house style, so a second agent was
  briefed with the exact remaining 14 — no rewrites, no divergence.
- **Found live on `main`:** an unresolved merge-conflict marker (`<<<<<<< HEAD`) in
  `docs/MASTER_PLAN.md`'s loop table, left by the Loop 13-era conflict repair. Fixed here as part of
  the docs refresh this loop owns.
- **Decisions taken by default:** (1) everything `generated` (paid topic). (2) `lbo_returns`
  Healthcare preset is 4.5× leverage at 7 % growth — bolt-on *modelling* was left out of the widget
  (the healthcare lens prose carries the arbitrage arithmetic); the plan's "£30m bolt-ons" preset
  would have required new library maths for a stretch flourish. (3) Week 5's day 5 carries both the
  `choosing-and-presenting` lesson and the valuation cheat sheet — 5 lessons don't fit 4 lesson
  days, and that lesson *is* review-shaped. (4) W10's three fit-lesson days stay unresolved at seed
  (no fit lessons exist — same as before the re-sequence; the warning now prints them).
- **For James:** the DCF cheat sheet still claims mid-year lifts EV "3–4 %" (library: +0.9 %) and
  the judge again sampled Loop 15's `multiples-and-metrics` low (Rule-of-40 lens numbers) — both
  pre-existing, one-line fixes, noted in the Loop 17 retro too.
