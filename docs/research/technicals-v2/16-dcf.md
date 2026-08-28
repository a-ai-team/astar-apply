# Chapter 16 — DCF: content spec

_Written 2026-08-28 for Loop 16 (`docs/loops/16-technicals-dcf.md`). Topic slug `dcf`. Reader: UK
second-year with one finance module. All prose here is original; sources are structural only._

## The one projection every lesson uses — Harbourline plc
Same company as `content/lessons/ev-bridge-basics.json`: share price **£4.20**, **250m** diluted shares
(equity value £1,050m), borrowings £500m, cash £120m, preferred £30m, NCI £25m, leases £45m, **EV £1,530m**.
UK logistics; FY0 revenue £1,200m, EBITDA margin 15 % (£180m), D&A 5 % of revenue, capex 5.5 % of
revenue, ΔNWC = 10 % of the revenue increase, tax 25 %. EV/EBITDA today = 1,530 / 180 = **8.5×**.

| £m | FY0 | FY1 | FY2 | FY3 | FY4 | FY5 |
|---|---|---|---|---|---|---|
| Revenue growth | — | 6 % | 6 % | 5 % | 5 % | 4 % |
| Revenue | 1,200.0 | 1,272.0 | 1,348.3 | 1,415.7 | 1,486.5 | 1,546.0 |
| EBITDA (15 %) | 180.0 | 190.8 | 202.2 | 212.4 | 223.0 | 231.9 |
| D&A (5 %) | 60.0 | 63.6 | 67.4 | 70.8 | 74.3 | 77.3 |
| EBIT | 120.0 | 127.2 | 134.8 | 141.6 | 148.7 | 154.6 |
| Tax on EBIT (25 %) | | 31.8 | 33.7 | 35.4 | 37.2 | 38.7 |
| NOPAT | | 95.4 | 101.1 | 106.2 | 111.5 | 115.9 |
| + D&A | | 63.6 | 67.4 | 70.8 | 74.3 | 77.3 |
| − Capex (5.5 %) | | 70.0 | 74.2 | 77.9 | 81.8 | 85.0 |
| − ΔNWC | | 7.2 | 7.6 | 6.7 | 7.1 | 5.9 |
| **UFCF** | | **81.8** | **86.7** | **92.4** | **96.9** | **102.3** |

**Discount rate.** Rf 4.0 %, β 1.0, ERP 6.0 % → Ke = 10.0 %. Kd 6.0 % pre-tax → 4.5 % after tax.
Weights at market values: E £1,050m; D £590m (borrowings 500 + leases 45 + preferred 30 treated as
debt-like) → E/V 64 %, D/V 36 % → **WACC = 0.64 × 10.0 + 0.36 × 4.5 = 8.0 %**.

**Discounting at 8 %** (end-year): DF 0.926, 0.857, 0.794, 0.735, 0.681 → PV of UFCF 75.7, 74.3,
73.3, 71.2, 69.6 = **£364.1m**.
**Terminal value, Gordon (g = 2 %):** 102.3 × 1.02 / (0.08 − 0.02) = **£1,739m**; PV = 1,739 × 0.681 = **£1,184m**.
**EV = 364 + 1,184 = £1,548m** (market says £1,530m — the DCF lands where the market is, which is the point).
TV share = 1,184 / 1,548 = **76 %**. Implied exit multiple = 1,739 / 231.9 = **7.5×** FY5 EBITDA.
**Exit-multiple method (8.5×):** TV = 8.5 × 231.9 = £1,971m; PV £1,342m; EV **£1,706m**; implied g =
(1,971 × 0.08 − 102.3) / (1,971 + 102.3) = **2.7 %**.
**Equity value (Gordon case):** 1,548 − 380 net debt − 30 − 25 − 45 = £1,068m → **£4.27 per share** vs £4.20 market.
**Sensitivity (EV, £m; Gordon):** WACC 9 % / g 1 % → 1,193; WACC 8 % / g 2 % → 1,548; WACC 7 % / g 3 % →
2,253. A 2× range from ±1 pt on each input.
**Mid-year convention:** every explicit-period DF × 1.08^0.5 ≈ 1.039 → PV of UFCF rises to £378m; EV ≈ £1,600m (+3–4 %).

---

