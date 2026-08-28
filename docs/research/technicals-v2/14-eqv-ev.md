# Chapter 14 — Equity value vs enterprise value: content spec

_Written 2026-08-28 for Loop 14 (`docs/loops/14-technicals-eqv-ev.md`). Topic slug `eqv-ev` (free topic).
Scope: `00-syllabus.md` § 2 row "EqV vs EV" — 4 lessons, 18 `sa-core` + 4 `sa-stretch` + 4 lens questions.
Every number below is invented. Sources are structural references only — nothing is quoted._

## Chapter company: Harbourline plc (UK logistics)
Fixed for every lesson; the existing approved lesson `ev-bridge-basics` already uses the first block.

| Item | £m unless stated | Item | £m |
|---|---|---|---|
| Share price | £4.20 | Revenue | 1,400 |
| Basic shares | 240m | EBITDA (post-IFRS 16, i.e. before lease cost) | 170 |
| Options | 20m at £2.10 strike | Depreciation of right-of-use assets | 12 |
| Diluted shares (TSM) | 250m | EBIT | 120 |
| Borrowings | 500 | Interest | 25 |
| Cash | 120 | Tax rate | 25 % |
| Preferred shares | 30 | Net income | 71 |
| Non-controlling interest | 25 | Unfunded pension deficit (stretch item) | 35 |
| Lease liabilities (IFRS 16) | 45 | Lease cash cost (old "rent") | 12 |

Derived: EqV = 4.20 × 250 = **1,050**; net debt = 380; EV (base bridge) = **1,530**; with pension
deficit **1,565**; EV/EBITDA = 1,530 / 170 = **9.0×**; P/E = 1,050 / 71 = **14.8×**; EV/Revenue 1.09×.
Note for authors: `ev-bridge-basics` states net income as unspecified — do not contradict it; the
71 figure appears first in `pairing-metrics-with-values`.

## Lesson map
| # | Subtopic slug (exists) | Lesson title | Widget | Status |
|---|---|---|---|---|
| 1 | `equity-and-enterprise-value` | What each value means, and who it belongs to | `ev_bridge` (preset "Harbourline", sliders locked to cash & debt only) | new |
| 2 | `ev-bridge-calculations` | The EqV → EV bridge (existing `ev-bridge-basics`) | `ev_bridge` (full) + `lease_toggle` | v2 additions only |
| 3 | `diluted-shares` | Diluted shares: the treasury-stock method | `tsm_dilution` | new |
| 4 | `pairing-metrics-with-values` | Pairing metrics with the right value | `multiple_matcher` | new |
| — | `ev-edge-cases` | — | — | `deferred: true` (pensions / NCI vs equity method covered in cheat-sheet "you may hear") |

Teaching order 1 → 2 → 3 → 4. Lesson 1 is deliberately number-light (one formula, one picture);
lesson 2 carries the arithmetic; 3 fixes the share count that lesson 2 assumed; 4 closes with *why*
the two values exist at all — the multiple-consistency rule interviewers actually probe.

---

## Lesson 1 — `equity-and-enterprise-value`: What each value means, and who it belongs to

**(a) Question answered:** "What's the difference between equity value and enterprise value?" — `sa-core`.
Also sets up "which one does a buyer pay?"

**(b) Worked numbers:** Harbourline: price £4.20 × 250m = £1,050m equity value. Borrowings 500, cash
120. Show *only* EqV and the idea that EV = EqV + net debt = 1,430 before the smaller claims (the full
bridge is lesson 2). Everyday analogy: buying a house with a mortgage attached — the house price is
the EV, your deposit is the equity, and the mortgage is the debt the buyer must clear.

**(c) Trap:** **"Enterprise value is just a fancy name for market cap."** Market cap is *equity* value
(and usually the basic-share version at that). EV adds the claims that rank ahead of shareholders and
strips out cash; two companies with identical market caps can have very different EVs.

**(d) Canonical answer (≈75 words):** Equity value is what the shares are worth — share price times
diluted shares — so it belongs to shareholders only. Enterprise value is what the whole operating
business is worth to everyone who has financed it: shareholders, lenders and other claim-holders.
You move from one to the other by adding debt-like claims and subtracting cash. For Harbourline the
shares are worth about £1.05bn, but with £380m of net debt the business as a whole is worth roughly
£1.4bn before smaller claims.

