# Loop 17 — Technicals: M&A

_Status: planned. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md` § Technicals v2. Spec: `docs/research/technicals-v2/17-ma.md`._

## Goal
The M&A chapter at summer-internship depth: 4 lessons (`why-companies-acquire`, `accretion-dilution-concepts`,
`accretion-dilution-calculations`, `synergies-and-deal-structure`) on the one Tamar / Wychwood deal, the
widgets `accretion_rule` and `synergy_npv` (+ `ppa_goodwill` stretch), 22 questions (12 core · 6 stretch ·
4 lens), TMT + Healthcare lens blocks in every lesson, the `ma` cheat sheet and a printable
`deal_summary` template. All content hand-authored from the spec; loads as `generated`.

## Out of scope
Full three-statement merger model; PPA mechanics beyond one stretch widget and two questions
(`purchase-price-allocation` subtopic → `deferred: true`); exchange-ratio collars; real deal data.

## Research at start
`17-ma.md` (the spec — every number is fixed there); `00-syllabus.md` § 2 M&A row and § 7 (probe
ladder); `02-lens-design.md` § 3 M&A row; Loop 11 retro (kit API, block components, `lensProblems`);
`src/lib/finance/merger.ts` as left by Loop 11; the Loop 16 retro (widget conventions settled by then).

## User stories
- A student predicts whether Tamar's all-stock deal is accretive, then slides the offer P/E in
  `accretion_rule` until it flips, and can say why.
- They complete a faded merger-maths walk (`fill_numbers`) and get per-cell feedback.
- With the Healthcare lens on, they read why a biotech deal is "dilutive by design" and practise the CVR question.
- They fill the `deal_summary` template for a Pulse deal and print it for their interview folder.

## Data model
No migration. `template.kind` enum gains `deal_summary` (schema + renderer + labels; additive).
`taxonomy.ts`: `purchase-price-allocation.deferred = true`; `target_questions` on the four kept
subtopics rewritten to 5 / 5 / 5 / 3 (= 18 non-lens; lens questions are tagged, not targeted).

## Routes / screens
- `src/lib/finance/merger.ts`: `proForma({acqNI, acqShares, acqPrice, tgtNI, price, pctCash, pctDebt, pctStock, cashRate, debtRate, tax, synergies, newAmort})` → `{newShares, afterTaxCost, proFormaNI, proFormaEPS, accretionPct, costOfCurrency:{stock,debt,cash}}`; `goodwill({price, bookNetAssets, writeUps, dtl?})`; `synergyNPV({runRate, phaseIn, oneOff, r, tax})`. Tests pinned to the spec (EPS 1.252 / 1.45 / 1.375 / 1.306 / 1.438; goodwill 220 / 235; NPV ≈ 160 net).
- Widgets: `src/components/widgets/accretion-rule.tsx` (simple + full mode via props), `synergy-npv.tsx`, `ppa-goodwill.tsx`; registered in `blocks/widget.tsx`.
- Template: `deal_summary` kind in `blocks/template.tsx` (fields from the spec; print CSS; localStorage draft, try/catch).
- Content: `content/lessons/{why-companies-acquire,accretion-dilution-concepts,accretion-dilution-calculations,synergies-and-deal-structure}.json` (each: why_here, concept, mechanics, worked_calc, predict, widget, fill_numbers where the spec says, trap, canonical_answer, lens ×2, your_turn, quick_fire, one_liner, now_you_can); `content/questions/*.json` ×22 with `depth:` / `format:` / `lens:` tags; `content/cheatsheets/ma.json`.
- Pages: none new; the topic page hides the deferred subtopic; cheat-sheet link already exists (Loop 11).
- Docs: `docs/TECHNICALS.md` chapter row.

## Scripts
`npm run content:validate` after every file; `npm run seed -- 03` (loads lessons + questions, rewrites
path items); `npm run seed -- 05` (flashcards from core / stretch only); `npm run content:index`;
`npm run eval -- --suite lessons,questions`.

## Risks
- Arithmetic drift between spec, `worked_calc` steps and widgets → all numbers come from `merger.ts`
  tests; `evalExpr` re-checks the steps at validate time.
- Difficulty mix on a 18-question chapter cannot hit 25 / 30 / 30 / 15 exactly; the eval gates the whole bank (≥ 40), not the chapter.
- Overlap check: the P/E 15-buys-10 setup is canonical everywhere — keep our wording and numbers (12.5× offer P/E, Tamar / Wychwood) distinct; run overlap before commit.

## Acceptance checks
- [x] lint / typecheck / build / test:unit (386/386) / test:e2e (**73/73**)
- [x] `content:validate` 0 errors: 4 lessons (all with `predict`, both lens variants, `fill_numbers` in lesson 3; lesson 1 carries the `deal_summary` template instead of a widget, per the spec), 22 questions, cheat sheet — 32 lessons / 186 questions / 6 sheets total
- [x] vitest `merger.test.ts` reproduces every spec number ± 0.5 % (12 new pinned cases, 25/25) — **except two the spec got wrong**, corrected against the library: synergy NPV ≈ £167m not £160m, breakeven run-rate ≈ £12.6m not £9–10m (§ Retro)
- [x] `eval --suite lessons,questions`: lessons schema 1.00, overlap 0, readability 4.35; questions schema 1.00, overlap 0, mix 0.132 at n = 178
- [x] `seed -- 03` → 4 `generated` lessons + 22 questions, idempotent; `seed -- 05` unchanged for now — flashcards derive **at approval** (18 eligible: 12 core + 6 stretch; the 4 lens questions are excluded), same as Valuation and DCF
- [x] Playwright `e2e/17-ma.spec.ts` 6/6 (approves the four lessons in `beforeAll`, restores after): predict gate → `ar-accretion` +4.3 % flips dilutive at a 16× offer → healthcare lens shows the CVR material → `deal_summary` renders its 13 rows and survives print emulation → cheat sheet lists the 6 formulas
- [x] nothing auto-approved (M&A is paid; the e2e restores original statuses)

## Tasks
- [x] `merger.ts` additions + tests (`newAmortisation`/`fees` on `accretionDilution`; `synergyPerpetuityNpv`)
- [x] widgets `accretion_rule` (simple/full mode), `synergy_npv`, `ppa_goodwill` + registry (18 entries)
- [x] `deal_summary` template kind — already shipped by Loop 11 (schema enum, renderer rows, labels); lesson 1 authors the block
- [x] taxonomy: defer PPA subtopic, rewrite `target_questions` to 5/5/5/3
- [x] lesson 1 `why-companies-acquire` (+ validate)
- [x] lesson 2 `accretion-dilution-concepts` (+ validate)
- [x] lesson 3 `accretion-dilution-calculations` (+ validate)
- [x] lesson 4 `synergies-and-deal-structure` (+ validate)
- [x] 22 questions (12 core, 6 stretch, 4 lens) with tags, follow-ups, `numbers` on the 5 fill questions
- [x] cheat sheet `ma.json`
- [x] seeds 03 / 05, `content:index` (231 chunks), eval
- [x] `e2e/17-ma.spec.ts`, docs, retro, RUNLOG

## Blocked-on-human (defaults)
Approval → stays `generated` (paid topic, no auto-approve); deal-template persistence → localStorage
only (no table); stretch widget `ppa_goodwill` shown inside lesson 4 behind a "Going deeper" reveal.

## Blocked
1. **Lighthouse a11y not run** — no headless Chrome in this sandbox (standing gap since Loop 11).
2. **Nothing is approved for students.** M&A is a **paid** topic: 4 lessons, 22 questions and the
   cheat sheet load as `generated`. **James/Tesleem:** approve in `/admin/review`, then
   `npm run seed -- 05 && npm run content:index`.

## Retro
- **Shipped:** four lessons on one deal — Tamar Group plc (P/E 15) buying Wychwood Ltd at a 25 %
  premium / 12.5× offer P/E — covering rationale (+ the printable `deal_summary` card), the
  accretion/dilution idea (earnings-yield framing), the full merger maths (50/50 walk with
  `fill_numbers`), and synergies/goodwill/structure; **22 questions** (12 core / 6 stretch / 4 lens;
  17 verbal / 5 fill with `numbers` / 1 order / 1 spot… as tagged); `content/cheatsheets/ma.json`;
  three widgets — `accretion_rule` (simple + full mode), `synergy_npv` (perpetuity NPV vs the
  premium), `ppa_goodwill` (inside its own "Going deeper" reveal) — plus `synergyPerpetuityNpv` and
  optional `newAmortisation`/`fees` in `merger.ts` (12 new tests, 25/25).
- **Verification:** eval lessons **PASS** (schema 1.00, overlap 0, readability 4.35) and questions
  **PASS** (schema 1.00, overlap 0, mix 0.132 at n = 178). unit 386/386, e2e 73/73, build ✓.
- **Three more spec errors (15–17), all caught before authoring** by verifying against the library:
  (15) the spec's synergy PV "≈ £160m" leaves the £20m integration cost untaxed; the library taxes
  every line (`(gross − cost) × (1 − t)`), giving **≈ £167m** — conclusion vs the £100m premium
  unchanged; (16) the breakeven-run-rate prompt "≈ £9–10m pre-tax" is wrong by *any* method — the
  true breakeven is **≈ £12.6m** (even the spec's own arithmetic gives ~13); (17) the difficulty-mix
  summary line ("1×2 · 2×6 · 3×6 · 4×4") contradicts the spec's own question table, which sums to
  2/7/6/3 — the table was followed; the bank-wide gate is the arbiter.
- **Kestrel Foods reused deliberately.** Lesson 1's your-turn keeps Chapter 13's Kestrel as an
  acquirer at P/E 18 — checked against every Chapter 13 figure first: nothing there pins a P/E or
  market cap, so this is continuity (the company the student already knows), not a Loop 16-style
  contradiction. New names introduced: **Oakhurst plc / Bexfield Ltd** (lesson 3 your-turn, all-debt
  variant, hand-checked: £600m at 7 % → EPS £2.669, +6.75 %, breakeven rate 10 % pre-tax).
- **Decisions taken by default:** (1) content stays `generated` (paid topic). (2) The `deal_summary`
  template stays a printable blank like the other three template kinds — no localStorage drafting;
  adding editable fields to one kind only would diverge from established template behaviour.
  (3) `ppa_goodwill` renders inside a native `<details>` reveal owned by the widget itself, so no
  renderer change was needed.
- **Out-of-scope observations for James:** (a) the merged DCF cheat sheet's discounting note still
  claims mid-year lifts EV "about 3–4 %", contradicting Loop 16's own retro (library: +0.9 %) — one
  line to fix; (b) the readability judge sampled Loop 15's `multiples-and-metrics` at 3.3, alleging
  its TMT lens answer says both companies score 30 on the Rule of 40 when one scores 45 — worth a
  look next time someone is in that file (chapter average still passed at 4.35).
- **Loop 18 must know:** (1) widget props added here: `accretion_rule {acquirerNetIncome,
  acquirerShares, acquirerPe, targetNetIncome, offerPe, stockPct, debtPct, cashPct, costOfDebt,
  cashRate, taxRate, synergies, fees, mode: "simple"|"full"}` (offer value is derived as
  offerPe × targetNetIncome), `synergy_npv {runRate, phaseInYears, integrationCost, discountRate,
  taxRate, premium}`, `ppa_goodwill {purchasePrice, bookEquity, writeUps, taxRate}`. (2) Companies
  now in use additionally: Tamar Group plc, Wychwood Ltd (17), Oakhurst plc, Bexfield Ltd (17).
  (3) The mix gate sits at **0.132** after this chapter (was 0.128) — LBO's 24 questions must not
  push it over 0.15; d2 is now the heavy band (0.343 vs target 0.30).
