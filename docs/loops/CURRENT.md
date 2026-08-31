# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-28 (Technicals v2)
- **Loop:** 12 Finance foundations — **complete**, PR open. Next: **Loop 13 Accounting**.
- **Branch:** `feat/technicals-foundations` (PR #31) → stacked on `feat/technicals-platform` (#30) → `feat/technicals-v2-plan` (#29)
- **Task:** Loop 12 10/10
- **Last checks:** lint ✓ typecheck ✓ build ✓ unit 324/324 ✓ e2e 46/46 ✓ content:validate 0 errors ✓ eval lessons+questions **PASS** (schema 1.00, overlap 0 vs hidden 400Q, readability 4.48 live) ✓ seeds idempotent ✓ — Lighthouse a11y **not run**
- **Blockers:** (a) **PRs #29, #30, #31 cannot be merged from this session** — `gh pr merge` is refused by the permission classifier; James runs `gh pr merge <n> --squash --delete-branch` in order 29 → 30 → 31. (b) Lighthouse a11y (one command, clears Loops 11 and 12 together). (c) Nothing is approved for students — Loop 12 content is all `generated`.
- **Decisions taken by default:** Loop 11 § Retro and Loop 12 § Retro.
- **Next action:** Loop 13 Accounting (8 lessons, 40 questions, `faded_walk` / `cash_cycle` / `filings_toggle`, 3-statement grid template) — branch `feat/technicals-accounting` off `feat/technicals-foundations` while the stack is unmerged.

### Chapter progress (35 lessons, 199 questions total)
| Loop | Chapter | Lessons | Questions | Status |
|---|---|---|---|---|
| 12 | Finance foundations | 3 | 12 | done (PR #31) |
| 13 | Accounting | 8 | 40 | next |
| 14 | EqV vs EV | 4 | 28 | planned |
| 15 | Valuation | 5 | 31 | planned |
| 16 | DCF | 7 | 42 | planned |
| 17 | M&A | 4 | 22 | planned |
| 18 | LBO | 4 | 24 | planned |

Two of the 35 lessons already existed (`three-statement-links`, `ev-bridge-basics`) and were
retrofitted to v2 in Loop 11 — Loops 13 and 14 write the v2 additions around them, not from scratch.

### Every chapter loop — read before starting
1. Spec: `docs/research/technicals-v2/1N-*.md`; plan: `docs/loops/1N-technicals-*.md`.
2. **Verify every worked number against `src/lib/finance/*`** — spec figures predate the library. Loop 12 found one wrong (an IRR given as −5 % is −8.9 %).
3. A v2 lesson needs a `predict`; `fill_numbers` needs ≥ 1 `blank`; a `lens` block must carry **both** lens slugs; every question needs a `depth:` tag.
4. Widgets: maths into `src/lib/finance` first, build on `src/components/widgets/kit/`, then register in `blocks/widget.tsx`.
5. Content lands `generated`. Only Accounting (13) and EqV/EV (14) auto-approve, and only after their evals pass.
6. e2e: approve rows in `beforeAll` and restore in `afterAll` (`e2e/09-industry.spec.ts` is the pattern). `test.use({ reducedMotion })` does not type-check — use `page.emulateMedia`.

### Outstanding from earlier loops (unchanged)
- Loop 10 PR #17 (`feat/launch`) stays open, `needs-james`: migrations 0010/0011, Stripe keys, env vars, copy/legal review.
- Loop 04/09 batches never ran; credit now exists (the readability judge ran live this loop).

## Heartbeat (Stop hook appends here; keep last 10 lines)
- 2026-08-28 13:36 heartbeat
- 2026-08-28 13:45 heartbeat
- 2026-08-28 13:59 heartbeat
- 2026-08-28 16:06 heartbeat
- 2026-08-28 16:18 heartbeat
- 2026-08-28 16:23 heartbeat
