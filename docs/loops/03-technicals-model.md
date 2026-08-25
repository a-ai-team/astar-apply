# Loop 03 — Technicals taxonomy & content model

_Status: merged. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
## Goal
curriculum skeleton in DB (topics → subtopics → lessons, + questions), `LessonRenderer` for any valid Lesson JSON, curriculum browsing and a 10-week learning path; two hand-written sample lessons prove the renderer.
## Out of scope
bulk content (04), progress/gating (05/10), widgets beyond `ev_bridge` (reference widget) and static placeholders.
## Research at start
Next `03-layouts-and-pages.md`, `08-caching.md`, `09-revalidating.md`, `14-metadata-and-og-images.md`; `400q-taxonomy.md`; `financefluency.md` § Lesson template; `~/.claude/skills/ib-daily-lesson` if present (sequencing); `react-markdown` + `remark-gfm` + `rehype-katex` React 19 compat.
## User stories
`/home/technicals` shows 9 topics with counts and free badges; lesson renders in fixed template with reveal blocks; `/home/path` shows weeks 1–10; admin edits lesson JSON with live validation + preview.
## Data model — `0004_technicals.sql`
`topics(id, slug, title, kind core|foundation|fit|industry, ordinal, level, is_free, summary, source_section, status)`; `subtopics(id, topic_id, slug, title, ordinal, kind concept|calculation|mixed, source_section; unique(topic_id,slug))`; `lessons(id, subtopic_id, slug, title, ordinal, body jsonb, body_version, reading_minutes, status, generated_by, prompt_version, timestamps)`; `questions(id, slug, topic_id, subtopic_id, kind, difficulty 1–4, question, body jsonb, status, source_topic, tags, generated_by, prompt_version, timestamps)`; `learning_paths(id, slug, title, weeks, description)`; `learning_path_items(id, path_id, week, day, lesson_id, question_set jsonb, label; unique)`. RLS: authenticated read `approved`; staff all. Validation in app (zod) on every write path.
## Routes/screens
`/home/technicals`, `/home/technicals/[topic]`, `/home/technicals/[topic]/[lesson]` (`LessonRenderer`); `/home/path`, `/home/path/[week]`; `/admin/lessons`, `/admin/lessons/[id]` (JSON editor + zod errors + preview; `saveLesson` → `revalidateTag('lesson:'+slug, 'max')`); `src/lib/content/{lesson-schema,question-schema,taxonomy,queries}.ts`; `src/components/lesson/{LessonRenderer, blocks/*, Reveal, QuickFire, YourTurn}`; `src/components/widgets/EvBridge.tsx` (sliders → animated bridge).
## Default path `default-10-week`
W1 Finance foundations · W2 Accounting concepts · W3 Accounting walkthroughs · W4 EqV/EV · W5 Valuation & multiples · W6 DCF assumptions · W7 DCF discount rate & TV · W8 M&A · W9 LBO · W10 Fit + full mock; 5 days/week, day 5 = review placeholder.
## Scripts
`scripts/seed/03-taxonomy.ts` (9 topics: Finance foundations, Accounting, EqV vs EV, Valuation, DCF, M&A, LBO, Markets & Why banking, Fit & behavioural (brain teasers as subtopic); ~45 subtopics; path; 2 hand-written lessons `ev-bridge-basics`, `three-statement-links` approved; 6 questions); `scripts/content/validate.ts <dir>`.
## Risks
block types frozen (add, never rename); KaTeX CSS only on lesson routes.
## Acceptance checks
- [x] lint/typecheck/build
- [x] vitest both schemas (missing `one_liner` fails approvable) — 16 new tests, 47/47 total
- [x] `seed -- 03` idempotent (ran 3×), `db:check` 21/21: 9 topics, 53 subtopics, 2 approved lessons, 6 approved questions, path with 50 items
- [x] Playwright `e2e/03-technicals.spec.ts` 3/3 (9 cards → EqV/EV → lesson has six required blocks by testid → your-turn reveal → widget slider → `/home/path` 10 weeks; admin JSON edit reflected) — full suite 13/13
- [x] student GET of a draft lesson → 404 (e2e test 2; RLS hides non-approved rows)

## Tasks
- [x] migration
- [x] schemas + tests
- [x] taxonomy finalisation (free = Accounting, EqV/EV)
- [x] seed + 2 lessons + 6 questions
- [x] markdown/KaTeX + renderer
- [x] `EvBridge`
- [x] curriculum pages
- [x] path pages
- [x] admin editor
- [x] Playwright/docs/retro

## Blocked-on-human (defaults)
free topics → Accounting + EqV/EV; sequencing → table above.


## Blocked
_(record blockers here during the run)_

