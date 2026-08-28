# Chapter 12 — Finance foundations: content spec

_Written 2026-08-28 for Loop 12 (`docs/loops/12-technicals-foundations.md`). Topic slug
`finance-foundations`. Reader: UK second-year with one finance module. Company for the whole chapter:
**Ashdown Bakeries Ltd** — a private bakery chain with 12 shops, so every number stays in single-digit £m.
Structure follows `00-syllabus.md` § 2 (depth tags) and `01-interactive-teaching.md` § 2 (lesson shape).
All prose here is original; sources are structural references only._

## Why this chapter exists
Foundations are never asked as a chapter — nobody says "explain the time value of money". They are
asked *inside* every later question: "why discount?", "what does WACC represent?", "why is a company
worth more when rates fall?". Three lessons, deliberately short, so the student meets the five ideas
(discounting, risk → rate, NPV, IRR, blended cost of capital) once with numbers and then reuses them
in DCF (Loop 16) and LBO (Loop 18). Subtopics `discount-rates-and-risk` and `irr-and-payback` are
**deferred** (folded into lessons 1 and 2); their slugs stay in `taxonomy.ts`.

## Lessons

### L1 `time-value-of-money` — "Why is £1 today worth more than £1 next year?"
- **(a) Interview question / depth:** "What is the time value of money and why do we discount?"
  and "What does a discount rate represent?" — `sa-core`. Foundation for the DCF walk-through.
- **(b) Worked numbers.** Ashdown expects a supplier rebate of **£1.0m in three years**. Rates on
  offer: a risk-free UK gilt at 4 %; Ashdown's own bank loan at 8 %. Steps: PV at 4 % =
  1.0 / 1.04³ = **£0.889m**; PV at 8 % = 1.0 / 1.08³ = **£0.794m**; the gap (£0.095m) is the price
  of Ashdown's risk. Mid-year variant: discount 2.5 years at 8 % → 1.0 / 1.08^2.5 = **£0.825m**.
- **(c) Trap.** "**Discounting is about inflation.**" Inflation is one reason, but the discount
  rate mostly pays for *waiting* (opportunity cost) and *uncertainty* (risk). A zero-inflation world
  still discounts — you could have invested the £1 elsewhere.
- **(d) Canonical answer (≈75 words).** Money today is worth more than the same amount later because
  it can be invested now, and because a future payment might not arrive. The discount rate converts
  the two: it is the return an investor could earn elsewhere on something of similar risk. Riskier
  cash flows get a higher rate and a lower present value. For Ashdown, £1m in three years is worth
  about £0.79m today at 8 %, but £0.89m at the 4 % gilt rate.
- **(e) Predict gate.** "Ashdown's rebate is pushed from year 3 to year 5. Its present value at 8 %
  … " options: *falls by less than 10 %* / *falls by more than 10 %* (**correct** — 0.794 → 0.681,
  −14 %) / *unchanged*. Explain: each extra year divides by 1.08 again; the effect compounds.
- **(f) Widget prompts — `discount_dial`.** (1) "Drag r from 4 % to 12 %. Which bar shrinks most —
  year 1 or year 8?" (2) "Set r = 8 % and switch on mid-year. Every bar grows a little — why the
  same proportion?" (3) "Find the rate at which year-10 cash is worth less than half its face value."
- **(g) Your turn.** A landlord offers Ashdown either £0.5m of rent-free months now or £0.6m in two
  years. At 8 %, which is better? Model answer: 0.6 / 1.08² = £0.514m > £0.5m → take the deferred
  offer, narrowly; at 10 % it flips (£0.496m). Rubric: discounts to today rather than comparing face
  values · uses the right exponent (2) · states the decision · notes it is rate-sensitive · mentions
  the risk that the landlord doesn't pay.
- **(h) Quick-fire.** Q: Higher discount rate — PV up or down? A: Down. Q: Two cash flows, same size,
  one in year 2 one in year 6 — which is worth more? A: Year 2. Q: What two things does a discount
  rate pay for? A: Waiting (opportunity cost) and risk. Q: Mid-year convention — does it raise or
  lower value? A: Raises it (cash arrives sooner on average).
