# Technicals — the complete syllabus checklist (Loop 21 research note)

_Written 2026-10-08. Question: is there anything a generalist IB technical interview (SA through
first-year analyst, UK and US banks) can ask that our course does not teach? This list is built
from public prep material (sources in `00-syllabus.md`) and banking practice, **not** from the 400Q
text — the hidden-set check is the separate `coverage` eval suite (`scripts/eval/suites/coverage.ts`).
Every row is a concept a candidate must be able to explain or compute, mapped to our content._

Key: ✓ taught (lesson and/or drilled by a question) · ~ named only (cheat-sheet "you may hear",
one passing line) · **GAP** not in the course. Slugs: `L:` lesson, `Q:` question, `CS:` cheat sheet.

## 0 · Finance foundations
| Concept | Status | Where |
|---|---|---|
| Time value of money; why discount | ✓ | L:time-value-of-money, Q:why-discount-future-cash |
| PV of a single sum, annuity, perpetuity, growing perpetuity | ~ | annuity in CS; **growing perpetuity formula taught only inside terminal value** |
| What a discount rate represents; risk ↔ required return; opportunity cost | ~ | Q:what-does-discount-rate-represent; subtopic `discount-rates-and-risk` deferred |
| NPV rule | ✓ | L:pv-npv, Q:npv-rule-and-meaning, Q:compute-npv-new-shop |
| IRR; NPV vs IRR conflicts | ✓ | Q:irr-definition-and-decision, Q:npv-vs-irr-conflict |
| Payback period and its flaws; IRR shortcomings (reinvestment, multiple IRRs, scale) | **GAP** | subtopic `irr-and-payback` deferred; MIRR / multiple IRRs only in CS |
| Rule of 72 | ✓ | CS |
| Real vs nominal rates; inflation consistency | ~ | CS only |
| Interest-rate moves and asset values (bonds, growth stocks) | ✓ | Q:lens-tmt-rates-and-growth-valuations, Q:rates-up-value-down |
| Bond basics: price vs yield, coupon, YTM, duration intuition | **GAP** | not taught anywhere |
| WACC intro; why Kd < Ke; why not all debt | ✓ | L:wacc-intro + 3 Qs |

## 1 · Accounting
| Concept | Status | Where |
|---|---|---|
| The three statements, how they link, which matters most | ✓ | L:three-statements-overview, L:three-statement-links |
| Revenue recognition; accruals vs cash; deferred revenue | ✓ | Q:is-revenue-cash, Q:deferred-revenue-prepayment |
| EBIT vs EBITDA; why EBITDA misleads | ✓ | Q:ebit-vs-ebitda, Q:why-ebitda-misleads |
| Capex vs opex; capitalised R&D / software | ✓ | Q:capex-vs-opex-treatment, lens Qs |
| Stock-based compensation through the statements | ✓ | Q:sbc-real-cost |
| D&A +10 (with tax); asset bought with debt; PIK; asset sale at a gain; impairment; inventory write-off | ✓ | single- and multi-step walkthrough lessons + Qs |
| Working capital: definitions, cash effect, CCC, negative NWC | ✓ | L:working-capital + 6 Qs |
| Prepaid expenses and accrued expenses walkthrough | **GAP** | not drilled |
| Share issuance and share buyback through the statements | **GAP** | dividend and debt walks exist; equity issue/buyback walks do not |
| PP&E write-down vs goodwill impairment vs depreciation — the difference | ~ | Q:impairment-walkthrough (goodwill only) |
| Amortisation of intangibles; tax-deductible vs not | **GAP** | |
| Deferred tax assets/liabilities (book vs tax depreciation); NOLs and how they arise | **GAP** | CS "you may hear" only; Q:ufcf-with-nols uses NOLs in a DCF |
| Leases: IFRS 16 / ASC 842 — what moves where on the three statements | **GAP** | EV consequence taught (Q:leases-in-the-bridge); statement effects not |
| Associates (equity method) and NCI on the statements (consolidation thresholds 20 % / 50 %) | **GAP** | NCI only in the EV bridge |
| Convertible bond — interest, conversion through the statements | **GAP** | dilution side taught in eqv-ev |
| Goodwill: what it is, when it is created, impairment not amortisation | ✓ | Q:goodwill-what-is-it |
| Profitable company going bust; cash vs profit | ✓ | Q:profitable-company-bankrupt |
| IFRS vs US GAAP differences candidates hear (interest/dividends in CFS, LIFO ban, R&D) | ~ | CS one line |
| Bad-debt provisions / allowance for doubtful accounts | **GAP** | |