## Lesson 1 — `dcf-overview` · "What a DCF is doing"
**(a)** "Walk me through a DCF." — `sa-core`. Also "Your DCF says £6.40 and the share is £4.20 — what's going on?" — `sa-stretch`.
**(b)** The table above, summarised: five years of UFCF (81.8 → 102.3), WACC 8 %, TV £1,739m, EV £1,548m, equity £1,068m, £4.27/share.
**(c)** Trap: **"A DCF tells you what the company is worth."** No — it tells you what the company is worth *if your assumptions are right*; the output is a range and the method's value is that it forces every assumption into the open.
**(d)** Canonical (≈ 80 words, 45 s): *A DCF values a business as the present value of the cash it will generate. Five steps: project unlevered free cash flow for five to ten years; work out a discount rate — the WACC — that reflects the risk of those cash flows; calculate a terminal value for everything after the projection, using a perpetuity growth rate or an exit multiple; discount the cash flows and the terminal value back to today and add them up to get enterprise value; then subtract net debt and other claims to get equity value and divide by diluted shares.*
**(e)** Predict: "Harbourline's five years of cash flow add up to £460m undiscounted. Roughly what share of the final EV do you expect them to be?" Options: ~80 % / ~50 % / ~25 % (**correct: ~25 %**). Explain: most of the value sits in the terminal value.
**(f)** Widget `tv_share` (preset Harbourline): "Drag projection years from 5 to 10 — does the TV share fall below 50 %?"; "Set g to 3 % — watch what happens to EV before you touch anything else."
**(g)** Your turn: "Kestrel Foods plc: UFCF £40m, £44m, £48m for three years, WACC 9 %, g 2 %, net debt £150m, 100m shares. Talk through the five steps and give a share price." Model: PVs 36.7 + 37.0 + 37.1 = 110.8; TV = 48 × 1.02 / 0.07 = 699.4, PV 540.1; EV 650.9; equity 500.9; **£5.01**. Rubric: names the five steps in order; discounts each year separately; TV uses year-4 cash flow (48 × 1.02); subtracts net debt before dividing; states it is a range.
**(h)** Quick-fire: Why "unlevered"? — cash to all capital providers, so it pairs with WACC and gives EV. · Why not project 30 years? — forecasts past ~5–10 years are noise; the TV handles it. · What does the DCF produce first, EV or equity? — EV. · Biggest weakness? — sensitivity to WACC and g.
**(i)** TMT lens — *Valuing growth you can't see yet*: a loss-making software company has negative UFCF for years 1–3 (sales and marketing ahead of revenue), so the explicit period is stretched to 8–10 years until margins mature and the TV share climbs above 85 %; the question becomes whether you believe the year-8 margin, not the year-2 loss. Example Q: "How would you DCF a company burning cash?" → longer explicit period, steady-state margin justified by peers, present the TV share honestly. Healthcare lens — *Cash flows that might never arrive*: a drug's cash flows are multiplied by its probability of reaching market (say 30 % at phase 2) *before* discounting, and the perpetuity is replaced by a decline after patent expiry; the DCF becomes an rNPV. Example Q: "Why can't you use a normal perpetuity for a single-drug biotech?" → revenue falls to generic levels after the cliff; there is no steady state.
**(j)** Ladder: walk-through → "which step is the value most sensitive to?" → "your DCF says £6.40, the market says £4.20 — three hypotheses (your growth or margin too high; your WACC too low; the market knows something) and how you'd test each (compare with consensus, comps' margins, peers' betas)".
Sources (structure): WSP DCF interview questions; M&I DCF guide; CFI DCF overview; Investopedia DCF.

