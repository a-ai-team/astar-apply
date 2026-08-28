# Cross-loop contracts

_Referenced by every loop plan. Change only by editing this file in the same PR._

These names, shapes and thresholds are fixed across Loops 01–10. A loop may *add* columns or block types; it may not rename or remove anything here without editing this file in the same PR.

### Overnight run conventions (apply to every loop)
- Branch `feat/<slug>` from `main`; squash-merge when **all** acceptance checks pass (Loop 10 excepted: open PR with `needs-james`).
- Loop 00 must be merged first. If `supabase/migrations/0001_init.sql` is absent on `main`, run Loop 00 before anything below.
- Every loop ends with `npm run lint && npm run typecheck && npm run build && npm run test:unit && npm run test:e2e` green. `npm run eval` additionally gates loops 02, 04, 06, 07, 09.
- Migrations: `supabase/migrations/NNNN_<slug>.sql`, applied by `npm run db:migrate` (`supabase db push --linked`, ref `nvigkfmrxtxvylbhfcwa`). Idempotent (`if not exists`, `create or replace`). Every user table has RLS enabled in the same migration.
- Seeds: `scripts/seed/<loop>.ts` via `npm run seed -- <loop>`; idempotent (upsert on natural key). Seeds are the machine-verifiable evidence that a data model works.
- Fixtures: `fixtures/` (committed, original/synthetic only, each file headed "PLACEHOLDER — synthetic content for pipeline testing"). The only private input is the 400Q PDF, read from `EVAL_HIDDEN_DIR` (default `~/Desktop/A* AI`) by `scripts/eval/extract-400q.ts`, writing only to `$EVAL_HIDDEN_DIR/.eval/`. `.gitignore` gains `.eval/`, `fixtures/private/`, `*.pdf`.
- Secrets: `.env.local` only; every new var goes in `.env.example` with a comment.
- Tests: `vitest` (`src/**/*.test.ts`, `scripts/**/*.test.ts`); `@playwright/test` smoke (`e2e/*.spec.ts`) against `next start` on port 3100. Playwright signs in via `supabase.auth.admin.generateLink({type:'magiclink'})` with the service key and visits `action_link` (`e2e/helpers/auth.ts`). Test users `e2e-student@astar.test`, `e2e-mentor@astar.test`, `e2e-admin@astar.test` created by `scripts/seed/00-users.ts`.
- Blocked-on-human rule: never stop the run for a human decision. Take the listed default, record it in the Retro under "Decisions taken by default", add a `TODO(james):` comment at the code site.

### Shared schema (Postgres `public`)
| Table | Purpose | Created in |
|---|---|---|
| `profiles`, `mentors` | users + roles | 0001 (Loop 00) |
| `corpus_sources`, `corpus_chunks` | mentor uploads + retrieval units | 0002 (Loop 01) |
| `chat_threads`, `chat_messages`, `chat_feedback`, `usage_daily` | chatbot | 0003 (Loop 02) |
| `topics`, `subtopics`, `lessons`, `questions`, `learning_paths`, `learning_path_items` | curriculum | 0004 (Loop 03) |
| `content_reviews`, `generation_runs` | review queue + batch runs | 0005 (Loop 04) |
| `flashcards`, `reviews`, `card_state`, `attempts`, `lesson_progress` | practice | 0006 (Loop 05) |
| `content_chunks` | lesson/question retrieval (+ `chat_threads.context`) | 0007 (Loop 06) |
| `interviews`, `interview_turns` | mocks | 0008 (Loop 07) |
| `firms`, `firm_questions`, `firm_question_reports`, `pulse_digests` | firm bank + Pulse | 0009 (Loop 08) |
| `industry_modules` (view) | industry | 0010 (Loop 09) |
| `plans`, `subscriptions`, `entitlements`, `playbook_progress`, `demo_usage` | billing/launch | 0011 (Loop 10) |

Conventions: `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at` via trigger `set_updated_at()` (0002). Slugs `text unique` kebab-case. Enums named `<table>_<column>`. RLS role helpers (created in 0001, Loop 00): `is_admin()`, `is_mentor()`, `is_staff()`; role read from the JWT claim **`user_role`** (`auth.jwt()->>'user_role'`) — not `role`, which Supabase reserves for the Postgres role. `set_updated_at()` also ships in 0001.

`content_status` enum: `draft | generated | in_review | approved | rejected | archived`. Only `approved` rows are served to students.

