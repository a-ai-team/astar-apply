# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-26
- **Loop:** 10 Launch (`docs/loops/10-launch.md`) — **run complete — see RUNLOG** (open PR, `needs-james`)
- **Branch:** `feat/launch` (PR #17, do not merge without James)
- **Task:** 10 / 10
- **Last checks:** lint ✓ typecheck ✓ build ✓ unit 168/168 ✓ e2e 34/34 ✓ curl flag-off 307 ✓ Lighthouse 95/100/96 ✓ seed 10 SKIPPED (0011 unapplied)
- **Blockers:** Loop 10 § Blocked 1–4 (0010/0011 unapplied, Stripe keys, credit, placeholder copy/legal).
- **Decisions taken by default this loop:** see Loop 10 § Retro.
- **Next action:** James — review PR #17, run `npm run db:migrate`, set env vars, approve copy.

### Interlude — /home landing (2026-08-27)
- **Branch:** `feat/home-landing` (off-loop polish, no DB/env/AI). `/home` is now a Mentor-led landing: full-bleed scroll-linked neural field (`src/components/home/neural-field.tsx`), once-only reveals (`reveal.tsx`), mentor bench from `src/content/mentors.ts` (add a mentor = one entry + `public/mentors/<slug>.jpg`). e2e `home-heading` text is now "Ask the people who actually got in."
- **Next action:** open PR, squash merge, then Loop 10.

## Heartbeat (Stop hook appends here; keep last 10 lines)
- 2026-08-27 19:40 heartbeat
- 2026-08-27 19:43 heartbeat
