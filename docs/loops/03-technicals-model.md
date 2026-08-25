# Loop 03 — Technicals taxonomy & content model

_Status: in-progress. Protocol: `docs/loops/README.md`. Contracts: `docs/loops/CONTRACTS.md`._
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
- [ ] lint/typecheck/build
- [ ] vitest both schemas (missing `one_liner` fails approvable)
- [ ] `seed -- 03` idempotent, `db/check` shows 9 topics, ≥ 40 subtopics, 2 approved lessons, path with 50 items
- [ ] Playwright `e2e/03-technicals.spec.ts` (9 cards → EqV/EV → lesson has six required blocks by testid → your-turn reveal → `/home/path` 10 weeks; admin JSON edit reflected)
- [ ] student GET of a draft lesson → 404

## Tasks
- [x] migration
- [x] schemas + tests
- [x] taxonomy finalisation (free = Accounting, EqV/EV)
- [x] seed + 2 lessons + 6 questions
- [ ] markdown/KaTeX + renderer
- [ ] `EvBridge`
- [ ] curriculum pages
- [ ] path pages
- [ ] admin editor
- [ ] Playwright/docs/retro

## Blocked-on-human (defaults)
free topics → Accounting + EqV/EV; sequencing → table above.


## Blocked
_(record blockers here during the run)_

## Retro
_(fill at end of loop; include "Decisions taken by default")_