## Lesson 2 — `unlevered-free-cash-flow`
**(a)** "How do you calculate unlevered free cash flow?" / "Why unlevered rather than levered?" — `sa-core`.
**(b)** FY1: EBIT 127.2 → tax 25 % → NOPAT 95.4; + D&A 63.6; − capex 70.0; − ΔNWC 7.2 = **81.8**. Show the same from net income for contrast: NI (after £30m interest) = (127.2 − 30) × 0.75 = 72.9; add back after-tax interest 22.5 → 95.4 — same NOPAT.
**(c)** Trap: **"Free cash flow is net income plus depreciation."** That ignores capex and working capital, and it starts after interest, so it is neither unlevered nor free.
**(d)** Canonical: *Unlevered free cash flow is the cash the operations generate for everyone who funds the business, before any interest. Start with EBIT, tax it at the full rate as if there were no debt, add back depreciation and other non-cash charges, subtract capital expenditure and the increase in net working capital. For Harbourline that is £127m of EBIT, £95m after tax, plus £64m of D&A, less £70m of capex and £7m of working capital — about £82m. It is unlevered so that it pairs with the WACC and gives enterprise value.*
**(e)** Predict: "Harbourline raises £200m of new debt. What happens to next year's UFCF?" up / down / **unchanged** (correct). Explain: interest is excluded by construction; the debt shows up in the discount rate and the bridge, not the cash flow.
**(f)** Widget `three_statement` (Loop 11, preset "capex +£10m"): "Push capex up £10m — UFCF falls by the full £10m; now push D&A up £10m — UFCF *rises* by £2.5m. Why?"
**(g)** Your turn: "EBIT £80m, tax 25 %, D&A £20m, capex £28m, receivables up £6m, payables up £2m, interest £12m. UFCF?" Model: 60 + 20 − 28 − 4 = **£48m**; interest ignored. Rubric: taxes EBIT not EBT; nets the two working-capital moves; ignores interest; states the answer is pre-financing.
**(h)** Quick-fire: Does share-based comp get added back? — arguably yes as non-cash, but it is a real cost; many analysts do not. · Levered FCF pairs with? — cost of equity → equity value. · Why tax EBIT at the statutory rate? — no debt means no interest shield; the shield lives in the WACC. · NWC rises £5m — cash effect? — minus £5m.
**(i)** TMT — *Deferred revenue is free money*: subscription businesses collect cash before recognising revenue, so growing deferred revenue is a working-capital *inflow* that lifts UFCF above NOPAT; capitalised development costs sit in capex, so compare capex-plus-R&D across peers. Example Q: "Why can a SaaS company's FCF exceed its profit?" Healthcare — *R&D is the capex*: pharma expenses R&D through the income statement, so UFCF already carries the investment; a DCF that also deducts big capex double counts. Example Q: "Where does a drug's development cost sit in a DCF?"
**(j)** Ladder: formula → "why EBIT not net income?" → "what if the company has £2bn of tax losses?" (lower cash tax for a few years — model it) → "is D&A a good proxy for maintenance capex?".
Sources: WSP UFCF; CFI FCF vs FCFF; M&I.

## Lesson 3 — `projections-and-assumptions`
**(a)** "How do you project the cash flows?" / "What would make you distrust a DCF?" — `sa-core`.
**(b)** Revenue 6/6/5/5/4 % → margins flat 15 % → D&A 5 %, capex 5.5 % (capex > D&A because the fleet is growing) → ΔNWC 10 % of Δrevenue. Sanity checks: FY5 revenue £1,546m implies 5.2 % CAGR vs UK logistics GDP-plus; capex/D&A 1.1×; FCF conversion (UFCF/EBITDA) 43–44 %.
**(c)** Trap: **"Just grow everything by 5 %."** Revenue, margins, capex and working capital are different decisions; a company cannot grow 8 % a year with capex below depreciation.
**(d)** Canonical: *Start with revenue — growth tied to the market, share and pricing, sense-checked against history and consensus. Then margins, which usually converge on the company's own history or peers. Depreciation and capex follow the asset base, with capex above depreciation while the business is growing. Working capital moves with revenue. Finally check the outputs: implied market share, capex against depreciation, cash conversion and the terminal growth rate all have to look like a real company.*
**(e)** Predict: "Harbourline grows 6 % but capex is set equal to D&A every year. Does the DCF value go up or down versus our base case?" **Up** (correct) / down / same. Explain: lower capex flatters cash flow — which is exactly why it is a red flag.
**(f)** Widget `dcf_sensitivity` (preset: revenue growth × EBITDA margin): "Set margin to 18 % — how much of the extra value is terminal?"; "Find the growth rate at which FY5 revenue exceeds £2bn — is that plausible for a UK logistics firm?"
**(g)** Your turn: "Kestrel Foods: revenue £500m, growth 4 %, EBITDA 12 %, D&A 4 % of revenue, capex 4.5 %, ΔNWC 8 % of Δrevenue, tax 25 %. Build FY1 UFCF." Model: revenue 520; EBITDA 62.4; D&A 20.8; EBIT 41.6; NOPAT 31.2; +20.8 −23.4 −1.6 = **£27.0m**. Rubric: each line derived from revenue; capex above D&A; ΔNWC on the *change*; states one sanity check.
**(h)** Quick-fire: Terminal-year capex vs D&A? — roughly equal (steady state). · Where do you get growth assumptions? — history, consensus, market reports, management guidance with a haircut. · Why five years? — enough to reach steady state, short enough to be credible. · Margin expanding forever? — no; cap at peer best-in-class.
**(i)** TMT — *When year 8 matters more than year 2*: for a company at 40 % growth and −10 % margins, project until growth and margin look like a mature software peer (Rule of 40 as the check), often 8–10 years. Example Q: "How long should your explicit period be for a high-growth company?" Healthcare — *Phase-by-phase*: revenue is built from patients × penetration × price per drug, weighted by probability of approval; the projection is a decision tree, not a growth rate. Example Q: "How do you project revenue for a phase-3 asset?"
**(j)** Ladder: how → "what sanity checks?" → "management's plan shows 12 % growth — do you use it?" (haircut; sell-side vs internal) → "which assumption would you defend hardest in front of a client?".
Sources: WSP DCF assumptions; M&I; Damodaran on growth and reinvestment (structure).

