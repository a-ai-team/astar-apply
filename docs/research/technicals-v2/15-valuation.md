# Loop 15 — Valuation: content spec

_Written 2026-08-28. Topic slug `valuation`. Scope from `00-syllabus.md` § 2 (Valuation row) and § 8:
**5 lessons, 22 sa-core + 5 sa-stretch + 4 lens questions**. Lens mechanics: `02-lens-design.md`.
Widget conventions: `01-interactive-teaching.md` § 3 and § 5. Everything below is original; sources are
cited for *structure* (which questions get asked, in what order) only._

## Chapter numbers — one dataset for every lesson

**Marlow Instruments plc** — a UK maker of laboratory measurement equipment. Listed, 120m shares,
share price £9.00. Balance sheet: cash £60m, debt £240m, no preferred, no NCI, IFRS 16 leases £30m.

| | Marlow |
|---|---|
| Revenue | £900m |
| EBITDA | £150m |
| EBIT | £110m |
| Net income | £72m |
| Revenue growth (fwd) | 6 % |
| Equity value | 120 × 9.00 = **£1,080m** |
| EV (bridge) | 1,080 + 240 + 30 − 60 = **£1,290m** |

Five invented peers (all £m, forward-year figures, EV already bridged):

| Peer | EV | EBITDA | EBIT | NI | Revenue | Growth | EV/EBITDA | EV/EBIT | P/E* | EV/Rev |
|---|---|---|---|---|---|---|---|---|---|---|
| Brantwood Sensors | 1,760 | 160 | 120 | 80 | 1,000 | 8 % | 11.0× | 14.7× | 20.0× | 1.8× |
| Thornbury Optics | 990 | 110 | 80 | 50 | 700 | 4 % | 9.0× | 12.4× | 17.0× | 1.4× |
| Larkfield Controls | 2,400 | 200 | 150 | 100 | 1,200 | 12 % | 12.0× | 16.0× | 24.0× | 2.0× |
| Penrose Metrology | 640 | 80 | 55 | 34 | 500 | 3 % | 8.0× | 11.6× | 15.0× | 1.3× |
| Halden Labs | 1,500 | 125 | 95 | 60 | 750 | 10 % | 12.0× | 15.8× | 22.0× | 2.0× |
| **Median** | | | | | | | **11.0×** | **14.7×** | **20.0×** | **1.8×** |
| **Mean** | | | | | | | 10.4× | 14.1× | 19.6× | 1.7× |

\*P/E = equity value / NI; equity values: Kestrel 1,600, Thornbury 850, Ashdown 2,400, Penrose 510, Halden 1,320.

Precedent transactions (four invented deals, last three years):

| Deal | Target EBITDA | EV paid | EV/EBITDA | Premium to undisturbed price |
|---|---|---|---|---|
| Orme Group buys Dunmore Instruments | 90 | 1,170 | 13.0× | 32 % |
| Sponsor buys Calder Metrology | 60 | 720 | 12.0× | 28 % |
| Vantor plc buys Skerry Sensors | 140 | 1,960 | 14.0× | 38 % |
| Sponsor buys Lyle Optics | 45 | 495 | 11.0× | 25 % |
| **Median** | | | **12.5×** | **30 %** |

DCF for Marlow (from the Loop 16 chapter, used here only as an output): EV range £1,250–1,450m.

Implied values for Marlow (used in every lesson):
- Comps median EV/EBITDA 11.0× × 150 = **EV £1,650m** → equity 1,650 − 240 − 30 + 60 = **£1,440m** → **£12.00/share**.
- Precedents median 12.5× × 150 = **EV £1,875m** → equity **£1,665m** → **£13.88/share**.
- DCF £1,250–1,450m EV → **£8.67–£10.33/share**.
- Market: £9.00.

---

## Lesson 1 — `valuation-methodologies` · "The three methods and how to rank them"

**(a) Interview question.** "How would you value a company?" then "Which method usually gives the
highest value and why?" — `sa-core`. Tier A #4 and #5.

**(b) Worked numbers.** The Marlow summary above: comps → £1,650m EV, precedents → £1,875m, DCF →
£1,250–1,450m. Premium to undisturbed price in precedents median 30 %.

**(c) Trap.** **"The DCF is the most accurate, so it gives the right answer."** No — a DCF is the most
*sensitive* method, not the most accurate; small changes in WACC or terminal growth swing it more than
any other approach, which is why it is shown as a range and cross-checked against market methods.