**(e) Predict gate:** "Harbourline's share price doubles overnight; nothing else changes. What happens
to EV?" Options: *EV doubles* / *EV rises by £1,050m* (correct) / *EV is unchanged*. Explain: EqV
rises by £1,050m and every other bridge item is untouched, so EV rises by the same £1,050m — which is
less than doubling because net debt does not move.

**(f) Widget prompts (`ev_bridge`, preset with cash and debt sliders only):** (1) "Drag cash up to
£500m — watch EV fall while EqV stays put. Why?" (2) "Set debt to zero. Is EV now smaller than EqV?
What does that say about this company?" (3) "Find the cash level at which EV equals EqV."

**(g) Your turn:** "Kestrel Media plc trades at £8.00 with 60m diluted shares, £90m of debt and
£150m of cash. Which value is bigger, and by how much?" Model: EqV 480; net debt −60; EV 420. EV is
£60m smaller because Kestrel holds more cash than debt. Rubric: EqV computed with diluted shares;
net cash recognised as negative net debt; EV < EqV stated with the reason; one sentence on what a
buyer actually pays.

**(h) Quick-fire:** Q: Who does equity value belong to? A: Ordinary shareholders only. · Q: Who does
EV belong to? A: All capital providers together. · Q: Does share price move EV? A: Yes — one-for-one
through equity value. · Q: A company with net cash: EV bigger or smaller than EqV? A: Smaller.

**(i) Lens variants:**
- *TMT — "Why big tech's EV is smaller than its market cap":* Many software and platform companies
  carry more cash than debt, so net debt is negative and EV sits below equity value. Interviewers
  use this to check you understand the sign, not just the formula. Example_q: "A software company
  has a £20bn market cap, £1bn of debt and £6bn of cash — what is its EV and why is it lower?"
  Answer outline: EV = 20 + 1 − 6 = £15bn; a buyer gets £6bn back on day one.
- *Healthcare — "A biotech with no revenue and a £900m equity value":* After a fundraising a biotech
  may hold £400m of cash against no debt; EV of £500m is the market's price for the pipeline alone.
  Example_q: "Why can a loss-making biotech have a large equity value?" Outline: equity value prices
  future cash flows from the pipeline; cash on hand is real value on top; EV isolates the pipeline.

**(j) Follow-up ladder:** definition → "which one does an acquirer pay?" (both: pays EqV for the
shares, inherits the rest) → "so why do we even bother with EV?" (comparability across capital
structures — sets up lesson 4) → "can EV ever be below zero?" (lesson 4).

Sources (structure only): M&I "enterprise value vs equity value"; WSP EV bridge explainer; CFI
enterprise value page; WSO London top-20 thread.

---

## Lesson 2 — `ev-bridge-calculations`: The EqV → EV bridge (v2 additions to `ev-bridge-basics`)

The approved lesson keeps its text. Loop 14 adds:

**(a)** Same question ("walk me through the bridge") — `sa-core`; pension add-on is `sa-stretch`.

**(b)** Numbers unchanged (EV 1,530). Add a stretch line: unfunded pension deficit £35m → 1,565, with
the rule "add it if the company must fund it from cash — treat it like debt".

**(c) Trap** (existing) stays; add one sentence on the net-debt double-count.

**(d) Canonical answer** — existing (45 s).

**(e) Predict gate (new, before the widget):** "Harbourline uses £100m of its cash to repay £100m
of borrowings. Equity value and EV?" Options: *both fall* / *EqV unchanged, EV falls* / *both
unchanged* (correct). Explain: net debt is 380 either way; the shares are worth the same.

**(f) Widget prompts:** `ev_bridge` (full): (1) "Push leases to zero and note the EV — then explain
which EBITDA you would pair it with." (2) "Set NCI to £100m — why does EV go *up* when we own less
of something?" `lease_toggle` (new): (3) "Toggle 'capitalise leases' off: EBITDA drops by £12m and
EV drops by £45m — does EV/EBITDA rise or fall?" (9.0× → 1,485 / 158 = 9.4×).

**(g) Your turn** — existing (Marlow Foods). Add a second, stretch variant: "…and Marlow discloses a
£25m unfunded pension deficit" → 980.

**(h) Quick-fire** — existing four pairs kept.

**(i) Lens variants:**
- *TMT — "Convertibles and the bridge":* Convertible bonds are debt until they are in the money;
  then they are treated as shares (lesson 3). Tech companies issue them often. Example_q: "A
  company has a £200m convertible with a £5 conversion price and the share is at £7 — is it debt or
  equity in your bridge?" Outline: in the money → if-converted → add the new shares to EqV, drop the
  debt.