## Lesson 4 — `cost-of-equity-capm`
**(a)** "How do you calculate the cost of equity?" / "What is beta?" — `sa-core`. Un/relevering — `sa-stretch`.
**(b)** Ke = Rf + β × ERP = 4.0 % + 1.0 × 6.0 % = **10.0 %**. Stretch: three comps with levered betas 1.2 / 0.9 / 1.1 and D/E 0.6 / 0.3 / 0.5, tax 25 % → unlevered 0.83 / 0.73 / 0.80, median 0.80 → relevered at Harbourline's D/E (590/1,050 = 0.56): 0.80 × (1 + 0.75 × 0.56) = **1.14** → Ke 10.8 %.
**(c)** Trap: **"Beta measures how risky the company is."** It measures how the share moves *with the market* — undiversifiable risk only; a volatile share with no market correlation can have a low beta.
**(d)** Canonical: *Cost of equity is the return shareholders need to hold the shares, and we estimate it with CAPM: the risk-free rate plus beta times the equity risk premium. The risk-free rate is a long government bond yield, the premium is what equities have earned over that historically, and beta measures how much the share moves with the market — the only risk a diversified investor is paid for. For Harbourline: 4 % plus 1.0 times 6 % gives 10 %.*
**(e)** Predict: "Gilt yields rise from 4 % to 5 %. Harbourline's cost of equity…" **rises by about 1 point** (correct) / falls / unchanged. Explain: Rf feeds straight through; every valuation in the market drops together.
**(f)** Widget `wacc_builder` (Ke panel): "Set β to 1.5 — how much does Ke move per 0.1 of beta?"; stretch `beta_relever`: "Change one comp's D/E to 2.0 — why does its unlevered beta barely move the median?"
**(g)** Your turn: "Rf 3.5 %, ERP 5.5 %, β 1.3. Ke? A peer has β 0.7 — which company is riskier for a diversified investor and why?" Model: **10.65 %**; the 1.3 company, because its returns amplify market moves. Rubric: correct arithmetic; explains β as co-movement; mentions diversifiable risk is unpriced; names the inputs' sources.
**(h)** Quick-fire: Beta of the market? — 1. · Negative beta? — possible (gold miners historically); moves against the market. · Why unlever comps' betas? — to strip out their different debt levels before applying yours. · ERP typical range? — ~5–6 % for the UK/US.
**(i)** TMT — *Long-duration assets*: growth companies' cash flows sit far in the future, so a change in Rf hits their value hardest; betas above 1.2 are common, and for pre-profit companies peers' betas are the only estimate. Example Q: "Why did software valuations fall when rates rose in 2022?" Healthcare — *Trial risk isn't beta*: the chance a drug fails is company-specific and diversifiable, so it belongs in the cash-flow probabilities, not the discount rate; biotech betas are often below 1 despite huge share-price swings. Example Q: "Should a risky biotech have a high cost of equity?"
**(j)** Ladder: formula → "where does beta come from?" (regression; Bloomberg; comps) → "management says a breakthrough designation lowers their risk, so use a lower Ke — respond" → "unlever and relever this beta".
Sources: CFI CAPM; WSP beta; Investopedia beta; Damodaran ERP (structure).