**(d) Canonical answer.** "Three core methods. Comparable companies applies trading multiples of
similar listed businesses to the company's own metrics — a market view today. Precedent transactions
applies multiples paid in recent acquisitions, which include a control premium so usually come out
higher. A discounted cash flow values the business from its own projected cash flows and a discount
rate — theoretically the purest but the most sensitive to assumptions. In practice you run all three
and present a range, then explain why the ranges differ." (78 words, ~45 s)

**(e) Predict gate.** "Marlow's comps imply £1,650m EV. Before you see the precedents number, will
precedents come out higher, lower or about the same?" Options: Higher ✓ / Lower / Same. Explain:
buyers pay a premium for control and expected synergies, so deal multiples sit above trading multiples
in most cycles.

**(f) Widget prompts** (`football_field`, chapter preset with the three ranges + market price line).
1. "Toggle precedents off. Does the range narrow or widen? What did you lose?"
2. "Drag the DCF low end down to £1,100m. Which method now overlaps with nothing — what would an
   interviewer ask you about that?"
3. "Where does £9.00 sit? What does it tell you about how the market sees Marlow versus its peers?"

**(g) Your turn.** "Penrose Metrology (EBITDA £80m, net debt £130m, 50m shares, price £10.20) —
comps median EV/EBITDA 11.0×, precedents 12.5×, DCF EV £780–900m. Give the implied share price under
each method and rank them." Model: comps 880 → equity 750 → £15.00; precedents 1,000 → 870 →
£17.40; DCF 650–770 → £13.00–15.40. Rubric: bridges EV to equity each time; divides by 50m; ranks
precedents > comps > DCF here; notes the market price sits below every method and offers one reason.

**(h) Quick-fire.** Q: Which method embeds a control premium? A: Precedent transactions. · Q: Which
is most sensitive to assumptions? A: DCF. · Q: What does a comps valuation reflect? A: How the market
prices similar companies today. · Q: Why present a range, not a number? A: Every method rests on
assumptions; the overlap is the defensible zone.

**(i) Lens.**
- *TMT — "When EBITDA is missing, the ranking changes."* For a loss-making software business the
  three-method picture reshuffles: EV/EBITDA is unusable, so comps run on EV/Revenue or EV/ARR, and
  the DCF carries most of the weight because it is the only method that captures the path to
  profitability. Precedents still tend to be highest, but the premium is often paid for growth and
  customer base rather than synergies. Example_q: "Marlow spins out a SaaS unit with £40m ARR growing
  35 % and negative EBITDA — which methods can you use?" Answer outline: EV/ARR comps (growth-matched
  peers), precedents on EV/ARR, long-horizon DCF; explain why EV/EBITDA and P/E fail; mention the Rule
  of 40 as the sanity check on the multiple. Link: `/home/technicals/tmt`.
- *Healthcare — "Pipeline value sits outside all three methods."* A pharma with marketed products
  values like Marlow; a clinical-stage biotech does not. Comps become EV/peak-sales or per-programme
  multiples, precedents are dominated by big-pharma acquisitions paying for pipeline, and the DCF
  becomes a risk-adjusted NPV — each programme's cash flows multiplied by its probability of success.
  Example_q: "How would you value a company with three Phase 3 assets and no revenue?" Answer
  outline: rNPV per asset (phase-adjusted probability, launch year, peak sales, patent life), sum,
  add net cash; cross-check to precedents on similar-stage deals; say why comps are weak. Link:
  `/home/technicals/healthcare-biotech`.

**(j) Follow-up ladder.** "Which is highest?" → "Why does the buyer pay a premium?" → "When might a
DCF come out *above* precedents?" (high-growth, undervalued sector, cheap money) → "Marlow's market
price is below every method — three hypotheses?" (market doubts growth, peer set too rich, Marlow-
specific discount such as governance or liquidity).

Sources (structure): M&I valuation methodologies overview; WSP "valuation interview questions"; WSO
London top-20 (ranking question); financefluency curriculum topic 3 outline.

---

## Lesson 2 — `comparable-companies` · "Trading comps: picking peers and spreading them"

**(a)** "Walk me through a comparable-companies analysis. How do you choose the peers?" — `sa-core`.

**(b)** The five-peer table. Median EV/EBITDA 11.0×, mean 10.4× (dragged down by Penrose at 8.0×).
Marlow implied EV 1,650 (median) vs 1,560 (mean). Show the spread: EV/EBITDA runs 8.0×–12.0×.

