# Chapter 18 — LBO: content spec

_Written 2026-08-28 for `docs/loops/18-technicals-lbo.md`. Topic slug `lbo`. Reader: UK second-year
with one finance module. Depth from `00-syllabus.md`: summer level = what an LBO is, what makes a good
target, sources & uses, the three return levers and IRR / MoM mental maths (`sa-core`); a one-page
paper LBO is `sa-stretch` (Evercore, PJT London, Citi EMEA, LevFin seats). Full debt schedules, cash
sweeps, dividend recaps and covenant maths are `ft-only` — named in the cheat sheet only. Structure
references (never wording): M&I LBO model articles, WSP "Paper LBO", WSO "Paper LBO for SA interviews"
and the London 20-questions thread, Macabacus LBO template pages._

## The one deal used everywhere: Pennard Logistics Ltd
A UK contract-logistics business a sponsor ("Marlow Capital") buys and sells five years later.

| Item | Value | Note |
|---|---|---|
| LTM EBITDA at entry | £50.0m | D&A £10m, so EBIT £40m |
| Entry multiple | 8.0× | EV £400m (cash-free, debt-free) |
| Leverage | 5.0× EBITDA | Debt £250m, blended 6 % cash interest |
| Transaction fees | £10m | Paid from sponsor equity |
| Sponsor equity | £160m | = 400 + 10 − 250 |
| EBITDA growth | 5 % a year | Y1 52.5 · Y2 55.1 · Y3 57.9 · Y4 60.8 · Y5 63.8 |
| Capex = D&A = £10m; ΔNWC = 0; tax 25 % | | keeps FCF = net income |
| Exit multiple | 8.0× (same as entry) | Exit EV £510.4m |

Year-by-year (all £m, rounded to 0.1): interest on opening debt; every pound of FCF repays debt.

| Year | EBITDA | EBIT | Interest | PBT | Tax | NI = FCF | Debt at year end |
|---|---|---|---|---|---|---|---|
| 0 | 50.0 | — | — | — | — | — | 250.0 |
| 1 | 52.5 | 42.5 | 15.0 | 27.5 | 6.9 | 20.6 | 229.4 |
| 2 | 55.1 | 45.1 | 13.8 | 31.3 | 7.8 | 23.5 | 205.9 |
| 3 | 57.9 | 47.9 | 12.4 | 35.5 | 8.9 | 26.6 | 179.3 |
| 4 | 60.8 | 50.8 | 10.8 | 40.0 | 10.0 | 30.0 | 149.3 |
| 5 | 63.8 | 53.8 | 9.0 | 44.8 | 11.2 | 33.6 | 115.7 |

Exit: EV 8.0 × 63.8 = £510.4m; equity = 510.4 − 115.7 = **£394.7m**; MoM = 394.7 / 160 = **2.47×**;
IRR ≈ **20 %** (2.47^(1/5) − 1 = 19.8 %). Value created £234.7m = EBITDA growth 110.4 (13.8 × 8)
+ deleveraging 134.3 (250 − 115.7) + multiple expansion 0 − fees 10.

---

