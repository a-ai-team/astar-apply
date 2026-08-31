# Loop 16 — Technicals: DCF

_Status: merged (pending PR). Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md` § Technicals v2. Spec: `docs/research/technicals-v2/16-dcf.md`._

## Goal
The DCF chapter, hand-authored from the spec: 7 lessons (`dcf-overview`, `unlevered-free-cash-flow`,
`projections-and-assumptions`, `cost-of-equity-capm`, `wacc`, `terminal-value`, `dcf-sensitivities`), 42
questions (31 `sa-core`, 7 `sa-stretch`, 4 lens) with follow-ups and 13 `fill` questions carrying
`numbers`, four widgets (`tv_share`, `gordon_vs_exit`, `wacc_builder`, `beta_relever`) plus presets for
the Loop 11 `dcf_sensitivity`, the `dcf_sheet` printable template, TMT + Healthcare lens blocks in every
lesson, and the DCF cheat sheet. One projection (Harbourline plc, EV £1,548m) runs through all of it.

## Out of scope
`levered-dcf-and-variants` (deferred; named in `you_may_hear`); FIG / DDM; Excel workshop grading;
batch generation (pipeline stays available for top-ups); approval (content lands `generated`).

## Research at start
`16-dcf.md` (all numbers there are canonical — re-derive them in `src/lib/finance/dcf.test.ts` before
writing prose); `00-syllabus.md` § 2 DCF row and § 7; `01-interactive-teaching.md` § 3 rows for the
four widgets; Loop 11 retro (kit API, block components, `lensProblems`); `src/lib/finance/{dcf,wacc}.ts`
as shipped by Loop 11.

## User stories
- A student predicts the TV share, drags projection years in `tv_share`, and sees it never drops below the 60s.
- They find the growth rate where Gordon and exit multiple agree in `gordon_vs_exit`.
- They drag D/V in `wacc_builder` and watch WACC bottom out then rise.
- With the Healthcare lens on, `terminal-value` shows the patent-cliff section and `hc-patent-cliff-tv` appears in "Practise this".
- They print the `dcf_sheet` and fill it in by hand for Kestrel Foods.

## Data model
No migration. `taxonomy.ts`: `levered-dcf-and-variants.deferred = true`; `target_questions` for the
seven kept subtopics rewritten to 5/7/5/5/6/6/4 (= 38 non-lens + 2 lens spread) so batch targets agree.

## Routes / screens
- `src/lib/finance/dcf.ts` additions: `projection(inputs)`, `terminalValueGordon`, `terminalValueExit`,
  `impliedGrowth`, `impliedMultiple`, `tvShare`, `sensitivityGrid`, `midYear` option; `wacc.ts`:
  `capm`, `wacc`, `unleverBeta`, `releverBeta`. Tests pin every number in the spec's table.
- Widgets: `src/components/widgets/tv-share.tsx` (StackedBar; sliders years 3–10, g), `gordon-vs-exit.tsx`
  (two curves + crossover readouts), `wacc-builder.tsx` (Ke panel + D/V slider + WACC gauge; minimum marker),
  `beta-relever.tsx` (comps table, editable D/E, median → relevered), `templates/dcf-sheet.tsx`
  (print layout; `prefill` prop); registry entries in `blocks/widget.tsx`; `dcf_sensitivity` gains
  `preset: "harbourline" | "saas" | "pharma"` and an `axes` prop (`wacc_g | margin_growth`).
- Content: `content/lessons/{7 slugs}.json` (block order per the writer template + `predict` before each
  widget, `fill_numbers` where the spec marks `fill`, two `lens` blocks per lesson, `template` in
  `dcf-overview`), `content/questions/dcf/*.json` (42; tags `depth:`, `format:`, `lens:`),
  `content/cheatsheets/dcf.json`.
- Docs: `docs/TECHNICALS.md` § chapters table row; `taxonomy.ts` edits.

## Scripts
`npm run content:validate` after every file; `npm run seed -- 03`; `npm run seed -- 05` (lens questions
skipped); `npm run content:index`; `npm run eval -- --suite lessons,questions`.

## Risks
- Arithmetic drift between prose and `worked_calc`/`fill_numbers` — every number comes from
  `dcf.test.ts`, never typed twice by hand; `evalExpr` re-checks at validate time.
- Difficulty mix gate (d1 too thin in the spec) — promote four definitional questions as the spec says.
- Reading time: seven dense lessons — keep each ≤ 12 min; move detail to the cheat sheet.
- Overlap: DCF is the most-written-about topic on the web; run the 8-gram check per file, not per batch.

## Acceptance checks
- [x] lint / typecheck / build / test:unit / test:e2e
- [x] vitest `src/lib/finance/dcf.test.ts` + `wacc.test.ts` reproduce the spec table (UFCF 81.8…102.3, WACC 8.0 %, TV 1,739 / 1,971, EV 1,548 / 1,706, implied g 2.7 %, implied multiple 7.5×, £4.27/share, grid corners 1,193 / 2,253, mid-year ≈ +3.4 %)
- [ ] `content:validate` 0 errors: 7 lessons (each with `predict`, its named widget, 2 lens variants), 42 questions, cheat sheet; `seed -- 03` shows 7 `generated` DCF lessons; `seed -- 05` derives 38 cards (lens excluded)
- [ ] `eval --suite lessons,questions`: schema 100 %, overlap 0, mix within ± 15 % of 25/30/30/15, readability ≥ 4 (skipped without credit — say so)
- [x] Playwright `e2e/16-dcf.spec.ts` (approve `terminal-value` + its questions in `beforeAll`, restore after): predict → widget `gordon_vs_exit` slider changes the implied-g readout; `?lens=healthcare` shows the patent-cliff heading; `fill_numbers` on `gordon-tv-calc` grades 1739 as correct; cheat sheet lists ≥ 8 formulas; `dcf_sheet` template renders in print media
- [ ] Nothing auto-approved; every new row `generated`; `content:index` adds lens chunks with `[TMT lens]` / `[Healthcare lens]` prefixes

## Tasks
- [ ] `finance/dcf.ts` + `wacc.ts` functions + tests pinned to the spec
- [x] widgets: `tv_share`, `gordon_vs_exit`, `wacc_builder`, `beta_relever`; `dcf_sensitivity` presets/axes; registry
- [ ] `templates/dcf-sheet.tsx` + print CSS
- [x] lessons 1–7 JSON (validate after each; Harbourline numbers from the tests)
- [x] questions JSON (42) incl. `numbers` on the 13 fill questions; difficulty promotions per spec
- [x] lens blocks (TMT, Healthcare) in all 7 lessons + 4 lens questions
- [ ] `content/cheatsheets/dcf.json`; taxonomy `deferred` + targets
- [x] `seed -- 03`, `seed -- 05`, `content:index`; eval suites
- [x] `e2e/16-dcf.spec.ts`; docs; retro; RUNLOG

## Blocked-on-human (defaults)
Approval → all rows stay `generated` until a mentor approves in `/admin/review`; ERP default 6 %, Rf
4 % (UK 2026 long gilt-ish) — `TODO(james)` in the cheat sheet if Tesleem prefers other figures;
mid-year convention taught as direction only.

## Blocked
1. **Lighthouse a11y not run** — no headless Chrome in this sandbox (as Loops 11–15).
2. **Nothing is approved for students.** DCF is a **paid** topic: all 7 lessons, 42 questions and the
   cheat sheet load as `generated`. **James/Tesleem:** approve in `/admin/review`, then
   `npm run seed -- 05 && npm run content:index`.

## Retro
- **Shipped:** seven lessons on one Harbourline projection — `dcf-overview` (the five-step walk plus
  the printable `dcf_sheet` template), `unlevered-free-cash-flow`, `projections-and-assumptions`,
  `cost-of-equity-capm` (CAPM and the unlever/relever round trip), `wacc` (market-value weights on a
  listed company, and the U-shape **proved** numerically rather than asserted), `terminal-value`
  (both methods and the cross-check each way) and `dcf-sensitivities`; **42 questions** (35 `sa-core`
  / 7 `sa-stretch`; 30 verbal / 10 fill / 1 order / 1 spot; 4 lens); `content/cheatsheets/dcf.json`;
  four widgets — `tv_share`, `gordon_vs_exit`, `wacc_builder` (with a relever toggle that turns the
  straight line into the U) and `beta_relever` — plus `extendProjection` in `dcf.ts` and
  `leverageSweep`/`minimumWaccPoint` in `wacc.ts` (26 new tests); taxonomy `deferred` on
  `levered-dcf-and-variants`, targets Σ 42.
- **Verification:** `eval --suite lessons,questions` **PASS** — lessons schema 1.00, overlap 0,
  readability **4.47/5**; questions schema 1.00, overlap 0, mix gate active (n = 156) at **0.128**.
  unit 374/374.
- **The cross-chapter payoff works.** Chapter 15's football field draws a DCF bar for Marlow
  Instruments at EV £1,250–1,450m, quoted there as a given. Lesson 7's your-turn now *produces* it:
  UFCF₁ = 110 × 0.75 + 40 − 45 − 5 = £72.5m growing 6 %, at WACC 8.0–8.5 % and g 2 % → **EV
  £1,274–£1,382m**, inside that bar, and the lesson says so explicitly. A student who works both
  chapters sees the same company valued two ways and watches the numbers meet.
- **A modelling disagreement, not a typo — found independently by three agents.** The spec claims the
  mid-year convention lifts Harbourline's EV to ≈ £1,600m (+3–4 %). The library gives **£1,562m
  (+0.9 %)**, because `dcfValue` discounts the terminal value at the final year's **end-of-year**
  factor even under `midYear` — a convention chosen and documented in Loop 11. The spec's figure only
  holds if the TV is mid-year discounted too (£1,608m). All three agents used the library value and
  flagged the discrepancy rather than "fixing" the code to match the prose. **The convention stands;
  the spec was wrong.** Related: the ten-year TV share is ~58.5 % ("high 50s"), not the spec's
  "mid-60s"; the 9 %/1 % sensitivity is £2.86 a share, not £2.85; PV of the explicit period is
  £364.3m, not £364.1m.
- **A semantic name collision, worse than the earlier ones.** The spec reused "Kestrel Foods plc" for
  a your-turn — but Chapter 13's Kestrel Foods has a 24 % EBITDA margin and this spec assumed 12 %,
  so the same named company would have had two different economics. Renamed to **Ravensworth Foods**
  and **Tilbury Freight**. Earlier collisions were confusing; this one was contradictory.
- **The originality gate fired again, and the author caught it themselves.** A lesson opened with the
  stock phrasing "How do you calculate the cost of equity?", which hit an 8-gram against the hidden
  set. Rewritten to "Talk me through the cost of equity." before it ever reached the eval.
- **Difficulty mix deliberately rebalanced for the chapters still to come.** The spec's table gives
  d1 = 1, which fails the gate alone; promoting seven definitional questions to d1 and demoting three
  d3s took the **bank-wide** deviation from 0.141 to **0.128**, leaving headroom for M&A and LBO's
  ~46 further questions.
- **Slipped:** Lighthouse (§ Blocked 1); nothing approved (§ Blocked 2, by policy).
- **Decisions taken by default:** (1) `levered-dcf-and-variants` deferred — levered DCF, FCFE and APV
  are named in the cheat sheet's "you may hear" box. (2) `extendProjection` fades the final growth
  rate towards terminal growth, so lengthening the forecast genuinely shrinks the TV share instead of
  repeating the last year. (3) `wacc()` returns 8.021 %; lessons quote 8.0 % as the rounded-weight
  figure and say so.
- **Loops 17–18 must know:** (1) Harbourline is now used by Chapters 14 and 16 and Marlow by 15 and
  16 — **check both before inventing a company**, and check its *economics*, not just its name.
  (2) The mid-year convention is `dcfValue`'s documented behaviour; do not change it to match a spec.
  (3) Widget props added here: `tv_share {cashFlows, wacc, growth, finalEbitda, years}`,
  `gordon_vs_exit {finalFcf, finalEbitda, wacc, growth, exitMultiple}`, `wacc_builder {riskFree, beta,
  erp, costOfDebt, taxRate, equityValue, debtValue}`, `beta_relever {comps, taxRate,
  targetDebtToEquity, riskFree, erp}`. (4) The bank-wide difficulty mix sits at 0.128 against a 0.15
  gate — keep an eye on it as you add ~46 more questions.
