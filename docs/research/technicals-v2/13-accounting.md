# Chapter 13 — Accounting: content spec

_Written 2026-08-28 for Loop 13 (`docs/loops/13-technicals-accounting.md`). Topic slug `accounting`
(free topic). Reader: UK second-year with one accounting/finance module. Everything below is original;
public sources are cited for *structure* only. Company for the whole chapter: **Kestrel Foods plc**, a
UK snacks maker — revenue £500m, 25 % tax rate throughout. Depth tags per `00-syllabus.md` § 2._

## Chapter shape
8 lessons, ~55 minutes reading; 30 `sa-core` + 6 `sa-stretch` + 4 lens questions; four widgets
(`three_statement` with per-lesson presets, `faded_walk`, `cash_cycle`, `filings_toggle`); cheat sheet
with the `three_statement_grid` template. Deferred subtopics: `deferred-taxes-and-other-items`,
`depreciation-and-capex` (their sa-core content is folded into `single-step-walkthroughs`; the rest
lives in the cheat sheet's *you may hear* box).

**Kestrel Foods plc — base year (£m).** Revenue 500 · COGS 300 · gross profit 200 · opex 100 (of which
D&A 20) · EBIT 100 · interest 10 · PBT 90 · tax 22.5 · net income 67.5. Cash 60 · receivables 50 ·
inventory 40 · PP&E 300 · total assets 450. Payables 30 · debt 150 · equity 270. Capex 30 ·
dividends 20. Every lesson's worked numbers start here so a student can carry one company through.

---

## Lesson 1 — `three-statements-overview` · "The three statements at a glance"
- **(a) Question:** "Walk me through the three financial statements." `sa-core`.
- **(b) Numbers:** the base year above. Show each statement as a five-line summary.
- **(c) Trap:** "**The balance sheet shows what the company earned this year.**" No — it is a
  snapshot of what it *owns and owes* at one instant; the income statement is the film, the balance
  sheet the photograph.
- **(d) Canonical answer:** *The income statement shows revenue less costs over a period, ending in
  net income. The balance sheet is a snapshot: assets equal liabilities plus equity. The cash-flow
  statement reconciles net income to the actual change in cash through operating, investing and
  financing sections. They link because net income flows into retained earnings and starts the cash-flow
  statement, and the closing cash lands on the balance sheet.* (68 words, 40 s)
- **(e) Predict gate:** "Kestrel's net income is £67.5m. Did its cash rise by £67.5m this year?"
  Options: Yes / No, cash rose by less / No, cash rose by more / Can't say from the income statement
  alone → **correct: Can't say** (explain: cash needs the cash-flow statement — capex, working capital
  and dividends all sit outside net income).
- **(f) Widget (`filings_toggle`, preset `kestrel-overview`):** "Toggle to *as-filed*: find where
  'operating profit' hides among six extra lines." · "Which statement grew by 20 lines when toggled?
  Why is the balance sheet the longest?"
- **(g) Your turn:** Given revenue 800, costs 700 (incl. D&A 50), interest 20, tax 25 %: write the
  five-line income statement and state which number appears on the other two statements. Rubric:
  EBIT 100 · PBT 80 · NI 60 · NI → retained earnings (BS) · NI → top of CFS.
- **(h) Quick-fire:** "Which statement is a snapshot?" → balance sheet · "What does the CFS start
  with?" → net income · "Assets = ?" → liabilities + equity · "Where does net income go on the
  balance sheet?" → retained earnings, inside equity.
- **(i) Lens:** *no lens* (nothing changes at this altitude).
- **(j) Follow-up ladder:** "Which is most important and why?" → "If you could only have one, which?"
  (cash flow — cash is what pays debt) → "Then why do analysts obsess over EBITDA?" (proxy for
  operating cash before capex and capital structure).
- Sources (structure): WSP "how the statements are linked"; M&I accounting questions; WSO
  "20 most frequently asked, London edition".

## Lesson 2 — `income-statement` · "Income statement: from revenue to net income"
- **(a)** "Walk me down the income statement" / "What is the difference between EBIT and EBITDA?" `sa-core`.
- **(b)** Base year. EBITDA = EBIT + D&A = 120. Margins: gross 40 %, EBITDA 24 %, EBIT 20 %, net 13.5 %.
- **(c) Trap:** "**Revenue is cash received.**" No — revenue is recognised when the good is
  delivered; a sale on credit is revenue today and cash later.
