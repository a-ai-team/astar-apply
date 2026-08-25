# 400Q guide — structure & taxonomy (research note)

Source: *400 Questions Guide for Investment Banking Interviews, 2025 Edition* (Breaking Into Wall
Street, 207 pp). James has the PDF locally at `~/Desktop/A* AI/`. **It is copyrighted — it never
goes in this (public) repo, and its answers are never copied into product content.** We use its
*structure* (topics, question types, ordering, difficulty ladder) to organise content that Claude
writes from scratch. The PDF itself can live in the private mentor-corpus bucket (Loop 1) as a
*reference for graders/evals only*, not as retrievable chatbot content.

## Counts (413 numbered Qs; extracted 2026-08-25)

### Fit / behavioural (pp. 5–45, ~73 Qs)
| Section | Qs |
|---|---|
| The "Big 5" fit questions | 5 |
| Teamwork / leadership | 5 |
| Strengths & weaknesses | 5 |
| Flaws & failures | 9 |
| Recruiting process | 10 |
| Resume / CV | 5 |
| Understanding banking | 9 |
| "Why banking?" / "Why our firm?" | 10 |
| "Outside the box" | 5 |
| Discussing transaction experience | 10 |

### Generalist technicals (pp. 46–128, ~191 Qs) — **this is the Technicals section spine**
| Section | Qs | Maps to curriculum topic |
|---|---|---|
| Finance concepts (TVM, discount rate, PV/NPV, IRR, WACC intro) | 10 | 0 · Finance foundations |
| Accounting – concepts | 18 | 1 · Accounting |
| Accounting – calculations (statement walk-throughs) | 18 | 1 · Accounting |
| Equity value & enterprise value – concepts | 11 | 2 · EqV vs EV |
| Equity value & enterprise value – calculations | 12 | 2 · EqV vs EV |
| Valuation methodologies | 15 | 3 · Valuation |
| Valuation metrics & multiples | 15 | 3 · Valuation |
| DCF – assumptions & analysis | 23 | 4 · DCF |
| DCF – the discount rate | 25 | 4 · DCF |
| Merger models – concepts | 13 | 5 · M&A |
| Merger models – calculations | 11 | 5 · M&A |
| LBO models – concepts | 15 | 6 · LBO |
| LBO models – calculations | 5 | 6 · LBO |

### Industry / group-specific (pp. 129–207, ~149 Qs) — **Technicals "Industry modules", later loop**
Consumer/Retail 4 · DCM & LevFin 14 · Distressed & Restructuring 15 · ECM 10 · FIG 15 · FSG 5 ·
Healthcare & Biotech 4 · Industrials 5 · Metals & Mining 9 · Oil & Gas 10 · Power & Utilities 10 ·
Private Capital Advisory (Secondaries) 5 · Private Companies 5 · Project Finance & Infra 9 ·
Real Estate 10 · REITs 10 · Renewables 5 · TMT 10.

## Structural patterns worth copying (not the text)
- Every technical section splits **Concepts** (why) from **Calculations** (walk me through / compute).
  Our lesson pages should do the same: *Concept → Mechanics → Worked calc → Interview drill*.
- Questions escalate: definition → "why" → second-order follow-up → numerical. Tag each generated
  question with `difficulty: 1–4` on this ladder.
- The guide is explicit that it is a *review*, not a teaching text — that's the gap our Technicals
  section fills (second-years have no textbook for this).
- 2025 edition specifics to bake in: IFRS 16 / ASC 842 leases in the EV bridge; LBO mental-maths
  rules of thumb; HireVue-era fit answers.

## How it feeds the product
1. **Taxonomy** → `technicals.topics` / `technicals.subtopics` seed data (Loop 3).
2. **Question skeletons** → for each of the ~340 technical Qs, Claude writes an *original* question
   on the same concept, an original model answer, 2–3 follow-ups, and a "what a weak answer sounds
   like" note (Loop 4). Provenance field records `source_topic` only, never the source text.
3. **Eval set** → the guide's questions become a *hidden* eval set for the chatbot (Loop 2): we ask
   the bot the concept and grade against the guide's standard with an LLM judge. Never served to users.