## Lesson 5 — `wacc`
**(a)** "How do you calculate WACC?" / "Why is cost of debt lower than cost of equity, and why not fund everything with debt?" / "If the company is 100 % equity, what is WACC?" — `sa-core`.
**(b)** E £1,050m (64 %), D £590m (36 %); Ke 10 %; Kd 6 % × (1 − 0.25) = 4.5 %; WACC = 6.4 + 1.62 = **8.0 %**. 100 % equity → WACC = Ke = 10 % (with a lower, unlevered beta in practice).
**(c)** Trap: **"Debt is cheaper, so more debt always lowers WACC."** Only at first — as leverage rises the equity gets riskier (beta relevers up) and lenders charge more; past a point WACC turns up again and distress costs appear.
**(d)** Canonical: *WACC is the blended return all the company's capital providers require, weighted by market value. Multiply the cost of equity by the equity share, add the after-tax cost of debt times the debt share. Debt is cheaper because lenders are paid first and interest is tax-deductible, but adding debt makes the remaining equity riskier, so you cannot lower WACC indefinitely. Harbourline: 64 % of 10 % plus 36 % of 4.5 % gives 8 %.*
**(e)** Predict: "Harbourline swaps £300m of equity for debt. WACC…" falls / **falls a little then rises if it keeps going** (correct) / rises. Explain with the relevered beta.
**(f)** Widget `wacc_builder`: "Drag D/V from 0 to 80 % — find the minimum WACC"; "Set tax to 0 — what happens to the debt advantage?"; "Set Kd to 12 % (junk) — where is the minimum now?"
**(g)** Your turn: "Equity £800m, debt £200m, Ke 11 %, Kd 5 %, tax 25 %. WACC? What if the debt is at book value £150m but trades at £200m?" Model: 0.8 × 11 + 0.2 × 3.75 = **9.55 %**; use market value (£200m) — same answer here, and explain why market weights. Rubric: after-tax Kd; market weights; one sentence on why Kd < Ke; recognises the 100 % equity special case.
**(h)** Quick-fire: Which is higher, Kd or Ke? — Ke; equity ranks last. · Where does the tax shield sit? — in the after-tax Kd. · Cost of debt source? — yield on the company's bonds or rating-based spread over gilts. · Higher WACC means? — lower value.
**(i)** TMT — *Why software carries little debt*: no hard assets and volatile cash flows mean lenders lend less, so WACC ≈ Ke for many tech names; a mature telco is the opposite — heavy, cheap debt against predictable cash flows. Example Q: "Why does a telco have a lower WACC than a software company?" Healthcare — *Pharma vs biotech*: big pharma borrows cheaply against diversified cash flows; a single-asset biotech cannot borrow at all, so its WACC is its (equity) cost of capital. Example Q: "What discount rate would you use for a pre-revenue biotech?"
**(j)** Ladder: formula → "why market weights?" → "why not 100 % debt?" → "what happens to WACC in a recession?" (Ke and Kd both rise; weights shift).
Sources: WSP WACC; CFI WACC; M&I; Modigliani–Miller (structure only).

## Lesson 6 — `terminal-value`
**(a)** "How do you calculate terminal value, and which method do you prefer?" — `sa-core`. Cross-check — `sa-core`.
**(b)** Gordon: 102.3 × 1.02 / 0.06 = **£1,739m**; implied multiple 7.5× FY5 EBITDA. Exit: 8.5 × 231.9 = **£1,971m**; implied g 2.7 %. PVs £1,184m / £1,342m; TV share 76 % / 79 %.
**(c)** Trap: **"Terminal growth is the company's growth rate."** It is the growth rate *forever*, so it cannot exceed long-run nominal GDP (2–3 %); anything higher says the company eventually outgrows the economy.
**(d)** Canonical: *Terminal value captures everything after the projection. Two methods: the perpetuity growth method takes the final year's cash flow, grows it one more year and divides by WACC minus the growth rate; the exit multiple method applies a current trading multiple to the final year's EBITDA. Each implies the other — a growth rate implies a multiple and a multiple implies a growth rate — so I calculate both and check they agree. For Harbourline, 2 % growth gives £1.7bn, about 7.5 times EBITDA.*
**(e)** Predict: "Move g from 2 % to 3 %. EV rises by…" ~5 % / **~20 %** (correct) / ~50 %. Explain: the denominator falls from 6 to 5 points.
**(f)** Widget `gordon_vs_exit`: "Find the g at which the two methods agree (≈ 2.7 %)"; "Set exit multiple to 12× — what growth rate is that assuming, and is it believable?"; `tv_share`: "Extend to 10 years — the TV share only drops to the mid-60s."
**(g)** Your turn: "Final-year UFCF £60m, WACC 9 %, g 2.5 %, final-year EBITDA £150m, peers trade at 7×. TV both ways; implied multiple and implied g." Model: Gordon 60 × 1.025 / 0.065 = **£946m** (6.3×); exit **£1,050m**; implied g = (1,050 × 0.09 − 60) / (1,050 + 60) = **3.1 %**. Rubric: grows the cash flow one year; both methods; both cross-checks; comments on plausibility.
**(h)** Quick-fire: Which method do bankers prefer? — exit multiple in practice; perpetuity as the check (and the reverse in academia). · g > WACC? — formula breaks; nonsense. · Why discount TV five years, not six? — it is valued at the end of year 5. · TV share typical? — 60–80 %.
**(i)** TMT — *When the multiple is the whole answer*: for a company that is still growing 20 % in year 10, an exit multiple of 15× is really a bet on what growth investors will pay then; state the implied g and expect it to look too high. Example Q: "Your exit multiple implies 6 % perpetual growth — defend it." Healthcare — *No perpetuity after the cliff*: a single drug's revenue collapses 80–90 % within two years of patent expiry, so replace the perpetuity with an explicit decline to a small generic tail. Example Q: "How do you handle terminal value for a drug losing exclusivity in 2031?"
**(j)** Ladder: two methods → "which is better?" → "your implied multiple is 7.5× but peers trade at 8.5× — so?" → "what happens to the TV if the terminal year has unusually high capex?" (normalise it).
Sources: WSP terminal value; CFI; M&I; Investopedia.