## Lesson 1 — `lbo-overview` · "What an LBO is" (sa-core)
**(a) Question:** "Walk me through an LBO at a high level" / "What makes a good LBO candidate?" — `sa-core`.
**(b) Worked numbers:** the house analogy with Pennard's numbers: buy for £410m (incl. fees) using
£250m of borrowed money and £160m of your own; five years later sell for £510m, having repaid £134m
of the loan from the business's own cash; you get back £395m on £160m.
**(c) Trap:** **"The sponsor pays the debt back."** No — the *company* does, from its own free cash
flow; the debt sits on the target's balance sheet, which is why cash generation matters more than growth.
**(d) Canonical answer (≈80 words):** "A leveraged buyout is when a private-equity sponsor buys a
company using mostly debt — typically 50–70 % of the price — and a minority of its own equity. The
debt is raised against the target's cash flows and sits on its balance sheet. Over a four-to-six-year
hold the company repays debt, grows EBITDA and is sold, ideally at the same or a higher multiple. Because
the equity cheque was small, returns on that equity are magnified — that's the point of the leverage."
**(e) Predict gate:** "Marlow uses £250m debt instead of paying all £410m in equity. If the exit
value is unchanged, what happens to the sponsor's *money multiple*?" Options: goes up (**correct**) ·
goes down · unchanged. Explain: same profit on a smaller cheque.
**(f) Widget prompts** (`lbo_returns`, preset Pennard): "Drag leverage from 5× to 0× — watch MoM fall
towards 1.3× while the value created barely moves." · "Now set exit multiple to 9× — which bar grows?" ·
"Set EBITDA growth to 0 % — is the deal still above 2×?"
**(g) Your turn:** "Sponsor buys 'Kite Bakeries' at £300m EV with £180m debt and £120m equity; sells
after five years for £360m having repaid £90m of debt. MoM and rough IRR?" Model: exit equity 360 − 90
= 270; MoM 2.25×; IRR ≈ 17–18 % (between the 2× ≈ 15 % and 2.5× ≈ 20 % anchors). Rubric: equity at
exit computed net of remaining debt · MoM = exit equity / entry equity · IRR bracketed from the anchors ·
notes that the debt repaid came from Kite's cash flow · states the leverage as a % of price.
**(h) Quick-fire:** Why do sponsors use debt? → to shrink the equity cheque and magnify returns · Who
repays the debt? → the target from its FCF · Typical hold? → 4–6 years · Three exit routes? → sale to a
strategic, secondary buyout, IPO.
**(i) Lens — TMT:** *"Why software is the sponsor's favourite"* — subscription revenue is contracted
and predictable, gross margins are high and capex is small, so a larger share of EBITDA converts to
cash and lenders will fund more turns of leverage (6–7× is common for software take-privates versus
4–5× for a logistics business like Pennard). Explain recurring-revenue "visibility" and why churn is the
number a lender asks about first. Example Q: "Why can a software company support more leverage than a
haulier?" Answer outline: recurring revenue → predictable FCF → higher debt capacity; low capex; caveat
that growth software with negative EBITDA is *not* an LBO candidate — lenders lend against cash, not TAM.
**Lens — Healthcare:** *"Roll-ups, and why biotech is off the table"* — dental chains, vet groups and
care providers are classic sponsor plays: fragmented markets, steady demand, buy-and-build at lower
multiples than the platform. But leverage is capped by reimbursement risk (NHS / insurer tariffs can be
cut) and regulation. A biotech has no EBITDA to lend against and binary trial risk — no lender will fund
it, so it is not an LBO candidate. Example Q: "Would a sponsor LBO a Phase 2 biotech?" Answer: no —
no cash flow to service debt; sponsors do growth equity there instead.
**(j) Follow-up ladder:** high-level walk → "what makes a good target?" (stable cash flows, low capex,
scope to cut costs, strong management, undervalued or non-core) → "what would make you walk away?"
(cyclical earnings, heavy capex, regulatory risk) → "how does the sponsor get paid if there's no exit?"
(dividend recap — name it, `ft-only`).

