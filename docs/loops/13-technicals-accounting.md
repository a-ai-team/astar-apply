# Loop 13 — Technicals: Accounting

_Status: planned. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md` § Technicals v2. Spec: `docs/research/technicals-v2/13-accounting.md`._

## Goal
The full Accounting chapter for the summer-internship bar, hand-authored from the spec: 8 lessons
(4 statement lessons, the retrofitted links lesson, working capital, single-step and multi-step
walkthroughs), 40 questions (30 `sa-core`, 6 `sa-stretch`, 4 lens), three new widgets
(`faded_walk`, `cash_cycle`, `filings_toggle`) on the Loop 11 kit, TMT + Healthcare lens sections,
and the Accounting cheat sheet with the `three_statement_grid` template. Accounting is a free topic
and auto-approves when the evals pass.

## Out of scope
Deferred subtopics (`deferred-taxes-and-other-items`, `depreciation-and-capex` — marked `deferred`,
content folded into the cheat sheet and single-step lesson); IFRS 16 mechanics (EqV/EV chapter);
`deferred_tax` widget (built only if a later chapter needs it); batch generation.

## Research at start
`13-accounting.md` (the spec — read it in full before writing any JSON); `00-syllabus.md` § 2, § 7;
`02-lens-design.md` § 3 (Accounting row); Loop 11 retro (kit exports, block components, `lensProblems`
signature); `content/lessons/three-statement-links.json` as the shape reference; `.claude/rules/content.md`.

## User stories
- A student works through Kestrel Foods plc from the income statement to the cash crunch, with the
  same numbers carried across eight lessons.
- They predict before every widget, run the five single-step walks and the four harder ones in the
  ripple widget, then fill the faded walk from memory.
- With the TMT lens on, they see deferred revenue and SBC handled in place; Healthcare shows R&D
  and milestones.
- They print the Accounting cheat sheet and the blank three-statement grid before an AC.
- A mentor reviews `/admin/review` and finds every lesson already approved (free topic, evals green).

## Data model
No migration. `taxonomy.ts`: `deferred: true` on the two deferred subtopics; `target_questions`
rewritten to the spec (3/4/4/4/6/5/8/6 across the eight kept subtopics = 40 incl. lens).

## Routes / screens
- Widgets: `src/components/widgets/faded-walk.tsx` (fade level 0–4 over a `three_statement` preset;
  per-cell grading via `src/lib/finance/statements.ts`), `cash-cycle.tsx` (DSO/DIO/DPO sliders →
  timeline ribbon, cash tied up, ΔNWC; maths in `src/lib/finance/working-capital.ts`, new),
  `filings-toggle.tsx` (simplified ⇄ as-filed line items for Kestrel from `props.company`); registered
  in `blocks/widget.tsx`. `statements.ts` gains presets `inventory-credit`, `debt-raise`, `ppe-debt`,
  `dividend`, `pik`, `asset-sale`, `deferred-rev`, `cash-crunch`, `write-off`, `sbc`, `rd-spend`.
- Content: `content/lessons/{three-statements-overview,income-statement,balance-sheet,cash-flow-statement,working-capital,single-step-walkthroughs,multi-step-walkthroughs}.json`
  (new) + `three-statement-links.json` (v2 edits from Loop 11 kept; add the spec's lens questions);
  `content/questions/*.json` ×40 per the spec table (slugs as given; lens questions tagged
  `lens:tmt` / `lens:healthcare`, every question tagged `depth:` and `format:`).
- Cheat sheet: `content/cheatsheets/accounting.json` (replaces the Loop 11 sample) incl.
  `template: three_statement_grid` props; route already exists.
- Learning path: `DEFAULT_PATH` weeks 2–3 point at the eight lessons (day 5 = cheat sheet + faded walk).
- Docs: `docs/TECHNICALS.md` § Loop 13 (widgets, presets, counts).

## Scripts
`npm run content:validate` after every file; `npm run seed -- 03` (lessons/questions load as
`generated`), `npm run eval -- --suite lessons,questions`, `npm run content:approve -- --topic accounting`
(only after evals pass), `npm run seed -- 05`, `npm run content:index`.

## Risks
- Numbers drift between lessons — every worked number derives from the Kestrel base year in the spec;
  `evalExpr` re-checks `worked_calc` and `fill_numbers` at validate time.
- Difficulty mix: the spec is 2/3-heavy; promote two calculation questions to difficulty 4 with
  `numbers` if the `questions` eval flags the ±15 % band (n ≥ 40 gates it).
- Overlap: the 8-gram check runs against the hidden set; rewrite any flagged sentence rather than
  paraphrase it.
- Reading time: walkthrough lessons carry many scenarios — keep each ≤ 12 min (widgets don't count).

## Acceptance checks
- [ ] lint / typecheck / build
- [ ] vitest: `working-capital.test.ts` (CCC 48.7 d on the Kestrel numbers; negative CCC case), new `statements` presets pinned (PIK: cash +2.5 / debt +10; asset sale: CFO −2.5 / CFI +50); unit suite green
- [ ] `npm run content:validate` 0 errors; 8 lessons + 40 questions + cheat sheet present
- [ ] `npm run eval -- --suite lessons,questions`: schema 100 %, overlap 0, lens rule + `predict` present on all 8, mix within ±15 % (readability ≥ 4 when credit)
- [ ] `seed -- 03` / `05` idempotent; flashcards = 36 (lens questions excluded); `content:index` includes `[TMT lens]` chunks
- [ ] Playwright `e2e/13-accounting.spec.ts`: topic page lists 8 lessons and hides the 2 deferred; `single-step-walkthroughs` predict → ripple preset switch changes the cash cell → `faded_walk` level 3 grades a correct entry; `cash_cycle` DPO slider flips CCC sign; `?lens=healthcare` shows the R&D block; cheat sheet prints the grid
- [ ] **Auto-approved Accounting** (free topic, evals green) — every approved slug listed in the retro; `/home/technicals/accounting` shows 8 / 8 to a student

## Tasks
- [ ] `working-capital.ts` + `statements.ts` presets + tests
- [ ] widgets `faded_walk`, `cash_cycle`, `filings_toggle` + registry
- [ ] lessons 1–4 (overview, IS, BS, CFS) — validate after each
- [ ] lessons 6–8 (working capital, single-step, multi-step) + links lesson lens questions
- [ ] 36 core/stretch questions
- [ ] lens blocks (both variants on lessons 2–4, 6–8) + 4 lens questions
- [ ] cheat sheet + `three_statement_grid` props; `DEFAULT_PATH` weeks 2–3; taxonomy `deferred` + targets
- [ ] `seed -- 03`, `05`, `content:index`
- [ ] `e2e/13-accounting.spec.ts`
- [ ] eval suites → `content:approve --topic accounting`
- [ ] docs (`TECHNICALS.md`), retro, RUNLOG

## Blocked-on-human (defaults)
Auto-approve Accounting → yes (existing rule, free topic); Kestrel Foods plc as the chapter company →
yes; 25 % tax rate everywhere → yes (UK main rate).

## Blocked
_(record blockers here during the run)_

## Retro
_(written at the end of the loop)_