## Lesson 7 — `dcf-sensitivities`
**(a)** "Which assumptions is a DCF most sensitive to?" / "What is the mid-year convention?" — `sa-core` (direction only for mid-year).
**(b)** Grid: WACC 9 %/g 1 % → £1,193m; 8 %/2 % → £1,548m; 7 %/3 % → £2,253m. Per share: £2.85 / £4.27 / £7.09. Margin ±1 pt moves EV by roughly ±£100m. Mid-year: explicit PV £364m → £378m; EV ≈ £1,600m (+3–4 %).
**(c)** Trap: **"My DCF gives £4.27."** A DCF gives a *range*; quoting one number tells the interviewer you have not looked at the table.
**(d)** Canonical: *A DCF is most sensitive to the discount rate and the terminal growth rate or exit multiple, because most of the value is in the terminal value and both sit in its denominator. Operating assumptions — margin, revenue growth, capex — matter next. So I present a sensitivity table of WACC against growth and quote a range. For Harbourline, one point either way on WACC and growth moves the value from about £1.2bn to £2.3bn around a base of £1.5bn.*
**(e)** Predict: "Which single change moves Harbourline's EV more: WACC −1 pt, or FY1–FY5 revenue growth +1 pt each year?" **WACC** (correct) / growth / same. Explain: WACC hits every year and the TV denominator.
**(f)** Widget `dcf_sensitivity`: "Find the corner where value doubles"; "Switch the axes to margin × growth — flatter, isn't it?"; "Toggle mid-year — which way, and by how much?"
**(g)** Your turn: "Explain to a client why your range is £1.2–2.3bn and not a number. Then: the market cap implies £1.53bn — what does that say about the market's WACC/g?" Model: the market sits close to 8 %/2 %; the range is the honest output; a client decision needs the *drivers*, not the point. Rubric: names WACC and g as the drivers; explains why TV dominates; reads the market back into the table; mentions mid-year direction if asked.
**(h)** Quick-fire: Mid-year convention effect? — raises value slightly; cash arrives on average mid-year. · Second most sensitive input? — margin. · Why show WACC × g rather than WACC × revenue? — they are the TV drivers. · How wide should a range be? — ±1 pt on each; wider than that is not a valuation.
**(i)** TMT — *Everything is in the tail*: with TV at 85 %+ of value, the sensitivity table *is* the valuation; show margin × exit multiple too, because the terminal margin is the real bet. Example Q: "What would you sensitise for a loss-making SaaS DCF?" Healthcare — *Probability is the third axis*: sensitise probability of success × price per patient; a 10-point change in approval odds moves an rNPV more than a point of WACC. Example Q: "What's the most sensitive input in an rNPV?"
**(j)** Ladder: what's sensitive → "so how do you present it?" → "the range is 2× — is the DCF useless?" (no: it shows what you must believe) → "mid-year — which way and why?".
Sources: WSP sensitivity/mid-year; M&I; CFI.

---

## Question table (42 = 31 core · 7 stretch · 4 lens)
Depth column → the tag written to `questions.tags`: `core` = `depth:sa-core`, `stretch` = `depth:sa-stretch`; lens rows additionally carry `lens:tmt` or `lens:healthcare`. `depth:ft-only` items are never written as questions — they are named in the cheat sheet's "you may hear" box.
All `topic_slug: dcf`; `format` verbal unless stated; each ships with `key_points` 3–6 and `weak_answer_note`.