### Lesson JSON (`lessons.body jsonb`)
```jsonc
{ "version": 1, "reading_minutes": 8, "blocks": [
  { "type": "why_here", "md": "…" },
  { "type": "concept", "heading": "…", "md": "…" },
  { "type": "mechanics", "md": "…" },
  { "type": "worked_calc", "md": "…", "steps": [{ "label": "Net debt", "expr": "500 - 120", "value": 380, "unit": "£m" }] },
  { "type": "trap", "md": "…" },
  { "type": "canonical_answer", "md": "60–90 word memorisable answer", "seconds": 45 },
  { "type": "scenario", "prompt": "…", "statements": { "is": [{"line":"Net income","delta":-7.5,"note":"…"}], "cfs": [], "bs": [] }, "check": "…" },
  { "type": "your_turn", "prompt": "…", "model_answer_md": "…", "rubric": ["…"] },
  { "type": "quick_fire", "pairs": [{ "q": "…", "a": "…" }] },   // exactly 4
  { "type": "one_liner", "md": "…" },
  { "type": "now_you_can", "items": ["…"] },
  { "type": "widget", "widget": "three_statement|ev_bridge|filings_toggle|dcf_sensitivity|lbo_returns", "props": {} },
  { "type": "key_metrics", "rows": [{ "metric": "…", "definition": "…", "why_it_matters": "…" }] }   // Loop 09
] }
```
Required for `approved`: `trap`, `canonical_answer`, `your_turn`, `quick_fire`, `one_liner` (`scenario` required for walkthrough lessons). Validator `src/lib/content/lesson-schema.ts` (zod) — shared by the renderer (03), the Claude structured-output format (04), and evals.

### Question JSON (`questions` row + `body`)
```jsonc
{ "slug": "…", "topic_slug": "…", "subtopic_slug": "…", "kind": "concept|calculation",
  "difficulty": 1|2|3|4,   // 1 definition · 2 why · 3 second-order · 4 numerical/edge
  "question": "…", "model_answer_md": "…", "key_points": ["…"],   // 3–6
  "follow_ups": [{ "question": "…", "answer_md": "…" }],          // 2–3
  "weak_answer_note": "…", "numbers": { "inputs": {}, "answer": 380 } | null,
  "source_topic": "EqV & EV – calculations",   // 400Q section label ONLY, never text
  "tags": ["…"], "status": "generated" }
```
Validator `src/lib/content/question-schema.ts`. Flashcards are derived: front = `question`, back = first paragraph of `model_answer_md` unless `body.flashcard_back`.

### Chat message (`chat_messages.content`)
`{ text, citations: [{ chunk_id, source_id, kind: "corpus|lesson|question", label, quote, start, end, href? }], rung: "corpus|lesson|prior", model, usage }` — `href` (Loop 06) is the deep link for lesson|question citations (`/home/technicals/<topic>/<lesson>#block-<n>` or `/home/practice/<slug>`).

### AI module (`src/lib/ai/`)
- `client.ts` — one `Anthropic`; `MODEL_CHAT = MODEL_JUDGE = "claude-opus-5"`, `MODEL_FAST = "claude-haiku-4-5"`.
- `embeddings.ts` — `embed(texts, {inputType})`; provider by `EMBEDDINGS_PROVIDER` (`voyage` when key set, else `local` = deterministic hashed word/bigram, 1024-d, L2-normalised). Columns are always `vector(1024)`; switching provider = `npm run reembed`, not a migration.
- `rerank.ts` — Voyage `rerank-2` when key set, else Haiku listwise (`{order:number[]}`), else identity.
- `prompts/<name>.vN.ts` — `{ id, version, system, … }`; no dates/UUIDs/per-request data (cache stability).
- Every Opus 5 call: `client.beta.messages.*`, `betas: ["server-side-fallback-2026-07-01"]`, `fallbacks: "default"`, adaptive thinking, stream when `max_tokens > 8000`, check `stop_reason === "refusal"`. Batches omit `fallbacks`. Structured output via `messages.parse` + `zodOutputFormat`; never combined with `citations`.

### Eval harness (`scripts/eval/`)
`npm run eval -- --suite retrieval|chat|lessons|questions|grader|industry|all [--limit N] [--json out]`. Golden sets: `fixtures/eval/*.jsonl` (public, original) + hidden `$EVAL_HIDDEN_DIR/.eval/*.jsonl` (from `extract-400q.ts`, gitignored). Writes `.eval/last-<suite>.json`; non-zero exit on missed threshold. Judge `scripts/eval/judge.ts`: Opus 5, `{correctness, faithfulness, voice: 0–5, notes}`, `effort: "medium"`, cached prompt. CI runs `retrieval,chat` on PRs touching `src/lib/ai/**` (skips with warning if no key).

| Suite | Threshold | Introduced |
|---|---|---|
| retrieval | recall@5 ≥ 0.80 (≥ 0.70 printed when `EMBEDDINGS_PROVIDER=local`) | 02 |
| chat | correctness ≥ 3.8/5; faithfulness ≥ 4.2/5; corpus-citation rate ≥ 95 % where a labelled chunk exists | 02 |
| lessons | schema 100 %; readability ≥ 4/5; zero 8-gram overlap with 400Q | 04 |
| questions | schema 100 %; difficulty mix within ±15 % of 25/30/30/15; overlap 0 | 04 |
| chat (fusion) | lesson-citation rate ≥ 80 % on curriculum questions | 06 |
| grader | Spearman ≥ 0.7, MAE ≤ 1.0 vs 40 hand-labelled answers | 07 |
| industry | schema 100 %, overlap 0 | 09 |

