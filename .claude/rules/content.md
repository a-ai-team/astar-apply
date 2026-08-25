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
- `content/**` JSON is the reviewable artefact; the DB is loaded from it by `scripts/content/load.ts`.
  Raw batch results go to `.eval/batches/` (gitignored), never to `content/`.
