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
- [ ] lint / typecheck / build / test:unit / test:e2e
- [ ] `content:validate` 0 errors: 4 lessons (all with `predict`, a widget, both lens variants, `fill_numbers` in lesson 3), 22 questions, cheat sheet
- [ ] vitest `merger.test.ts` reproduces every spec number (± 0.5 %)
- [ ] `eval --suite lessons,questions`: schema 100 %, overlap 0 (readability ≥ 4 when credit)
- [ ] `seed -- 03` → 4 `generated` lessons + 22 questions; `seed -- 05` derives 18 cards, 0 for lens questions; both idempotent
- [ ] Playwright `e2e/17-ma.spec.ts` (approve lesson 2 in `beforeAll`, restore after): predict → widget slider changes accretion % → lens Healthcare shows CVR heading → `deal_summary` renders and prints (media emulation) → cheat sheet lists 6 formulas
- [ ] nothing auto-approved (M&A is a paid, non-free topic)

## Tasks
- [ ] `merger.ts` additions + tests
- [ ] widgets `accretion_rule`, `synergy_npv`, `ppa_goodwill` + registry
- [ ] `deal_summary` template kind (schema enum, renderer, labels, indexer)
- [ ] taxonomy: defer PPA subtopic, rewrite `target_questions`
- [ ] lesson 1 `why-companies-acquire` (+ validate)
- [ ] lesson 2 `accretion-dilution-concepts` (+ validate)
- [ ] lesson 3 `accretion-dilution-calculations` (+ validate)
- [ ] lesson 4 `synergies-and-deal-structure` (+ validate)
- [ ] 22 questions (12 core, 6 stretch, 4 lens) with tags, follow-ups, `numbers` on the 5 fill questions
- [ ] cheat sheet `ma.json`
- [ ] seeds 03 / 05, `content:index`, eval
- [ ] `e2e/17-ma.spec.ts`, docs, retro, RUNLOG

## Blocked-on-human (defaults)
Approval → stays `generated` (paid topic, no auto-approve); deal-template persistence → localStorage
only (no table); stretch widget `ppa_goodwill` shown inside lesson 4 behind a "Going deeper" reveal.

## Blocked
_(record blockers here during the run)_

## Retro
_(written at the end of the loop)_