### Technicals v2 (Loops 11–18) — additions, never renames
_Design: `docs/research/technicals-v2/{00-syllabus,01-interactive-teaching,02-lens-design}.md`. Implemented by Loop 11; filled by Loops 12–18._

**New lesson block types** (appended to the Lesson JSON union; validator `lesson-schema.ts`):
```jsonc
{ "type": "predict", "prompt": "…", "options": [{ "label": "…", "correct": true }], "explain_md": "…" },   // 2–4 options, exactly one correct; sits immediately before a widget
{ "type": "fill_numbers", "md": "…", "steps": [{ "label": "…", "expr": "500 - 120", "value": 380, "unit": "£m", "blank": true }] },   // ≥ 1 blank; graded client-side by evalExpr against `value` (±0.5 %)
{ "type": "order_steps", "prompt": "…", "steps": ["…", "…"] },   // 3–8 steps; the given order is the correct order
{ "type": "lens", "slot": "after-concept|after-mechanics|after-worked-calc|before-your-turn",
  "variants": { "tmt": { "heading": "…", "md": "…", "example_q": "…", "answer_md": "…" }, "healthcare": { … } } },
{ "type": "template", "kind": "three_statement_grid|dcf_sheet|paper_lbo|deal_summary", "props": {} }   // printable artefact block
```
- `LENSES` in `taxonomy.ts` = `[{ slug: "tmt", label, module_slug: "tmt" }, { slug: "healthcare", label, module_slug: "healthcare-biotech" }]`. Add, never rename.
- Lens rule (`lensProblems()` in `generate/checks.ts`, run by `content:validate` and the admin gate): a lesson with any `lens` block must provide every `LENSES` slug in every `lens` block. Lens selection = `?lens=<slug>` search param mirrored to `localStorage["astar.lens"]`; default generalist; no DB column.
- `WIDGET_NAMES` gains: `discount_dial, tv_share, gordon_vs_exit, wacc_builder, beta_relever, football_field, tsm_dilution, cash_cycle, multiple_matcher, accretion_rule, ppa_goodwill, synergy_npv, paper_lbo, lease_toggle, nci_vs_equity, deferred_tax, faded_walk`. The four placeholders (`three_statement, filings_toggle, dcf_sensitivity, lbo_returns`) become real. A widget's `props` are authored in the content file (the batch writer still emits `{}`).
- Approval for v2 lessons (`assertApprovable(body, { walkthrough, v2: true })`): existing rules + ≥ 1 `predict` + the widget named in the chapter spec + lens rule. `reading_minutes ≤ 12` unchanged (widgets don't count).
- Pure maths lives in `src/lib/finance/` — Loop 11 creates `{statements,bridge,discount,dcf,wacc,shares,merger,lbo}.ts`; chapter loops may add modules (e.g. `working-capital.ts`) but never re-implement maths a widget or `fill_numbers` grading already imports.

**Question tags** (no schema change; `tags: string[]`): `depth:sa-core|sa-stretch|ft-only` (required from Loop 12), `lens:tmt|healthcare` (lens questions only; hidden from the generalist bank), `format:verbal|fill|order|spot` (default `verbal`). `flashcards` are derived only from `depth:sa-core` and `sa-stretch` questions without a `lens:` tag.

**Cheat sheet** (`content/cheatsheets/<topic_slug>.json`, validator `src/lib/content/cheatsheet-schema.ts`, route `/home/technicals/[topic]/cheatsheet`, print CSS):
```jsonc
{ "topic_slug": "dcf", "formulas": [{ "name": "…", "latex": "…", "note": "…" }], "canonical": [{ "q": "…", "a": "…" }],
  "traps": ["…"], "one_liners": ["…"], "you_may_hear": ["…"] }   // you_may_hear = ft-only items, named not taught
```

**Taxonomy**: `CurriculumSubtopic.deferred?: true` hides a subtopic from the topic page until it has an approved lesson; `target_questions` is rewritten by each chapter loop to the v2 counts (`00-syllabus.md` § 8). Slugs are never removed.

**Eval**: `lessons` suite additionally asserts the lens rule and `predict` presence on v2 lessons; thresholds unchanged (schema 100 %, overlap 0, readability ≥ 4 when credit).

### Rough budget
| Loop | Agent tokens | API spend | Wall time |
|---|---|---|---|
| 01 | 1.5–2.5 M | ~$3 | 2–3 h |
| 02 | 2–3 M | ~$10 | 3–4 h |
| 03 | 1–1.5 M | ~$1 | 1.5–2 h |
| 04 | 1.5–2 M | ~$40–60 (Batches) | 3–4 h |
| 05 | 1.5–2 M | ~$1 | 2–3 h |
| 06 | 1–1.5 M | ~$8 | 1.5–2 h |
| 07 | 2–3 M | ~$10 | 3–4 h |
| 08 | 1.5–2 M | ~$10 | 2–3 h |
| 09 | 1 M | ~$40 (Batches) | 2 h |
| 10 | 2–3 M | ~$1 | 3 h |
| **Total** | ~16–22 M | ~$130–160 | **~24–30 h → two nights** |