- **(d) Canonical:** *Revenue less cost of goods sold gives gross profit; less operating expenses,
  including depreciation and amortisation, gives operating profit or EBIT. Adding back D&A gives
  EBITDA, a rough proxy for operating cash generation. Below EBIT come interest and tax, leaving net
  income for shareholders. Each line answers a different question: gross profit is product economics,
  EBIT is the business, net income is what the equity holders keep.* (72 words)
- **(e) Predict:** "Kestrel doubles D&A from £20m to £40m (no other change). What happens to EBITDA?"
  Falls / Rises / Unchanged → **Unchanged**.
- **(f) Widget (`three_statement`, preset `is-only`, IS pane expanded):** "Raise COGS by £50m — watch
  gross and net margin." · "Now raise D&A by £20m — which margin does not move?"
- **(g) Your turn:** Revenue 1,000, COGS 550, opex 250 incl. D&A 60, interest 40, tax 25 %. Compute
  EBITDA, EBIT, NI and the three margins. Rubric: EBITDA 260 · EBIT 200 · NI 120 · margins 26 / 20 / 12 %
  · states EBITDA excludes D&A because it is non-cash.
- **(h) Quick-fire:** "EBITDA − D&A = ?" → EBIT · "Is interest above or below EBIT?" → below ·
  "Non-cash item on the IS?" → depreciation (also SBC, impairment) · "Net income belongs to whom?"
  → equity holders.
- **(i) Lens — TMT:** "Revenue you have not earned yet" — a SaaS customer pays £120 upfront for a
  year; revenue is £10 a month, the rest sits as *deferred revenue* (a liability); why "billings"
  and "ARR" appear in TMT decks; *example_q*: "A software company collects £120m of annual
  subscriptions in January. What is on the income statement in Q1?" → £30m revenue, £90m deferred.
  **Healthcare:** "R&D is expensed, not capitalised" — a biotech spending £80m on trials shows a
  loss although it is building its most valuable asset; why EBIT understates value; *example_q*:
  "Why can a biotech have negative EBIT and a £2bn valuation?" → future cash flows from the pipeline
  are not on the IS; R&D is expensed under IFRS unless development criteria are met.
- **(j) Ladder:** "Is EBITDA a good proxy for cash?" → "When does it mislead?" (capex-heavy, high
  working-capital businesses) → "Give me an industry where EBITDA is almost meaningless" (banks,
  leasing companies).
- Sources: WSP EBITDA guides; M&I; CFI income-statement primer.

## Lesson 3 — `balance-sheet` · "Balance sheet: what you own, what you owe"
- **(a)** "Why does the balance sheet balance?" / "What is on each side?" `sa-core`.
- **(b)** Base year: assets 450 = liabilities 180 (payables 30 + debt 150) + equity 270.
- **(c) Trap:** "**Equity is the cash the shareholders could take out.**" No — equity is a residual
  accounting claim, not a pile of cash; Kestrel's equity is £270m but its cash is £60m.
- **(d) Canonical:** *The balance sheet lists what the company owns — assets, from cash and
  receivables through to property and intangibles — against how those assets were funded:
  liabilities such as payables and debt, and shareholders' equity. It balances by construction:
  every asset was paid for with either someone else's money or the owners'. Equity is the residual,
  so anything that changes assets or liabilities without an offset changes equity, usually through
  retained earnings.* (72 words)
- **(e) Predict:** "Kestrel raises £100m of debt. Which side of the balance sheet grows?" Assets
  only / Liabilities only / Both / Neither → **Both** (cash +100, debt +100).
- **(f) Widget (`three_statement`, preset `bs-focus`):** "Raise £100m debt — see both sides grow by
  100." · "Pay a £20m dividend — which side shrinks, and which line?"
- **(g) Your turn:** Assets: cash 80, receivables 70, inventory 50, PP&E 400. Liabilities: payables
  60, debt 240. Compute equity and explain what it represents. Rubric: total assets 600 · liabilities
  300 · equity 300 · residual claim · not cash.
