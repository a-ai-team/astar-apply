---
paths:
  - "content/**"
  - "fixtures/**"
  - "src/lib/content/**"
  - "src/components/lesson/**"
---

# Content rules

- **Original only.** The 400Q guide (BIWS, copyrighted) and financefluency.co.uk are structural
  references: topic taxonomy, question *types*, page template. Never reproduce their sentences;
  `scripts/eval/overlap.ts` (8-gram) must report zero hits. `source_topic` stores a section
  *label*, never text.
- Reader: UK second-year undergrad with one finance module. No unexplained jargon; every formula
  gets a worked number in £m; British spelling; 6–12 minute lessons.
- Lesson JSON and Question JSON shapes are fixed in `docs/loops/CONTRACTS.md`; validators are
  `src/lib/content/lesson-schema.ts` and `question-schema.ts` (zod). Add block types, never
  rename or remove them. Required blocks for `approved`: `trap`, `canonical_answer`, `your_turn`,
  `quick_fire` (exactly 4 pairs), `one_liner`.
- Status flow: `generated` → `in_review` → `approved`. Only `approved` is served to students.
  Overnight auto-approval is limited to Accounting and EqV/EV after `npm run eval -- --suite
  lessons,questions` passes; list every auto-approval in the loop retro.
- Difficulty ladder 1 definition · 2 why · 3 second-order · 4 numerical/edge; target mix
  25/30/30/15 %.
- **Technicals v2 (Loops 11–18).** Scope is what a UK penultimate-year candidate needs for a summer
  internship — see `docs/research/technicals-v2/`. Every question carries `depth:sa-core` or
  `depth:sa-stretch` (`ft-only` material is *named* in the chapter cheat sheet, never taught);
  optionally `lens:tmt` / `lens:healthcare` (lens questions are hidden from the generalist bank and
  get no flashcard) and `format:verbal|fill|order|spot` (default `verbal`).
- v2 lesson blocks: `predict` (before a widget, exactly one correct option), `fill_numbers` (≥ 1
  step marked `blank`), `order_steps`, `lens` (must cover **every** slug in `LENS_SLUGS` or the
  lesson is not approvable), `template`. Arithmetic in `worked_calc` *and* `fill_numbers` is
  re-evaluated at approval.
- **Verify every worked number against `src/lib/finance/*`** (the arithmetic authority, 132 tests)
  rather than trusting a spec: `npv()` treats `cashFlows[0]` as year 1, terminal value discounts at
  the final year's end-of-year factor even under `midYear`, and PIK interest raises cash by the tax
  shield. Widgets and `fill_numbers` grading import from there — never re-implement the maths.
- `content/**` JSON is the reviewable artefact; the DB is loaded from it by `scripts/content/load.ts`.
  Raw batch results go to `.eval/batches/` (gitignored), never to `content/`.
