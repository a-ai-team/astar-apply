# A* Apply — Master Plan

*Owner: James Wingfield · Mentor #1: Tesleem · Last updated 2026-08-25 (loop plans + overnight run protocol added)*

## What we are building

An AI-supported online resource for students breaking into finance, built **with the best finance
students** as mentors. Two core products, in this order:

1. **The Mentor Chatbot** — a chat assistant trained on our mentors' own material (starting with
   Tesleem's notes, photos and answers) using a carefully-built RAG pipeline. It answers the way a
   strong senior student who has *actually done the process* would, and cites where the advice comes
   from.
2. **Technicals** — the textbook that doesn't exist for second-years: a structured curriculum,
   question bank, flashcards and mock-interview practice covering every generalist IB technical
   topic. Structured by the *400 Questions* guide's taxonomy; content written by Claude and reviewed
   by mentors; feature parity with financefluency.co.uk as the baseline, then beyond it.

Not an application tracker. Separate site from the main A* AI product; shares the A* brand.

## Ground truths (from research — see `docs/research/`)

| Area | Finding | Consequence |
|---|---|---|
| Repo | Next.js 16.3 App Router, React 19, Tailwind 4, Vercel. Only a "Coming soon" page + key-gated `/home`. **Repo is public.** | Nothing copyrighted or secret in git. Read `node_modules/next/dist/docs/` before coding. |
| 400Q guide | 413 Qs: ~73 fit, ~191 generalist technical across 13 sections, ~149 industry. Each technical topic splits *Concepts* / *Calculations*. Copyrighted (BIWS). | Use as taxonomy + hidden eval set. Never as content. Details: `research/400q-taxonomy.md`. |
| financefluency.co.uk | Nav: Curriculum (9 topics / 39 lessons, first two free) · Practice · Flashcards (spaced repetition) · Interviews (194 real Qs across 14 banks, tagged by stage/programme) · Pulse (market news) · Non-Target playbook · Pricing free / £4.99 / £9.99 (AI tools on top tier). AI-graded mock interviews (pace, filler words, eye contact), live DCF workshop. | Feature-parity list below. Details: `research/financefluency.md`. |
| Claude API | Use `claude-opus-5`, adaptive thinking, streaming, prompt caching, server-side refusal fallbacks; PDF/image input native; citations supported. (`/claude-api` skill.) | Chatbot on the Anthropic TS SDK directly — no LangChain. |
| Prior art | James's `ib-daily-lesson` skill already maps a 10-week curriculum onto the 400Q sections. | Reuse its week/day sequencing as the default learning path. |

## Architecture (decided defaults — change via a loop plan, not ad hoc)

- **App**: Next.js 16 App Router, server components + route handlers, Tailwind 4. Shared UI in
  `src/components`. Content pages are MDX-free: lessons live in the DB and render from structured
  JSON so mentors can edit them in-app.
- **Data**: Supabase (Postgres + `pgvector` + Auth + Storage). One project, `dev` and `prod`
  branches. Row-level security on all user tables.
- **Auth**: Supabase Auth (email magic link + Google). Roles: `student`, `mentor`, `admin`. The
  existing shared access key stays as a *second* gate on `/home` until public launch.
- **AI**: Anthropic TS SDK. `claude-opus-5` for chat/generation, `claude-haiku-4-5` for cheap
  classification/routing. Embeddings: Voyage AI (`voyage-3-large`) — swap-able behind
  `src/lib/ai/embeddings.ts`. Reranking: Voyage rerank. All prompts in `src/lib/ai/prompts/` and
  version-tagged.
- **RAG**: hybrid retrieval (pgvector cosine + Postgres full-text) → rerank → answer with
  citations to corpus chunks. Chunking is *document-type aware* (a photo of handwritten notes ≠ a
  PDF ≠ a Q&A pair). Every chunk carries `mentor_id`, `source_id`, `topic_tags`, `page/region`.
- **Evals**: `scripts/eval/` — golden question set + LLM-as-judge; run in CI on PRs touching
  `src/lib/ai/`. Gate: no regression on retrieval recall@5 or answer score.
- **Content pipeline**: `scripts/content/` generates lesson + question JSON with Claude (Batches API
  for bulk, 50% cheaper), writes to `content/` as reviewable JSON, mentors approve in an admin UI,
  approved rows are seeded into the DB.
- **Payments** (later): Stripe. **Analytics**: Vercel Analytics + PostHog.

## Loops

Each loop follows `docs/loops/README.md` and the shared `docs/loops/CONTRACTS.md` (schema names, JSON shapes, eval thresholds). Every loop has a full plan doc already. Run unattended, the whole set is ~24–30 h of agent time (~$130–160 API spend) — two overnight runs. Status values: planned · in-progress · merged · merged (partial) · open-pr · blocked.