- **(h) Quick-fire:** "Current vs non-current cut-off?" → one year · "Retained earnings = ?" →
  cumulative net income less dividends · "Is goodwill an asset?" → yes, intangible, from acquisitions
  · "Debt raised — which lines move?" → cash and debt.
- **(i) Lens — TMT:** "Capitalised development costs" — software built for sale can be capitalised
  as an intangible under IFRS once technical feasibility is shown; higher assets and EBITDA today,
  amortisation later; *example_q*: "Two software companies, one capitalises development and one
  expenses it. Which has higher EBITDA and is it 'better'?" → capitaliser, no — same cash.
  **Healthcare:** "Inventory and gross margin in pharma" — high gross margins (80 %+) because
  the cost of a pill is tiny; the value is in the IP, which is *not* on the balance sheet unless
  bought; *example_q*: "Why does an acquired pharma show large intangibles while an organic one shows
  none?" → purchase accounting recognises what internal R&D could not.
- **(j) Ladder:** "Can equity be negative?" → "Is that always bad?" (buy-back-heavy companies) →
  "What does negative equity do to enterprise value?" (nothing directly — bridge lesson).
- Sources: WSP balance-sheet primer; M&I; WSO "real technical questions" (negative equity).

## Lesson 4 — `cash-flow-statement` · "Cash flow: from net income to cash"
- **(a)** "Walk me through the cash-flow statement" / "Why start from net income?" `sa-core`.
- **(b)** Base year: NI 67.5 + D&A 20 − ΔNWC 10 (receivables +5, inventory +10, payables +5) = CFO
  77.5; capex −30 → CFI −30; dividends −20 → CFF −20; Δcash +27.5.
- **(c) Trap:** "**An increase in inventory is a source of cash because inventory is an asset.**"
  Backwards — buying inventory *uses* cash; an increase in an operating asset is an outflow.
- **(d) Canonical:** *Operating cash flow starts from net income, adds back non-cash charges such as
  depreciation, and adjusts for working capital: increases in receivables or inventory use cash,
  increases in payables free it. Investing is mainly capital expenditure and acquisitions; financing
  is debt raised or repaid, dividends and buy-backs. The three sum to the change in cash, which
  reconciles to the balance sheet. It answers the question the income statement cannot: where did the
  cash go?* (76 words)
- **(e) Predict:** "Kestrel's receivables rise by £5m. Cash flow from operations…" Rises 5 / Falls 5
  / Unchanged → **Falls 5**.
- **(f) Widget (`three_statement`, preset `cfs-focus`):** "Set capex to £80m — CFO does not move,
  but cash does. Why?" · "Increase payables by £15m — a *liability* rising helps cash."
- **(g) Your turn:** NI 120, D&A 60, receivables +15, inventory −5, payables +10, capex 90, debt
  repaid 30, dividends 25. Compute CFO, CFI, CFF, Δcash. Rubric: CFO 180 · CFI −90 · CFF −55 ·
  Δcash +35 · sign logic explained for each working-capital line.
- **(h) Quick-fire:** "Depreciation on the CFS?" → added back in CFO · "Capex sign?" → negative,
  investing · "Buy-back section?" → financing · "ΔNWC up means cash…" → down.
- **(i) Lens — TMT:** "Deferred revenue is a cash engine" — upfront subscriptions show as CFO
  before revenue; growth *raises* CFO; the reverse when growth slows; *example_q*: "Why can a SaaS
  company have negative net income and positive operating cash flow?" **Healthcare:** "Milestone
  receipts" — a lumpy £50m licensing milestone is CFO and revenue in one quarter; interviewers ask
  you to normalise it; *example_q*: "How would you treat a one-off milestone when forecasting cash?"
- **(j) Ladder:** "Why not a direct-method CFS?" → "What is free cash flow?" (CFO − capex) →
  "Levered or unlevered — which is that?" (levered; leads into DCF).
- Sources: WSP cash-flow guides; M&I; CFI.