| # | slug | subtopic | kind | diff | depth | format | model-answer gist | follow-ups |
|---|---|---|---|---|---|---|---|---|
| 1 | walk-me-through-a-dcf | dcf-overview | concept | 2 | core | verbal | five steps, EV then equity | most sensitive step? / why unlevered? |
| 2 | why-dcf-gives-ev | dcf-overview | concept | 2 | core | verbal | UFCF is to all providers; WACC blends them | how to get to equity? / levered variant? |
| 3 | when-dcf-is-wrong-tool | dcf-overview | concept | 3 | core | verbal | banks, start-ups without a path to cash, cyclicals at peak | what instead? / negative FCF? |
| 4 | dcf-vs-market-gap | dcf-overview | concept | 3 | stretch | verbal | three hypotheses, tests for each | which is likeliest? / would you pitch it? |
| 5 | order-the-dcf-steps | dcf-overview | concept | 1 | core | order | 5 steps in sequence | — |
| 6 | ufcf-from-ebit | unlevered-free-cash-flow | calculation | 2 | core | fill | 127.2 → 81.8 | what if interest £30m? / D&A +10? |
| 7 | why-not-net-income-in-dcf | unlevered-free-cash-flow | concept | 2 | core | verbal | post-interest, pre-capex | when is NI-based FCF used? |
| 8 | ufcf-vs-lfcf | unlevered-free-cash-flow | concept | 2 | core | verbal | interest & debt flows; pairs with Ke → equity | can they give different values? |
| 9 | nwc-increase-cash-effect | unlevered-free-cash-flow | calculation | 2 | core | fill | ΔNWC £5m → −5 | receivables vs payables? |
| 10 | tax-on-ebit-why | unlevered-free-cash-flow | concept | 3 | core | verbal | no-debt tax; shield lives in WACC | NOLs? |
| 11 | ufcf-with-nols | unlevered-free-cash-flow | calculation | 4 | stretch | verbal | lower cash tax until used; model separately | valuing NOLs standalone? |
| 12 | spot-the-error-ufcf | unlevered-free-cash-flow | calculation | 3 | core | spot | interest wrongly deducted | — |
| 13 | how-to-project-revenue | projections-and-assumptions | concept | 2 | core | verbal | market × share × price; history; consensus | management plan? |
| 14 | capex-vs-da-in-projections | projections-and-assumptions | concept | 3 | core | verbal | capex > D&A while growing; equal at steady state | terminal year? |
| 15 | dcf-sanity-checks | projections-and-assumptions | concept | 3 | core | verbal | implied share, conversion, capex/D&A, g | which fails most often? |
| 16 | build-fy1-ufcf | projections-and-assumptions | calculation | 4 | core | fill | Kestrel 27.0 | FY2? |
| 17 | how-long-explicit-period | projections-and-assumptions | concept | 2 | core | verbal | until steady state, 5–10 y | high-growth co? |
| 18 | cost-of-equity-capm | cost-of-equity-capm | calculation | 2 | core | fill | 4 + 1.0 × 6 = 10 % | Rf +1? |
| 19 | what-is-beta | cost-of-equity-capm | concept | 2 | core | verbal | co-movement; undiversifiable | negative beta? |
| 20 | rates-up-value-down | cost-of-equity-capm | concept | 3 | core | verbal | Rf → Ke → WACC → value | which companies hit hardest? |
| 21 | unlever-relever-beta | cost-of-equity-capm | calculation | 4 | stretch | fill | 0.80 → 1.14 | why median not mean? |
| 22 | erp-and-rf-sources | cost-of-equity-capm | concept | 2 | stretch | verbal | long gilt; historical / implied ERP | UK vs US? |
| 23 | wacc-calculation | wacc | calculation | 2 | core | fill | 8.0 % | 100 % equity? |
| 24 | why-kd-less-than-ke | wacc | concept | 2 | core | verbal | seniority; tax shield | preferred? |
| 25 | why-not-100-percent-debt | wacc | concept | 3 | core | verbal | relevered β, distress, lenders' limits | where's the minimum? |
| 26 | market-vs-book-weights | wacc | concept | 3 | core | verbal | market reflects today's claims | debt trading at 80? |
| 27 | wacc-100-equity | wacc | concept | 2 | core | verbal | = Ke with unlevered β | is that higher or lower? |
| 28 | cost-of-debt-sources | wacc | concept | 2 | stretch | verbal | bond YTM; rating spread | private company? |
| 29 | tv-two-methods | terminal-value | concept | 2 | core | verbal | Gordon vs exit; each implies the other | which preferred? |
| 30 | gordon-tv-calc | terminal-value | calculation | 3 | core | fill | 1,739 | implied multiple? |
| 31 | exit-multiple-tv-calc | terminal-value | calculation | 3 | core | fill | 1,971; implied g 2.7 % | plausible? |
| 32 | terminal-growth-ceiling | terminal-value | concept | 2 | core | verbal | ≤ long-run nominal GDP | g > WACC? |
| 33 | tv-share-of-value | terminal-value | concept | 3 | core | verbal | 60–80 %; why it's fine but must be shown | how to reduce it? |
| 34 | normalise-terminal-year | terminal-value | concept | 4 | stretch | verbal | capex ≈ D&A, NWC steady, margin mid-cycle | cyclicals? |
| 35 | most-sensitive-inputs | dcf-sensitivities | concept | 2 | core | verbal | WACC, g; then margin | how present? |
| 36 | build-sensitivity-corner | dcf-sensitivities | calculation | 4 | core | fill | 7 %/3 % → 2,253 | why not linear? |
| 37 | mid-year-convention | dcf-sensitivities | concept | 3 | core | verbal | cash mid-year; value up a few % | TV treatment? |
| 38 | stub-period | dcf-sensitivities | concept | 3 | stretch | verbal | partial first year; discount fraction | with mid-year? |
| L1 | tmt-dcf-negative-fcf | dcf-overview | concept | 3 | core `lens:tmt` | verbal | longer period; terminal margin bet; TV share | what multiple? |
| L2 | tmt-rates-and-growth-stocks | cost-of-equity-capm | concept | 3 | core `lens:tmt` | verbal | duration; Rf pass-through | value vs growth? |
| L3 | hc-rnpv-basics | projections-and-assumptions | calculation | 3 | core `lens:healthcare` | fill | £100m × 30 % PoS → 30 before discounting | phase 3 odds? |
| L4 | hc-patent-cliff-tv | terminal-value | concept | 3 | core `lens:healthcare` | verbal | explicit decline; generic tail | biosimilars? |