**(c)** **"Pick the five biggest companies in the sector."** Size is one filter, not the filter —
peers are matched on business model, growth, margins and geography; a much larger, faster-growing
company will deserve a higher multiple and inflate your number.

**(d)** "Select five to ten listed companies that share the target's industry, size, growth and
margin profile, ideally the same region. For each, compute enterprise value from the market and
calendarise the forward metrics — EBITDA, EBIT, revenue, earnings. Calculate the multiples, take the
median rather than the mean so one outlier doesn't distort it, and apply that median to the target's
own metric. Bridge from enterprise value back to equity value and per-share. Sanity-check where the
target should sit within the range, not just at the middle." (84 words)

**(e)** "Larkfield Controls is growing 12 % a year against Marlow's 6 %. If you keep Ashdown in the
peer set, does Marlow's implied value go up, down or stay the same?" Options: Up ✓ / Down / Same.
Explain: Ashdown's 12.0× lifts the median; a faster-growing peer imports a multiple Marlow hasn't
earned.

**(f)** Widget: **comps picker** — implemented as a **preset of `football_field`** (`props.mode:
"comps"`) that shows the peer table with checkboxes; unticking a peer recomputes median and mean and
redraws Marlow's implied bar. (No new widget name.) Prompts: 1. "Untick Penrose. Median moves from
11.0× to — what? Mean moves how much more?" 2. "Keep only the two 12 %+ growers. Justify the number
you get to an MD in one sentence." 3. "Which single peer is Marlow most like on growth and margin?"

**(g)** "Thornbury Optics wants a comps valuation. Using the other four peers plus Marlow (EV/EBITDA
1,290/150 = 8.6×), compute median and mean EV/EBITDA and Thornbury's implied EV and share price
(EBITDA 110, net debt 140, 50m shares)." Model: multiples 11.0, 12.0, 8.0, 12.0, 8.6 → median 11.0×,
mean 10.3×; EV 1,210 (median) → equity 1,070 → £21.40. Rubric: includes Marlow as a peer; median
chosen and justified; bridge correct; per-share; comments that Thornbury's own 9.0× sits below
median because it grows slowest.

**(h)** Q: Median or mean? A: Median — robust to one outlier. · Q: Why calendarise? A: Peers have
different year-ends; you compare the same twelve months. · Q: Forward or trailing multiples? A:
Forward (next twelve months) is standard; trailing as a check. · Q: Where does the multiple come
from? A: Market equity value plus the bridge, divided by the metric.

**(i)** *TMT — "Growth-adjusted comps."* Software peers span 2× to 20× revenue; the differentiator
is growth plus margin. Analysts plot EV/Revenue against revenue growth (or Rule of 40 score) and read
the target off the regression rather than a flat median. Example_q: "Two SaaS peers trade at 5× and
12× revenue. Which multiple do you use?" Outline: neither — position the target on the growth-
adjusted line; explain Rule of 40 (growth + FCF margin ≥ 40); note churn and net retention as
qualitative adjusters. *Healthcare — "Peer sets by sub-sector."* A peer set that mixes pharma
(P/E 14×), medtech (EV/EBITDA 18×), CROs and biotech (no earnings) is meaningless; the first step is
naming the sub-sector and using its metric — EV/EBITDA for devices and services, P/E for big pharma,
EV/peak sales or EV/R&D spend for clinical-stage. Example_q: "A medtech company — what peers and
what multiple?" Outline: other device makers with similar reimbursement exposure; EV/EBITDA and
EV/Revenue given high gross margins; exclude pharma.

**(j)** "How do you pick peers?" → "What if there are only two good peers?" (widen geography, accept
larger set with caveats, weight the DCF) → "Why might the target deserve a discount to the median?"
(smaller, slower, less liquid) → "Would you use LTM or NTM after a big acquisition?" (NTM pro forma).

Sources: WSP comparable-company analysis guide (steps); M&I comps questions; CFI comps overview.

---

## Lesson 3 — `precedent-transactions` · "Precedent transactions and the control premium"

**(a)** "What are precedent transactions and why do they usually give a higher value than comps?" —
`sa-core`; "How stale is too stale?" — `sa-stretch`.

**(b)** Four-deal table: median EV/EBITDA 12.5×, median premium 30 %. Marlow implied EV 1,875 →
£13.88/share. Compare: Marlow undisturbed £9.00 + 30 % = £11.70 as a *premium-based* cross-check.

**(c)** **"Precedents are higher because acquirers overpay."** They are higher because the buyer
acquires *control* — the right to change management, strategy and capital structure — and often
expects synergies; that is a rational premium, not a mistake, and it is why precedents are the
reference point for a sale process rather than for a trading valuation.