- *Healthcare — "Milestones: debt-like or not?":* Contingent milestone payments owed to a partner
  are not debt on the balance sheet, but a careful analyst asks whether they are near-certain and
  cash-settled; if so, treat them as debt-like. Example_q: "Would you include a £50m milestone due
  on approval in EV?" Outline: probability-weight it; state the assumption out loud.

**(j) Follow-up ladder:** bridge → "why add NCI?" → "what if leases are already in EBITDA?" →
"the company pays a £50m dividend — EqV and EV?" → "raises £100m equity and keeps it as cash?"
(EqV +100, EV unchanged) → "buys a £100m machine with that cash?" (EqV unchanged, EV +100).

Sources: WSP EV bridge; M&I "IFRS 16 leases and enterprise value"; CFI net debt; financefluency
public curriculum outline (lesson list only).

---

## Lesson 3 — `diluted-shares`: Diluted shares — the treasury-stock method

**(a)** "How do you calculate diluted shares?" / "Why diluted rather than basic?" — `sa-core`;
convertibles if-converted — `sa-stretch`.

**(b) Worked numbers:** Harbourline: basic 240m; 20m options, strike £2.10, price £4.20.
Proceeds = 20 × 2.10 = £42m. Shares repurchased = 42 / 4.20 = 10m. Net new shares = 20 − 10 = 10m.
Diluted = 240 + 10 = **250m** (matches lesson 2). Stretch: a £60m convertible with a £3.00 conversion
price → 20m shares if converted; in the money at £4.20, so add 20m shares and remove the £60m of debt.

**(c) Trap:** **"Options add their full count to the share number."** Only the *net* shares count:
the company receives the strike price and, by convention, uses it to buy shares back at the market
price. Out-of-the-money options add nothing.

**(d) Canonical answer (≈80 words):** Start with basic shares, then add the net effect of in-the-money
options using the treasury-stock method: assume the options are exercised, the company collects the
strike price and spends it repurchasing shares at the current price; the difference is the dilution.
Out-of-the-money options are ignored. Convertibles that are in the money are treated as converted —
add the shares, remove the debt. For Harbourline, 20m options at £2.10 against a £4.20 share add 10m
net shares, taking 240m basic to 250m diluted.

**(e) Predict gate:** "The share price rises from £4.20 to £8.40. Do the same 20m options dilute
more, less or the same?" Options: *more* (correct) / *less* / *same*. Explain: proceeds are fixed at
£42m but buy back only 5m shares now, so net dilution is 15m.

**(f) Widget prompts (`tsm_dilution`):** (1) "Slide the price below £2.10 — what happens to the
diluted count?" (2) "Find the price at which the options dilute by exactly 5 %." (3) Stretch: "Turn on
the convertible — watch £60m leave the debt bar and 20m shares arrive."

**(g) Your turn:** "Kestrel Media: 60m basic shares, 9m options at £5.00, share price £8.00, plus 3m
restricted stock units." Model: proceeds 45; repurchase 45 / 8 = 5.625m; net 3.375m; RSUs add all 3m;
diluted 66.375m ≈ 66.4m. Rubric: TSM applied only to options; RSUs added in full (no proceeds);
correct arithmetic; states the "out of the money → ignore" rule.

**(h) Quick-fire:** Q: Strike above share price — effect? A: None; out of the money. · Q: Why does
the company "buy back" shares in TSM? A: Convention: the option proceeds are assumed to be spent
repurchasing shares, so only net dilution counts. · Q: RSUs — TSM or full count? A: Full count; no
strike, no proceeds. · Q: In-the-money convertible — debt or shares? A: Shares (if-converted) and
remove the debt.

**(i) Lens variants:**
- *TMT — "Option-heavy cap tables":* Growth companies pay in stock, so 10–15 % dilution from options
  and RSUs is normal; ignoring it overstates the share price you are implying. Example_q: "Why might
  a software company's diluted share count be far above its basic count?" Outline: stock comp,
  early-employee options, convertibles; TSM for options, full count for RSUs.
- *Healthcare — "Warrants after a biotech fundraising":* Biotechs often attach warrants to equity
  raises; treat warrants exactly like options. Example_q: "A biotech issued 5m warrants at £1 with
  the share at £3 — diluted effect?" Outline: proceeds 5; repurchase 1.67m; net 3.33m.