## 2 · Equity value and enterprise value
| Concept | Status | Where |
|---|---|---|
| Definitions; why two values; share price moves | ✓ | L:equity-and-enterprise-value |
| The bridge: cash, debt, prefs, NCI, pensions, leases | ✓ | L:ev-bridge-basics + 11 Qs |
| Associates / equity investments — subtracted, and why | ~ | CS only |
| NOLs in EV (debate) ; excess vs operating cash; restricted / trapped cash | ~ | Q:trapped-cash-and-ev; NOLs absent |
| Basic vs diluted shares; TSM; options in tranches (in/out of the money) | ✓ | L:diluted-shares, Q:treasury-stock-method, Q:tsm-price-sensitivity |
| Convertibles: if-converted vs debt; in- or out-of-the-money treatment | ✓ | Q:convertible-if-converted |
| What a transaction does to EqV and EV (debt raise, equity raise, dividend, buyback, acquisition paid in cash / stock) | ~ | debt, equity raise, dividend ✓; **buyback and acquisition-funded walks GAP** |
| Book vs market value of equity; when EqV < book | **GAP** | |
| Can EV be negative; can EqV be negative | ~ | EV ✓; equity value negative (market vs book) GAP |
| Pairing metrics with values (EV/EBITDA vs P/E; EV/Revenue; P/BV) and consistency of the numerator/denominator | ✓ | L:pairing-metrics-with-values + Qs |
| Calculations: full EV build from a balance sheet with dilution | ✓ | Q:compute-ev-harbourline, Q:compute-multiples-marlow |

## 3 · Valuation
| Concept | Status | Where |
|---|---|---|
| The methods, ranking, why precedents > comps | ✓ | L:valuation-methodologies |
| Picking peers; LTM vs NTM; median vs mean; spreading comps | ✓ | L:comparable-companies |
| Precedents; control premium; stale precedents; strategic vs financial buyer | ✓ | L:precedent-transactions |
| Which multiple when; why multiples differ; EBIT vs EBITDA multiple and capex | ✓ | L:multiples-and-metrics |
| Football field; presenting a range; DCF vs market gap | ✓ | L:choosing-and-presenting |
| Pre-revenue / negative-earnings companies | ✓ | Q:value-a-pre-revenue-company, Q:which-multiple-negative-earnings |
| Normalising EBITDA: one-offs, add-backs, adjusted EBITDA scepticism | **GAP** | |
| Calendarisation of peers with different year ends | ~ | CS only |
| SOTP and conglomerate discount | ~ | Q:sotp-when-and-how; no lesson |
| Liquidation / replacement cost; LBO analysis as a floor | ~ | Q:liquidation-value-basics; LBO floor CS only |
| Dividend discount model (and why for banks) | ~ | CS only |
| Premiums paid analysis; 52-week high/low; analyst price targets on a football field | **GAP** | |
| EV/EBITDAR, P/BV, P/NAV, EV/reserves — sector multiples named | ~ | CS one line; industry out of scope |
| Implied perpetuity growth from a multiple and vice versa | ✓ | dcf CS cross-check |

## 4 · DCF
| Concept | Status | Where |
|---|---|---|
| Walk me through a DCF; why EV; when the wrong tool | ✓ | L:dcf-overview |
| UFCF build; tax on EBIT; why not net income; NWC sign | ✓ | L:unlevered-free-cash-flow |
| Projections: period length, revenue drivers, capex vs D&A, sanity checks | ✓ | L:projections-and-assumptions |
| Sensitivities; mid-year convention; stub period | ✓ | L:dcf-sensitivities |
| CAPM; beta; ERP and Rf sources; rates up → value down | ✓ | L:cost-of-equity-capm |
| Un/relevering beta; peer beta median | ✓ | Q:unlever-relever-beta |
| WACC; market vs book weights; cost of debt sources; U-shaped WACC | ✓ | L:wacc |
| Terminal value: both methods, ceiling, share of value, normalised terminal year | ✓ | L:terminal-value |
| How leverage changes beta, Ke, Kd and WACC (a recap); WACC after a debt raise | ~ | U-shape taught; **a worked recap question GAP** |
| Preferred stock and convertibles in WACC | **GAP** | |
| Cost of debt for an unrated / private company; YTM vs coupon | ~ | Q:cost-of-debt-sources |
| Negative or very low beta; beta of a cash-rich company | **GAP** | |
| Size premium, country risk premium, currency consistency (cash flows and rates in one currency) | ~ | CS only |
| Private company WACC (no observable beta) | ~ | CS only |
| Levered DCF (FCFE at Ke) vs unlevered; when used | ~ | Q:ufcf-vs-lfcf; no lesson |
| APV | ~ | CS only |
| NOLs in a DCF | ✓ | Q:ufcf-with-nols |
| Effect of an input change on the DCF (capex up, NWC up, tax up, rates up) | ✓ | sensitivities + Qs |
| Discounting the terminal value; the "TV is 70 % of value" critique | ✓ | Q:tv-share-of-value |

