# Technicals v2 research — index

Planning for the summer-internship prep pack (Loops 11–18), 2026-08-28. Read in this order.

**Scope in one line:** 35 lessons and 199 questions (135 `sa-core` · 38 `sa-stretch` · 26 industry-lens) across seven chapters — what a UK penultimate-year candidate actually needs, not the 400Q guide's 413.

| File | What it is | Feeds |
|---|---|---|
| `00-syllabus.md` | What a UK penultimate-year summer-internship candidate needs: topic × depth (`sa-core` / `sa-stretch` / `ft-only`), stage, firm type, top-20 questions, failure modes, how interviewers probe | scope of every chapter; question `depth:` tags; `follow_ups` |
| `01-interactive-teaching.md` | Comparators, pedagogy evidence, the widget catalogue, practice formats, implementation notes | Loop 11 kit + blocks; each chapter's widgets |
| `02-lens-design.md` | The industry-lens mechanism (TMT, Healthcare) and what each lens changes per chapter | `lens` block contract; lens sections in every spec |
| `12-foundations.md` … `18-lbo.md` | Per-chapter **content specs**: every lesson's outline, numbers, trap, canonical answer, predict gate, widget prompts, your-turn, quick-fire, lens variants, follow-up ladder; the question list; the cheat sheet | the chapter loop writes `content/**` JSON from these |

**Verify every number against the code.** `src/lib/finance/*` (Loop 11, 132 tests) is the arithmetic
authority. When a chapter loop authors a lesson it must re-compute each worked figure with those
functions rather than trusting the spec: the spec numbers were written before the library existed and
at least four are known to be off (implied growth 2.59 %, PV explicit 424.52, synergy NPV 53.09,
median unlevered beta 0.9375). Conventions to know: `npv()` treats `cashFlows[0]` as **year 1**;
terminal value discounts at the final year's **end-of-year** factor even under `midYear`; PIK interest
**raises** cash by the tax shield, exactly like depreciation.

Rules that apply to all of it: original prose only (the 400Q guide gives section *counts*, never text;
public prep sites give *structure*); UK second-year reader; every formula has a worked £m number;
British spelling. The specs are the "exactly what you need to know" — if it is not in a spec, it is
not taught.
