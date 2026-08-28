# Loop 11 — Technicals v2 platform

_Status: merged (pending PR). Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md` § Technicals v2. Design: `docs/research/technicals-v2/00–02`._

## Goal
Everything the seven chapter loops (12–18) need, proven end-to-end on the two existing lessons: a pure
finance-maths library with tests, a widget kit and two reference widgets (`three_statement`,
`dcf_sensitivity`) plus `ev_bridge` refactored onto the kit, five new block types (`predict`,
`fill_numbers`, `order_steps`, `lens`, `template`), the industry-lens picker (TMT / Healthcare), question
depth / lens / format tags in the practice bank, and the cheat-sheet artefact route. No new content
beyond retrofitting `three-statement-links` and `ev-bridge-basics`.

## Out of scope
Chapter content (12–18); the other 17 widgets (each chapter builds its own on the kit); FIG lens;
lens-specific widgets; voice; any migration (nothing here needs the DB to change).

## Research at start
`docs/research/technicals-v2/01-interactive-teaching.md` § 3 and § 5; `02-lens-design.md` § 2; Next docs
`03-layouts-and-pages.md` (searchParams in async pages), `04-linking-and-navigating.md`; Loop 03 retro
(schema exports); `src/components/widgets/ev-bridge.tsx`; `src/lib/content/generate/checks.ts`;
`src/lib/content/index-chunks.ts` (`blockText` is exhaustive — add the new types).

## User stories
- A student opens a lesson, answers a `predict` gate, then drags a slider and watches the three
  statements ripple; with reduced motion they step through a textual diff instead.
- They pick "TMT" in the lens picker; the TMT sections appear in place, the URL gains `?lens=tmt`,
  and the choice sticks on the next lesson.
- They type numbers into a faded worked example and get per-cell feedback.
- They open the chapter cheat sheet and print it.
- A mentor edits a lesson JSON in `/admin/lessons/[id]` and the new blocks validate and preview.

## Data model
No migration. Tags on `questions.tags` (`depth:`, `lens:`, `format:`) — the column exists.
`content/cheatsheets/*.json` is a new content directory walked by `validateContentDir` and loaded by
`loadContent` into… **nothing** (v1: cheat sheets are read from the repo at build time by the route via
`src/lib/content/cheatsheets.ts`; a table is a later loop if mentors need to edit them in-app).

## Routes / screens
- `src/lib/finance/{statements,bridge,discount,dcf,wacc,shares,merger,lbo}.ts` + `*.test.ts`
  (canonical cases: D&A +£10 at 25 % → NI −7.5, cash +2.5, PP&E −10, RE −7.5, balances; TSM with
  in- and out-of-the-money options; Gordon ⇄ exit implied values; IRR of 2× / 5 y ≈ 14.9 %).
- `src/components/widgets/kit/{slider,animated-number,scale,fmt,use-reduced-motion,widget-frame,waterfall,heatmap,stacked-bar}.tsx`.
- Widgets: `src/components/widgets/three-statement.tsx` (Statement Ripple: line select, Δ input, tax
  slider; IS → CFS → BS animation; balance check; reduced-motion step-through), `dcf-sensitivity.tsx`
  (WACC × g heatmap with sliders, current cell highlighted), `ev-bridge.tsx` refactored to `kit` +
  `lib/finance/bridge.ts`. `blocks/widget.tsx` becomes a registry map, not a ternary.
- Blocks: `blocks/{predict,fill-numbers,order-steps,lens,template}.tsx`; schema + `BLOCK_LABELS` +
  renderer switch + `blockText` + writer schema (`generate/schemas.ts`) + `lesson-write.v1.ts` template
  prose + `lesson-schema.test.ts` frozen list.
- Lens: `src/components/lesson/lens-picker.tsx` (client; select; `?lens=`; localStorage mirror),
  `lens-context.tsx`; `src/app/home/technicals/[topic]/[lesson]/page.tsx` reads `searchParams`
  (Next 16: `await props.searchParams`) and wraps `LessonRenderer` in the provider; `LENSES` in taxonomy.
- Practice: `/home/practice` gains depth chips (core / stretch) and a lens chip; lens-tagged questions
  excluded unless the chip is on (`src/lib/practice/queries.ts`); `/home/practice/[slug]` shows the
  depth badge. Flashcard derivation (`scripts/seed/05-flashcards.ts`) skips `lens:` questions.
- Cheat sheet: `src/lib/content/cheatsheet-schema.ts` (zod), `src/lib/content/cheatsheets.ts`,
  `src/app/home/technicals/[topic]/cheatsheet/page.tsx` (+ `print.css` rules in `globals.css`),
  link from the topic page; `content/cheatsheets/accounting.json` (sample, real content lands in Loop 13).
- Checks: `lensProblems()`, `predict` presence for v2, in `generate/checks.ts` and `approvalProblems`
  (`{ v2: true }` when the body contains any v2 block); `scripts/content/validate.ts` walks cheat sheets.
- Retrofit: `content/lessons/three-statement-links.json` gains `predict` (before the widget), a real
  `three_statement` widget block with props, one `fill_numbers`, two `lens` blocks (TMT: deferred
  revenue; Healthcare: R&D expensing); `ev-bridge-basics.json` gains `predict` + two `lens` blocks.
  Both stay `approved` (they pass the new gate).
- Docs: `docs/TECHNICALS.md` § "v2 platform (Loop 11)"; `.claude/rules/content.md` adds the tag vocabulary.

## Scripts
No new npm scripts. `npm run content:validate` covers cheat sheets; `npm run seed -- 03` reloads the
two retrofitted lessons; `npm run seed -- 05` (flashcards skip lens questions); `npm run content:index`.

## Risks
- Exhaustive switches (`blockText`, renderer, labels) — TypeScript catches misses; keep `BLOCK_TYPES` derived.
- `searchParams` makes the lesson page dynamic — it already is (cookies). Fine.
- Widget a11y: Lighthouse a11y ≥ 95 on the retrofitted lesson; keyboard-only run through the ripple.
- Scope creep into content: the retrofits are the *only* content this loop writes.

## Acceptance checks
- [x] lint / typecheck / build
- [x] vitest: `src/lib/finance/**` **132** cases; schema tests for the 5 new blocks (valid + each invalid shape); `lensProblems` (missing healthcare variant fails); unit suite green
- [x] `npm run content:validate` 0 errors incl. `content/cheatsheets/accounting.json`; `seed -- 03` / `05` idempotent; `content:index` indexes lens text with the `[TMT lens]` prefix
- [x] Playwright `e2e/11-platform.spec.ts` (7 tests, suite 42/42): lesson shows `block-predict` → choose → explanation; `three_statement` widget: change Δ → an output cell changes; lens picker → `?lens=tmt` → TMT heading visible, Healthcare not; reload keeps the lens; `fill_numbers` correct → green, wrong → hint; cheat sheet route renders formulas; reduced-motion emulation → step-through button present; existing e2e green
- [ ] Lighthouse a11y ≥ 95 — **not run** (see Blocked) on `/home/technicals/accounting/three-statement-links`
- [x] Admin editor: a `lens` block missing `healthcare` is an approval warning, not a zod error (unit-tested; the editor reuses `approvalProblems`)

## Tasks
- [x] `src/lib/finance/*` + tests (statements, bridge, discount, dcf, wacc, shares, merger, lbo)
- [x] widget kit (`kit/*`)
- [x] schema: 5 block types + `WIDGET_NAMES` + labels + renderer + `blockText` + writer schema + prompt prose + frozen-list test
- [x] blocks: predict, fill_numbers, order_steps (with keyboard move buttons), lens, template
- [x] widgets: `three_statement`, `dcf_sensitivity`; refactor `ev_bridge`; registry in `blocks/widget.tsx`
- [x] lens picker + context + page `searchParams` + `LENSES` in taxonomy + `lensProblems`
- [x] practice tags: chips, query filters, depth badge, flashcard derivation skip
- [x] cheat-sheet schema / loader / route / print CSS / sample file / validate.ts
- [x] retrofit the two lessons (+ `seed -- 03`, `05`, `content:index`)
- [x] `e2e/11-platform.spec.ts`, Lighthouse, docs (`TECHNICALS.md`, `content.md` rule), retro, RUNLOG

## Blocked-on-human (defaults)
Lens labels → "TMT" and "Healthcare & Biotech"; lens picker position → lesson header right of the title;
cheat sheets are repo-only (no table) until a mentor asks to edit them in-app.

## Blocked
1. **Lighthouse a11y not run** — no Chrome-headless Lighthouse in this sandbox. The a11y work is in
   place and e2e-verified (native range inputs with `aria-valuetext`, `aria-live` outputs, keyboard
   move buttons on `order_steps`, reduced-motion step-through, `Heatmap` as a real `<table>`).
   **James:** run `npx lighthouse http://localhost:3100/home/technicals/accounting/three-statement-links
   --only-categories=accessibility` against `next start` once and tick the check.
2. **Migration 0010/0011 still unapplied** (inherited from Loops 09/10, not this loop). `seed 03`
   prints its `group_family` warning and falls back; nothing in Loop 11 needs the DB to change.

## Retro
- **Shipped:** `src/lib/finance/{statements,bridge,discount,dcf,wacc,shares,merger,lbo}.ts` (132
  vitest); five block types (`predict`, `fill_numbers`, `order_steps`, `lens`, `template`) through
  the whole spine — schema, `V2_BLOCK_TYPES`/`isV2Body`/`lensProblems`, labels, renderer, `blockText`,
  writer schema, `lesson-write.v1` prose, frozen-list test (+16 schema and 2 indexer tests); widget
  kit `src/components/widgets/kit/*` (Slider, AnimatedNumber, WidgetFrame, Waterfall, Heatmap,
  StackedBar, fmt, scale, useReducedMotion — no new deps) with `three_statement` (Statement Ripple,
  9 walk variants, reduced-motion step-through) and `dcf_sensitivity` (WACC × g heatmap), `ev_bridge`
  refactored onto the kit and `blocks/widget.tsx` turned into a registry; the industry lens (`LENSES`
  in taxonomy, `LensPicker` + `LensProvider`/`useLens`, `?lens=` + localStorage, lens text indexed as
  `[TMT lens] …`); practice `depth:`/`lens:`/`format:` tags with chips, a Stretch badge and
  lens-aware flashcard derivation; cheat sheets (`cheatsheet-schema.ts`, `cheatsheets.ts`,
  `/home/technicals/[topic]/cheatsheet`, print CSS, `content:validate` coverage,
  `content/cheatsheets/accounting.json`); both existing lessons retrofitted with predict + lens
  (+ widget and `fill_numbers` on `three-statement-links`) and still `approved`;
  `e2e/11-platform.spec.ts` 7/7 (suite 42/42); docs (`TECHNICALS.md` § Platform,
  `.claude/rules/content.md`, research README).
- **Slipped:** Lighthouse a11y (§ Blocked 1). No `order_steps` or `template` block appears in shipped
  content yet — both are unit-tested and render, and Loops 13/16/17/18 are where they land.
- **Decisions taken by default:** (1) `lens.variants` is a **partial** record — a missing variant is a
  readable approval problem, not a zod error, so a chapter author can save a draft mid-write.
  (2) The writer schema gets `predict`/`fill_numbers`/`order_steps`/`template` but **not** `lens`
  (its `variants` map is a `z.record`, which structured output rejects; lens sections are
  hand-authored per chapter anyway) — and `template.props`, like `widget.props`, is authored by hand.
  (3) Lens questions are hidden from the generalist bank and derive **no flashcard** — they are
  lens-specific practice, not general recall. (4) Cheat sheets are repo-only (no table) until a mentor
  needs to edit them in-app. (5) `useReducedMotion` uses `useSyncExternalStore` (the React Compiler
  lint rule bans `setState` in an effect). (6) `Heatmap` is an HTML `<table>`, not SVG — the data is
  tabular, so keyboard and screen-reader support come free. (7) `predict` requires exactly one correct
  option; a wrong guess still reveals, because the surprise is the teaching moment.
- **Loops 12–18 must know:** (1) **Verify every worked number against `src/lib/finance/*`** — the specs
  were written before the library existed and at least four figures are known to be off (implied growth
  2.59 %, PV explicit 424.52, synergy NPV 53.09, median unlevered beta 0.9375). Conventions: `npv()`
  treats `cashFlows[0]` as year 1; TV discounts at the final year''s **end-of-year** factor even under
  `midYear`; PIK interest **raises** cash by the tax shield. (2) Widget props available today —
  `three_statement {kind, amount, taxRate, lockKind}`, `dcf_sensitivity {cashFlows, finalFcf, netDebt,
  shares, wacc, growth}`, `ev_bridge` unchanged. Build new widgets on `kit/`, put the maths in
  `src/lib/finance` first, and add the name to the registry in `blocks/widget.tsx`. (3) A v2 lesson
  needs a `predict`, every `fill_numbers` needs ≥ 1 `blank`, and any `lens` block must carry **both**
  slugs. (4) Every question needs a `depth:` tag; add `lens:` only to lens questions. (5) `test.use({
  reducedMotion })` does not type-check in Playwright 1.62.1 (and `npm run build` type-checks `e2e/`) —
  use `page.emulateMedia({ reducedMotion: "reduce" })`.