## 5 · M&A
| Concept | Status | Where |
|---|---|---|
| Why companies acquire; synergies; talking through a deal | ✓ | L:why-companies-acquire |
| Accretion / dilution; P/E rule; cost of each currency | ✓ | L:accretion-dilution-concepts |
| Merger maths with mixed consideration; foregone interest | ✓ | L:accretion-dilution-calculations |
| Breakeven synergies | ✓ | Q:breakeven-synergies |
| Goodwill calculation; PPA write-ups and DTL | ~ | Q:compute-goodwill-wychwood, Q:ppa-write-ups-and-dtl; subtopic `purchase-price-allocation` deferred |
| Combining balance sheets on day one | **GAP** | |
| New D&A from write-ups hitting pro-forma EPS | **GAP** | |
| Asset vs share purchase (UK framing; tax step-up idea) | ~ | CS only |
| Exchange ratio; fixed vs floating; collars | ~ | CS only |
| Contribution analysis; ownership split after an all-stock deal | **GAP** | |
| Deal protections; break fees; UK Takeover Code basics (schemes vs offers, put up or shut up) | ~ | Q:deal-protections; **UK Code GAP** |
| Minority stake vs control; consolidation | **GAP** | |
| Is accretive always good; EPS vs value | ✓ | Q:is-accretive-always-good |

## 6 · LBO
| Concept | Status | Where |
|---|---|---|
| What an LBO is; good candidate; why leverage boosts returns | ✓ | L:lbo-overview |
| Sources & uses; equity as the plug; max leverage | ✓ | L:sources-and-uses |
| Returns: IRR vs MoM; three levers; mental maths; decomposition | ✓ | L:returns-irr-mom |
| Paper LBO | ✓ | L:paper-lbo-walkthrough |
| Debt tranches (TLA/TLB, HY, mezz, PIK, unitranche); seniority, security, pricing | ~ | Q:debt-tranches-order; subtopic `debt-tranches` deferred |
| Covenants: maintenance vs incurrence; cov-lite; leverage and coverage ratios | ~ | CS only |
| Cash sweep and mandatory amortisation | ~ | Q:cash-sweep-vs-bolt-on |
| Dividend recap | ✓ | Q:dividend-recap-basic |
| Management rollover / sweet equity; fees and transaction costs in S&U | ~ | CS only |
| LBO as a valuation floor (solve for price at a target IRR) | **GAP** | |
| Exit routes | ✓ | Q:exit-routes |
| Credit stats: leverage (Debt/EBITDA), interest cover (EBITDA/interest), FCF/debt | ~ | partial in max-leverage-limits |

## 7 · Restructuring basics (UK extra — PJT / Lazard / HL / Rothschild)
| Concept | Status |
|---|---|
| Signs of distress; liquidity vs solvency | **GAP** |
| A distressed company's options (refinance, amend & extend, asset sale, equity injection, debt-for-equity, administration / Chapter 11) | **GAP** |
| Creditor waterfall and absolute priority | **GAP** |
| Fulcrum security | **GAP** |
| Distressed valuation (EV below debt; recovery %) | **GAP** |

## 8 · Brain teasers and quick maths
| Concept | Status |
|---|---|
| Mental-maths drills (percentages, multiples, compounding) | ~ (LBO mental maths only) |
| Estimation / market sizing method | **GAP** |
| Classic logic puzzles (clock angle, probability basics) | **GAP** |

## Build list (gaps → Loop 21 tasks)
1. **finance-foundations:** lesson `irr-and-payback` (payback, IRR flaws, MIRR named, multiple IRRs) and lesson `discount-rates-and-risk` (risk ↔ return, opportunity cost, real vs nominal, **bond price vs yield**, growing perpetuity).
2. **accounting:** lesson `deferred-taxes-and-other-items` (DTA/DTL, NOLs, IFRS 16 on the statements, associates & NCI, intangibles amortisation, IFRS vs US GAAP). Question top-ups: accrued/prepaid walk, share issue, share buyback, PP&E write-down, convertible conversion, bad-debt provision.
3. **eqv-ev:** lesson `ev-edge-cases` (associates, NOLs, excess cash, book vs market equity, negative equity value). Question top-ups: buyback, acquisition paid with cash / stock / debt, options in tranches.
4. **valuation:** lesson `other-methodologies` (SOTP, DDM, liquidation / replacement, LBO floor, premiums paid, normalising EBITDA, calendarisation). Question top-ups for multiples.
5. **dcf:** lesson `levered-dcf-and-variants` (FCFE, APV, private-company WACC, size / country premia, currency, prefs & converts in WACC). Question top-ups for the discount rate: recap effect, negative beta, unrated Kd, cash-rich beta, WACC with prefs.
6. **ma:** lesson `purchase-price-allocation` (combining balance sheets, write-ups, DTL, new D&A in EPS, asset vs share deal, exchange ratio, contribution analysis, minority vs control, UK Takeover Code basics).
7. **lbo:** lesson `debt-tranches` (tranches, covenants, credit stats, sweep, rollover, fees, LBO as a floor).
8. **lbo (new subtopic):** lesson `distress-and-restructuring`.
9. **fit-behavioural/brain-teasers:** lesson + questions (estimation method, mental-maths drills, logic classics).
10. **Master guide** that consolidates every chapter (Phase C of the loop plan).