- **(i) Lens variants.**
  - *TMT — "Growth companies are long-duration assets."* A loss-making software company earns most
    of its value from cash flows ten years out; a profitable telecoms operator earns it from the
    next five. The same 1-point rise in rates therefore cuts the software company's value far more,
    which is why growth stocks fell hardest when rates rose in 2022. Example_q: "Why did high-growth
    tech valuations fall more than telecoms when interest rates rose?" Answer outline: value = PV of
    cash flows; the further out, the more each extra point of r bites; growth companies are back-end
    loaded; link to `tmt` module.
  - *Healthcare — "Discount the probability first, then the time."* A drug in Phase 2 may pay £1bn in
    year 8 — but only if it reaches the market. Healthcare analysts multiply by a probability of
    success *before* discounting for time, so the rate itself stays sensible. Example_q: "Why don't
    biotech analysts just use a very high discount rate to reflect trial risk?" Answer outline: trial
    failure is a yes/no event, not a spread of outcomes; probability-weighting is more honest and
    keeps r comparable across companies; full rNPV in the `healthcare-biotech` module.
- **(j) Follow-up ladder.** "Why 8 % and not 4 % for Ashdown?" → "If rates rise 1 %, what happens to
  Ashdown's value?" → "Is discounting the same as inflation-adjusting?"
- Sources (structure): joinleland.com 20 technicals; wallstreetprep.com DCF interview questions;
  intervyo.co.uk DCF (mid-year convention); Khan Academy finance (PV sequencing).

### L2 `pv-npv` — "Should Ashdown open the thirteenth shop?"
- **(a) Interview question / depth:** "What is NPV and how do you use it?" `sa-core`; "What is IRR
  and how does it relate to NPV?" `sa-core`; payback period `sa-stretch` (named, one line).
- **(b) Worked numbers.** New shop costs **£2.0m** today and returns **£0.6m a year for five years**.
  At 8 %: PV of the five flows = 0.6 × [1 − 1.08⁻⁵] / 0.08 = 0.6 × 3.993 = **£2.396m**; NPV = 2.396
  − 2.0 = **+£0.396m** → open it. IRR: the rate that makes NPV zero ≈ **15.2 %** (found by trial:
  at 15 % NPV = +£0.011m; at 16 % NPV = −£0.036m). Payback = 2.0 / 0.6 = **3.3 years**.
- **(c) Trap.** "**IRR is the project's profit.**" IRR is a *rate*, not an amount; a 40 % IRR on £10k
  is worth less than 12 % on £5m, and IRR assumes each year's cash is reinvested at the IRR itself.
- **(d) Canonical answer (≈80 words).** NPV is the present value of a project's cash inflows minus
  the cost today; a positive NPV means the project earns more than the discount rate, so it creates
  value. IRR is the discount rate at which NPV is exactly zero — the project's own rate of return.
  Accept when IRR exceeds the cost of capital. Ashdown's shop has an NPV of about £0.4m at 8 % and
  an IRR around 15 %, so both rules say yes.
- **(e) Predict gate.** "Ashdown's cost of capital rises from 8 % to 15 %. The shop's NPV …" options:
  *stays positive* / *goes to roughly zero* (**correct** — IRR ≈ 15 %) / *becomes strongly negative*.
- **(f) Widget prompts — `discount_dial` (NPV mode) + rule-of-72 mini.** (1) "Slide r until the
  NPV bar touches zero — that rate is the IRR." (2) "Rule of 72: money doubling in 5 years ≈ 72/5 ≈
  14 % — check it against the dial." (3) "Halve the annual cash flow. Does IRR halve too?" (No —
  it falls to about −5 %; the relationship is not linear.)
- **(g) Your turn.** A delivery van costs £0.3m and saves £0.1m a year for four years. At 10 %, NPV?
  IRR roughly? Model: PV = 0.1 × 3.170 = £0.317m; NPV = +£0.017m; IRR ≈ 12.6 %. Rubric: annuity or
  year-by-year PV · subtracts the outlay · sign of decision · IRR bracketed between 10 % and 15 % ·
  notes NPV is small so sensitive to assumptions.