## Lesson 2 — `sources-and-uses` · "Sources and uses" (sa-core)
**(a) Question:** "Walk me through the sources and uses of an LBO" / "How much equity does the sponsor
put in?" — `sa-core`. Tranches summarised here (`debt-tranches` deferred).
**(b) Worked numbers:** Uses: purchase EV £400m + fees £10m = £410m. Sources: senior term loan £200m
(4.0×, ~5.5 %), second-lien / mezzanine £50m (1.0×, ~8 %), sponsor equity £160m. Blended cost ≈ 6 %.
Equity = 39 % of sources. Show the two-column table balancing.
**(c) Trap:** **"Equity is 100 % minus leverage."** Equity is the *plug* — uses minus debt — so fees,
refinanced existing debt and cash left in the business all change it. Pennard's equity is £160m, not
£150m, because the fees are a use.
**(d) Canonical answer (≈75 words):** "Uses are what the money buys: the purchase price of the equity,
refinancing of the target's existing debt, and fees. Sources are where it comes from: a senior loan,
usually 3–4× EBITDA, possibly a junior or mezzanine layer, and the sponsor's equity, which is the plug
that makes the two sides balance. On Pennard, £410m of uses is funded by £250m of debt and £160m of
equity — about 60 / 40."
**(e) Predict gate:** "Fees rise from £10m to £20m and the lenders won't lend more. Which changes?"
Options: sponsor equity rises by £10m (**correct**) · debt rises · the purchase price falls.
**(f) Widget prompts** (`lbo_returns` S&U tab): "Add £50m of the target's old debt to be refinanced —
where does it appear?" · "Move £50m from equity to mezzanine at 8 % — what happens to Y1 interest?"
**(g) Your turn:** "Target equity price £220m, existing net debt £30m to refinance, fees £6m; lenders
offer 4.5× on £40m EBITDA. Build S&U and state the equity %." Model: uses 220 + 30 + 6 = 256; debt 180;
equity 76 (29.7 %). Rubric: refinanced debt is a use · fees are a use · debt from leverage × EBITDA ·
equity as plug · percentage stated.
**(h) Quick-fire:** Which side is the plug? → sponsor equity · Is refinanced debt a source or a use? →
use · Cheapest tranche? → senior secured · Why not 100 % debt? → interest would exceed cash flow; lenders cap leverage.
**(i) Lens — TMT:** *"Six turns and a covenant-lite loan"* — for a software take-private lenders often
fund 6–7× and use "recurring-revenue" loans sized off ARR when EBITDA is depressed by growth spend.
Show Pennard-style S&U for a £50m-EBITDA SaaS at 6.5× with 35 % equity. Example Q: "Why might a
software LBO have a smaller equity cheque than Pennard?" Answer: predictable cash, higher debt capacity,
lenders comfortable with cov-lite terms.
**Lens — Healthcare:** *"Leverage with a tariff risk"* — a care-home or dental roll-up might get 4–5×,
but lenders discount EBITDA that depends on a single public payer; a "reimbursement haircut" case is
run before sizing debt. Example Q: "What would a lender stress in a care-home LBO?" Answer: fee-rate
cuts, staffing-cost inflation, occupancy — then size debt off the downside EBITDA.
**(j) Follow-up ladder:** table → "why is equity the plug?" → "what happens to returns if you add a
mezzanine layer at 8 %?" (more leverage, more interest, higher risk, higher MoM if the deal works) →
"what is a cash sweep?" (`ft-only`, name only).

## Lesson 3 — `returns-irr-mom` · "Returns: IRR, money multiple and the three levers" (sa-core; mental maths folded in)
**(a) Question:** "How does a sponsor make money in an LBO?" / "What IRR is a 2.5× over five years?" — `sa-core`.
**(b) Worked numbers:** Pennard exit equity £394.7m on £160m: MoM 2.47×, IRR ≈ 20 %. Decomposition:
EBITDA growth 13.8 × 8 = £110.4m; deleveraging £134.3m; multiple expansion £0; fees −£10m. Anchors:
2× / 5 y ≈ 15 % (14.9 %), 2.5× / 5 y ≈ 20 % (20.1 %), 3× / 5 y ≈ 25 % (24.6 %); rule of 72: at 20 %
money doubles in ~3.6 years.
**(c) Trap:** **"Leverage creates value."** It doesn't — it *concentrates* value on a smaller equity
cheque and adds interest cost and risk. Value is created by EBITDA growth, debt paydown from cash flow,
and (if lucky) selling on a higher multiple.
**(d) Canonical answer (≈85 words):** "Returns come from three levers. First, EBITDA growth — the
business is worth more at exit. Second, deleveraging — free cash flow repays debt, so more of the exit
value belongs to equity. Third, multiple expansion — selling on a higher multiple than you paid, which
sponsors don't underwrite. Leverage magnifies whatever those levers produce. On Pennard, growth adds
about £110m, debt paydown about £134m, multiple nothing; £160m becomes £395m — 2.5×, roughly a 20 % IRR."
**(e) Predict gate:** "Pennard exits at 7× instead of 8×. Roughly what happens to the IRR?" Options:
falls to about 15 % (**correct**) · unchanged · rises. Explain: exit EV 446.6, equity 330.9, MoM 2.07× ≈ 15–16 %.
**(f) Widget prompts** (`lbo_returns`): "Set multiple expansion to +1× — how much of the value created
is now 'luck'?" · "Halve EBITDA growth to 2.5 % — which bar shrinks, and does deleveraging shrink too?"
(yes: less FCF) · "Find the hold period where IRR falls below 15 % with everything else fixed."
**(g) Your turn:** "£100m equity becomes £300m after 5 years — IRR? And if it takes 7 years?" Model:
3× / 5 y ≈ 25 %; 3× / 7 y ≈ 17 % (3^(1/7) = 1.17). Rubric: uses the anchor · adjusts for longer hold ·
states MoM first · notes IRR falls with time even if MoM is unchanged · mentions the rule of 72 as a check.
**(h) Quick-fire:** IRR of 2× in 5 y? → ~15 % · MoM ignores what? → time · Which lever do sponsors
*not* underwrite? → multiple expansion · Same MoM, longer hold → IRR? → lower.
**(i) Lens — TMT:** *"Where software returns come from"* — with 6–7× leverage and 90 % cash conversion,
deleveraging is a huge share; pricing power and net-revenue retention drive the EBITDA lever; multiple
expansion is dangerous because software multiples are rate-sensitive. Example Q: "Why did software
LBOs done at 2021 multiples struggle?" Answer: entry multiples high, rates up → exit multiple down;
the third lever went negative.
**Lens — Healthcare:** *"Buy-and-build arithmetic"* — a platform bought at 10× adding clinics at 6×
lowers the blended entry multiple, so "multiple arbitrage" is a real fourth lever in roll-ups; but
integration cost and tariff cuts hit the EBITDA lever. Example Q: "How does a dental roll-up create
value?" Answer: bolt-ons at lower multiples, central costs, then exit the larger platform at a scale multiple.
**(j) Follow-up ladder:** three levers → "which matters most on this deal?" → "what if interest rates
rise 2 % after closing?" (interest up, FCF down, less deleveraging, exit multiple pressure) →
"how would you get to a 25 % IRR here?" (more growth, cheaper entry, or shorter hold).

