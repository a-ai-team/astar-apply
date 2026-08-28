# Loop 12 — Technicals: Finance foundations

_Status: planned. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md` § Technicals v2. Spec: `docs/research/technicals-v2/12-foundations.md`._

## Goal
Ship the Finance foundations chapter on the Loop 11 platform: three hand-authored lessons
(`time-value-of-money`, `pv-npv`, `wacc-intro`) built around Ashdown Bakeries, the `discount_dial`
widget (PV / NPV modes, mid-year toggle, WACC preset, rule-of-72 mini), 12 original questions
(8 `sa-core`, 2 `sa-stretch`, 2 lens), TMT + Healthcare lens blocks in every lesson, and the chapter
cheat sheet. Everything loads `generated`, validates, and passes the evals.

## Out of scope
The full `wacc_builder` and CAPM (Loop 16); APV / real-vs-nominal (cheat-sheet "you may hear" only);
any change to the platform beyond bug fixes discovered while using it; migrations.

## Research at start
`docs/research/technicals-v2/12-foundations.md` (the spec — read fully); `00-syllabus.md` § 2 and § 7;
`01-interactive-teaching.md` § 3 (`discount_dial` row) and § 5; Loop 11 retro ("Loop 12 must know");
`content/lessons/three-statement-links.json` as the retrofitted v2 reference; `src/lib/finance/discount.ts`
(exists from Loop 11 — extend, don't duplicate).

## User stories
- A student who has never discounted anything answers the predict gate, drags the rate on the dial
  and sees year-8 cash collapse; then writes the canonical answer from memory in Your turn.
- They choose the TMT lens and read why growth stocks are rate-sensitive, then answer the lens question.
- They print the foundations cheat sheet before an AC.
- A mentor opens each lesson in `/admin/review` and approves it.

## Data model
No migration. `taxonomy.ts`: `discount-rates-and-risk` and `irr-and-payback` gain `deferred: true`;
`target_questions` → time-value-of-money 4, pv-npv 4, wacc-intro 4, deferred 0. Questions carry
`depth:`, `format:` and (two of them) `lens:` tags.

## Routes / screens
- Widget: `src/components/widgets/discount-dial.tsx` (kit `Slider`, `StackedBar`/bars, `AnimatedNumber`,
  reduced-motion step-through) + `src/lib/finance/discount.ts` additions (`annuityFactor`, `irr` by
  bisection, `midYearExponent`) + `discount.test.ts` pins (spec § Widget); registered in `blocks/widget.tsx`.
- Content: `content/lessons/{time-value-of-money,pv-npv,wacc-intro}.json` (each: why_here → concept →
  mechanics → predict → widget → worked_calc → fill_numbers → lens → trap → canonical_answer → lens →
  your_turn → quick_fire → one_liner → now_you_can); `content/questions/<slug>.json` × 12 (slugs in
  spec table); `content/cheatsheets/finance-foundations.json`.
- Pages: no new routes; `/home/technicals/finance-foundations` lists 3 lessons (deferred subtopics hidden);
  cheat-sheet link appears once the file exists.

## Scripts
`npm run content:validate` after every file; `npm run seed -- 03` (lessons, questions, path items resolve);
`npm run seed -- 05` (10 cards — lens questions skipped); `npm run content:index`;
`npm run eval -- --suite lessons,questions`.

## Risks
- Foundations can drift into a textbook — every lesson ≤ 9 minutes, one company, one number set.
- `irr` bisection edge cases (all-positive flows) — return `null`, widget hides the marker.
- Difficulty mix has no diff-4 — acceptable, recorded in the retro.

## Acceptance checks
- [ ] lint / typecheck / build
- [ ] vitest `src/lib/finance/discount.test.ts` ≥ 8 cases (PV, annuity, NPV, IRR bracket, mid-year, WACC preset)
- [ ] `npm run content:validate` 0 errors; lens rule satisfied in all 3 lessons; `predict` present
- [ ] counts: 3 lessons, 12 questions (8 core / 2 stretch / 2 lens), 1 cheat sheet; `seed -- 03` and `-- 05` idempotent (run twice)
- [ ] `npm run eval -- --suite lessons,questions`: schema 100 %, overlap 0 (hidden set present), readability ≥ 4 when credit
- [ ] Playwright `e2e/12-foundations.spec.ts`: approve `pv-npv` in `beforeAll` → predict gate → move dial rate → NPV readout changes and IRR marker appears/moves → `?lens=tmt` shows TMT heading → cheat sheet renders formulas → restore status in `afterAll`
- [ ] Lighthouse a11y ≥ 95 on `/home/technicals/finance-foundations/pv-npv`

## Tasks
- [ ] `discount_dial` widget + `discount.ts` additions + tests + registry
- [ ] lesson `time-value-of-money` (validate)
- [ ] lesson `pv-npv` (validate)
- [ ] lesson `wacc-intro` (validate)
- [ ] 10 generalist questions (8 core + 2 stretch) with tags, follow-ups, `numbers` on fill questions
- [ ] lens blocks in all three lessons + 2 lens questions
- [ ] `content/cheatsheets/finance-foundations.json`
- [ ] taxonomy: deferred flags + `target_questions`; `seed -- 03`, `seed -- 05`, `content:index`
- [ ] `e2e/12-foundations.spec.ts` + Lighthouse
- [ ] `eval --suite lessons,questions`; retro; RUNLOG line; `docs/TECHNICALS.md` chapter row

## Blocked-on-human (defaults)
All content stays `generated` (foundations is a paid topic, so no auto-approval); James/Tesleem approve
in `/admin/review`. Company name "Ashdown Bakeries Ltd" kept unless a mentor objects.

## Blocked
_(record blockers here during the run)_

## Retro
_(written at the end of the loop)_
