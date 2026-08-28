# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-28 (Technicals v2)
- **Loop:** 11 Technicals v2 platform (`docs/loops/11-technicals-platform.md`) — **complete**, PR open
- **Branch:** `feat/technicals-platform` (PR #30, off `feat/technicals-v2-plan` / PR #29 — merge #29 first)
- **Task:** 10 / 10
- **Last checks:** lint ✓ typecheck ✓ build ✓ unit 311/311 ✓ e2e 42/42 ✓ content:validate 0 errors ✓ seed 03/05 idempotent ✓ content:index 34 chunks ✓ — Lighthouse a11y **not run** (Loop 11 § Blocked 1)
- **Blockers:** Lighthouse a11y (James, one command); migrations 0010/0011 still unapplied (inherited from Loops 09/10 — nothing in Loop 11 needs them).
- **Decisions taken by default:** Loop 11 § Retro (partial lens record, lens excluded from the writer schema, lens questions get no flashcard, cheat sheets repo-only).
- **Next action:** merge #29 then #30 → `/loop` Loop 12 (Finance foundations) → 13 → 18 in order.

### Chapter loops 12–18 — read before starting one
1. Its spec is `docs/research/technicals-v2/1N-*.md`; the loop plan is `docs/loops/1N-technicals-*.md`.
2. **Verify every worked number against `src/lib/finance/*`** — spec figures predate the library and at least four are known wrong (Loop 11 § Retro).
3. A v2 lesson needs a `predict`; `fill_numbers` needs ≥ 1 `blank`; a `lens` block must carry **both** lens slugs; every question needs a `depth:` tag.
4. Build widgets on `src/components/widgets/kit/`, maths in `src/lib/finance` first, then register the name in `blocks/widget.tsx`.

### Outstanding from earlier loops (unchanged)
- Loop 10 PR #17 (`feat/launch`) stays open, `needs-james`: apply migrations 0010/0011, Stripe keys, env vars, copy/legal review.
- Loop 04/09 batches were never run (credit exists now — optional top-ups after the chapters land).

## Heartbeat (Stop hook appends here; keep last 10 lines)
- 2026-08-28 13:10 heartbeat
- 2026-08-28 13:25 heartbeat
- 2026-08-28 13:30 heartbeat