- **(h) Quick-fire.** Q: NPV > 0 means…? A: Return exceeds the discount rate. Q: IRR definition?
  A: Rate where NPV = 0. Q: Can NPV and IRR disagree? A: Yes — mutually exclusive projects of
  different size or timing. Q: Payback period ignores…? A: Time value and cash after payback.
- **(i) Lens variants.**
  - *TMT — "Negative for years, positive for decades."* A subscription start-up spends £5m a year
    acquiring customers who pay back over eight years. NPV can be strongly positive while three
    years of cash flow are negative — which is why "burn" alone tells you nothing. Example_q: "A SaaS
    company loses money every year; how can it have a positive NPV?" Outline: front-loaded costs,
    long-dated inflows, unit economics (CAC vs lifetime value) as the mini-NPV per customer.
  - *Healthcare — "Expected NPV, not NPV."* For a drug, multiply each year's cash flow by the chance
    the drug is still alive, then discount. Example_q: "A Phase 3 drug has a 60 % chance of approval
    and £2bn PV if approved, costing £0.5bn to finish — go ahead?" Outline: 0.6 × 2.0 − 0.5 = +£0.7bn
    expected NPV; the cost is spent regardless; decision is yes but the range is wide.
- **(j) Follow-up ladder.** "Which do you trust more, NPV or IRR?" → "Why can IRR mislead?" →
  "How would you decide between two shops with the same NPV?"
- Sources: wallstreetprep.com (NPV vs IRR), mergersandinquisitions.com interview questions, Brilliant-style
  predict-then-check structure (`01-interactive-teaching.md`).

### L3 `wacc-intro` — "What rate does Ashdown use, and why is it a blend?"
- **(a) Interview question / depth:** "What is WACC, conceptually?" `sa-core`; "Why is cost of debt
  lower than cost of equity?" `sa-core`; "Why not fund everything with debt?" `sa-core`. The full
  CAPM / relevering build is Loop 16 — here it is one worked blend.
- **(b) Worked numbers.** Ashdown is funded by **£4m of equity** and **£2m of bank debt**. Lenders
  charge **8 %**; the owners expect **14 %**; tax **25 %**. After-tax cost of debt = 8 % × (1 − 0.25)
  = **6 %**. Weights 4/6 and 2/6. WACC = (4/6 × 14 %) + (2/6 × 6 %) = 9.33 % + 2.0 % = **11.3 %**.
  Now Ashdown's new-shop NPV at 11.3 %: PV = 0.6 × 3.664 = £2.198m → NPV **+£0.198m**; still yes,
  but half the cushion of L2.
- **(c) Trap.** "**Debt is cheaper, so more debt always lowers WACC.**" It does at first — interest is
  tax-deductible and lenders take less risk — but every extra pound of debt makes the remaining
  equity riskier, so the cost of equity rises; past a point lenders also demand more, and
  bankruptcy risk appears.
- **(d) Canonical answer (≈85 words).** WACC is the average return a company must earn to satisfy
  everyone who funds it, weighted by how much each group has put in. Equity is more expensive than
  debt because shareholders are paid last and bear more risk, while interest is contractual and tax-
  deductible. Ashdown's WACC is about 11 %: two-thirds equity at 14 % and one-third debt at 6 % after
  tax. We use it to discount cash flows that belong to all providers of capital — the unlevered cash
  flows of a DCF.
- **(e) Predict gate.** "Ashdown swaps £1m of equity for £1m of extra debt at the same 8 %. WACC
  …" options: *falls to about 10 %* (**correct** on these fixed inputs — 3/6 × 14 + 3/6 × 6 = 10 %) /
  *unchanged* / *rises*. Explain: it falls *because we held the cost of equity fixed*; in reality the
  14 % would creep up — the trap in action.
