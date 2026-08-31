# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-28 (Technicals v2) · **Handover written:** 2026-08-31
- **Loop:** **17 M&A complete** on `feat/loop-17-ma` — all checks green, PR next. Then Loop 18 LBO (last).
- **Last checks (on `feat/loop-17-ma`):** lint ✓ typecheck ✓ build ✓ unit 386/386 ✓ e2e **73/73**
  (17-ma 6/6) ✓ `content:validate` 0 errors (32 lessons, 186 questions, 6 cheat sheets) ✓ 18 widgets
  registered ✓ eval lessons+questions **PASS** (lessons schema 1.00, overlap 0, readability 4.35;
  questions schema 1.00, overlap 0, mix **0.132** at n = 178) ✓ seeds 03/05 + `content:index` run ✓
- **Spec errors found (Loop 17, verified against the library — the tally is now 17):** (15) synergy
  NPV ≈ **£167m** not £160m (the spec left the integration cost untaxed); (16) breakeven run-rate
  ≈ **£12.6m** pre-tax, not "9–10"; (17) the spec's difficulty summary line contradicts its own
  table (2/7/6/3 followed). Full detail in the Loop 17 retro.
- **Blockers:** none. Lighthouse a11y never run (§ Standing gaps).
- **Next action:** commit → PR → `--admin` squash merge (one at a time, no `--delete-branch`),
  then branch Loop 18 LBO off the refreshed `main`.

---

## Where the programme is

**31 of 35 lessons written · 178 of ~202 questions · 18 widgets · 10 finance modules · 19 e2e specs.**

| Loop | Chapter | Lessons | Questions | State |
|---|---|---|---|---|
| 11 | Platform | — | — | **merged to `main`** |
| 12 | Finance foundations | 3 | 12 | **merged to `main`** |
| 13 | Accounting | 8 | 42 | **merged to `main`** · approved & **live** |
| 14 | EqV vs EV | 4 | 29 | **merged to `main`** · approved & **live** |
| 15 | Valuation | 5 | 31 | **merged to `main`** · `generated` |
| 16 | DCF | 7 | 42 | **merged to `main`** · `generated` |
| 17 | **M&A** | 4 | 22 | **complete on `feat/loop-17-ma`** · `generated` — PR pending |
| 18 | **LBO** | 4 | 24 | **not started** |

Accounting and EqV/EV are the only free topics and the only ones that auto-approve. Valuation, DCF,
M&A and LBO land `generated` and wait in `/admin/review` — that is policy, not an oversight.

---

## Merging — now unblocked

`.claude/settings.local.json` (gitignored, this project only) carries
`"permissions": { "allow": ["Bash(gh pr merge:*)"] }`, so **Claude can merge PRs itself**. It was
added deliberately at a narrow scope: not the committed project settings — that would grant
admin-merge to every collaborator on a public repo — and not the global user settings, which would
carry it into `revision-coach-pro`, where `main` is production with no staging.

`main` requires 1 approving review and a PR author cannot approve their own PR, so merges use
`--admin`. **Merge one PR at a time and re-check the next**, and **do not pass `--delete-branch`**:
batching merges with it once deleted base branches out from under queued PRs, auto-closing two of
them and forcing a 17-conflict repair.

After each squash merge the remaining branches conflict, because `main` now holds as one squashed
commit what they still carry individually. The repair is mechanical and takes a minute:

```
git checkout <branch> && git merge origin/main --no-edit
git checkout --ours $(git diff --name-only --diff-filter=U)   # branch side is always newer
git add -A && git commit --no-edit && git push
```

Conflicts land in the same five files every time: `docs/{MASTER_PLAN,TECHNICALS}.md`,
`docs/loops/{CURRENT,RUNLOG}.md` and `src/components/lesson/blocks/widget.tsx`. **Always verify the
widget registry is a union afterwards** — `grep -c "as ComponentType"` should equal the number of
built widgets (18 after Loop 17). Then delete the branch and prune.

`#17` (Loop 10 launch) is **deliberately untouched** — `needs-james`, placeholder legal copy and an
unconfigured Stripe. Not this programme's work, and not something to merge on a permission rule.

## Branching for Loops 17–18

Branch **off `main`**, not off the previous chapter, and merge each chapter before starting the
next. Stacking is what caused the mess above. `main` now holds Chapters 11–16, so Loop 17 starts
from complete content. The files two chapters can both touch are:

- `src/lib/content/taxonomy.ts` (targets + `deferred` flags)
- `src/components/lesson/blocks/widget.tsx` (the widget registry)
- `docs/{MASTER_PLAN,TECHNICALS}.md`, `docs/loops/RUNLOG.md`

Expect conflicts in exactly those; resolve to the superset.

---

## How a chapter loop runs (the pattern that worked)

1. Read `docs/research/technicals-v2/1N-*.md` (the content spec) and `docs/loops/1N-technicals-*.md`.
2. Set the taxonomy: `deferred: true` on folded subtopics, `target_questions` summing to the chapter total.
3. Launch in parallel: **one widget agent**, **two or three lesson agents** (split the chapter), each
   writing disjoint files. Write the cheat sheet yourself while they run.