## Lesson 5 — `three-statement-links` (exists, approved) · v2 additions only
Keep the current body. Add: (1) a `predict` gate before the widget: "D&A rises £10m at 25 % tax.
Cash…" Falls 10 / Falls 7.5 / Rises 2.5 / Unchanged → **Rises 2.5**; (2) a real `three_statement`
widget block with props `{ preset: "da-up-10", tax: 0.25 }` replacing the placeholder; (3) a
`fill_numbers` block blanking the tax saving and the cash line; (4) two lens blocks — TMT
"Deferred revenue through the statements" (customer prepays £12m: cash +12, deferred revenue +12,
nothing on the IS yet; then £1m a month unwinds), Healthcare "R&D through the statements" (£30m of
trial spend: IS −30 pre-tax, −22.5 post-tax; CFS −22.5; no asset). Lens questions: two, listed below.
Depth `sa-core`. Follow-up ladder already implicit: single-step → PIK → asset sale (lessons 7–8).

## Lesson 6 — `working-capital` · "Working capital and the cash conversion cycle"
- **(a)** "What is working capital and why does an increase use cash?" `sa-core`; CCC maths `sa-stretch`.
- **(b)** Kestrel: receivables 50, inventory 40, payables 30 → NWC 60. DSO = 50/500 × 365 = 36.5 d;
  DIO = 40/300 × 365 = 48.7 d; DPO = 30/300 × 365 = 36.5 d; CCC = 48.7 d.
- **(c) Trap:** "**More working capital is good — it means the company is bigger.**" Growth in NWC
  is cash *tied up*; a supermarket with negative working capital is funded by its suppliers.
- **(d) Canonical:** *Operating working capital is current operating assets — receivables and
  inventory — less current operating liabilities such as payables; cash and debt are excluded. When
  it increases, the company has sold on credit or stocked up faster than it has been paid, so cash is
  tied up and operating cash flow falls below net income. When it decreases, cash is released. The cash
  conversion cycle expresses the same idea in days.* (73 words)
- **(e) Predict:** "Kestrel negotiates 30 more days to pay suppliers. Cash…" Rises / Falls /
  Unchanged → **Rises** (payables up, one-off cash release).
- **(f) Widget (`cash_cycle`):** "Drag DPO past DIO + DSO — the cycle goes negative; who is funding
  Kestrel now?" · "Double revenue with the same days — how much extra cash is tied up?"
- **(g) Your turn:** Revenue 730, COGS 365, receivables 80, inventory 60, payables 50. Compute DSO,
  DIO, DPO, CCC and the cash freed if DSO drops to 30 days. Rubric: 40 / 60 / 50 / 50 days · cash
  freed = (80 − 60) = £20m · explains sign.
- **(h) Quick-fire:** "Is cash in NWC?" → no (operating definition) · "Payables up → cash?" → up ·
  "CCC formula?" → DIO + DSO − DPO · "Negative CCC example?" → supermarket, Amazon-style retailer.
- **(i) Lens — TMT:** "Negative working capital as a feature" — subscription businesses collect
  first; deferred revenue counts as an operating liability; *example_q*: "Should deferred revenue be
  in working capital when you value a SaaS company?" → yes, operating, and it grows with bookings.
  **Healthcare:** "Long receivables" — hospital and pharma receivables from public payers can run
  90+ days; *example_q*: "Why might a healthcare services company be profitable but cash-starved?"
- **(j) Ladder:** "How does working capital enter a DCF?" → "Why do we forecast it as days rather
  than pounds?" → "What happens to NWC in a recession?" (releases as sales fall — perverse cash boost).
- Sources: WSP working-capital articles; CFI CCC; M&I.