**(j) Follow-up ladder:** method → "why net, not gross?" → "what if the share price falls?" →
"convertible above/below conversion price?" → "does dilution change EV or only EqV?" (EqV, and
therefore EV by the same amount — unless a convertible moves from debt to shares, which shifts
between bridge lines).

Sources: WSP treasury stock method; M&I diluted shares; CFI TSM page.

---

## Lesson 4 — `pairing-metrics-with-values`: Pairing metrics with the right value (and negative EV)

**(a)** "Why is EV/EBITDA used rather than equity value/EBITDA?" / "Which multiples use EV and which use
equity value?" / "Can EV be negative?" — all `sa-core`.

**(b) Worked numbers:** Harbourline EV 1,530; EBITDA 170 → **9.0×**. EqV 1,050; net income 71 →
**14.8×**. Wrong pairing to show and reject: 1,050 / 170 = 6.2× ("equity value over EBITDA") — mixes
shareholders' value with a profit that also belongs to lenders. Rule: if the metric is *before*
interest (revenue, EBITDA, EBIT, unlevered FCF) it belongs to everyone → EV; if it is *after* interest
(net income, EPS, levered FCF, book equity) it belongs to shareholders → equity value. Negative EV:
Kestrel Media variant with cash 600, debt 90, EqV 480 → EV −30; the market is valuing the operating
business at less than nothing — usually distress, a cash pile it is expected to burn, or mispricing.

**(c) Trap:** **"P/E and EV/EBITDA are interchangeable — pick whichever is handy."** They answer
different questions: EV/EBITDA is capital-structure-neutral and compares operating businesses; P/E is
after interest and tax, so two identical businesses with different leverage show different P/Es.

**(d) Canonical answer (≈85 words):** Match the numerator to whoever the denominator belongs to.
EBITDA, EBIT and revenue are earned before interest, so they belong to all capital providers and pair
with enterprise value; net income and EPS come after interest, so they belong to shareholders and
pair with equity value. Mixing them makes a leveraged company look cheap or expensive for no
operating reason. Harbourline trades on 9.0× EV/EBITDA and 14.8× P/E; dividing equity value by EBITDA
would give a meaningless 6.2×.

**(e) Predict gate:** "Two identical companies; one has £500m of debt, the other none. Which multiple
differs between them?" Options: *EV/EBITDA* / *P/E* (correct) / *both*. Explain: EV and EBITDA are
both capital-structure-neutral; net income is after interest.

**(f) Widget prompts (`multiple_matcher`):** (1) "Drag every metric to EV or Equity — the widget
colours mismatches red; read the reason on each." (2) "Now drag Harbourline's numbers in and read
off both multiples." (3) "Set cash to £1,200m — when does EV turn negative, and what would that mean?"

**(g) Your turn:** "Marlow Foods: EV £955m, equity value £1,000m, EBITDA £95m, EBIT £70m, net income
£48m, revenue £820m. Give EV/EBITDA, EV/EBIT, EV/Revenue and P/E, and say which one you'd lead with
for a food producer." Model: 10.1×; 13.6×; 1.16×; 20.8×; lead with EV/EBITDA (capital-structure-
neutral, D&A differences between producers are large). Rubric: four correct pairings; arithmetic
within rounding; one justified choice; notes that P/E > EV/EBITDA here partly because of net cash.

**(h) Quick-fire:** Q: Unlevered FCF pairs with? A: EV. · Q: Book value of equity pairs with? A:
Equity value (P/B). · Q: Can EV be negative? A: Yes — cash exceeding equity value plus other claims;
rare, signals distress or expected cash burn. · Q: Why is EV/Revenue used at all? A: When EBITDA is
negative or not meaningful — early-stage or loss-making companies.

**(i) Lens variants:**
- *TMT — "EV/Revenue and EV/ARR":* Loss-making software has no EBITDA to divide by, so EV/Revenue
  (or EV/ARR for subscription businesses) is the working multiple; it still pairs with EV because
  revenue is pre-interest. Example_q: "Why do investors quote EV/ARR for SaaS companies?" Outline:
  recurring revenue is the best available proxy for future cash flow; growth and margin move the
  multiple; still EV, never equity value.
- *Healthcare — "When EV is near zero for a biotech":* Cash-rich, pre-revenue biotechs can trade at
  an EV close to zero or negative after a setback; the multiple framework breaks and rNPV (chapter
  15/16 lens) takes over. Example_q: "A biotech's EV is −£40m — what is the market saying?" Outline:
  pipeline valued below the cash it will burn; possible catalyst mispricing.