- **(f) Widget prompts — `discount_dial` WACC preset (v1: sliders for weights and costs feeding the
  dial; the full `wacc_builder` arrives in Loop 16).** (1) "Move debt from 0 % to 80 % of funding
  with costs fixed — watch WACC fall in a straight line. What is missing?" (2) "Set tax to 0 % — how
  much of the debt advantage disappears?" (3) "Find the equity cost that would make WACC 15 %."
- **(g) Your turn.** A rival, Hollins Pies, has £6m equity costing 12 %, £4m debt at 6 %, tax 25 %.
  WACC? Model: 0.6 × 12 % + 0.4 × 4.5 % = 7.2 % + 1.8 % = **9.0 %**. Rubric: after-tax debt cost ·
  market-value weights · arithmetic · says what WACC is used for · notes Hollins is cheaper to fund
  because less risky or more levered (asks which).
- **(h) Quick-fire.** Q: Why is cost of equity higher than debt? A: Shareholders are residual, riskier
  claims. Q: What does the (1 − t) do? A: Interest is tax-deductible, so debt's true cost is lower.
  Q: WACC discounts which cash flow? A: Unlevered free cash flow. Q: 100 % equity company — WACC =?
  A: Its cost of equity.
- **(i) Lens variants.**
  - *TMT — "Almost no debt, high cost of equity."* Young software companies are funded nearly
    entirely by equity because they have little collateral and volatile cash flows, so their WACC is
    close to their cost of equity — often 10–12 %. Mature telecoms carry heavy debt against stable
    cash flows, with WACCs nearer 6–7 %. Example_q: "Why does a telecoms company have a lower WACC
    than a software company?" Outline: leverage capacity, asset stability, tax shield, beta.
  - *Healthcare — "Where the risk should live."* A biotech with one drug has huge business risk, but
    much of it is specific to that drug rather than the market, so its CAPM cost of equity is not
    always as high as you'd guess; that is why analysts prefer probability-weighting cash flows to
    inflating the rate. Example_q: "Should a single-asset biotech have a 25 % cost of equity?"
    Outline: distinguish diversifiable trial risk from market risk; typical 10–14 % plus rNPV.
- **(j) Follow-up ladder.** "Why after-tax debt but not after-tax equity?" → "What happens to WACC as
  you add debt — draw it" → "What if the company has no debt at all?"
- Sources: wallstreetprep.com WACC questions; WSO "20 most frequently asked, London edition";
  mergersandinquisitions.com DCF section.

## Question list (12 = 8 core + 2 stretch + 2 lens)
Depth column → the tag written to `questions.tags`: `core` = `depth:sa-core`, `stretch` = `depth:sa-stretch`; lens rows additionally carry `lens:tmt` or `lens:healthcare`. `depth:ft-only` items are never written as questions — they are named in the cheat sheet's "you may hear" box.
| Slug | Kind | Diff | Depth | Format | Model-answer gist | Follow-ups |
|---|---|---|---|---|---|---|
| `why-discount-future-cash` | concept | 1 | sa-core | verbal | Waiting + risk; rate = return elsewhere at similar risk | Same as inflation? · Which cash flows get the highest rate? |
| `pv-of-one-million-in-three-years` | calculation | 2 | sa-core | fill | 1.0 / 1.08³ = £0.794m (numbers: cf 1.0, r 8 %, n 3) | At 4 %? · Pushed to year 5? |
| `what-does-discount-rate-represent` | concept | 2 | sa-core | verbal | Opportunity cost of capital at that risk; not inflation | Who sets it? · Higher for equity or debt? |
| `npv-rule-and-meaning` | concept | 2 | sa-core | verbal | PV(inflows) − outlay; > 0 beats the hurdle | Negative NPV but strategic? · Same NPV, different size? |
| `compute-npv-new-shop` | calculation | 3 | sa-core | fill | 0.6 × 3.993 − 2.0 = +£0.396m (numbers: cf 0.6, n 5, r 8 %, outlay 2.0) | At 11.3 %? · Cash flows fall 20 %? |
| `irr-definition-and-decision` | concept | 2 | sa-core | verbal | Rate where NPV = 0; accept if > cost of capital | Limits of IRR? · Two IRRs possible? |
| `why-cost-of-equity-exceeds-debt` | concept | 2 | sa-core | verbal | Residual claim, no contract, paid last; interest tax-deductible | Ever the reverse? · Where does preferred sit? |
| `compute-wacc-ashdown` | calculation | 3 | sa-core | fill | 4/6 × 14 % + 2/6 × 6 % = 11.3 % (numbers: E 4, D 2, ke 14, kd 8, t 25) | Tax 0 %? · Swap £1m equity for debt? |
| `why-not-all-debt` | concept | 3 | sa-stretch | verbal | Equity gets riskier, lenders re-price, distress costs; WACC U-shape | Where is the minimum? · Trade-off vs pecking order (name only) |
| `npv-vs-irr-conflict` | concept | 3 | sa-stretch | order | Scale and timing differences; reinvestment assumption; prefer NPV | Draw the NPV profiles · When would you still quote IRR? |
| `lens-tmt-rates-and-growth-valuations` | concept | 3 | sa-core | verbal (`lens:tmt`) | Back-end-loaded cash flows → higher duration → more rate-sensitive | Which sector is least sensitive? · Does this reverse when rates fall? |
| `lens-healthcare-probability-before-discount` | calculation | 3 | sa-core | fill (`lens:healthcare`) | 0.6 × 2.0 − 0.5 = +£0.7bn expected NPV | Probability 30 %? · Why not a 25 % rate instead? |