## Lesson 4 — `paper-lbo-walkthrough` · "The paper LBO" (sa-stretch; new subtopic)
**(a) Question:** "Do a quick paper LBO for me" — `sa-stretch` (EBs, LevFin). Five minutes, no calculator.
**(b) Worked numbers:** the Pennard table above, simplified for talking through: EBITDA 50 → 64 at
5 %; interest ≈ 6 % on £250m falling; FCF ≈ 20 → 34; cumulative paydown ≈ £134m; exit 8× → £510m; equity
£395m; 2.5× ≈ 20 %. Teach the rounding: "call it £20m, £24m, £27m, £30m, £34m — about £135m of debt gone".
**(c) Trap:** **"I'll build the full debt schedule."** In a paper LBO you round aggressively and narrate;
the interviewer wants the *structure* (S&U → FCF → paydown → exit → returns) and sensible numbers, not
precision.
**(d) Canonical answer (≈90 words, as a narrated structure):** "I'd set up sources and uses: 8× £50m
is £400m, plus £10m fees; 5× leverage gives £250m of debt, so £160m of equity. Then free cash flow:
EBITDA less interest, tax, capex and working capital — roughly £20m rising to £34m a year — all used to
repay debt, about £135m over five years. At exit, 8× on £64m of EBITDA is £510m; less £115m of debt
leaves £395m of equity. That's 2.5× on £160m, so around a 20 % IRR."
**(e) Predict gate:** "Before computing: with no multiple expansion and 5 % growth, will the MoM be
closer to 1.5×, 2.5× or 3.5×?" Correct: 2.5× (deleveraging does most of the work).
**(f) Widget prompts** (`paper_lbo` stepper): "Step 1: type EV and equity — the stepper only unlocks
when S&U balances." · "Step 3: enter each year's FCF from the rounded rule; the tolerance is ±£2m." ·
"Step 5: pick the IRR anchor — 2.5× ≈ ?"
**(g) Your turn:** "EBITDA £30m, bought at 7×, 4× leverage, fees £5m, FCF £10m a year flat, exit 7× on
£36m EBITDA after 5 years. Narrate the paper LBO." Model: uses 215; debt 120; equity 95; paydown 50 →
debt 70; exit EV 252; equity 182; MoM 1.9×; IRR ≈ 14 %. Rubric: S&U balances · FCF → debt · exit equity
net of remaining debt · MoM then IRR via anchors · narrated in order without hesitation.
**(h) Quick-fire:** First step? → sources and uses · What do you do with FCF? → repay debt · Exit
equity = ? → exit EV − remaining debt · 2.5× in 5 y ≈ ? → 20 %.
**(i) Lens — TMT:** *"Paper LBO with recurring revenue"* — same steps, but FCF ≈ 90 % of EBITDA
(tiny capex) and leverage 6.5×; show how a SaaS Pennard (same £50m EBITDA) gets to ~3× on a smaller
cheque. Example Q: "Redo the paper LBO with 6.5× leverage and 90 % cash conversion." Answer outline:
debt 325, equity 85, paydown ~200, exit equity ~385 → 4.5× (and why lenders allow it).
**Lens — Healthcare:** *"Paper LBO with bolt-ons"* — add a step: £30m a year of acquisitions at 6×
funded from FCF instead of paydown; EBITDA grows faster, debt does not fall. Example Q: "Is spending
FCF on bolt-ons better than repaying debt?" Answer: if the bolt-on multiple is below the exit multiple,
yes — multiple arbitrage beats deleveraging; but leverage stays high, so risk stays high.
**(j) Follow-up ladder:** paper LBO → "what would you change to hit 25 %?" → "how sensitive is that
to the exit multiple?" (1× = ~£64m of equity ≈ 0.4× MoM) → "what if half the debt is PIK?"
(`ft-only`: interest accrues, less cash interest, more debt at exit).

