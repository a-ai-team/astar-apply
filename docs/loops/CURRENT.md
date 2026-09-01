# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-28 (Technicals v2) · **Programme completed:** 2026-09-01
- **Loop:** **18 LBO complete — the programme is done.** All of Loops 11–18 are merged to `main`
  (Loop 18 via this PR). There is no next loop; what remains is human work (§ For James & Tesleem).
- **Last checks (Loop 18, on `feat/loop-18-lbo`):** lint ✓ typecheck ✓ build ✓ unit **403/403** ✓
  e2e **79/79** (18-lbo 6/6; 07/09 unchanged) ✓ `content:validate` 0 errors (**36 lessons, 210
  questions, 7 cheat sheets**) ✓ **20 widgets** registered ✓ eval **PASS** (lessons schema 1.00,
  overlap 0, readability **4.50**; questions schema 1.00, overlap 0, mix **0.126** at n = 202) ✓
  seeds 03/05 + `content:index` run; path resolves **35/35 v2 lessons + 7 cheat-sheet days** ✓
- **Blockers:** none. Lighthouse a11y never run (§ Standing gaps).

---

## The programme, finished

**35 of 35 v2 lessons · 202 chapter questions (210 in the bank) · 20 widgets · 7 cheat sheets ·
4 printable templates · 10-week path re-sequenced · lens option on drills and mocks · 20 e2e specs.**

| Loop | Chapter | Lessons | Questions | State |
|---|---|---|---|---|
| 11 | Platform | — | — | merged |
| 12 | Finance foundations | 3 | 12 | merged · `generated` |
| 13 | Accounting | 8 | 42 | merged · approved & **live** |
| 14 | EqV vs EV | 4 | 29 | merged · approved & **live** |
| 15 | Valuation | 5 | 31 | merged · `generated` |
| 16 | DCF | 7 | 42 | merged (#36) · `generated` |
| 17 | M&A | 4 | 22 | merged (#38) · `generated` |
| 18 | LBO | 4 | 24 | **merged via this PR** · `generated` |

**21 spec errors** were caught across the run by verifying every number against `src/lib/finance/*`
before writing prose — the single highest-value habit of the whole programme (per-loop detail in the
loop docs' retros). Loop 18 additionally fixed two latent defects found on `main`: approved
lens-tagged questions leaking into generalist drills (a CONTRACTS violation dormant since Loop 11)
and an unresolved merge-conflict marker sitting live in `docs/MASTER_PLAN.md`.

## For James & Tesleem — everything that needs a human

1. **Approve the four paid chapters** in `/admin/review` — Valuation (31), DCF (42), M&A (22) and
   LBO (24 questions, 4 lessons each chapter) all sit `generated` by policy. After approving:
   `npm run seed -- 05 && npm run content:index` (derives the flashcards, indexes the chunks).
2. **Lighthouse a11y** (standing gap since Loop 11, no headless Chrome in the sandbox):
   `npx lighthouse http://localhost:3100/home/technicals/accounting/three-statement-links --only-categories=accessibility`
   against `next start` clears Loops 11–18 in one run.
3. **Two one-line content fixes flagged by the gates** (pre-existing, on `main`): the DCF cheat
   sheet's discounting note claims mid-year lifts EV "3–4 %" (library: +0.9 %); Loop 15's
   `multiples-and-metrics` TMT lens answer has a Rule-of-40 inconsistency the readability judge
   keeps sampling low (3.3).
4. **Migrations 0010/0011 remain unapplied** (inherited from Loops 09/10; nothing in 11–18 needs
   them — seed 03 warns and works around). **PR #17** (Loop 10 launch) is still deliberately
   untouched: `needs-james`, placeholder legal copy, unconfigured Stripe.
5. Loop 04/09 batch content runs never happened; credit exists now if top-ups are ever wanted.

## Merging — how it works here

`.claude/settings.local.json` (gitignored, this project only) allows `gh pr merge`, so Claude can
merge its own PRs with `--admin` (branch protection requires a review an author cannot self-give).
**One PR at a time, never `--delete-branch`** — batching with it once deleted base branches out from
under queued PRs. After a squash merge, delete the branch and prune. If parallel branches ever exist
again, conflicts land in `docs/{MASTER_PLAN,TECHNICALS}.md`, `docs/loops/{CURRENT,RUNLOG}.md` and
`src/components/lesson/blocks/widget.tsx`; resolve to the superset and verify the widget registry —
`grep -c "as ComponentType"` must equal **20**.

## How a chapter loop ran (the pattern, kept for future content programmes)

1. Read the content spec (`docs/research/technicals-v2/1N-*.md`) and the loop plan; **deep-plan by
   hand-verifying every spec number against `src/lib/finance/*` first** — this caught 21 errors.
2. Set the taxonomy (deferred flags, targets), extend the finance library, pin every worked number
   in tests — *before* any content agent runs.
3. Launch in parallel: one widget agent + two lesson agents (disjoint files); write the cheat sheet
   yourself while they run. Programme-close code streams (path, interviews) ran as parallel agents
   too — safe because their files were disjoint.
4. Then the questions agent (it must read the finished lessons). If an agent stalls, check what
   landed on disk, validate it, and brief a fresh agent with exactly the remainder.
5. `content:validate` → seeds → `eval -- --suite lessons,questions` → e2e agent → retro → PR →
   `--admin` merge.

## Rules learned the hard way — do not rediscover these

1. **Verify every number against `src/lib/finance/*`** — the specs predate the library; 21 errors
   caught across seven chapters.
2. **When spec and library disagree, the library wins** — flag it, never edit code to match prose
   (the mid-year TV convention, the synergy-cost taxing, the paper-LBO paydown).
3. **Check every spec question slug against `content/questions/` before writing** (Loop 13 once
   silently downgraded an approved question).
4. **Check company names *and their economics* across chapters.** In use: Ashdown Bakeries (12),
   Kestrel Foods (13, +17 your-turn), Harbourline (14, 16), Marlow Instruments (15, 16), Tamar
   Group / Wychwood (17), Pennard Logistics / Marlow Capital / Kite Bakeries / Denholm Coldstores
   (18), Oakhurst / Bexfield (17), plus peers Brantwood Sensors, Thornbury Optics, Larkfield
   Controls, Penrose Metrology, Halden Labs, Ravensworth Foods, Tilbury Freight.
5. **If you rename an entity, sweep bare forms too**; re-run `eval --suite lessons` after any rename.
6. **No stock interview phrasings** — the hidden 8-gram check has fired; the repo is public.
7. **Introduce every number before using it; gloss every term on first use.**
8. **Widget props: values are EV, rates are decimals**; never pass per-share values with
   `display: "share"`.
9. **Never pin content counts in tests** — derive from the page or `findSubtopic()`.
10. **Delete scratch scripts** — they break lint.
11. **The difficulty-mix gate is manageable**: promote genuinely definitional questions to d1 when a
    chapter runs d3-heavy (0.132 → 0.126 in Loop 18, done honestly).

## Standing gaps (not blockers)

- **Lighthouse a11y never run** (§ For James 2).
- **Migrations 0010/0011 unapplied** (§ For James 4).
- **Difficulty mix 0.126** against the 0.15 gate — healthy; d1 is still the thin band (0.124 vs 0.25).

## Heartbeat (Stop hook appends here; keep last 10 lines)
- 2026-09-01 heartbeat