**(d)** "Precedent transactions apply the multiples paid in recent acquisitions of comparable
companies. They usually sit above trading comps because the price includes a control premium —
typically twenty to forty per cent over the undisturbed share price — reflecting control and
expected synergies. They are less reliable than comps because deals are infrequent, terms are
sometimes undisclosed, and market conditions at the time of each deal differ. Use deals from the
last two or three years, same sector, similar size, and show the premium alongside the multiple."
(84 words)

**(e)** "A deal from 2021 was struck at 16× EBITDA when rates were near zero. Include it in today's
set: does Marlow's implied value go up, down or unchanged — and should you include it?" Options:
Up, but flag or exclude it ✓ / Up, keep it / Unchanged. Explain: it raises the median, but the
financing environment differed; staleness is a judgement you must state.

**(f)** `football_field` precedents layer: 1. "Switch the precedents bar to 'premium-based' (£9.00
× 1.30). Why is it lower than the multiple-based bar?" 2. "Remove the Vantor/Skerry deal (14×).
How far does the median fall?" 3. "Add the DCF back — do precedents overlap with anything now?"

**(g)** "Halden Labs receives an approach. Using the precedent median and the premium median, give
two implied offer values per share (EBITDA 125, net debt 180, 60m shares, price £22.00)." Model:
12.5 × 125 = 1,562.5 EV → 1,382.5 equity → £23.04; premium route £22.00 × 1.30 = £28.60. Rubric: both
routes; explains why they differ (Halden already trades at 12×, near deal multiples, so the multiple
route adds little premium); which the board would cite (the higher, with caution).

**(h)** Q: Typical UK control premium? A: Roughly 20–40 % over the undisturbed price. · Q: Why
"undisturbed"? A: The price before leak or announcement moved it. · Q: Strategic or sponsor pays
more? A: Usually strategic — synergies. · Q: Biggest weakness of precedents? A: Few, stale, and
terms often private.

**(i)** *TMT — "Premiums paid for growth and users."* Tech deal multiples are paid on revenue or ARR,
and the premium often reflects customer base and technology rather than cost synergies; take-private
premiums by sponsors in software have been substantial in weak markets. Example_q: "Why might a
software precedent set show 8× revenue when the sector trades at 5×?" Outline: control, scarcity of
assets, sponsor leverage capacity on recurring revenue, timing. *Healthcare — "Pipeline deals and
contingent value."* Pharma precedents frequently include contingent value rights or milestone
payments; the headline multiple understates or overstates depending on whether contingent
consideration is included. Example_q: "A biotech acquisition at £2bn plus £500m in milestones — what
EV do you record for the precedent?" Outline: show both (upfront and risk-adjusted total); state the
convention you're using; note peak-sales multiples as the common metric.

**(j)** "Why higher?" → "When would precedents be *lower* than comps?" (distressed sellers, bear
market deals, sector re-rated upward since) → "How do you handle undisclosed terms?" → "Which would
you show a board considering a sale?"

Sources: WSP precedent transaction analysis; M&I control premium discussion; Rothschild/HL interview
reports citing the ranking question (financefluency tags, WSO snippets).

---

## Lesson 4 — `multiples-and-metrics` · "Which multiple, when — and why similar companies differ"

**(a)** "What's the difference between EV/EBITDA and P/E, and when would you use each?" and "Why
might two similar companies trade at different multiples?" — `sa-core`; EV/EBIT vs EV/EBITDA
capital-intensity — `sa-stretch`.

**(b)** Marlow at market: EV/EBITDA 1,290/150 = 8.6×, EV/EBIT 11.7×, P/E 1,080/72 = 15.0×,
EV/Revenue 1.4×. Ashdown (12 % growth, 16.7 % EBITDA margin) 12.0× vs Penrose (3 %, 16 %) 8.0× —
same margin, different growth, four turns apart. Kestrel vs Halden: same 12.0×/11.0× range but
Halden's D&A is lighter so its EV/EBIT is lower — the capital-intensity point.

**(c)** **"EV/EBITDA is always better than P/E because it's capital-structure neutral."** Neutral is
not always better: P/E is what equity investors actually pay, it is the right metric for banks and for
companies where leverage *is* the story, and EBITDA ignores capex — for a heavy-capex business
EV/EBIT or EV/(EBITDA − capex) tells the truer story.