**(j) Follow-up ladder:** pairing rule → "why not P/E for everything?" → "when would you use
EV/Revenue?" → "negative EV — what would you check first?" (cash burn, liabilities off balance
sheet, restricted cash) → "which multiple for a bank?" (P/E, P/B — EV breaks; points to the FIG module).

Sources: M&I "EV/EBITDA vs P/E"; WSP valuation multiples overview; CFI EV/EBITDA; WSO "beyond the
guide" thread (negative EV, multiples consistency).

---

## Question bank (28 rows = 20 core + 4 stretch + 4 lens; 26 new files + 2 that already exist)
Depth column → the tag written to `questions.tags`: `core` = `depth:sa-core`, `stretch` = `depth:sa-stretch`; lens rows additionally carry `lens:tmt` or `lens:healthcare`. `depth:ft-only` items are never written as questions — they are named in the cheat sheet's "you may hear" box.
Difficulty 1 definition · 2 why · 3 second-order · 4 numerical/edge. Format default `verbal`.
Every question: `key_points` 3–6, `follow_ups` 2, `weak_answer_note`. Numbers reuse the chapter data.

| Slug | Lesson | Kind | Diff | Depth | Format | Model-answer gist | Follow-ups |
|---|---|---|---|---|---|---|---|
| `what-is-enterprise-value` (exists) | 1 | concept | 1 | core | verbal | value of the operating business to all providers | who pays it? / relation to EqV |
| `what-is-equity-value` | 1 | concept | 1 | core | verbal | price × diluted shares; shareholders' claim | basic vs diluted? / vs market cap |
| `why-two-values` | 1 | concept | 2 | core | verbal | comparability across capital structures | which for a buyer? / which for multiples? |
| `share-price-doubles-ev` | 1 | concept | 3 | core | spot | EV rises by EqV increase, not ×2 | what if debt also refinanced? / cash unchanged? |
| `walk-me-through-the-bridge` | 2 | concept | 2 | core | order | EqV + debt − cash + prefs + NCI + leases | why NCI added? / net debt double count |
| `compute-ev-harbourline` (exists) | 2 | calc | 4 | core | fill | 1,530 | leases excluded? / dividend |
| `why-subtract-cash` | 2 | concept | 2 | core | verbal | buyer uses it against inherited debt | restricted cash? / operating cash? |
| `why-add-nci` | 2 | concept | 3 | core | verbal | consistency with 100 %-consolidated EBITDA | equity-method associates? / minority put |
| `leases-in-the-bridge` | 2 | concept | 3 | core | verbal | IFRS 16 liability added if EBITDA is pre-lease | EV/EBITDA before vs after / comps mixed standards |
| `debt-raise-ev-eqv` | 2 | calc | 3 | core | verbal | both unchanged | then buys a machine? / pays interest a year later? |
| `dividend-ev-eqv` | 2 | calc | 3 | core | verbal | EqV −50, EV unchanged | share buyback? / special dividend funded by debt? |
| `equity-raise-kept-as-cash` | 2 | calc | 3 | core | verbal | EqV +100, EV unchanged | spends it on capex / on an acquisition |
| `pension-deficit-in-ev` | 2 | concept | 3 | stretch | verbal | debt-like if cash-funded; 1,565 | tax effect? / surplus? |
| `net-debt-given-not-cash` | 2 | calc | 4 | core | fill | avoid double count; Marlow 955 | net cash sign / leases separately |
| `why-diluted-shares` | 3 | concept | 2 | core | verbal | shareholders-in-waiting; buyer pays for them | OTM options? / RSUs? |
| `treasury-stock-method` | 3 | calc | 4 | core | fill | 240 + 20 − 10 = 250 | price doubles? / strike above price? |
| `tsm-price-sensitivity` | 3 | concept | 3 | core | verbal | higher price → more net dilution | why proceeds fixed? / cap on dilution? |
| `convertible-if-converted` | 3 | calc | 4 | stretch | fill | 20m shares in, £60m debt out | out of the money? / effect on EV |
| `rsus-and-warrants` | 3 | concept | 2 | stretch | verbal | RSUs full count; warrants like options | performance shares? / expired warrants |
| `ev-multiples-vs-equity-multiples` | 4 | concept | 2 | core | verbal | pre-interest → EV; post-interest → EqV | FCF variants? / book value? |
| `why-ev-ebitda-not-pe` | 4 | concept | 3 | core | verbal | capital-structure-neutral | when P/E better? / EBITDA flaws |
| `compute-multiples-marlow` | 4 | calc | 4 | core | fill | 10.1× / 13.6× / 20.8× | which to lead with / net cash effect on P/E |
| `can-ev-be-negative` | 4 | concept | 3 | core | verbal | yes; cash > EqV + claims; distress or burn | first checks? / what multiple then? |
| `identical-companies-different-leverage` | 4 | concept | 3 | stretch | spot | P/E differs, EV/EBITDA same | tax shield effect on P/E / at what leverage does it flip |
| `lens-tmt-net-cash-ev` | 1/4 | calc | 3 | core | verbal (`lens:tmt`) | EV = 20 + 1 − 6 = 15bn | why hold so much cash / EV/Revenue pairing |
| `lens-tmt-convertible-bridge` | 2/3 | concept | 4 | stretch (`lens:tmt`) | verbal | ITM → if-converted | hedged convertibles? / accounting vs bridge |
| `lens-hc-negative-ev-biotech` | 4 | concept | 3 | core (`lens:healthcare`) | verbal | market values pipeline below cash burn | catalysts / rNPV instead |
| `lens-hc-milestones-debt-like` | 2 | concept | 4 | stretch (`lens:healthcare`) | verbal | probability-weight; state assumption | receivable milestones? / royalty streams |