---

## Question bank (24: 12 sa-core · 8 sa-stretch · 4 lens)
Depth column → the tag written to `questions.tags`: `core` = `depth:sa-core`, `stretch` = `depth:sa-stretch`; lens rows additionally carry `lens:tmt` or `lens:healthcare`. `depth:ft-only` items are never written as questions — they are named in the cheat sheet's "you may hear" box.
Difficulty 1 definition · 2 why · 3 second-order · 4 numerical. Format default `verbal`.

| Slug | Lesson | Kind | Diff | Depth | Format | Model-answer gist | Follow-ups |
|---|---|---|---|---|---|---|---|
| what-is-an-lbo | 1 | concept | 1 | sa-core | verbal | Buy with mostly debt on target's balance sheet; repay from FCF; exit in 4–6 y; leverage magnifies equity return | Who repays the debt? · Why not all equity? |
| ideal-lbo-candidate | 1 | concept | 2 | sa-core | verbal | Stable cash flows, low capex, cost-out scope, strong management, asset base for security, undervalued | Would a cyclical miner qualify? · Why does low capex matter? |
| why-leverage-boosts-returns | 1 | concept | 2 | sa-core | verbal | Same value creation on a smaller cheque; interest is tax-deductible; but risk rises | Does leverage create value? · What limits it? |
| exit-routes | 1 | concept | 1 | sa-core | verbal | Strategic sale, secondary buyout, IPO; dividend recap as partial | Which gives the highest price and why? · Why might an IPO be worse for a sponsor? |
| sources-and-uses-walk | 2 | calculation | 4 | sa-core | fill | Pennard S&U balances at £410m; equity plug £160m | If fees double? · If £30m old debt is refinanced? |
| why-equity-is-the-plug | 2 | concept | 2 | sa-core | verbal | Debt capacity is set by lenders off EBITDA; equity fills the rest | What raises debt capacity? · What is an equity cure? (name only) |
| debt-tranches-order | 2 | concept | 2 | sa-core | order | Senior secured → second lien → mezzanine / HY → equity; cost rises with risk | Why is senior cheaper? · Where does PIK sit? |
| max-leverage-limits | 2 | concept | 3 | sa-core | verbal | Interest coverage, lender appetite, cyclicality, covenant headroom | Why 5× for logistics, 7× for software? · What does a lender look at first? |
| three-return-levers | 3 | concept | 2 | sa-core | verbal | EBITDA growth, deleveraging, multiple expansion; leverage amplifies | Which is underwritten? · Which dominated Pennard? |
| irr-vs-mom | 3 | concept | 2 | sa-core | verbal | MoM ignores time; IRR is annualised; both reported | Same MoM, longer hold → IRR? · Which do LPs care about more? |
| irr-mental-maths | 3 | calculation | 4 | sa-core | fill | 2× ≈ 15 %, 2.5× ≈ 20 %, 3× ≈ 25 % over 5 y; rule of 72 | 3× in 7 y? · 2× in 3 y? |
| pennard-returns | 3 | calculation | 4 | sa-core | fill | Exit equity 394.7; MoM 2.47×; IRR ≈ 20 % | Exit at 7×? · Hold 7 years? |
| returns-decomposition | 3 | calculation | 4 | sa-stretch | fill | Growth 110.4 · deleveraging 134.3 · multiple 0 · fees −10 | Which lever would rising rates hit? · What if entry was 9×? |
| rates-rise-after-close | 3 | concept | 3 | sa-stretch | verbal | Interest up → FCF down → less paydown; exit multiples compress; hedges mitigate | How do sponsors hedge? · Which tranche is floating? |
| paper-lbo-pennard | 4 | calculation | 4 | sa-stretch | fill | Narrated five-step structure to 2.5× / 20 % | To reach 25 %? · With PIK on half the debt? |
| paper-lbo-order | 4 | calculation | 2 | sa-stretch | order | S&U → FCF → paydown → exit EV → exit equity → MoM → IRR | Where do fees enter? · What if there is cash at exit? |
| spot-the-error-paper-lbo | 4 | calculation | 3 | sa-stretch | spot | A walk that subtracts *entry* debt at exit instead of remaining debt | Why is the difference exactly the paydown? · What if debt rose? |
| exit-multiple-sensitivity | 4 | calculation | 4 | sa-stretch | fill | ±1× on £63.8m EBITDA = ±£63.8m equity ≈ ±0.4× MoM | Why do sponsors assume flat multiples? · Which is riskier: exit multiple or growth? |
| dividend-recap-basic | 1 | concept | 3 | sa-stretch | verbal | Re-lever to pay a dividend; returns cash early, raises risk (name only beyond that) | Effect on IRR vs MoM? · Why do lenders allow it? |
| cash-sweep-vs-bolt-on | 4 | concept | 3 | sa-stretch | verbal | Repaying debt vs buying at lower multiples; arbitrage vs risk | When is a bolt-on better? · What does it do to leverage? |
| tmt-leverage-capacity | 1 | concept | 3 | sa-core | verbal | `lens:tmt` — recurring revenue → higher debt capacity; churn is the lender's question | Why not growth software? · What is an ARR loan? |
| tmt-rate-sensitivity | 3 | concept | 3 | sa-core | verbal | `lens:tmt` — high-multiple entries + rising rates → negative third lever | How to protect against it? · Which lever still works? |
| hc-rollup-arbitrage | 3 | calculation | 3 | sa-core | verbal | `lens:healthcare` — platform at 10×, bolt-ons at 6×, exit at 10×: value from blended entry | What breaks the arithmetic? · What is a synergy here? |
| hc-why-not-biotech | 1 | concept | 2 | sa-core | verbal | `lens:healthcare` — no EBITDA, binary risk, no lender; growth equity instead | What healthcare *is* LBO-able? · What caps leverage there? |

