# Technicals v2 — interactive teaching: comparators, pedagogy, widget catalogue (research note)

_Written 2026-08-28 for Loops 11–18. Question: what does a best-in-class interactive lesson on an IB
technical contain, and how do we build it in this codebase (Next 16, React 19, Tailwind 4, hand SVG)?_

## 1. What exists and what each interaction teaches
- **financefluency.co.uk** — 39-lesson curriculum (free = Accounting + EV), practice, SRS flashcards,
  firm banks tagged by stage, an on-device video mock (audio-only transcription, pace / filler / eye
  contact), and a *Live DCF Workshop* where each step is marked as you build. Teaches well: the
  **build-and-get-marked** loop and **say-it-aloud** practice. The specific lesson widgets named in our
  earlier note (three-statement animator, EV bridge, filings toggle) sit behind login — treat as reported.
- **Wall Street Prep / BIWS / Macabacus** — static worked examples with canonical numbers (D&A +10 →
  NI −7 → cash +3 at 30 % tax) and Excel templates. Authoritative, zero on-page interactivity. The
  gap: *worked examples made manipulable*.
- **Retail DCF calculators** (Alpha Spread, ValueInvesting.io, TIKR, Finbox, Tickzen) — sliders for
  growth / margin / WACC / g, a WACC × g heatmap, sometimes a reverse DCF. Teach *sensitivity
  intuition* (TV dominates; WACC and g interact non-linearly) but are tools, not lessons.
- **Explorable explanations** (Bret Victor, Nicky Case, distill.pub) — prose interleaved with a live
  model; every claim testable by a control. Case's heuristics: text for abstractions, graphs for
  relationships, animation for sequences, interactives only for *systems*; start small, build big;
  see → model → apply; **cognitive gates** (withhold the punchline until the reader acts); avoid
  pointless interactivity. IB technicals are systems of cause and effect — a near-perfect fit.
- **Brilliant.org** — no video; each screen is a small manipulable diagram plus a question that must
  be answered before the next unlocks. Forced participation with immediate feedback. **This is the
  structural template for our lessons.**
- **Khan Academy** — video-first; its hint ladder is a cheap faded-example pattern.
- **AI mock platforms** (IB IQ etc.) — rubric converging on *clarity, depth, structure, technical
  correctness*; we add *numbers used correctly* (our grader already caps accuracy on wrong numbers).

## 2. Pedagogy evidence → design rules
1. **Worked → faded → free problems** (Sweller; Renkl & Atkinson — guidance-fading). Every walk starts
   fully worked, then the CFS add-back is blanked, then the tax effect, then everything. → `fill_numbers`.
2. **Retrieval practice** (Roediger & Karpicke 2006; Karpicke & Blunt 2011; Dunlosky 2013 — practice
   testing and distributed practice rated "high utility"). After each widget the learner *reproduces*
   the chain, typed or spoken. → `your_turn` + drills; MCQ only as a gate.
3. **Spacing and interleaving** (Chen et al. 2021). Interleave *near-confusables*: EV vs equity
   adjustments, Gordon vs exit multiple, unlever vs relever. → flashcard decks mix them deliberately.
4. **Predict-then-reveal** (White & Gunstone POE; Brod 2021 — prediction raises surprise and
   encoding). Lock the widget's punchline behind a prediction. → `predict` block before each widget.
5. **Immediate, specific feedback** (Hattie & Timperley 2007; Shute 2008). Show *which line* was wrong.
6. **Dual coding / multimedia** (Mayer — contiguity, signalling, segmenting). Numbers next to the
   diagram; flash the one cell that changed; step IS → CFS → BS.

**A best-in-class lesson:** hook question → `predict` gate → widget with 2–3 "what to notice" prompts
→ worked calc → faded blanks → free-recall answer (rubric) → quick-fire → spaced follow-ups.

## 3. Widget catalogue (names = `WIDGET_NAMES` entries; chapter assignment in the loop docs)

