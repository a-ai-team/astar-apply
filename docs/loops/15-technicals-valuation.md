# Loop 15 — Technicals: Valuation

_Status: merged (pending PR). Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md` § Technicals v2. Spec: `docs/research/technicals-v2/15-valuation.md`. Depends on Loop 11 (platform) and Loop 14 (`multiple_matcher`, `ev_bridge` refactor)._

## Goal
Ship the Valuation chapter for the summer-internship level: 5 hand-authored lessons (three methods
and ranking, trading comps, precedent transactions, multiples and metrics, football field and hard
cases) on one consistent dataset (Marlow Instruments plc + five peers + four precedents), the
`football_field` widget (with its comps-picker preset), 31 questions (22 sa-core, 5 sa-stretch, 4
lens) with follow-up ladders, TMT and Healthcare lens sections in every lesson, and the chapter cheat
sheet. All content loads `generated` for mentor review.

## Out of scope
SOTP / liquidation / LBO-valuation lessons (`other-methodologies` → `deferred: true`; named in the
cheat sheet only); DCF mechanics (Loop 16 — this chapter only *uses* a DCF range); real companies'
financials; new practice formats beyond those Loop 11 shipped.

## Research at start
`docs/research/technicals-v2/15-valuation.md` (the spec — every lesson's numbers, trap, canonical
answer, gate, prompts, your-turn, quick-fire, lens variants, ladder) and `00-syllabus.md` § 2 and § 7;
`01-interactive-teaching.md` § 3 (`football_field`, `multiple_matcher`) and § 5; Loop 11 retro (kit
exports, block components, `lensProblems`, cheat-sheet loader); Loop 14 retro (`multiple_matcher`
props); `content/lessons/three-statement-links.json` as the v2 reference lesson.

## User stories
- A student reads "The three methods and how to rank them", predicts whether precedents come out
  higher, then toggles methods on the football field and sees the overlap band move.
- They untick a peer in the comps preset and watch the median and Marlow's implied bar recompute.
- With the TMT lens on, every lesson gains its EV/ARR / Rule of 40 section; the practice bank shows
  the two TMT questions.
- They fill in the blanks of the Thornbury comps calculation and get per-cell feedback.
- They print the Valuation cheat sheet the night before an AC.

## Data model
No migration. Content files only: `content/lessons/{valuation-methodologies, comparable-companies,
precedent-transactions, multiples-and-metrics, choosing-and-presenting}.json`,
`content/questions/*.json` (31), `content/cheatsheets/valuation.json`. `taxonomy.ts`:
`other-methodologies` gets `deferred: true`; `target_questions` for the five kept subtopics rewritten
to 5 / 6 / 5 / 7 / 4 (= 27 non-lens).

## Routes / screens
- `src/lib/finance/comps.ts` — `multiples(peer)`, `median`, `mean`, `impliedValue(multiple, metric,
  bridge, shares)`, `premium(offer, undisturbed)`, `footballField(ranges)` (per-share bars from EV
  ranges via the bridge) + `comps.test.ts` pinned to the spec numbers (median 11.0×, Marlow £12.00,
  precedents £13.88, Thornbury £21.40, Halden £23.04 / £28.60).
- `src/components/widgets/football-field.tsx` — horizontal range bars per method (toggle on/off,
  draggable low/high handles with keyboard ±), market price and 52-week lines, overlap band readout;
  `props.mode: "field" | "comps"`; **comps mode** shows the peer table with checkboxes and recomputes
  median / mean and the implied bar (this is the "comps picker" — a preset, not a new widget name).
  Presets: `marlow` (chapter), `negative-ebitda` (revenue bars replace EBITDA bars). Built on
  `kit/{slider,stacked-bar,fmt,widget-frame,use-reduced-motion}`.
- Register `football_field` in `blocks/widget.tsx`; `multiple_matcher` reused with a chapter preset
  (adds EV/Revenue, EV/EBIT, EV/(EBITDA − capex), P/B) — preset lives in props, no component change
  unless Loop 14's matcher lacks `props.metrics`.
- Lessons: block order per the Loop 04 template + v2 additions (`predict` before each widget, one
  `fill_numbers` in lessons 2, 3 and 4, one `order_steps` in lesson 2, two `lens` blocks per lesson at
  `after-mechanics` and `before-your-turn`). Each lesson ≤ 12 min.
- Questions per the spec table (31 files) with `tags: ["depth:…", "format:…", ("lens:…")]`.
- Cheat sheet per the spec; topic page links to `/home/technicals/valuation/cheatsheet`.
- `DEFAULT_PATH` week 5 (Valuation) items point at the five lesson slugs.

## Scripts
`npm run content:validate` after every file; `npm run seed -- 03` (lessons, questions, path),
`npm run seed -- 05` (flashcards for the 27 non-lens questions), `npm run content:index`;
`npm run eval -- --suite lessons,questions`.

## Risks
- Numbers must reconcile across five lessons and 31 questions — a single `spec numbers` vitest file
  recomputes every figure in the spec from `comps.ts`; any drift fails the build.
- Difficulty mix: the chapter is heavy on difficulty 4 `fill` items (22 %); the `questions` eval gates
  ±15 % only at n ≥ 40, so record the mix in the retro rather than pad with weak questions.
- Overlap check: comps / precedents explanations are well-trodden — run the 8-gram overlap after
  every lesson, not just at the end.
- Draggable handles on the football field — keyboard path first (arrow keys on the focused handle),
  pointer drag second.

## Acceptance checks
- [x] lint / typecheck / build / `test:unit` / `test:e2e` green
- [ ] `content/lessons/` gains 5 valuation lessons and `content/questions/` gains 31 valuation questions, all passing `npm run content:validate` (incl. `lensProblems`, ≥ 1 `predict` each, `football_field` present in lessons 1, 2, 3, 5; `multiple_matcher` in lesson 4)
- [x] vitest `src/lib/finance/comps.test.ts` ≥ 15 cases, every spec figure reproduced
- [ ] `eval --suite lessons,questions`: schema 100 %, overlap 0; readability ≥ 4 on the 5 lessons when credit exists (else `NO API CREDIT` noted); difficulty mix recorded
- [x] `seed -- 03` idempotent (5 lessons, 31 questions `generated`; week-5 path items resolve), `seed -- 05` derives 27 cards (lens questions skipped), `content:index` adds the chapter's chunks
- [x] Playwright `e2e/15-valuation.spec.ts` (approves lesson 1 in `beforeAll`, restores after): lesson renders the required blocks; `predict` reveal; football field — toggle precedents off → overlap readout changes; comps mode — untick a peer → median text changes; `?lens=tmt` shows the TMT heading; cheat sheet renders the Rule of 40 formula
- [ ] Content stays `generated` (nothing auto-approves outside Accounting / EqV-EV); `/admin/review` lists 36 valuation items

## Tasks
- [ ] `taxonomy.ts`: `other-methodologies` deferred; `target_questions` rewritten; `DEFAULT_PATH` week 5
- [ ] `src/lib/finance/comps.ts` + tests (spec numbers)
- [ ] `football_field` widget (field + comps modes, presets) + registry; `multiple_matcher` chapter preset
- [x] lesson 1 `valuation-methodologies` (validate)
- [x] lesson 2 `comparable-companies` (+ `order_steps`, `fill_numbers`)
- [x] lesson 3 `precedent-transactions` (+ `fill_numbers`)
- [x] lesson 4 `multiples-and-metrics` (+ `fill_numbers`)
- [x] lesson 5 `choosing-and-presenting`
- [ ] 22 sa-core questions
- [ ] 5 sa-stretch + 4 lens questions
- [ ] `content/cheatsheets/valuation.json` + topic-page link
- [ ] seeds 03 / 05, `content:index`, eval suites
- [x] `e2e/15-valuation.spec.ts`, `docs/TECHNICALS.md` § Valuation, retro, RUNLOG

## Blocked-on-human (defaults)
Approval → all 36 items stay `generated` until a mentor approves in `/admin/review`; peer / deal
names → the invented set in the spec; lens labels as Loop 11 shipped them; football-field default
preset → `marlow`.

## Blocked
1. **Lighthouse a11y not run** — no headless Chrome in this sandbox (as Loops 11–14).
2. **Nothing is approved for students.** Valuation is a **paid** topic, so unlike Accounting and
   EqV/EV it does not auto-approve: all 5 lessons, 31 questions and the cheat sheet load as
   `generated`. **James/Tesleem:** approve in `/admin/review`, then `npm run seed -- 05 &&
   npm run content:index` to derive its flashcards and make it retrievable by the Mentor chatbot.

## Retro
- **Shipped:** five lessons on Marlow Instruments plc — `valuation-methodologies` (the three methods
  and how to rank them), `comparable-companies` (picking peers and spreading them),
  `precedent-transactions` (the control premium and why precedents sit highest),
  `multiples-and-metrics` (which multiple to choose, and why two similar companies trade four turns
  apart) and `choosing-and-presenting` (the range, the football field, and valuing a loss-making
  company); **31 questions** (25 `sa-core` / 6 `sa-stretch`; 23 verbal / 6 fill / 1 order / 1 spot;
  4 lens-tagged); `content/cheatsheets/valuation.json`; the `football_field` widget — one component
  with two faces (a range chart with method toggles, market-price line and a defensible-overlap
  readout; and a peer picker where unticking a peer moves the mean more than the median) plus a
  negative-EBITDA mode that strikes out the multiple-based bars — and `src/lib/finance/comps.ts`
  (`median`, `mean`, `spread`, `impliedFromMultiple`, `multipleFromValue`, `enterpriseFromEquity`,
  16 tests); taxonomy `deferred` on `other-methodologies`, targets Σ 31.
- **Verification:** `eval --suite lessons,questions` **PASS** — lessons schema 1.00, overlap 0,
  readability **4.47/5**; questions schema 1.00, overlap 0, mix gate active (n = 114) at 0.145.
  unit 357/357.
- **Slipped:** Lighthouse (§ Blocked 1); nothing approved (§ Blocked 2, by policy).
- **Four spec errors caught, three of them arithmetic:**
  1. **Lesson 5's per-share ranges did not reconcile** with the chapter's own £210m bridge. The spec
     said trading comps imply £10.90–£13.20; at 8.0×–12.0× they imply **£8.25–£13.25**, and
     precedents at 11.0×–14.0× imply **£12.00–£15.75**, not £12.38–£14.00. Found independently by
     the widget author (pinning tests) and the lesson author within a minute of each other.
  2. **A backwards factual claim** — the spec said Halden's EV/EBIT is *lower* than Brantwood's
     because its D&A is lighter. It is **higher** (15.79× vs 14.67×) and their D&A step-ups are
     effectively identical. Replaced with Penrose vs Larkfield, a real capital-intensity contrast.
  3. **A widget prompt that its own data cannot satisfy** — "keep only the two 12 %+ growers" when
     only one peer grows at 12 %.
  4. **The difficulty-mix prose contradicted the table it sits under** (3/9/9/6 vs 3/10/9/5).
- **A rename I got wrong and the readability judge caught.** The spec's peers "Kestrel Sensors" and
  "Ashdown Controls" clashed with Chapter 13's Kestrel Foods and Chapter 12's Ashdown Bakeries, so I
  renamed them to **Brantwood Sensors** and **Larkfield Controls**. My first pass replaced only the
  full names, leaving bare "Kestrel"/"Ashdown" references behind — two lessons ended up naming three
  companies for two entities, and the judge scored them 3.4 and 2.8 with exactly that diagnosis.
  Fixed with a word-boundary pass (checked first that no valuation file legitimately references the
  other chapters' companies); readability recovered to 4.47 and both lessons cleared.
- **Decisions taken by default:** (1) `other-methodologies` is deferred — SOTP, liquidation and LBO
  valuation are named in the cheat sheet's "you may hear" box. (2) One `football_field` component
  serves the range chart, the comps picker and the per-share view rather than three widgets; it
  gained an optional `display: "ev" | "share"` prop for lesson 5. (3) `spread()` uses inclusive
  quartiles, which reproduces the spec's shaded 9.0×–12.0× band.
- **A widget-prop unit bug the e2e caught.** `choosing-and-presenting` passed per-share values in
  `methods.low/high` *and* `display: "share"`, so the widget converted twice and rendered large
  negative bars; its peers also used whole percents (`growth: 8`) where the widget expects decimals,
  displaying as 800 %. The contract is: **`methods` are always EV and `display` does the
  conversion**; rates are decimals. Fixed across every `football_field` block and re-verified —
  comps £8.25–£13.25, precedents £12.00–£15.75, DCF £8.67–£10.33.
- **Loops 16–18 must know:** (1) Marlow's DCF range (**EV £1,250–1,450m**) is quoted in this chapter
  as an output — **Chapter 16 must produce that range**, or both chapters must change together.
  (2) The full renaming lesson: when a chapter renames an entity, sweep bare forms as well as full
  names, and re-run the lessons eval — the readability judge catches naming incoherence that schema
  validation cannot. (3) `football_field` props: `{ subject, peers, methods, currentPrice, mode:
  "field"|"comps", display: "ev"|"share" }`.