## Retro
- **Shipped:** migration `0004_technicals` (6 tables, enums `topics_kind/subtopics_kind/questions_kind`,
  read-approved + staff RLS, grants, `subtopics.target_questions`), `src/lib/content/{lesson-schema,
  question-schema,taxonomy,queries}.ts` (+16 vitest), `CURRICULUM` 9 topics / 53 subtopics with
  `source_section` labels, `is_free` (Accounting, EqV/EV), `walkthrough` flags, `target_questions`
  (Σ 347), `DEFAULT_PATH` 10 × 5; `content/lessons/{ev-bridge-basics,three-statement-links}.json`
  (hand-written, approved, every block type incl. `scenario`, `ev_bridge` widget, `key_metrics`) +
  `content/questions/*.json` (6, approved); `scripts/content/{validate,load}.ts` (`npm run
  content:validate|content:load`), `scripts/seed/03-taxonomy.ts`; `LessonRenderer` + 13 block
  components + `Reveal`/`QuickFire`, `Markdown` (react-markdown 10 + remark-gfm/math + rehype-katex;
  KaTeX CSS only via the renderer), `EvBridge` widget (7 sliders → animated SVG waterfall);
  `/home/technicals`, `/[topic]`, `/[topic]/[lesson]`, `/home/path`, `/[week]` (noindex);
  `/admin/lessons`, `/admin/lessons/[id]` (live zod + approval warnings, preview tab, `saveLesson`
  → `revalidateTag('lesson:'+slug,'max')` + `refresh()`); nav enabled; `db:check` 21/21;
  `e2e/03-technicals.spec.ts` 3/3; `docs/TECHNICALS.md`.
- **Slipped:** nothing in scope. Widgets other than `ev_bridge` are placeholders (as planned);
  no lesson *create* UI (lessons come from `content/` + seed/Loop 04); `revalidateTag` is a no-op
  today because no `use cache` scope tags lessons yet (pages are dynamic under cookies) — harmless.
- **Decisions taken by default:** free = Accounting + EqV/EV (`TODO(james)` in taxonomy.ts);
  `~/.claude/skills/ib-daily-lesson` absent → plan's 10-week table; curriculum topic slugs reuse
  the Loop 01 tag slugs (`why-banking` = "Markets & why banking", `fit-behavioural`) so corpus tags
  and curriculum share one vocabulary; one planned lesson per subtopic with lesson slug = subtopic
  slug (path items resolve `lesson_id` lazily — 2/38 resolvable now); `worked_calc` arithmetic is
  re-evaluated by `evalExpr` at approval time (±0.5 %); `reading_minutes ≤ 12` enforced for
  approval; difficulty-4 calculation questions must carry `numbers`; `topics.level` is free text
  (`foundation|core|advanced`); topics/subtopics carry a `status` so Loop 09 can add industry
  modules as drafts.
- **Loop 04 must know:** (1) Schema exports — `LessonBodySchema`, `LessonBlockSchema`, `BLOCK_TYPES`,
  `REQUIRED_FOR_APPROVAL`, `validateLessonBody()`, `approvalProblems(body,{walkthrough})`,
  `assertApprovable()`, `evalExpr()`, types `LessonBody`/`LessonBlock` from
  `src/lib/content/lesson-schema.ts`; `QuestionSchema`, `validateQuestion()`, `splitQuestion()`,
  `assertQuestionApprovable()`, `flashcardBack()`, `QUESTION_ROW_KEYS` from `question-schema.ts`.
  Use `zodOutputFormat(LessonBodySchema)` directly (zod 4, discriminated union on `type`; `widget.props`
  is `record(string, unknown)`, `canonical_answer.seconds` defaults 45). (2) Targets — `CURRICULUM[i]
  .subtopics[j].target_questions` (Σ 347) and `walkthrough` (scenario required); `findSubtopic(slug)`
  gives `{topic, subtopic}`. (3) Load path — write `content/lessons/<slug>.json` as `{slug,
  subtopic_slug, title, ordinal, status, generated_by, prompt_version, body}` and
  `content/questions/<slug>.json` as Question JSON, then `validateContentDir(root)` +
  `loadContent(db, root)` from `scripts/content/{validate,load}.ts` (upsert on slug; `approved`
  rows are gated by the approval rules before any write). Path items for lesson slug = subtopic slug
  get their `lesson_id` when `seed -- 03` is re-run after loading. `lessons.generated_by`/
  `prompt_version` columns exist; `questions.generated_by` is set to `"human"` by `loadContent` —
  pass model ids through the file if needed (add a field). (4) Lesson pages read under RLS with the
  cookie client, so nothing non-`approved` leaks; the admin editor's approval gate is the same
  `approvalProblems()` used by `validate.ts`.