## Lesson 7 — `single-step-walkthroughs` · "One change, three statements" (walkthrough)
- **(a)** "Depreciation goes up by £10m — walk me through the statements" and four siblings. `sa-core`.
- **(b) Scenario deltas (tax 25 %, signs from Kestrel's view):**
  1. *D&A +10:* IS: EBIT −10, tax −2.5, NI −7.5. CFS: NI −7.5, D&A +10, CFO +2.5, Δcash +2.5. BS:
     cash +2.5, PP&E −10, assets −7.5; retained earnings −7.5. Check: −7.5 = −7.5.
  2. *Inventory £20m bought on credit:* IS: nothing. CFS: inventory −20, payables +20, CFO 0. BS:
     inventory +20, payables +20. Check: 20 = 20.
  3. *Raise £100m debt at 5 % (year-end, no interest yet):* IS: nothing. CFS: CFF +100, cash +100.
     BS: cash +100, debt +100. (Follow-up: a full year later — interest 5, tax 1.25, NI −3.75, cash −3.75.)
  4. *Buy £40m PP&E with debt:* IS: nothing on day one. CFS: capex −40, debt +40, Δcash 0. BS:
     PP&E +40, debt +40.
  5. *Pay a £20m dividend:* IS: nothing. CFS: CFF −20. BS: cash −20, retained earnings −20.
- **(c) Trap:** "**Depreciation up £10m means cash down £10m.**" It is non-cash; cash *rises* by the
  tax saved.
- **(d) Canonical:** *With depreciation up £10m at 25 % tax, operating profit falls £10m, tax falls
  £2.5m and net income falls £7.5m. On the cash-flow statement net income is down £7.5m but
  depreciation is added back, so operating cash flow rises £2.5m. On the balance sheet cash is up
  £2.5m and PP&E down £10m, so assets fall £7.5m; retained earnings fall £7.5m and it balances.* (70 words)
- **(e) Predict:** "Inventory bought on credit: what changes on the income statement?" Revenue /
  COGS / Nothing / Net income → **Nothing**.
- **(f) Widget (`three_statement`, presets for all five; `faded_walk` beneath):** "Run D&A +10 at
  0 % tax — why is cash now flat?" · "Switch to 'buy PP&E with debt' — three lines move and cash
  does not; say which." · "Fade level 3 — fill the six blanks without looking."
- **(g) Your turn:** Kestrel writes off £30m of inventory (tax 25 %). Rubric: IS −30 / −22.5 · CFS
  +30 add-back, CFO +7.5 · BS inventory −30, cash +7.5, RE −22.5 · balance check stated.
- **(h) Quick-fire:** "Order of the walk?" → IS → CFS → BS · "Tax effect of a £10m non-cash charge
  at 25 %?" → £2.5m saved · "Dividend on the IS?" → no · "Debt raised — NI?" → unchanged on day one.
- **(i) Lens — TMT:** "SBC +£10m" — non-cash like D&A but it dilutes: IS −10 / NI −7.5, add-back
  on CFS, cash +2.5, share count up; *example_q*: "Is stock-based compensation a real cost?" → yes,
  paid in shares rather than cash. **Healthcare:** "£30m trial spend" — expensed, cash out, no
  asset; contrast with capex; *example_q*: "Walk me through £30m of R&D versus £30m of capex."
- **(j) Ladder:** D&A +10 → "and at 0 % tax?" → "and if it is amortisation of an acquired
  intangible that is not tax-deductible?" (NI −10, cash 0) → "now the asset is sold" (lesson 8).
- Sources: WSP "depreciation +10"; M&I; WSO London guide; financefluency walkthrough structure.

## Lesson 8 — `multi-step-walkthroughs` · "Harder walks and why profits aren't cash" (walkthrough)
- **(a)** "PIK interest / asset sale at a gain / deferred revenue — walk me through" (`sa-stretch`);
  "Why can a profitable company go bankrupt?" (`sa-core`).
- **(b) Scenario deltas (25 % tax):**
  1. *£10m PIK interest accrues:* IS: interest −10, tax −2.5, NI −7.5. CFS: NI −7.5, PIK add-back
     +10, CFO +2.5. BS: cash +2.5, debt +10; RE −7.5. Check: +2.5 = +10 − 7.5.
  2. *Sell PP&E with book value £40m for £50m:* IS: gain +10, tax −2.5, NI +7.5. CFS: NI +7.5, gain
     −10 (CFO −2.5), proceeds +50 (CFI), Δcash +47.5. BS: cash +47.5, PP&E −40; RE +7.5. Check: 7.5 = 7.5.
  3. *Customer prepays £12m for a year:* day one — CFS: deferred revenue +12, CFO +12; BS: cash +12,
     deferred revenue +12; IS nothing. Month one: revenue +1, tax −0.25, NI +0.75; deferred revenue −1.
  4. *Profitable but bust:* Kestrel earns £67.5m but capex jumps to £150m and a £120m loan matures —
     cash 60 + 77.5 − 150 − 120 < 0. Narrative, then the numbers in the widget.
- **(c) Trap:** "**A gain on sale increases operating cash flow.**" No — the *proceeds* are
  investing cash; the gain is removed from CFO so it is not counted twice.
- **(d) Canonical (profitable but bust):** *Profit is an accounting measure; bankruptcy is about
  cash. A company can report net income yet run out of cash if its profits are tied up in
  receivables and inventory, if it is spending heavily on capex, or if debt falls due faster than it
  can refinance. The cash-flow statement, not the income statement, shows whether it can pay its
  bills — which is why lenders focus on cash flow and liquidity.* (71 words)
- **(e) Predict:** "Kestrel sells an asset for £50m, book value £40m. Operating cash flow…" Rises 10
  / Rises 7.5 / Falls 2.5 / Unchanged → **Falls 2.5**.
- **(f) Widget (`three_statement` presets `pik`, `asset-sale`, `deferred-rev`, `cash-crunch`):**
  "Run PIK — debt rises while cash rises. Why is that not a contradiction?" · "In cash-crunch, drag
  the loan maturity from £120m to £40m — when does the cash line turn positive?"
- **(g) Your turn:** Sell an asset with book value £25m for £15m (loss), tax 25 %. Rubric: IS loss
  −10, NI −7.5 · CFS loss added back +10, CFO +2.5, CFI +15 · Δcash +17.5 · BS cash +17.5, PP&E −25,
  RE −7.5 · check.
- **(h) Quick-fire:** "PIK interest — cash?" → none, added back · "Gain on sale in CFO?" → deducted ·
  "Deferred revenue — asset or liability?" → liability · "Bankrupt but profitable — first place to
  look?" → the CFS and debt maturities.
- **(i) Lens — TMT:** "Deferred revenue at scale" — a company with £400m of deferred revenue and
  falling bookings: CFO falls before revenue does; *example_q*: "What early-warning sign does deferred
  revenue give?" **Healthcare:** "Milestone accounting" — £50m milestone recognised when the
  trial hits its endpoint; *example_q*: "Walk me through a £50m milestone received in cash."
- **(j) Ladder:** "PIK — is it in EBITDA?" (no, below) → "Does it affect EV?" (debt rises → yes) →
  "So what does the leverage ratio do?" (rises each year without any cash leaving).
- Sources: WSO "real technical questions" (PIK, asset sale); M&I; WSP.

---

## Question table (40 = 30 core + 6 stretch + 4 lens)
Depth column → the tag written to `questions.tags`: `core` = `depth:sa-core`, `stretch` = `depth:sa-stretch`; lens rows additionally carry `lens:tmt` or `lens:healthcare`. `depth:ft-only` items are never written as questions — they are named in the cheat sheet's "you may hear" box.
Difficulty 1 definition · 2 why · 3 second-order · 4 numerical/edge. Every question carries 3–6
key points, a `weak_answer_note` and 2–3 follow-ups; two follow-ups are shown.

| # | slug | kind | diff | depth | format | model-answer gist | follow-ups |
|---|---|---|---|---|---|---|---|
| 1 | walk-me-through-the-three-statements | concept | 1 | sa-core | verbal | IS period, BS snapshot, CFS reconciles; NI and cash link them | Which matters most? · What is missing from all three? |
| 2 | most-important-statement | concept | 2 | sa-core | verbal | CFS — cash pays debt; IS can be managed; caveat | Why not the IS? · When would you say BS? |
| 3 | why-balance-sheet-balances | concept | 2 | sa-core | verbal | every asset funded by liability or equity; equity residual | Can equity be negative? · Effect of a loss? |
| 4 | ebit-vs-ebitda | concept | 1 | sa-core | verbal | D&A the difference; EBITDA proxy for cash before capex | Which is better for capex-heavy cos? · Is SBC in EBITDA? |
| 5 | is-revenue-cash | concept | 2 | sa-core | verbal | accrual recognition; receivables bridge | Where does the gap sit? · Why does it matter for valuation? |
| 6 | net-income-vs-cash | concept | 2 | sa-core | verbal | non-cash charges, NWC, capex, financing | Give three reasons cash < NI · reverse case |
| 7 | equity-vs-cash | concept | 2 | sa-core | verbal | equity is residual claim, not cash | Kestrel numbers · buy-back effect |
| 8 | why-cfs-starts-with-net-income | concept | 2 | sa-core | verbal | indirect method; adjust accruals | Direct method? · What if NI is negative? |
| 9 | depreciation-on-cfs | concept | 1 | sa-core | verbal | added back in CFO — non-cash | Amortisation too? · Impairment? |
| 10 | increase-in-receivables-cash | concept | 2 | sa-core | verbal | uses cash; sold on credit | Payables? · Inventory? |
| 11 | what-is-working-capital | concept | 1 | sa-core | verbal | operating CA − operating CL; cash/debt excluded | Why exclude cash? · Negative NWC? |
| 12 | why-nwc-increase-uses-cash | concept | 2 | sa-core | verbal | cash tied up in stock/receivables | Recession effect? · Growth effect? |
| 13 | negative-working-capital-good-or-bad | concept | 3 | sa-core | verbal | supplier-funded; risk if sales fall | Which industries? · Effect on DCF? |
| 14 | cash-conversion-cycle-compute | calculation | 4 | sa-stretch | fill | DSO 36.5, DIO 48.7, DPO 36.5, CCC 48.7 (numbers) | Halve DSO — cash freed? · Why days not £? |
| 15 | da-up-10-walkthrough | calculation | 3 | sa-core | verbal | −10/−2.5/−7.5; +2.5 cash; PP&E −10, RE −7.5 (numbers) | 0 % tax? · Non-deductible amortisation? |
| 16 | da-up-10-fill-the-blanks | calculation | 3 | sa-core | fill | same walk with blanks | Balance check · which line closes the loop? |
| 17 | inventory-bought-on-credit | calculation | 2 | sa-core | verbal | IS nothing; inventory +20, payables +20 | Now sold for £30m? · Paid the supplier? |
| 18 | raise-100m-debt-day-one | calculation | 2 | sa-core | verbal | cash +100, debt +100; IS nothing | After a year at 5 %? · Effect on EV? |
| 19 | raise-debt-after-one-year | calculation | 3 | sa-core | fill | interest 5, tax 1.25, NI −3.75, cash +96.25 (numbers) | Repay £50m? · Leverage ratio? |
| 20 | buy-ppe-with-debt | calculation | 2 | sa-core | verbal | PP&E +40, debt +40, cash flat | Year one depreciation? · Cash vs debt funding? |
| 21 | pay-dividend-20m | calculation | 2 | sa-core | verbal | cash −20, RE −20; IS nothing | Buy-back instead? · Effect on equity value? |
| 22 | inventory-write-off-30m | calculation | 3 | sa-core | verbal | −30/−22.5; add-back; cash +7.5; inv −30 (numbers) | If not tax-deductible? · Reverse later? |
| 23 | order-the-walk-steps | calculation | 2 | sa-core | order | IS → tax → NI → CFS add-back → Δcash → BS both sides → check | Why this order? · Where do most people slip? |
| 24 | spot-the-error-da-walk | calculation | 3 | sa-core | spot | a walk where cash falls £10m — find the line | What should it be? · Explain the tax shield |
| 25 | profitable-company-bankrupt | concept | 3 | sa-core | verbal | NWC, capex, maturities; cash not profit | Early warning? · Which ratio? |
| 26 | asset-sale-at-gain | calculation | 3 | sa-stretch | verbal | gain +10 → NI +7.5; CFO −2.5, CFI +50; PP&E −40 (numbers) | At a loss? · Why remove the gain? |
| 27 | pik-interest-walkthrough | calculation | 3 | sa-stretch | verbal | NI −7.5; add back 10; cash +2.5; debt +10 (numbers) | Leverage over time? · In EBITDA? |
| 28 | deferred-revenue-prepayment | calculation | 3 | sa-stretch | verbal | cash +12, DR +12; unwinds monthly | Asset or liability? · Effect on EV bridge? |
| 29 | capex-vs-opex-treatment | concept | 2 | sa-core | verbal | capitalise vs expense; timing of hit to profit | Which flatters EBITDA? · Cash difference? |
| 30 | goodwill-what-is-it | concept | 2 | sa-core | verbal | premium over fair value of net assets; not amortised, impaired | Impairment effects? · Why not amortise? |
| 31 | impairment-walkthrough | calculation | 3 | sa-stretch | verbal | non-cash, often non-deductible: NI −X, cash 0 | Deductible case? · Covenant effect? |
| 32 | sbc-real-cost | concept | 3 | sa-core | verbal | non-cash but dilutive; add-back debate | Include in FCF? · Effect on share count? |
| 33 | retained-earnings-definition | concept | 1 | sa-core | verbal | cumulative NI − dividends | Negative RE? · Link to NI? |
| 34 | cash-flow-sections | concept | 1 | sa-core | verbal | operating, investing, financing; examples | Interest paid — which? · Leases? |
| 35 | free-cash-flow-simple | concept | 2 | sa-core | verbal | CFO − capex; levered | Unlevered version? · Why capex not D&A? |
| 36 | why-ebitda-misleads | concept | 3 | sa-stretch | verbal | ignores capex, NWC, leases, SBC | Industry example · Fix it how? |
| L1 | lens-tmt-deferred-revenue-walk | calculation | 3 | sa-core | verbal | `lens:tmt` — £12m prepayment through the statements | Bookings vs revenue? · Slowing growth? |
| L2 | lens-tmt-capitalised-dev-costs | concept | 3 | sa-core | verbal | `lens:tmt` — capitalise vs expense, EBITDA effect, same cash | Which would you normalise? · Amortisation later? |
| L3 | lens-healthcare-rd-expensed | concept | 2 | sa-core | verbal | `lens:healthcare` — R&D expensed; loss with value | IFRS development criteria? · Acquired IPR&D? |
| L4 | lens-healthcare-milestone-cash | calculation | 3 | sa-core | verbal | `lens:healthcare` — £50m milestone: revenue, tax, cash, normalise | Recurring? · Effect on multiples? |

Mix: difficulty 1 ×6 (15 %) · 2 ×14 (35 %) · 3 ×17 (43 %) · 4 ×1 — heavier on 2/3 than the 25/30/30/15
target because accounting is walkthrough-dominated; the loop may promote two of #15/#22/#26 to
difficulty 4 by adding numbers to meet the ±15 % band. Formats: fill ×3, order ×1, spot ×1.

---

## Cheat sheet — `content/cheatsheets/accounting.json`
- **Formulas:** $\text{EBITDA} = \text{EBIT} + \text{D\&A}$ · $\text{NI} = (\text{EBIT} - \text{Interest})(1 - t)$ ·
  $\text{Assets} = \text{Liabilities} + \text{Equity}$ · $\text{CFO} = \text{NI} + \text{non-cash} - \Delta\text{NWC}$ ·
  $\text{FCF} = \text{CFO} - \text{Capex}$ · $\text{NWC} = \text{Receivables} + \text{Inventory} - \text{Payables}$ ·
  $\text{DSO} = \frac{\text{Receivables}}{\text{Revenue}} \times 365$, $\text{DIO} = \frac{\text{Inventory}}{\text{COGS}} \times 365$,
  $\text{DPO} = \frac{\text{Payables}}{\text{COGS}} \times 365$, $\text{CCC} = \text{DIO} + \text{DSO} - \text{DPO}$ ·
  tax shield of a non-cash charge $= \text{charge} \times t$.
- **Canonical Qs:** the five canonical answers above (lessons 1, 4, 6, 7, 8).
- **Traps:** revenue ≠ cash · balance sheet is a snapshot · equity ≠ cash · inventory up = cash down
  · D&A up = cash *up* by the tax shield · gain on sale is removed from CFO · dividends never touch the IS.
- **One-liners:** "Walk IS → CFS → BS and check that assets − liabilities − equity = 0." · "Non-cash
  charges cost profit and save tax." · "Working capital up, cash down." · "Profit is an opinion,
  cash is a fact."
- **You may hear (ft-only, name only):** deferred tax assets and liabilities from book-vs-tax
  depreciation · IFRS 16 lease capitalisation mechanics · NOL carry-forwards · pension deficits ·
  LIFO/FIFO (US) · direct-method cash-flow statement.
- **Template `three_statement_grid`:** three columns (IS / CFS / BS), eight rows each, blank Δ cells
  and a balance-check line; props `{ tax: 0.25, rows: "standard" }`.
