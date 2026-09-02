# CURRENT — live run state (rewrite after every task)

- **Run started:** 2026-08-28 (Technicals v2) · **Programme completed:** 2026-09-01
- **Loop:** **19 Home toolkit landing — done** (`feat/home-toolkit`, plan `docs/loops/19-home-toolkit.md`).
  `/home` is now the integrated-toolkit landing (wordmark hero, toolkit grid, route to the offer,
  10-week spine, Mentor + bench, in-the-works row); the header wordmark hides while the hero wordmark
  is on screen; `/` redirects to `/home` (the "Coming soon" page is gone).
- **Last checks (Loop 19):** lint ✓ typecheck ✓ build ✓ unit **403/403** ✓ e2e — see RUNLOG ✓
  visual check 375 / 768 / 1280 ✓
- **Blockers:** none.

---

## The programme, finished (Loops 11–18)

**35 of 35 v2 lessons · 202 chapter questions (210 in the bank) · 20 widgets · 7 cheat sheets ·
4 printable templates · 10-week path re-sequenced · lens option on drills and mocks · 20 e2e specs.**
All seven chapters approved and live (James, 2026-09-01); 176 flashcards; 654 chunks indexed for the
Mentor. Per-loop detail: the loop docs and `RUNLOG.md`.

## For James & Tesleem — everything that needs a human

1. **The launch itself** — PR #17 (Loop 10): `needs-james`, placeholder legal copy, unconfigured
   Stripe, migration 0011 lives only there. `/` currently redirects to `/home`; at launch `/` becomes
   the public landing (the redirect in `src/app/page.tsx` is a temporary 307 on purpose).
2. **Firm banks and Pulse** are built but every row stays `generated` until approved in admin
   (`docs/FIRMS_PULSE.md`). The landing lists both as *Coming* — approve some rows and they can
   move into the toolkit grid.
3. Loop 04/09 batch content runs never happened; credit exists now if top-ups are ever wanted.
4. Two non-blocking Lighthouse a11y notes (2026-09-01): one colour-contrast instance on the
   accounting page; print-style tables use header-less `<td>` rows (`td-has-header`).

**Nothing else is outstanding.**

## Landing page — where things live (Loop 19)

- Sections: `src/components/home/sections.tsx` (Hero · Toolkit · Route · Path · Mentor · InTheWorks ·
  Closing). Copy/data: `src/content/home.ts` — the mono facts lines are **static strings**; update
  them when lesson / question / card counts change. Roster: `src/content/mentors.ts`.
- Header brand fade: `src/components/home/hero-brand.tsx` toggles `data-hero-brand` on `<html>`;
  CSS in `globals.css` (`[data-brand]`). `rootMargin` must be px — `rem` throws and takes the whole
  page down (caught by e2e).
- Pinned by e2e (`00`, `00b`, `00c`): the H1 text, `home-*-card` hrefs, `home-works` copy having no
  "live" / "£", `mentor-seat` count 3, `nav-logo` hidden → visible, `/` → `/home`.

## Merging — how it works here

`.claude/settings.local.json` (gitignored, this project only) allows `gh pr merge`, so Claude can
merge its own PRs with `--admin` (branch protection requires a review an author cannot self-give).
**One PR at a time, never `--delete-branch`** — batching with it once deleted base branches out from
under queued PRs. After a squash merge, delete the branch and prune. Widget registry check after any
conflict in `src/components/lesson/blocks/widget.tsx`: `grep -c "as ComponentType"` must equal **20**.

## Rules learned the hard way — do not rediscover these

1. **Verify every number against `src/lib/finance/*`** — the specs predate the library; 21 errors
   caught across seven chapters.
2. **When spec and library disagree, the library wins** — flag it, never edit code to match prose.
3. **Check every spec question slug against `content/questions/` before writing.**
4. **Check company names *and their economics* across chapters** (roster in the Loop 18 retro).
5. **If you rename an entity, sweep bare forms too**; re-run `eval --suite lessons` after any rename.
6. **No stock interview phrasings** — the hidden 8-gram check has fired; the repo is public.
7. **Introduce every number before using it; gloss every term on first use.**
8. **Widget props: values are EV, rates are decimals**; never pass per-share values with
   `display: "share"`.
9. **Never pin content counts in tests** — derive from the page or `findSubtopic()`.
10. **Delete scratch scripts** — they break lint (and stray e2e specs run in the suite).
11. **The difficulty-mix gate is manageable**: promote genuinely definitional questions to d1 when a
    chapter runs d3-heavy.
12. **Landing copy claims only what is approved and visible** — no prices, no multiple mentors, no
    "live" firm banks / Pulse, no video mocks (voice dictation is behind a flag).

## Heartbeat (Stop hook appends here; keep last 10 lines)
- 2026-09-01 22:56 heartbeat
- 2026-09-01 23:07 heartbeat