Difficulty mix: 1 × diff-1, 5 × diff-2, 6 × diff-3, 0 × diff-4 — acceptable for a foundations chapter
(no numerical-edge questions; the eval gates the mix only from n ≥ 40). `numbers` on all four `fill`
questions. `target_questions` in `taxonomy.ts`: time-value-of-money 4, pv-npv 4, wacc-intro 4,
deferred subtopics 0.

## Cheat sheet (`content/cheatsheets/finance-foundations.json`)
- **Formulas.** PV: $PV = \frac{CF}{(1+r)^n}$ (mid-year: exponent $n-0.5$) · Annuity PV:
  $CF \times \frac{1-(1+r)^{-n}}{r}$ · NPV: $\sum \frac{CF_t}{(1+r)^t} - I_0$ · IRR: the $r$ where
  $NPV = 0$ · Rule of 72: years to double $\approx 72 / r\%$ · WACC:
  $\frac{E}{D+E}k_e + \frac{D}{D+E}k_d(1-t)$.
- **Canonical Qs.** Why discount? · What is NPV? · What is IRR? · What is WACC? · Why is equity dearer
  than debt? · Why not 100 % debt? (the six answers from L1–L3).
- **Traps.** Discounting ≠ inflation · IRR is a rate not a profit · More debt does not always lower
  WACC · Payback ignores time value · Face values are never compared across years.
- **One-liners.** "A pound later is a pound discounted for waiting and worry." · "NPV says how much;
  IRR says how fast." · "WACC is what every funder together needs to be paid."
- **You may hear (ft-only).** Modified IRR · multiple-IRR projects · APV · real vs nominal rates ·
  continuous compounding.

## Widget spec — `discount_dial`
Props: `cashflows: number[]` (default Ashdown £0.6m × 5, or a single £1.0m at n = 3), `rate`
(0–20 %, step 0.5), `midYear: boolean`, `mode: "pv" | "npv"` (npv adds `outlay`), optional `wacc`
preset `{ E, D, ke, kd, t }` that computes `rate`. Output: one bar per year showing face value
(faint) and PV (solid), cumulative PV line, NPV readout in `aria-live`, IRR marker when NPV crosses
zero. Reduced motion: no bar transitions; a "step year" button reveals each PV with its arithmetic.
Maths from `src/lib/finance/discount.ts` (`pv`, `npv`, `irr`, `annuityFactor`, `midYearExponent`);
vitest pins 1.0 / 1.08³ = 0.7938, annuity(8 %, 5) = 3.9927, IRR(−2.0, 0.6 × 5) ≈ 0.1524.
