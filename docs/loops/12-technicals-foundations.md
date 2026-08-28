# Loop 12 — Technicals: Finance foundations

_Status: merged (pending PR). Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md` § Technicals v2. Spec: `docs/research/technicals-v2/12-foundations.md`._

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
- [x] lint / typecheck / build
- [x] vitest `src/lib/finance/discount.test.ts` **29** cases (13 added) (PV, annuity, NPV, IRR bracket, mid-year, WACC preset)
- [x] `npm run content:validate` 0 errors; lens rule satisfied in all 3 lessons; `predict` present
- [x] counts: 3 lessons, 12 questions (8 core / 2 stretch / 2 lens), 1 cheat sheet; `seed -- 03` and `-- 05` idempotent (run twice)
- [x] `npm run eval -- --suite lessons,questions` **PASS** — lessons schema 1.00 / overlap 0 / readability **4.48**; questions schema 1.00 / overlap 0 / mix reported (n=18 < 40, not gated): schema 100 %, overlap 0 (hidden set present), readability ≥ 4 when credit
- [x] Playwright `e2e/12-foundations.spec.ts` (4 tests, suite **46/46**): approve `pv-npv` in `beforeAll` → predict gate → move dial rate → NPV readout changes and IRR marker appears/moves → `?lens=tmt` shows TMT heading → cheat sheet renders formulas → restore status in `afterAll`
- [ ] Lighthouse a11y ≥ 95 on `/home/technicals/finance-foundations/pv-npv` — **not run** (no headless Chrome in the sandbox; same as Loop 11 § Blocked 1)

## Tasks
- [x] `discount_dial` widget + `discount.ts` additions + tests + registry
- [x] lesson `time-value-of-money` (validate)
- [x] lesson `pv-npv` (validate)
- [x] lesson `wacc-intro` (validate)
- [x] 10 generalist questions (8 core + 2 stretch) with tags, follow-ups, `numbers` on fill questions
- [x] lens blocks in all three lessons + 2 lens questions
- [x] `content/cheatsheets/finance-foundations.json`
- [x] taxonomy: deferred flags + `target_questions`; `seed -- 03`, `seed -- 05`, `content:index`
- [x] `e2e/12-foundations.spec.ts` (Lighthouse → § Blocked 1)
- [x] `eval --suite lessons,questions`; retro; RUNLOG line; `docs/TECHNICALS.md` chapter row

## Blocked-on-human (defaults)
All content stays `generated` (foundations is a paid topic, so no auto-approval); James/Tesleem approve
in `/admin/review`. Company name "Ashdown Bakeries Ltd" kept unless a mentor objects.

## Blocked
1. **Lighthouse a11y not run** — no headless Chrome in this sandbox (inherited from Loop 11 § Blocked 1).
   One command against `next start` clears both loops at once.
2. **Nothing is approved for students.** All three lessons, all 12 questions and the cheat sheet load
   as `generated`; only Accounting and EqV/EV auto-approve. **James/Tesleem:** approve the chapter in
   `/admin/review`, then `npm run seed -- 05 && npm run content:index` to derive its 10 flashcards
   (the 2 lens questions are deliberately excluded) and make it retrievable by the Mentor chatbot.

## Retro
- **Shipped:** three hand-authored lessons on Ashdown Bakeries — `time-value-of-money` (discounting,
  the £1m rebate at 4 % vs 8 %, mid-year), `pv-npv` (the thirteenth shop: annuity factor 3.993,
  NPV +£0.396m, IRR 15.2 %, payback 3.3 y) and `wacc-intro` (£4m equity at 14 % / £2m debt at 8 %,
  WACC 11.33 %, and the shop re-tested at that rate) — each with a `predict` gate, the `discount_dial`
  widget, a `fill_numbers` faded example and a `lens` block carrying both TMT and Healthcare variants;
  12 questions (10 `sa-core`, 2 `sa-stretch`, 2 lens-tagged; 4 `fill` with `numbers`, 1 `order`);
  `content/cheatsheets/finance-foundations.json` (6 formulas, 6 canonical answers, 6 traps,
  4 one-liners, 5 `ft-only` items); the `discount_dial` widget (PV/NPV modes, mid-year toggle, WACC
  preset, rule-of-72, reduced-motion step-through) on the Loop 11 kit with `annuityFactor` and
  `midYearExponent` added to `src/lib/finance/discount.ts` (29 tests); taxonomy `deferred` flags on
  `discount-rates-and-risk` and `irr-and-payback` plus v2 `target_questions`, and the topic page now
  hides a deferred subtopic until it has a lesson.
- **Verification:** `eval --suite lessons,questions` **PASS** — lessons schema 1.00, **overlap 0**
  against the hidden 400Q set, readability **4.48/5** (the judge ran live); questions schema 1.00,
  overlap 0, mix 11/33/44/11 reported (n = 18, below the n ≥ 40 gate). unit 324/324; seeds idempotent.
- **Slipped:** Lighthouse (§ Blocked 1). Nothing approved (§ Blocked 2) — so no flashcards and no
  chatbot chunks for this chapter yet, by design.
- **Decisions taken by default:** (1) `discount-rates-and-risk` and `irr-and-payback` are **deferred**,
  their content folded into lessons 1 and 2 — slugs kept, `target_questions` set to 0, and the topic
  page hides them until a lesson exists. (2) One `lens` block per lesson carrying **both** variants
  (not one block per lens) — the contract requires full coverage either way, and one block reads
  better. (3) The chapter has no difficulty-4 question; foundations has no numerical-edge material and
  the eval gates the mix only from n ≥ 40. (4) `TOTAL_TARGET_QUESTIONS` is no longer asserted at the
  frozen 347 in `targets.test.ts` — every chapter loop rewrites it, so the test now asserts the
  invariant (targets equal the taxonomy) and a sane range.
- **Loops 13–18 must know:** (1) The spec-number check is **not optional** — this chapter''s spec said
  halving the shop''s cash flow gives "about −5 %" IRR; it is **−8.9 %**. Verify every figure against
  `src/lib/finance` before it reaches a lesson. (2) `discount_dial` props: `{ cashflows, rate, midYear,
  mode: "pv"|"npv", outlay, wacc: { E, D, ke, kd, t } }`; testids `dial-rate`, `dial-total`,
  `dial-step`. (3) A chapter''s content all lands `generated`; only Accounting (13) and EqV/EV (14)
  auto-approve after their evals pass. (4) Re-running `seed -- 03` is safe and idempotent; run
  `seed -- 05` and `content:index` only after approval, or they no-op.