**(d)** "A multiple pairs a value with a metric that belongs to the same claimants. Enterprise value
belongs to all capital providers, so it pairs with pre-interest metrics — EBITDA, EBIT, revenue.
Equity value belongs to shareholders, so it pairs with net income or book equity. EV/EBITDA is the
default because it's capital-structure and D&A neutral; EV/EBIT when capex intensity differs;
EV/Revenue when earnings are negative; P/E for financials or when you're valuing the equity
directly. Two similar companies trade differently because of growth, margins, returns on capital,
risk and liquidity." (90 words)

**(e)** "Marlow and Kestrel have the same EBITDA margin. Kestrel grows 8 %, Marlow 6 %. Which should
trade at the higher EV/EBITDA, all else equal?" Options: Kestrel ✓ / Marlow / Same. Explain: a
multiple is a compressed DCF — higher growth at the same margin means more future cash per pound of
today's EBITDA.

**(f)** `multiple_matcher` (Loop 14 widget, chapter preset adds EV/Revenue, EV/EBIT, EV/(EBITDA −
capex), P/B): 1. "Drag P/B — which bucket, and for what kind of company does it matter?" 2. "Drag
EBIT and EBITDA to EV. Now which of Kestrel or Halden looks cheaper on EV/EBIT — and why did the
order change?" 3. "Where does EV/Revenue belong, and when is it the *only* option?"

**(g)** "Two peers: Ashdown (EV/EBITDA 12.0×, growth 12 %, EBITDA margin 16.7 %, capex 8 % of
revenue) and Halden (12.0×, growth 10 %, margin 16.7 %, capex 3 %). An MD asks which is 'cheaper'.
Answer with numbers." Model: EV/(EBITDA − capex): Ashdown 2,400/(200 − 96) = 23.1×; Halden 1,500/
(125 − 22.5) = 14.6× — Halden is materially cheaper on cash earnings despite the identical headline
multiple; Ashdown's growth partly justifies it. Rubric: computes capex-adjusted multiple; identifies
the driver (capital intensity); weighs growth; gives a view.

**(h)** Q: P/E pairs with? A: Equity value — post-interest earnings belong to shareholders. · Q: When
EV/Revenue? A: Negative or immature earnings. · Q: Multiple as a formula? A: A compressed DCF: higher
growth, lower risk, higher returns → higher multiple. · Q: Why not EV/Net income? A: Mismatch — EV is
pre-debt, net income is post-interest.

**(i)** *TMT — "EV/ARR and the Rule of 40."* For subscription software, annual recurring revenue is
the base and EV/ARR the multiple; a business with growth plus free-cash-flow margin above 40 earns a
premium multiple. Example_q: "Company A grows 50 % with −20 % FCF margin; B grows 20 % at +25 %.
Which deserves the higher EV/ARR?" Outline: both score 30 on the Rule of 40 — similar; then discuss
durability of growth, net retention, capital needs; conclude with a range not a verdict.
*Healthcare — "EV/peak sales and why P/E rules pharma."* Big pharma trades on P/E (stable, cash-
generative, low leverage); clinical-stage companies are compared on EV/risk-adjusted peak sales;
medtech on EV/EBITDA and EV/Revenue given 60–70 % gross margins. Example_q: "Why would you never
quote EV/EBITDA for a Phase 2 biotech?" Outline: EBITDA negative and uninformative; value is
option-like on trial outcomes; use rNPV and peak-sales multiples.

**(j)** "Why different multiples?" → "Give me three specific reasons in this pair" → "If a company
has more debt, what happens to its P/E versus its EV/EBITDA?" (P/E falls with higher interest and
leverage risk; EV/EBITDA unchanged by leverage) → "Which multiple for a company with large operating
leases under IFRS 16?" (EV/EBITDA with leases in both numerator and denominator — be consistent).

Sources: WSP "EV/EBITDA vs P/E" explainer; M&I multiples questions; CFI "types of valuation
multiples"; WSO thread on identical companies / different multiples.

---

## Lesson 5 — `choosing-and-presenting` · "The football field and the hard cases"

**(a)** "How do you present a valuation to a client?" — `sa-core`; "How would you value a company
with negative cash flows / no revenue?" — `sa-core` (Tier B #18).

**(b)** Marlow football field per share: comps £10.90–£13.20 (8.0×–12.0× → EV 1,200–1,800 →
equity 1,010–1,610 → /120m; use quartiles 9.0×–12.0× for the shaded bar: £11.75–£13.20), precedents
£12.38–£14.00 (11×–14×), DCF £8.67–£10.33, market £9.00, 52-week range £7.80–£10.40. Overlap of the
two market methods: roughly £12.40–£13.20.

