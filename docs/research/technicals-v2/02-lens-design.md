# Technicals v2 — the industry lens (design note)

_Written 2026-08-28. James's brief: "the option to include real-life context on the industry you're
targeting — a dropdown that adds a few interchangeable sections, e.g. TMT." First release: **TMT and
Healthcare** (decision 2026-08-28). Everything here is implemented by Loop 11 and filled by Loops 12–18._

## 1. What a lens is
A lens is a **reader setting**, not a separate curriculum. The generalist lesson is always complete on
its own; choosing a lens swaps in 1–3 short sections (and unlocks 2–4 lens-tagged questions) that show
how *this* concept changes in *that* coverage group — exactly the "contextualise" probe interviewers
use (`00-syllabus.md` § 7). The 18 industry modules (Loop 09) remain the deep dive; the lens is the
bridge from the core chapter to them and links to the module at the end of each lens section.

## 2. Mechanism (contract — mirrored in `docs/loops/CONTRACTS.md`)
- Taxonomy: `LENSES = ["tmt", "healthcare"] as const` in `src/lib/content/taxonomy.ts`, each with
  `{ slug, label, module_slug }` (module = the Loop 09 industry topic it links to). Add lenses freely.
- Lesson block `lens`:
  ```jsonc
  { "type": "lens", "slot": "after-mechanics",
    "variants": {
      "tmt":        { "heading": "…", "md": "…", "example_q": "…", "answer_md": "…" },
      "healthcare": { "heading": "…", "md": "…", "example_q": "…", "answer_md": "…" } } }
  ```
  `slot` is documentation of *where* the block sits (the block's position in `blocks` is what
  renders); allowed values `after-concept | after-mechanics | after-worked-calc | before-your-turn`.
  A lens block renders only the chosen variant; with no lens chosen it renders nothing (a one-line
  "Add an industry lens ↗" hint appears once per lesson instead).
- Rule `lensProblems()` (in `generate/checks.ts`, also run by `content:validate`): if a lesson has any
  `lens` block, every block must carry a variant for **every** slug in `LENSES`; a lesson may also
  have no lens blocks at all (allowed for foundations lessons where a lens adds nothing).
- Questions: tag `lens:<slug>`; they are hidden from the generalist bank, shown when the lens chip is
  active in `/home/practice` and appended to a lesson's "Practise this" list when the lens is on.
  Drills / mocks: a "with lens" option includes lens-tagged questions for the chosen slug (Loop 18).
- UI: `LensPicker` (client island in the lesson header, `data-testid="lens-picker"`) — select with
  "Generalist" + each lens; writes `?lens=<slug>` (so links are shareable) and mirrors to
  `localStorage["astar.lens"]` (try/catch); the lesson page reads `searchParams.lens` and passes it
  down via `LensContext`. No DB column, no migration.
- Mentor chat: `index-chunks.ts` `blockText` indexes lens variants with a `[TMT lens]` prefix so the
  chatbot can cite them.

## 3. What TMT and Healthcare change, chapter by chapter
(From public sector guides — M&I industry-specific interviews, tmtbanking.com, ibinterviewquestions
healthcare guide, WSP — structure only.)

| Chapter | TMT lens | Healthcare lens |
|---|---|---|
| Foundations | Discount rate for a 40 %-growth loss-making SaaS vs a profitable telco; why growth companies are long-duration assets (rate-sensitive) | Probability-adjusting a cash flow *before* discounting (rNPV idea, no maths yet) |
| Accounting | Subscription / deferred revenue (cash before revenue → deferred revenue liability), capitalised development costs, share-based comp as a real cost, telco capex intensity | R&D expensed not capitalised, milestone and licensing revenue, pharma inventory and gross margin, why "no revenue but £2bn value" is coherent |
| EqV vs EV | Net-cash tech companies (EV < equity value), convertibles and TSM for option-heavy cap tables, EV/Revenue as the pairing when EBITDA < 0 | Cash-rich biotech after a raise, near-zero or negative EV pre-revenue, milestone payments as debt-like items (say so, then reason) |
| Valuation | EV/ARR and EV/Revenue, Rule of 40 as a multiple driver, growth-adjusted multiples, media EBITDA add-backs, tower / fibre carve-outs | EV/peak sales, rNPV vs comps, sub-sector peer sets (pharma / biotech / medtech / services / tools), patent cliff in precedents |
| DCF | Negative near-term FCF and a longer explicit period, TV dominance, why a small change in g moves everything | Probability-weighted cash flows by phase, patent-cliff decline replacing a perpetuity, discount rate reflecting trial risk vs diversifiable risk |
| M&A | Stock-heavy deals and dilution, scepticism on revenue synergies, acqui-hires, regulatory scrutiny of platform deals | CVRs and earn-outs bridging valuation gaps, in-process R&D in PPA, services roll-ups, drug-pipeline acquisitions with no EPS impact for years |
| LBO | Recurring revenue supports higher leverage, software take-privates, capex-light cash conversion | Services roll-ups (dental, vet, care) as classic sponsor plays, reimbursement / regulatory risk capping leverage, biotech is *not* an LBO candidate and why |

Each chapter's research doc (`1N-*.md`) turns these into concrete `lens` blocks (heading, 120–200 words,
one example question with a model answer) and 2–4 lens questions, all written for the same
second-year reader and in £m.

## 4. Out of scope for v1
Lens-specific widgets (the generalist widgets accept lens presets instead — e.g. `dcf_sensitivity`
with a "SaaS" preset); FIG (breaks the framework — needs its own lessons, not sections; it stays a
Loop 09 module); per-firm lenses.
