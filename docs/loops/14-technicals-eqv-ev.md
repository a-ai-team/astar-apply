# Loop 14 — Technicals: Equity value vs enterprise value

_Status: planned. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md` § Technicals v2. Spec: `docs/research/technicals-v2/14-eqv-ev.md`._

## Goal
Ship the complete EqV vs EV chapter on the Loop 11 platform: 4 lessons (1 new-content retrofit of the
approved `ev-bridge-basics`, 3 new), 3 new widgets (`tsm_dilution`, `lease_toggle`, `multiple_matcher`)
on the kit, 28 questions (20 `sa-core`, 4 `sa-stretch`, 4 lens) with depth / format / lens tags, TMT and
Healthcare lens blocks in every lesson, and the chapter cheat sheet. EqV/EV is a free topic and
**auto-approves when the evals pass** (existing rule).

## Out of scope
`ev-edge-cases` lesson (deferred; pensions and NCI-vs-equity-method live in the cheat sheet
"you may hear"); FIG lens; any new block type or migration; changes to `ev_bridge` beyond presets.

## Research at start
`docs/research/technicals-v2/14-eqv-ev.md` (the spec — every number and block is there),
`00-syllabus.md` § 2 and § 7, `02-lens-design.md` § 2; Loop 11 retro (kit exports, registry, lens
rule); `content/lessons/ev-bridge-basics.json` and `content/questions/{what-is-enterprise-value,
compute-ev-harbourline,trapped-cash-and-ev}.json` (existing, approved — keep slugs and numbers);
`src/lib/finance/shares.ts` and `bridge.ts` from Loop 11.

## User stories
- A student reads lesson 1, predicts what a doubled share price does to EV, then drags cash on the
  bridge preset and sees EqV hold while EV moves.
- In lesson 3 they slide the share price through the strike and watch the diluted count kick in.
- In lesson 4 they drag metrics into EV / Equity buckets and get red on `net income → EV`.
- With the TMT lens on, lesson 4 shows the EV/ARR section and the practice list gains the net-cash
  tech question; with Healthcare it shows the negative-EV biotech section instead.
- They open `/home/technicals/eqv-ev/cheatsheet` the night before an AC and print it.

## Data model
No migration. `taxonomy.ts`: `ev-edge-cases` gets `deferred: true`; `target_questions` for the four
kept subtopics become 4 / 10 / 5 / 5 (Σ 24 non-lens; 2 of those already exist → 22 written + 4 lens
= 26 new files, 28 questions in the chapter). Questions carry `tags` `depth:*`, `format:*`, `lens:*`.

## Routes / screens
- `src/lib/finance/shares.ts`: `treasuryStockMethod({basic, options, strike, price})`,
  `ifConverted({face, convPrice, price})`, `dilutedShares(inputs)`; `bridge.ts` gains `pension` and
  `withLeases: boolean`; `multiples.ts` (new): `pairing(metric) → "ev" | "equity"`, `multiple(value, metric)`.
- Widgets: `src/components/widgets/tsm-dilution.tsx` (price slider crossing the strike; proceeds →
  buy-back animation on a `StackedBar`; convertible toggle), `lease-toggle.tsx` (one switch; EBITDA,
  debt, EV, EV/EBITDA update together with `AnimatedNumber`), `multiple-matcher.tsx` (drag or
  keyboard-select metrics into two buckets; red / green with a one-line reason; "load Harbourline"
  button prints both multiples). Register all three in `blocks/widget.tsx`; `ev_bridge` gains a
  `locked: string[]` prop for the lesson-1 preset.
- Content: `content/lessons/{equity-and-enterprise-value,diluted-shares,pairing-metrics-with-values}.json`
  (new), `content/lessons/ev-bridge-basics.json` (v2 additions per spec § Loop 14 notes),
  `content/questions/*.json` (26 new = 22 non-lens + 4 lens; the 2 existing spec'd questions retagged, `trapped-cash-and-ev` left as is), `content/cheatsheets/eqv-ev.json`.
- Pages: nothing new — topic page hides the deferred subtopic; cheat-sheet route exists from Loop 11.

## Scripts
`npm run content:validate` after every file; `npm run seed -- 03` then `seed -- 05` and
`content:index`; `npm run eval -- --suite lessons,questions`; `npm run content:approve -- --topic eqv-ev`
only after the evals pass.

## Risks
- Retrofitting an *approved* lesson: the collector never overwrites approved files, so edit the file
  by hand and re-run `seed -- 03`; keep the canonical answer verbatim.
- Drag-and-drop a11y in `multiple_matcher`: ship the keyboard path (select metric → press E / Q)
  first; pointer drag is progressive enhancement.
- Difficulty mix: spec predicts level 3 over-weight; adjust one question rather than pad.
- Overlap check: the bridge is the most-written-about topic on the web — keep prose in the chapter
  company's voice and run `content:validate` (8-gram) per file, not at the end.

## Acceptance checks
- [ ] lint / typecheck / build
- [ ] vitest: `shares.test.ts` (TSM 240 → 250; OTM adds 0; price doubling → 15m net; if-converted ITM / OTM), `bridge.test.ts` (pension, leases on / off = 1,530 / 1,485 / 1,565), `multiples.test.ts` (pairing table; 9.0× / 14.8×); unit suite green
- [ ] `npm run content:validate` 0 errors: 4 lessons (each with `predict`, its widget, 2 `lens` blocks covering `tmt` + `healthcare`), 28 questions, cheat sheet; every question has `depth:` and `format:` tags; lens questions carry `lens:`
- [ ] `npm run eval -- --suite lessons,questions`: schema 100 %, overlap 0, difficulty mix within ±15 % (n ≥ 40 gate may not trigger — report the mix), readability ≥ 4 when credit
- [ ] `seed -- 03` idempotent (4 lessons, 28 questions loaded; `ev-bridge-basics` still `approved`); `seed -- 05` derives 24 cards from core + stretch only (lens excluded); `content:index` adds lens chunks with the `[TMT lens]` / `[Healthcare lens]` prefix
- [ ] `content:approve -- --topic eqv-ev` after green evals → 4 approved lessons, 28 approved questions (listed in the retro)
- [ ] Playwright `e2e/14-eqv-ev.spec.ts`: lesson 3 slider below the strike → diluted count equals basic; above → increases; lesson 4 keyboard-assign `net income` → EV shows red; lens switch on lesson 4 shows the EV/ARR heading; cheat sheet lists ≥ 4 formulas; existing suites green
- [ ] Lighthouse a11y ≥ 95 on `/home/technicals/eqv-ev/diluted-shares`

## Tasks
- [ ] `src/lib/finance/{shares,bridge,multiples}.ts` + tests
- [ ] widgets `tsm_dilution`, `lease_toggle`, `multiple_matcher` + registry + `ev_bridge` `locked` prop
- [ ] lesson 1 `equity-and-enterprise-value` JSON (validate)
- [ ] lesson 2 `ev-bridge-basics` v2 additions (validate; stays approvable)
- [ ] lesson 3 `diluted-shares` JSON (validate)
- [ ] lesson 4 `pairing-metrics-with-values` JSON (validate)
- [ ] 22 non-lens question files + retag the 2 existing (validate after each subtopic)
- [ ] lens questions (4) + lens blocks review against `02-lens-design.md`
- [ ] `content/cheatsheets/eqv-ev.json`; taxonomy `deferred` + `target_questions`
- [ ] `seed -- 03`, `seed -- 05`, `content:index`; eval; approve (free topic)
- [ ] `e2e/14-eqv-ev.spec.ts`, Lighthouse, `docs/TECHNICALS.md` § chapter table row, retro, RUNLOG

## Blocked-on-human (defaults)
Auto-approve EqV/EV → yes (existing rule, free topic); pension deficit → taught as stretch inside
lesson 2, not a separate lesson; lesson-1 widget → `ev_bridge` with only cash and debt unlocked.

## Blocked
_(record blockers here during the run)_

## Retro
_(written at the end of the loop)_
