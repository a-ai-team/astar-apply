# Loop 20 — Week packs: the 10-week path on paper

_Status: open PR. Protocol: `docs/loops/README.md`. Asked for by James in chat, 2026-09-20: "check
through the 10-week path that it's all ready; each week should have a fully made PDF that can be
downloaded — and printed, both sides, looking really good. Practical: exactly what you need to
know, nothing more, nothing less."_

## Goal
Every week of `DEFAULT_PATH` downloads as one print-ready A4 PDF — the week on paper — and the path
itself is audited end to end so nothing on it is a dead end.

## Out of scope
New technical content. A PDF per *lesson* (the week is the unit). Student-specific packs (progress,
lens choice). Any change to the launch PR (#17).

## What the audit found (2026-09-20)
| Check | Result |
| --- | --- |
| Weeks 1–9 lessons | 35 / 35 exist in `content/`, `approved`, linked in `learning_path_items` (live DB) |
| Cheat sheets | 7 / 7, every `sheetDay` resolves |
| `content:validate` · `eval --suite lessons` | 0 errors · PASS, 0 overlap hits |
| **Week 10** | **3 fit lessons never written** (`big-five-fit`, `why-banking-why-firm`, `cv-and-experience`) — the week page showed three "Coming soon" rows. Drafted this loop, see below. |
| Week page → lesson links | Built from the *week's* topic, so week 10's "why banking" (topic `why-banking`) would 404. Fixed: links use the lesson's own topic. |
| Draft leakage | `getPath()` did not filter on status and the shared team session is staff, so any linked draft read as **Ready**. Fixed: approved-only. |
| Drill / review / mock days | Plain text, no destination. Now link to the chapter's bank, the flashcards, or the mock studio. |
| Print CSS | Hid `header[data-app-header]` — an attribute nothing carried, so the app header printed on every cheat sheet. Fixed. |
| Worked-example values | `£-10m`, `1.31 £`, and unit-less rates at 2 dp (`0.05` for 4.5 %, `0.08` vs `0.07` for the WACC lesson's whole point). Fixed in `formatValue` (site + packs). |
| Accounting cheat sheet | Raw `**up**` in a plain-text trap. Fixed. |

## How it works
- **`/home/path/[week]/pack`** is the pack *and* the PDF source: cover + the week's plan, each
  approved lesson, the chapter cheat sheet when the week closes one, a practice set, then its model
  answers. Data: `getWeekPack()` in `src/lib/content/packs.ts` (approved only, generalist bank only).
- **`PrintLesson`** (`src/components/lesson/print-lesson.tsx`) renders lesson JSON for paper: every
  reveal open under a dashed "check" rule, `fill_numbers` blanks as write-in lines with the answers
  beneath, `predict` as A–D with the answer, `order_steps` with the order, widgets as a one-line
  pointer to the site. **Lens blocks are left out** — the generalist lesson is complete without
  them and the pack is the core, nothing more.
- **Practice set** — 10 questions dealt round-robin across the week's subtopics (easiest first
  inside each). Week 10 has no lesson questions, so it gets a **15-question spoken mock** across all
  seven chapters, rotating second-order → numerical → why → definition; `format:fill|order|spot`
  questions are excluded from the mock.
- **Print layout** (`globals.css`, `@media print`): A4; **mirrored margins for double-sided
  printing** (20 mm binding edge, 12 mm outer, via `@page :left/:right`); every lesson, the cheat
  sheet, the questions and the answers start a new page; self-contained blocks (tables, traps,
  canonical answers, quick-fire…) never split; prose flows; gold and coral darken to ink weight;
  the cream wordmark prints black. Footer (centred, so it is right on both faces): week + page n / N.
- **`npm run packs:build`** (`scripts/path/build-packs.ts`) signs in with the access key, prints
  each pack page with Playwright's Chromium and uploads to the private Storage bucket **`packs`**
  (created on first run — no migration, so nothing collides with 0011 on PR #17). `--week N`,
  `--no-upload` (PDFs land in gitignored `.packs/`), `PACKS_BASE_URL` to target a deployment.
- **`/home/path/[week]/pdf`** streams the stored file as an attachment
  (`astar-apply-week-04-equity-value-vs-enterprise-value.pdf`) behind the usual gates. No stored
  file → redirect to the pack page with `?print=1`, which opens the print dialog.
- PDFs are **never committed** (hard rail; `*.pdf` and `.packs/` are ignored) and never public.

**Re-run `npm run packs:build` whenever a lesson, cheat sheet or question changes** — the stored
PDFs are snapshots.

## Week 10 lessons (drafted, not live)
Three fit lessons written to the lesson contract (predict + order_steps, no lens, 8 min each), one
running candidate (Nadia) and a fictional firm (Calloway Reece): *the five fit questions and the
ninety-second story*, *the swap test for why banking / why this firm*, *the CV as a list of claims*.
They pass `assertApprovable` and the lessons eval (0 overlap hits) and are loaded as **`generated`**
— invisible to students, linked to week 10 days 1–3.

The mentor corpus is thin on fit and part of it is marked synthetic placeholder, so these lean on
general practice rather than Tesleem's voice. **Tesleem should read them before approval.**

To publish: `npm run content:approve -- --topic fit-behavioural,why-banking`, then
`npm run packs:build -- --week 10`.

## Decisions taken by default
- Storage bucket created from the script rather than a migration (0011 is parked on PR #17).
- Fit lessons loaded as `generated`, not approved — fit is the mentor's ground.
- Lens variants are not printed.
- The three lessons were loaded with a targeted upsert, not `seed -- 03`, so no live lesson that may
  have been edited in `/admin/lessons` was overwritten from `content/`.

## Tasks
- [x] Audit the path against `content/` and the live DB
- [x] `getPath()` approved-only + per-lesson topic slug; week page drill links + pack buttons
- [x] `getWeekPack()`, `PrintLesson`, `CheatSheetBody` (shared with the cheat-sheet page), pack page
- [x] Print stylesheet: A4, duplex margins, break rules, ink colours; `data-app-header` fix
- [x] `formatValue` fix (sign, units, rate precision) + unit tests
- [x] `packs:build` script, `packs` bucket, `/home/path/[week]/pdf` download route
- [x] Three week-10 fit lessons drafted, validated, loaded as `generated`
- [x] e2e `20-week-packs.spec.ts`; docs
- [x] All ten PDFs built, read page by page for layout, uploaded

## Acceptance checks
- [x] lint · typecheck · build · unit 409/409
- [x] e2e `20`, `18`, `03` green (13/13) against `next start`
- [x] Ten PDFs in the `packs` bucket; `/home/path/4/pdf` answers `application/pdf` with `%PDF-`
- [x] Print media hides header and toolbar; no `button` / `input` inside a printed lesson
- [x] Visual read of weeks 3, 7, 10: cover, lesson pages, cheat sheet, questions, answers
- [ ] Week 10 fit lessons approved (**needs James / Tesleem**) and its PDF rebuilt

## Retro
Shipped: a pack page that is also the PDF, ten stored PDFs, a gated download, duplex print CSS, and
five defects the audit surfaced on the live path (draft leakage, the week-10 404, dead drill days,
the unhidden print header, value formatting). Slipped: week 10's PDF carries the plan and the mock
only until its lessons are approved. Next loop must know: stored PDFs are snapshots — rebuild after
content changes; `formatValue` now owns unit placement, so new units go in `UNIT_AFFIX`.