**(c)** **"Take the average of the three methods."** Averaging hides the information: the *gap*
between methods is the analysis — precedents above comps says control is worth ~30 %; DCF below the
market says your projections or discount rate are conservative, or the market is pricing something
you haven't modelled.

**(d)** "You present a football field — one horizontal bar per method, each showing the range
implied by reasonable assumptions, with the current share price and 52-week range as reference
lines. The overlap between methods is the defensible range; the gaps are what you explain. For a
company with negative cash flows, trading and deal multiples move to revenue or operating metrics,
the DCF runs a longer explicit period until profitability, and you lean on the drivers that will
eventually produce cash — growth, gross margin, unit economics." (80 words)

**(e)** "Your DCF gives £9.50 and precedents £13.90. A client asks 'so what's it worth?'. Best
response?" Options: "Around £11.70, the midpoint" / "It depends on the buyer: £9.50–£10.30 as a
standalone, £12–14 to an acquirer with control" ✓ / "£13.90 — the highest defensible number".
Explain: value depends on who is asking and why; the method mix maps to the purpose.

**(f)** `football_field` full chapter preset (comps, precedents, DCF, LBO-ability optional, market
lines): 1. "Add the 52-week range. Which method sits closest to where the market has actually
traded?" 2. "Narrow the comps range to the interquartile 9–12×. Does the overlap with precedents
survive?" 3. "Switch on 'negative EBITDA' mode — which bars disappear and what replaces them?"

**(g)** "A pre-revenue diagnostics start-up (Marlow is considering buying it) has no earnings and
£5m revenue expected in two years. List, in order, the methods you would use and the one number
that matters most in each." Model: (1) DCF with a 10-year explicit period — the terminal margin and
the year profitability arrives; (2) EV/forward revenue on early-stage peers — the growth rate that
justifies the multiple; (3) precedents in diagnostics — the EV/revenue paid; (4) VC method as a
sanity check — required return. Rubric: names the shift to revenue metrics; longer DCF horizon;
identifies the single driver per method; says the range will be wide and why.

**(h)** Q: What is a football field? A: A chart of per-share ranges by method with market
reference lines. · Q: Negative EBITDA — which multiple? A: EV/Revenue (or sector KPI). · Q: Why show
the 52-week range? A: Anchors the valuation to where the market has actually been. · Q: When is a
DCF the *only* usable method? A: No listed peers and no recent deals — e.g. a unique infrastructure
asset.

**(i)** *TMT — "Presenting a growth company."* The football field for a loss-making software
company has EV/ARR comps, EV/ARR precedents, and a DCF whose bar is the widest; add a line for the
last funding round. Example_q: "How do you explain a DCF range that is 2× wide on the football
field?" Outline: terminal margin and exit-year assumptions dominate; show the sensitivity grid
alongside; anchor to ARR multiples. *Healthcare — "One bar per programme."* For a biotech, the field
is a sum-of-the-parts by asset: each programme's rNPV as its own bar, plus net cash, plus a platform
value; precedents on peak-sales multiples as the cross-check. Example_q: "How would a healthcare
banker present a Phase 3 company to its board?" Outline: rNPV by asset with probabilities stated,
scenario bars (approval / fail), precedent premiums for similar-stage deals.

**(j)** "How do you present?" → "Why do the ranges differ?" → "The board wants one number — what do
you say?" → "The market price is below every method — three hypotheses and how you'd test each?"
(projections too rich → check consensus; peer set too rich → re-cut peers; company-specific discount
→ check liquidity, governance, disclosure).

Sources: WSP football field chart guide; M&I "how to value a company with negative earnings";
financefluency curriculum (topic 3: overview · comps · precedents · football field · premiums).

---

## Question bank (22 sa-core · 5 sa-stretch · 4 lens = 31)
Depth column → the tag written to `questions.tags`: `core` = `depth:sa-core`, `stretch` = `depth:sa-stretch`; lens rows additionally carry `lens:tmt` or `lens:healthcare`. `depth:ft-only` items are never written as questions — they are named in the cheat sheet's "you may hear" box.

Slugs are `questions/<slug>.json`; `topic_slug: valuation`. Difficulty 1 definition · 2 why · 3
second-order · 4 numerical/edge. Format default `verbal`. Every question ships with 3–6 key points,
`weak_answer_note` and 2–3 follow-ups; two follow-ups are listed here.