Difficulty mix 6 / 7 / 6 / 5 ≈ 25 / 29 / 25 / 21 — within ±15 %. 7 questions carry `numbers`.

## Cheat sheet (`content/cheatsheets/lbo.json`)
- **Formulas:** debt = leverage × EBITDA · equity = uses − debt · FCF = EBITDA − interest − tax − capex
  − ΔNWC · exit equity = exit multiple × exit EBITDA − remaining debt · MoM = exit equity / entry equity
  · IRR = MoM^(1/years) − 1 · rule of 72: doubling years ≈ 72 / IRR.
- **Anchors:** 2× / 5 y ≈ 15 % · 2.5× ≈ 20 % · 3× ≈ 25 % · 2× / 3 y ≈ 26 %.
- **Canonical:** what an LBO is · good candidate · sources & uses · three levers · paper LBO narration.
- **Traps:** the sponsor doesn't repay the debt · leverage doesn't create value · equity is the plug ·
  subtract *remaining* debt at exit · a paper LBO is narrated and rounded.
- **One-liners:** "Debt shrinks the cheque; cash flow shrinks the debt; the exit pays the equity."
- **You may hear (ft-only):** cash sweep · PIK toggle · covenants (maintenance vs incurrence) ·
  dividend recap mechanics · management rollover and sweet equity · unitranche.

## `paper_lbo` template rows (printable, `template` block)
1. Sources & uses (EV, fees, refinanced debt · senior, junior, equity) 2. Assumptions (growth, margin,
tax, capex, interest) 3. Five-year FCF grid (EBITDA, interest, tax, capex, ΔNWC, FCF) 4. Debt roll
(opening, repaid, closing) 5. Exit (multiple × EBITDA, less debt, equity) 6. Returns (MoM, IRR anchor,
rule-of-72 check) 7. Sensitivity (exit multiple ±1×, growth ±2 %).