Difficulty mix of the 42: d1 1 · d2 18 · d3 18 · d4 5 — the eval gate (25/30/30/15 ± 15 %) needs
d1 ≥ 4: the loop promotes four definitional variants (e.g. "What does WACC stand for and represent?",
"Define terminal value", "What is unlevered free cash flow in one sentence?", "What is the ERP?") and
demotes four d3s to d2 when writing the JSON. `numbers` on every `fill` question (13 of 42 = 31 %).

## Cheat sheet — `content/cheatsheets/dcf.json`
- **Formulas**: UFCF = EBIT(1 − t) + D&A − capex − ΔNWC · Ke = Rf + β·ERP · WACC = E/V·Ke + D/V·Kd(1 − t) ·
  TV_gordon = FCF_N(1 + g)/(WACC − g) · TV_exit = multiple × EBITDA_N · implied g = (TV·WACC − FCF_N)/(TV + FCF_N) ·
  PV = CF/(1 + r)^t (mid-year: t − 0.5) · β_L = β_U(1 + (1 − t)D/E).
- **Canonical**: walk me through a DCF; UFCF; why unlevered; Ke; WACC; why not 100 % debt; two TVs; most sensitive.
- **Traps**: the seven trap sentences above.
- **One-liners**: "A DCF is a range with a story, not a number." "Most of the value is terminal — say so first." "Unlevered pairs with WACC and gives EV."
- **You may hear (ft-only)**: levered DCF / FCFE, APV, stub periods, size premium, private-company WACC, dividend discount model (→ FIG module).

## Template — `dcf_sheet` rows (printable one-pager, `template` block in `dcf-overview`)
Revenue · growth % · EBITDA · margin % · D&A · EBIT · tax · NOPAT · + D&A · − capex · − ΔNWC · **UFCF** ·
discount factor · PV · Σ PV · TV (method, inputs) · PV(TV) · **EV** · − net debt · − prefs/NCI/leases ·
**Equity value** · ÷ diluted shares · **per share** · TV share % · implied multiple / implied g · sensitivity 3 × 3.
Props: `{ years: 5, company: "Harbourline plc", prefill: "labels" | "harbourline" }`.