| Widget | Concept | Manipulation | On screen | Aha |
|---|---|---|---|---|
| `three_statement` Statement Ripple | statement links | pick line (D&A, revenue, inventory, capex, debt raise, PIK…) + Δ + tax rate | three mini-statements animate IS → CFS → BS; balance check ticks | non-cash charges *raise* cash via the tax shield |
| `faded_walk` | same, retrieval | fade level 0–4; type missing cells | blanks + per-cell feedback | can reproduce the chain unaided |
| `ev_bridge` Waterfall | EV ↔ equity | sliders for debt, cash, prefs, NCI, leases | waterfall re-renders; EV/EBITDA and P/E update | cash is negative debt; NCI added because EBITDA is 100 % consolidated |
| `multiple_matcher` | numerator / denominator pairing | drag metrics to EV or Equity bucket | green / red | pre-interest → EV; post-interest → equity |
| `discount_dial` | time value | slider r, slider years, mid-year toggle | cash-flow bars shrink to PV; cumulative line | distant cash flows collapse fast |
| `dcf_sensitivity` Grid | WACC × g | sliders; hover cells | 5 × 5 heatmap recolours | value explodes as g → WACC; it's a range |
| `tv_share` | TV dominance | projection years, g | stacked bar PV(FCF) vs PV(TV) | TV is 60–80 % of EV |
| `gordon_vs_exit` | two TV methods | slider g, slider exit multiple | two TV lines, crossover, implied g / implied multiple | each method implies the other |
| `wacc_builder` | cost of capital | D/E, Rf, β, ERP, Kd, tax | capital-weight pie; WACC gauge | debt lowers WACC until β relevers |
| `beta_relever` | un/relever | comps table + target D/E | unlevered median → relevered β | why raw betas can't be averaged |
| `football_field` | range synthesis | toggle methods; drag quartiles | horizontal bars; overlap band; price line | triangulation, not a point |
| `tsm_dilution` | diluted shares | share price, options, strike | proceeds buy-back animation | options dilute only in the money |
| `cash_cycle` | working capital | DSO, DIO, DPO | timeline ribbon; cash tied up; ΔNWC on CFS | negative CCC funds growth |
| `accretion_rule` | EPS maths | acquirer P/E, target P/E, % stock, Kd, tax | pro-forma vs standalone EPS; cost of currency | accretive if target earnings yield > cost of funding |
| `ppa_goodwill` | purchase accounting | price; write-ups; DTL toggle | goodwill plug; new D&A + DTL | goodwill is the residual |
| `synergy_npv` | synergies vs premium | synergies, phase-in, cost, r | NPV vs premium bar | premium justified only if PV(synergies) > premium |
| `lbo_returns` | value creation | entry / exit multiple, EBITDA growth, leverage, hold | stacked sources bar; IRR / MoM dial | leverage amplifies, doesn't create |
| `paper_lbo` Stepper | full paper LBO | type each step | steps validate; rule-of-72 IRR | doable on paper in 5 min |
| `deferred_tax` | DTA / DTL | book vs tax depreciation toggle | two curves; DTL builds then unwinds | timing differences reverse |
| `lease_toggle` | IFRS 16 in EV | capitalise on / off | EBITDA, debt, EV, EV/EBITDA update together | both sides rise — be consistent |
| `nci_vs_equity` | consolidation | ownership 0–100 % | treatment flips at 20 % / 50 %; bridge adjusts | why NCI is added and associates subtracted |
| `filings_toggle` | reading real statements | simplified ⇄ as-filed (invented company) | line items expand / collapse | the interview version is a simplification of the real thing |

## 4. Practice formats (ranked by evidence fit × web practicality)
1. **Type-your-answer + rubric** (free recall; strongest effect) — `your_turn`, drills, mocks. Model
   answer only after submission.
2. **Timed verbal with self-grade / transcript** — our `VoiceCapture`; audio never leaves the device.
3. **Fill-the-number** — the faded-example format; instant per-cell feedback → `fill_numbers`.
4. **Order-the-steps** — DCF and LBO procedures, EV → equity → `order_steps`.
5. **Spot-the-error** — a walk with one wrong sign or missing tax; click the wrong cell → `format:spot`
   questions (v1: rendered as a `predict` with a "which line is wrong?" prompt).
6. **MCQ** — lowest retrieval value; only as a `predict` gate (up / down / unchanged).
7. **Flashcards** — definitions and rules of thumb; interleave near-confusables.

## 5. Implementation notes for this codebase
- **SVG + React state, not canvas.** All widgets < 500 nodes; matches `ev-bridge.tsx` (hand SVG, CSS
  transitions). **No new charting / animation deps** — a small kit in `src/components/widgets/kit/`
  (`Slider`, `AnimatedNumber`, `scale.ts`, `fmt.ts`, `Waterfall`, `Heatmap`, `StackedBar`, `WidgetFrame`).
- **Pure maths in `src/lib/finance/*.ts`** with vitest pinned to canonical numbers (−10 / −7.5 / +2.5
  at 25 %; TSM; Gordon ⇄ exit implied values). Widgets are thin views; the same functions grade
  `fill_numbers` answers and power `worked_calc` checks (`evalExpr` already exists).
- **Sliders:** native `<input type="range">` (keyboard for free) + paired numeric input +
  `aria-valuetext` in plain English ("WACC 9.5 percent"). Key outputs in `aria-live="polite"`, debounced.
- **Reduced motion:** `prefers-reduced-motion` → step-through button + textual diff ("Cash +£2.5m,
  PP&E −£10m, retained earnings −£7.5m").
- **Mobile:** sliders fine; drag-sort needs move-up / move-down buttons (also the keyboard path).
- **Testing:** one Playwright per chapter — interact with a slider, assert an output changed; one
  vitest file per finance module.

## Sources
- financefluency.co.uk (homepage: curriculum, flashcards, firm banks, video mock, Live DCF Workshop).
- blog.ncase.me/explorable-explanations — Nicky Case's principles and pitfalls; github.com/blob42/awesome-explorables.
- Bret Victor, "Explorable Explanations" (2011). brilliant.org/about — learn-by-doing structure.
- wallstreetprep.com — "How are the financial statements linked", "Paper LBO". macabacus.com/learn.
- alphaspread.com DCF calculator; tickzen.app DCF lab; tikr.com sensitivity-analysis post.
- ibinterviewquestions.com — AI mock rubric. askivy.net/guides.
- Dunlosky et al. 2013 (Psychol. Sci. Public Interest); Karpicke & Blunt 2011 (Science); Sweller —
  guidance-fading effect; Chen et al. 2021 (Educ. Psychol. Rev.) spacing vs interleaving; Brod 2021
  (Psychon. Bull. Rev.) predicting as a learning strategy; POE (White & Gunstone 1992);
  Hattie & Timperley 2007; Shute 2008; Mayer, multimedia principles.
- react-range; React Aria `useSlider`; ogblocks.dev on reduced-motion animations.