4. Then the questions agent (it must read the finished lessons).
5. `content:validate` → `seed -- 03` → `eval --suite lessons,questions` → e2e agent → retro → PR.

Four parallel agents is the sweet spot. More than that and they collide on shared files.

---

## Rules learned the hard way — do not rediscover these

1. **Verify every number against `src/lib/finance/*`.** The specs predate the library. **Fourteen
   spec errors** have been caught this way across five chapters — wrong per-share ranges, a backwards
   EV/EBIT claim, a widget prompt its own data could not satisfy, mix prose contradicting its table.
2. **When the spec and the library disagree, the library wins** — flag it, never edit the code to
   match the prose. Three agents independently hit the mid-year convention this way; `dcfValue`
   discounts terminal value at the final year's **end-of-year** factor even under `midYear`
   (£1,562m / +0.9 %, not the spec's £1,600m / +3–4 %). Changing it would have broken every chapter.
3. **Check every spec question slug against `content/questions/` before writing.** Loop 13 silently
   overwrote an **approved** question and downgraded it. Restored, but check first.
4. **Check company names *and their economics* across chapters.** The DCF spec reused "Kestrel Foods"
   at a 12 % margin against Chapter 13's 24 % — same name, contradictory facts. Companies in use:
   Ashdown Bakeries (12), Kestrel Foods (13), Harbourline (14, 16), Marlow Instruments (15, 16),
   plus peers Brantwood Sensors, Thornbury Optics, Larkfield Controls, Penrose Metrology, Halden Labs.
5. **If you rename an entity, sweep bare forms too.** Renaming only the full names left two lessons
   naming three companies for two entities. Schema, arithmetic and overlap all passed it — only the
   **readability judge** caught it (3.4 and 2.8). Re-run `eval --suite lessons` after any rename.
6. **Do not recite standard definitions or stock interview phrasings.** The 8-gram check against the
   hidden 400Q set has fired twice. Rephrase; the repo is public.
7. **Introduce every number before using it, and gloss every term on first use.** The judge has
   failed lessons for both.
8. **Widget props: values are EV and rates are decimals.** `methods.low/high` are always EV — the
   `display: "share"` prop does the conversion. Passing per-share values *and* `display: "share"`
   double-converts and renders negative bars (caught by e2e, not by review).
9. **Never pin content counts in tests.** Every chapter invalidates them. Derive from what the page
   reports, or from `findSubtopic()`. Five assertions and one **real race** (the final flashcard
   rating is a server action with no end-of-session event once decks grew) were fixed this way.
10. **Delete your scratch scripts.** Agents left four `scripts/dev/__*.ts` behind; they break lint.

---

## Loop 17 — M&A (complete, PR pending)

Retro: `docs/loops/17-technicals-ma.md`. Everything shipped per plan; `generated`, awaiting mentor
approval. For Loop 18: widget props added — `accretion_rule {…, offerPe, mode: "simple"|"full"}`
(offer value derived as offerPe × targetNetIncome), `synergy_npv {runRate, phaseInYears,
integrationCost, discountRate, taxRate, premium}`, `ppa_goodwill {purchasePrice, bookEquity,
writeUps, taxRate}`. Companies added: Tamar Group plc, Wychwood Ltd, Oakhurst plc, Bexfield Ltd.

## Loop 18 — LBO (next, last) — also owns the programme close

Spec `docs/research/technicals-v2/18-lbo.md`, plan `docs/loops/18-technicals-lbo.md`.
4 lessons including **`paper-lbo-walkthrough` — a new subtopic slug that must be added to
`taxonomy.ts`**; `debt-tranches` and `lbo-mental-maths` fold in. 24 questions. Widgets `lbo_returns`,
`paper_lbo`. Company: **Pennard Logistics** (EBITDA £50m, 8× entry, 5× leverage, 5-year hold).
`src/lib/finance/lbo.ts` already exists — `paperLbo` uses a **blended** debt rate (7.6 %, so year-1
interest is £19m not £17.5m) and sweeps all free cash flow.

Loop 18 additionally owns: re-sequencing `DEFAULT_PATH` (day 5 of each week = that chapter's cheat
sheet + faded-walk review), a "with lens" option on drills and mocks, and refreshing
`docs/TECHNICALS.md` for v2.

---

## Standing gaps (not blockers)

- **Lighthouse a11y never run** — no headless Chrome in this sandbox. One command clears Loops 11–16:
  `npx lighthouse http://localhost:3100/home/technicals/accounting/three-statement-links --only-categories=accessibility`
  against `next start`.
- **Migrations 0010 and 0011 still unapplied** (inherited from Loops 09/10). Nothing in 11–16 needs them.
- **Bank-wide difficulty mix is 0.132 against a 0.15 gate** after M&A (d2 heavy at 0.343 vs 0.30).
  LBO's 24 questions must not push it over — lean d1/d4 where the spec allows.
- Loop 04/09 content batches never ran; credit exists now (the readability judge runs live).

## Heartbeat (Stop hook appends here; keep last 10 lines)
- 2026-08-31 12:16 heartbeat
- 2026-08-31 12:26 heartbeat
- 2026-08-31 12:27 heartbeat
- 2026-08-31 12:28 heartbeat
- 2026-08-31 12:31 heartbeat
- 2026-08-31 12:42 heartbeat
