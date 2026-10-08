# Loop 21 — Technicals complete

**Status:** in-progress · **Branch:** `feat/technicals-complete` · **Started:** 2026-10-08

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
- [ ] Every build-list row in `21-complete-syllabus.md` is ✓
- [ ] `content:validate` and `eval --suite lessons,questions`: schema 100 %, overlap 0, mix gate
- [ ] Every new lesson passes `approvalProblems` (approvable, status `generated`)
- [ ] lint · typecheck · build · unit · e2e (guide spec + `03`, `18`, `20`)
- [ ] Master guide page + PDF render

## Tasks
- [x] Coverage suite (`scripts/eval/suites/coverage.ts`), threshold, CONTRACTS row
- [x] Syllabus checklist + build list (`docs/research/technicals-v2/21-complete-syllabus.md`)
- [x] Taxonomy: un-defer, new subtopic, stretch days
- [ ] Lessons + questions: finance foundations (2 lessons) and brain teasers
- [ ] Lessons + questions: accounting
- [ ] Lessons + questions: eqv-ev and valuation
- [ ] Lessons + questions: DCF (discount-rate top-ups)
- [ ] Lessons + questions: M&A
- [ ] Lessons + questions: LBO debt tranches and restructuring
- [ ] Cheat sheets: new formulas / traps; taught items leave "you may hear"
- [ ] Master guide `/home/technicals/guide` + PDF
- [ ] Run checks; seed `03` as `generated`; PR

## Blocked-on-human (defaults taken)
- **Approval:** all new content lands `generated`; James approves with `content:approve`.
- **Coverage run:** waits for James (it sends hidden-set text to the API, as the chat eval does).
- **Path shape:** stretch days 6–7 rather than reshuffling the core 5-day weeks.

## Retro
_(at loop end)_
