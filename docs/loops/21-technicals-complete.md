# Loop 21 — Technicals complete

**Status:** open-pr (content `generated`, awaiting approval) · **Branch:** `feat/technicals-complete` · **Started:** 2026-10-08

## Goal
Make sure the Technicals course covers every concept a generalist IB technical interview can ask,
checked two ways (a full-syllabus checklist, and the hidden 400Q technical sections via the new
`coverage` eval suite), then fill every gap and publish one concise master guide.

## Out of scope
Industry-group modules and fit / behavioural content (James, 2026-10-08). Brain teasers and
restructuring basics are **in**.

## Research at start
- `docs/research/technicals-v2/00-syllabus.md` (§2 depth table, §7 probe ladder)
- `docs/research/technicals-v2/21-complete-syllabus.md` — the checklist and **build list**
- `.claude/rules/content.md`; `CURRENT.md` "Rules learned the hard way"; shape reference
  `content/lessons/wacc.json`, `content/questions/unlever-relever-beta.json`
- The company roster across chapters (Loop 18 retro) — reuse names *with their economics*

## Data model / taxonomy
- Un-deferred: `discount-rates-and-risk`, `irr-and-payback`, `deferred-taxes-and-other-items`,
  `ev-edge-cases`, `other-methodologies`, `levered-dcf-and-variants`, `purchase-price-allocation`,
  `debt-tranches`. New: `lbo/distress-and-restructuring`. `fit-behavioural/brain-teasers` gets its lesson.
- `DEFAULT_PATH`: core days 1–5 unchanged; **stretch days 6–7** carry the new lessons.

## Scripts
- `npm run eval -- --suite coverage` — new suite; reads the hidden set only via `hiddenDir()`;
  writes `.eval/coverage-400q.json`; prints counts and our own concept labels.

## Acceptance checks
- [ ] `coverage` suite: 0 gaps, ≥ 90 % covered (needs James's go-ahead to run — it sends hidden-set questions to the API)
- [x] Every build-list row in `21-complete-syllabus.md` is ✓
- [x] `content:validate` and `eval --suite lessons,questions`: schema 100 %, overlap 0, mix gate
- [x] Every new lesson passes `approvalProblems` (approvable, status `generated`)
- [x] lint · typecheck · build · unit · e2e (guide spec + `03`, `18`, `20`)
- [x] Master guide page + PDF render

## Tasks
- [x] Coverage suite (`scripts/eval/suites/coverage.ts`), threshold, CONTRACTS row
- [x] Syllabus checklist + build list (`docs/research/technicals-v2/21-complete-syllabus.md`)
- [x] Taxonomy: un-defer, new subtopic, stretch days
- [x] Lessons + questions: finance foundations (2 lessons) and brain teasers
- [x] Lessons + questions: accounting
- [x] Lessons + questions: eqv-ev and valuation
- [x] Lessons + questions: DCF (discount-rate top-ups)
- [x] Lessons + questions: M&A
- [x] Lessons + questions: LBO debt tranches and restructuring
- [x] Cheat sheets: new formulas / traps; taught items leave "you may hear"
- [x] Master guide `/home/technicals/guide` + PDF
- [x] Run checks; seed `03` as `generated`; PR

## Blocked-on-human (defaults taken)
- **Approval:** all new content lands `generated`; James approves with `content:approve`.
- **Coverage run:** waits for James (it sends hidden-set text to the API, as the chat eval does).
- **Path shape:** stretch days 6–7 rather than reshuffling the core 5-day weeks.

## Retro
- **Shipped:** 10 lessons + 78 questions (all `generated`), covering every gap in the syllabus checklist:
  irr-and-payback, discount-rates-and-risk, brain-teasers, deferred-taxes-and-other-items, ev-edge-cases,
  other-methodologies, levered-dcf-and-variants, purchase-price-allocation, debt-tranches,
  distress-and-restructuring. Seven cheat sheets extended; taught items left "you may hear". Master
  guide `/home/technicals/guide` + PDF; `coverage` eval suite; stretch days 6–7 on the path.
- **Checks:** content:validate 0 errors (49 lessons / 288 questions); eval lessons PASS (readability 4.45,
  overlap 0, 48/48 approvable); questions PASS (n 280, mix diff 0.107, overlap 0); lint · typecheck ·
  build · unit 409/409; technicals e2e green after unpinning counts (rule 9).
- **Caught in passing:** live `wacc-100-equity` used an unlevered beta of 0.80 / Ke 8.8 % / levered 10.8 %;
  the library and the WACC lesson say 0.70 / 8.2 % / 10.0 % — corrected (library wins). `unlever-relever-beta`
  still gives Harbourline a peer-derived 1.14 levered beta — a deliberate exercise, flagged for review.
  A near-duplicate associate question was dropped. `deferred_tax` and `nci_vs_equity` are in
  WIDGET_NAMES with no component — nothing uses them.
- **Not run:** the `coverage` suite (sends hidden-set text to the API; waits for James).
- **Next:** James/Tesleem review → `npm run content:approve -- --topic finance-foundations,accounting,eqv-ev,valuation,dcf,ma,lbo,fit-behavioural`
  (approves only rows that pass the rules) → `seed -- 05` → `content:index` → `packs:build -- --guide`.
  Check the UK loss-relief cap stated in `tax-losses-carried-forward`.