| # | Loop | Delivers | Status |
|---|---|---|---|
| 0 | [Foundations](loops/00-foundations.md) | Supabase + auth + roles, DB migrations, app shell/design system, admin area, CI (lint/build/eval) | merged |
| 1 | [Mentor corpus ingestion](loops/01-mentor-corpus.md) | Upload UI for Tesleem (photos, PDFs, notes, Q&A), Claude-vision OCR/transcription, type-aware chunking, embeddings, corpus browser, tagging | merged (partial) |
| 2 | [Mentor chatbot v1](loops/02-chatbot.md) | Hybrid RAG + rerank + citations, streaming chat UI, threads, feedback thumbs, eval harness with hidden 400Q set | merged (partial) |
| 3 | [Technicals taxonomy & content model](loops/03-technicals-model.md) | Topics/subtopics/lessons/questions schema seeded from the 400Q taxonomy; lesson renderer; learning path (10-week default) | merged |
| 4 | [Technicals content generation](loops/04-content-generation.md) | Claude writes every lesson (concept → mechanics → worked calc → drill) and an original question bank (~350 Qs, follow-ups, difficulty), mentor review queue | merged (partial) |
| 5 | [Practice: question bank + flashcards](loops/05-practice.md) | Filterable question bank, reveal-answer flow, spaced-repetition flashcards (FSRS), progress dashboard, streaks | merged |
| 6 | [Chatbot ↔ Technicals fusion](loops/06-chat-technicals.md) | Bot retrieves from lessons too; "explain this question" from any card; mentor corpus + curriculum citations | merged (partial) |
| 7 | [AI mock interviews](loops/07-mock-interviews.md) | Text mock interviews graded against model answers with rubric; then voice (Web Speech / Whisper) with pace/filler analysis | merged (partial) |
| 8 | [Firm interview bank + Pulse](loops/08-firms-pulse.md) | Real-question bank by firm/stage/programme (mentor-sourced), market-news digest (Pulse) | merged (partial) |
| 9 | [Industry modules](loops/09-industry-modules.md) | 18 industry/group technical modules from the 400Q industry taxonomy | merged (partial) |
| 10 | [Launch](loops/10-launch.md) | Public landing, pricing tiers (free / core / AI), Stripe, SEO, analytics, non-target playbook — **stays an open PR for James** | planned |

Loops 0–2 are the chatbot MVP. Loops 3–5 are the Technicals MVP. 6+ is where we pass
financefluency.

## Feature parity checklist vs financefluency.co.uk

Full inventory: `research/financefluency.md`. Our version of each, and which loop ships it:

| financefluency feature | Ours | Loop |
|---|---|---|
| Curriculum: 9 topics / 39 lessons (6–12 min), first two topics free, module progress | 7 core topics + foundations + fit, ~5 lessons each, same lesson template (trap · canonical answer · scenario · your-turn · quick-fire · one-liner), first two free | 3–4 |
| Interactive widgets: three-statement scenario animator, EV bridge, filings toggle, 2-min video summary | Same widgets as React components; video summaries later (Higgsfield/TTS) | 4, 7 |
| Written question bank, topic × easy/medium/hard, ⌘K | ~350 original Qs on the 400Q taxonomy, 4 difficulty levels, follow-ups, ⌘K | 4–5 |
| Flashcards: 6 decks, two-button SRS, two-in-a-row mastery | FSRS-scheduled decks for every topic incl. fit, auto-generated from Qs | 5 |
| Topic drill (5 Qs, AI-marked) · Full mock (15 Qs, timed, focus-area report) | Same, graded against our model answers with a rubric, plus mentor-voice feedback | 7 |
| HireVue-style video mock: Content/10, Delivery/100, eye contact %, video never uploaded | Same privacy model (local video, audio-only transcription); pace/filler v1, eye contact v2 | 7 |
| DCF workshop: per-cell guidance, AI rubric, VP defence Qs | Guided DCF build, then 3-statement + LBO builds (from James's curriculum) | 7 (stretch) / 9 |
| 14 firm banks, 194 Qs, tags (stage/programme/frequency/recency), sources, firm dossier + process timeline, report-a-question form | Mentor-sourced firm bank with identical tagging, dossiers, and a reviewed report form | 8 |
| Pulse: live tiles, 30-second take, compare, live-number practice Qs, calendar | Weekly AI digest first; live tiles via FMP later | 8 |
| Non-Target playbook (7 sections, interactive checklist) | Mentor-written playbook, chatbot-aware | 10 |
| Pricing free / £4.99 / £9.99, Stripe, promo code | Same shape; numbers decided in Loop 10 | 10 |
| Homepage "Couldn't I just ask AI?" section, testimonials, uni strip | Our answer: "ask a mentor who got in" — chatbot demo on the landing page | 10 |
| **Not on financefluency** | Mentor chatbot with citations; mentor-reviewed content; 10-week learning path; Excel drills across topics | 1–2, 6 |

## Decisions needed from James / Tesleem (defaults in brackets so work continues)
1. Supabase org/billing owner [James creates, invites Tesleem].
2. Mentor content licence — Tesleem's uploads are used to train/retrieve for all students [yes, with
   attribution shown in citations].
3. Brand name for the chatbot [“Mentor”].
4. Pricing [copy financefluency's shape, decide numbers in Loop 10].

## How to start
```
git checkout main && git pull
/loop Work on A* Apply loop 00 as described in docs/loops/README.md and docs/MASTER_PLAN.md ...
```
(full prompt in `docs/loops/README.md`).