Counts: 28 rows = 24 non-lens (20 `core` + 4 `stretch`) + 4 `lens`. Two of the 20 core questions
already exist as approved files (`what-is-enterprise-value`, `compute-ev-harbourline`) and are only
retagged, so the loop writes **26 new question files**. Flashcards derive from the 24 non-lens rows.
Difficulty mix across the 24 non-lens: 1 ×2, 2 ×7, 3 ×10, 4 ×5 → 8 / 29 / 42 / 21 % — level 3 is
over the ±15 % band; swap `tsm-price-sensitivity` and `leases-in-the-bridge` to difficulty 2 if the
eval flags it (the gate only bites at n ≥ 40, so the chapter alone will not trigger it).
`numbers` on: compute-ev-harbourline, net-debt-given-not-cash, treasury-stock-method,
convertible-if-converted, compute-multiples-marlow, lens-tmt-net-cash-ev, debt-raise/dividend/
equity-raise (deltas) → 9 / 26 ≥ 30 %.

## Cheat sheet (`content/cheatsheets/eqv-ev.json`)
- **Formulas:** `EqV = P \times N_{diluted}` · `EV = EqV + Debt - Cash + Pref + NCI + Leases (+ Pension\ deficit)` ·
  `N_{diluted} = N_{basic} + N_{opt} - \frac{N_{opt} \cdot K}{P}` (ITM options only) · `EV/EBITDA`, `P/E = EqV / NI`.
- **Canonical Qs:** difference between the two values; walk the bridge; why subtract cash; why add
  NCI; why diluted; TSM; which multiples pair with which; can EV be negative.
- **Traps:** market cap ≠ EV; adding cash; subtracting NCI; gross option count; net debt double
  count; leases without matching EBITDA; P/E to compare differently-levered companies.
- **One-liners:** "Equity value is the shareholders' slice; enterprise value is the whole pie."
  "Pre-interest metric → EV; post-interest → equity value." "Options dilute only when in the money,
  and only by the net share count."
- **You may hear (ft-only):** equity-method investments subtracted from EV; restricted cash; minority
  put options; convertible hedges; unfunded pension tax shield.

## Loop 14 authoring notes
- Lesson 2 edits must keep `ev-bridge-basics` approvable: add `predict` before the existing widget,
  `lens` ×2 (`after-mechanics`, `before-your-turn`), a `lease_toggle` widget after `worked_calc`, and
  one `fill_numbers` (the Marlow bridge with 3 blanks). Do not alter the canonical answer.
- Lesson 1 is ≤ 8 minutes and carries no `scenario`; lessons 3–4 ≤ 10 minutes.
- Widget props: `tsm_dilution` `{basic: 240, options: 20, strike: 2.1, price: 4.2, convertible: {face: 60, conv_price: 3}}`;
  `lease_toggle` `{ebitda_pre_lease: 170, lease_cost: 12, lease_liability: 45, ev_ex_leases: 1485}`;
  `multiple_matcher` `{metrics: [revenue, ebitda, ebit, unlevered_fcf, net_income, eps, levered_fcf, book_equity], values: {ev: 1530, eqv: 1050, ebitda: 170, ni: 71, revenue: 1400, ebit: 120}}`.