| # | slug | subtopic | kind | diff | depth | format | model-answer gist | follow-ups |
|---|---|---|---|---|---|---|---|---|
| 1 | what-are-the-three-valuation-methods | valuation-methodologies | concept | 1 | sa-core | verbal | comps, precedents, DCF; what each measures | Which is highest? / Which would you trust most for a small UK company? |
| 2 | rank-the-methods-highest-to-lowest | valuation-methodologies | concept | 2 | sa-core | verbal | precedents > comps usually; DCF varies; control premium | When could a DCF be highest? / What if precedents are stale? |
| 3 | why-do-precedents-exceed-comps | valuation-methodologies | concept | 2 | sa-core | verbal | control + synergies; buyer pays for the right to change things | Strategic vs sponsor premium? / Ever lower than comps? |
| 4 | marlow-three-method-per-share | valuation-methodologies | calculation | 4 | sa-core | fill | comps 11.0× → £12.00; precedents 12.5× → £13.88; DCF £8.67–10.33 (`numbers`) | Which do you show a seller? / Why is market at £9? |
| 5 | when-is-dcf-the-only-option | valuation-methodologies | concept | 3 | sa-core | verbal | no peers / no deals — unique assets; long-dated cash flows | How do you sanity-check it? / What discount rate for a unique asset? |
| 6 | order-a-comps-analysis | comparable-companies | concept | 2 | sa-core | order | select peers → gather financials → calendarise → EV & multiples → median → apply → bridge | Why calendarise? / Why median? |
| 7 | how-do-you-choose-peers | comparable-companies | concept | 2 | sa-core | verbal | industry, size, growth, margins, geography; 5–10 names | Only two good peers? / Include a much larger leader? |
| 8 | median-vs-mean-multiples | comparable-companies | concept | 2 | sa-core | verbal | median robust to outliers; show both | When would you use the mean? / What if the median is an obvious outlier's neighbour? |
| 9 | ltm-vs-ntm-multiples | comparable-companies | concept | 2 | sa-core | verbal | NTM standard; LTM as a check; pro forma after deals | Which after a large acquisition? / Where do forecasts come from? |
| 10 | thornbury-implied-ev-from-peers | comparable-companies | calculation | 4 | sa-core | fill | five multiples → median 11.0× → EV 1,210 → equity 1,070 → £21.40 (`numbers`) | Why does Thornbury trade below median? / Effect of dropping Marlow from the set? |
| 11 | spot-the-error-comps-bridge | comparable-companies | calculation | 3 | sa-core | spot | worked comps that forgets to subtract debt when going EV → equity | What else is commonly forgotten? / Leases? |
| 12 | what-is-a-control-premium | precedent-transactions | concept | 1 | sa-core | verbal | price over undisturbed; 20–40 % typical; control + synergies | Why "undisturbed"? / Who pays more? |
| 13 | why-are-precedents-less-reliable | precedent-transactions | concept | 2 | sa-core | verbal | infrequent, undisclosed terms, different market conditions | How old is too old? / How do you handle undisclosed EBITDA? |
| 14 | halden-offer-value-two-routes | precedent-transactions | calculation | 4 | sa-core | fill | 12.5× route £23.04 vs premium route £28.60 (`numbers`) | Why do they differ? / Which does the board cite? |
| 15 | strategic-vs-financial-buyer-price | precedent-transactions | concept | 3 | sa-core | verbal | strategic pays for synergies; sponsor bound by returns and leverage | When does a sponsor win? / Effect on the precedent set mix? |
| 16 | ev-ebitda-vs-pe-when-each | multiples-and-metrics | concept | 2 | sa-core | verbal | EV pairs pre-interest; equity pairs post-interest; capital structure | Banks? / Heavy capex? |
| 17 | why-similar-companies-different-multiples | multiples-and-metrics | concept | 3 | sa-core | verbal | growth, margins, ROIC, risk, liquidity, accounting | Give three for Ashdown vs Penrose / Leverage effect on P/E vs EV/EBITDA? |
| 18 | which-multiple-negative-earnings | multiples-and-metrics | concept | 2 | sa-core | verbal | EV/Revenue or sector KPI; longer DCF | What replaces it in SaaS? / In biotech? |
| 19 | ev-ebit-vs-ev-ebitda-capex | multiples-and-metrics | concept | 3 | sa-core | verbal | EBITDA ignores capex; EV/EBIT or EV/(EBITDA − capex) for capital-heavy | Ashdown vs Halden numbers? / IFRS 16 effect? |
| 20 | compute-marlow-market-multiples | multiples-and-metrics | calculation | 4 | sa-core | fill | EV/EBITDA 8.6×, EV/EBIT 11.7×, P/E 15.0×, EV/Rev 1.4× (`numbers`) | Is Marlow cheap vs peers? / Why is P/E above EV/EBITDA here? |
| 21 | what-is-a-football-field | choosing-and-presenting | concept | 1 | sa-core | verbal | bars per method, market lines, overlap = defensible range | Why not average? / What if no overlap? |
| 22 | value-a-pre-revenue-company | choosing-and-presenting | concept | 3 | sa-core | verbal | revenue multiples, long DCF, drivers; wide range | Which single number matters most? / VC method? |
| 23 | dcf-below-market-three-hypotheses | choosing-and-presenting | concept | 3 | sa-stretch | verbal | projections, peer richness, company-specific discount; how to test each | Which is most likely for Marlow? / What would you change first? |
| 24 | sotp-when-and-how | valuation-methodologies | concept | 3 | sa-stretch | verbal | value segments on their own multiples; conglomerate discount | When does SOTP exceed the market? / Corporate costs? |
| 25 | liquidation-value-basics | valuation-methodologies | concept | 2 | sa-stretch | verbal | asset recovery less liabilities; a floor; distressed context | When is it above EV? / Who uses it? |
| 26 | stale-precedent-adjustment | precedent-transactions | concept | 3 | sa-stretch | verbal | exclude, footnote, or re-rate for the cycle; state the choice | 2021 zero-rate deals? / Sector re-rated since? |
| 27 | leases-in-multiples-consistency | multiples-and-metrics | calculation | 4 | sa-stretch | fill | Marlow EV with/without £30m leases; EBITDA with/without rent; both or neither (`numbers`) | Which do UK analysts use post-IFRS 16? / Effect on comps ranking? |
| 28 | tmt-ev-arr-rule-of-40 | multiples-and-metrics | concept | 3 | lens:tmt | verbal | EV/ARR; growth + FCF margin ≥ 40 → premium multiple | Two companies both scoring 30? / Net retention? |
| 29 | tmt-growth-adjusted-comps | comparable-companies | calculation | 4 | lens:tmt | fill | regression of EV/Rev on growth; read Marlow SaaS unit off the line (`numbers`) | Why not the median? / Churn adjustment? |
| 30 | hc-ev-peak-sales-multiple | multiples-and-metrics | concept | 3 | lens:healthcare | verbal | EV / risk-adjusted peak sales; why not EBITDA | Which probability of success? / Patent cliff? |
| 31 | hc-rnpv-vs-comps-when-each | valuation-methodologies | concept | 3 | lens:healthcare | verbal | rNPV for clinical-stage; comps/precedents as cross-check; sub-sector peers | How do you present it? / CVRs in precedents? |

