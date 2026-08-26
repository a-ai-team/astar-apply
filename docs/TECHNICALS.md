# Technicals — curriculum & content model (Loop 03)

How the Technicals section is structured, where content lives, and how to add or edit a lesson.
Contracts (Lesson JSON, Question JSON) are in `docs/loops/CONTRACTS.md`; the plan and retro in
`docs/loops/03-technicals-model.md`.

## Data model (`supabase/migrations/0004_technicals.sql`)
`topics` (9) → `subtopics` (53) → `lessons` (body = Lesson JSON). `questions` hang off a topic and
optionally a subtopic. `learning_paths` + `learning_path_items` (week × day → lesson) hold the
default 10-week path. RLS: authenticated users read `approved` rows only; staff read/write all.
Drafts are therefore a 404 for students.

## Source of truth
- Taxonomy: `src/lib/content/taxonomy.ts` — `CURRICULUM` (topics/subtopics, `is_free`,
  `source_section` label, `target_questions` for Loop 04, `walkthrough` flag) and `DEFAULT_PATH`.
  Never rename a slug once seeded; add freely.
- Content: `content/lessons/<slug>.json` and `content/questions/<slug>.json` — the reviewable
  artefact. Validate with `npm run content:validate`; load with `npm run content:load` (or the seed).
- Seed: `npm run seed -- 03` (idempotent) upserts topics, subtopics, content and the path.

## Validators (`src/lib/content/`)
- `lesson-schema.ts` — `LessonBodySchema`, `LessonBlockSchema`, `BLOCK_TYPES`,
  `validateLessonBody()`, `approvalProblems()`, `assertApprovable(body, { walkthrough })`,
  `evalExpr()` (re-checks `worked_calc` arithmetic).
- `question-schema.ts` — `QuestionSchema`, `validateQuestion()`, `splitQuestion()` (row vs body),
  `assertQuestionApprovable()`, `flashcardBack()`.
Required for `approved`: `trap`, `canonical_answer`, `your_turn`, `quick_fire` (exactly 4 pairs),
`one_liner`; `scenario` too for walkthrough subtopics; `reading_minutes ≤ 12`.

## Rendering
`src/components/lesson/lesson-renderer.tsx` renders any valid body in the order the JSON gives;
one component per block type in `blocks/`, each wrapped in `<Section data-testid="block-<type>">`.
Markdown via `markdown.tsx` (react-markdown + GFM + KaTeX; CSS classes `.prose-lesson` in
`globals.css`; KaTeX CSS imported only by the renderer). Reveal interactions: `reveal.tsx`
(canonical answer, your-turn, scenario check) and the `quick-fire` flip cards. Widgets:
`src/components/widgets/ev-bridge.tsx` is live; the other four names render a placeholder.

## Routes
Student: `/home/technicals` (topic cards) → `/[topic]` (subtopics + lessons) → `/[topic]/[lesson]`;
`/home/path` → `/home/path/[week]`. Staff: `/admin/lessons` → `/admin/lessons/[id]` (JSON editor
with live zod errors, approval warnings, preview; `saveLesson` server action).

## Adding a lesson by hand
1. Copy `content/lessons/ev-bridge-basics.json`, change `slug`, `subtopic_slug`, `title`, body.
2. `npm run content:validate` → fix errors → `npm run seed -- 03`.
3. Open `/admin/lessons`, set status, save. Students see it once `approved`.

## Generated content & review (Loop 04)
Lessons and questions are written by Claude through the Batches pipeline described in
`docs/research/content-pipeline.md` (`npm run content:generate` → `content:collect` → `content:load`
→ `eval --suite lessons,questions` → `content:approve`). Generated rows land as `generated` (or
`draft` with `review_note` when the automatic checks failed) and wait in `/admin/review`, where a
mentor approves, requests changes (→ `in_review`, note stored on the row + `content_reviews`) or
rejects, or regenerates the item synchronously with a note. `/admin/generation` shows every
`generation_runs` row (dry-run estimates included). Migration `0005_content_review.sql`.