Difficulty mix (27 non-lens): 1 → 3, 2 → 9, 3 → 9, 4 → 6 ≈ 11/33/33/22 % — within ±15 % of 25/30/30/15
on the middle bands; the extra difficulty-4s are the `fill` items the chapter needs. Formats: fill 6,
order 1, spot 1, verbal 23.

## Cheat sheet — `content/cheatsheets/valuation.json`

- **formulas**: EV = equity + debt + leases + prefs + NCI − cash · Implied EV = median multiple ×
  target metric · Implied equity = EV − net debt (bridge in reverse) · Per share = equity / diluted
  shares · Premium = offer / undisturbed − 1 · EV/(EBITDA − capex) for capital-heavy peers · Rule of
  40 = revenue growth % + FCF margin % (TMT lens).
- **canonical**: the three methods (L1 d); comps steps (L2 d); control premium (L3 d); which multiple
  when (L4 d); presenting (L5 d).
- **traps**: "DCF is most accurate" · "Pick the biggest peers" · "Precedents are higher because
  buyers overpay" · "EV/EBITDA is always better than P/E" · "Average the three methods".
- **one_liners**: "Precedents above comps is the price of control; DCF beside them is your
  assumptions on display." · "A multiple is a DCF you haven't written out." · "Pair the value with
  the claimants: EV with pre-interest, equity with post-interest." · "The overlap is the answer; the
  gaps are the analysis."
- **you_may_hear** (`ft-only`): SOTP mechanics and conglomerate discount; liquidation and replacement
  value; LBO valuation as a floor; EV/EBITDAR for retail; regression-based comps; calendarisation
  arithmetic with stub periods.
