# Loop 19 — `/home` as the integrated toolkit

_Status: merged. Protocol: `docs/loops/README.md`. Plan approved by James in chat, 2026-09-02._

## Goal
Reposition the private landing (`/home`) from "the Mentor, with a suite strip" to **one integrated
toolkit for getting a spring week or summer internship** (spring weeks first). The wordmark becomes
the hero's focal point, large and centred; the header's small wordmark is hidden on `/home` while the
hero wordmark is on screen and fades in once it scrolls away, so the brand never shows twice. The
public `/` "Coming soon" page goes: `/` redirects to `/home` and the gate takes over.

## Out of scope
The public launch landing, pricing and Stripe (PR #17, James's). New products (the video interview
simulator is *named* as planned, not built). Nav changes (still Home · Mentor · Technicals ·
Practice · Interviews). Any change to `/unlock`.

## Decisions (James, 2026-09-02)
- `/home` only; `/` becomes a redirect (temporary 307 so `/` can become the public landing later).
- Show an "In the works" row: Firm question banks and Pulse (built, not yet approved) tagged
  *Coming*; video interview practice tagged *Planned*. No dates, no prices, never "live".
- Hero wordmark large and centred; header wordmark hidden until the hero scrolls away.

## Screens
One route, `/home`, seven sections in order (`src/components/home/sections.tsx`, copy and data in
`src/content/home.ts`):

1. **Hero** — `HeroBrand` (the wordmark, LCP, `data-field-focus` so the neural field haloes it) ·
   eyebrow *Spring weeks · Summer internships · Investment banking* · H1 **"Everything between you
   and the offer."** · sub · CTAs *Start the 10-week path* / *Ask the Mentor*.
2. **Toolkit** — hairline 4-up: Mentor · Technicals · Practice · Interviews, each with one line and a
   mono facts line (static; update when the curriculum changes).
3. **Route to the offer** — the five stages (applications & CV → online tests / recorded interviews
   → first interviews → assessment centre → offer) with chips linking to what covers each.
4. **10-week path** — the spine: W1–W10 ticks (mirrors `DEFAULT_PATH`), link to `/home/path`.
5. **Mentor** — "Ask the people who actually got in." · three reasons · a spring-week chat mock ·
   the bench (`MentorGrid`, one live mentor + reserved seats).
6. **In the works** — Firm question banks · Pulse · Video interview practice.
7. **Closing** — "Start with week one." + both CTAs + *Built with student mentors · A\* AI*.

## Header wordmark
`src/components/home/hero-brand.tsx` observes the hero wordmark (IntersectionObserver, top margin =
`--shell-header-h` converted to px — `rootMargin` only takes px or %) and toggles
`data-hero-brand="visible"` on `<html>`; the landing's inline script pre-sets it before hydration so
first paint is right; unmount clears it. `globals.css`: `html[data-hero-brand="visible"] [data-brand]`
fades the header logo out and delays `visibility:hidden` so it also leaves the tab order.
Accepted: client-side navigation to `/home` shows one frame of both before the effect runs.

## Risks
- Anything on the landing that reads the DB — none; facts are static strings on purpose.
- The header brand rule must not leak to other routes — pinned by e2e (navigate away → visible).
- Wordmark intrinsic ratio was declared ~2.58:1 everywhere; the PNG is 1400×675 — fixed in passing.

## Acceptance checks
- [x] lint / typecheck / build / test:unit (403/403) / test:e2e green
- [x] `/home` renders the seven sections; H1 "Everything between you and the offer."; every
      toolkit card links to its product; route has 5 stages; spine has 10 weeks; works row names
      Firm question banks and Pulse without "live" or "£"
- [x] header wordmark hidden while the hero wordmark is on screen, visible after scrolling past it
      and on every other route
- [x] `/` → `/home` (→ `/unlock?next=%2Fhome` without the key)
- [x] Visual check at 375 / 768 / 1280 px: CTAs above the fold on desktop, grids collapse cleanly,
      no horizontal scroll
- [x] Docs: `CLAUDE.md`, `docs/PRIVATE_AREA.md`, `docs/MASTER_PLAN.md`, `CURRENT.md`, `RUNLOG.md`

## Tasks
- [x] `src/content/home.ts` — toolkit, route, path weeks, reasons, chat mock, in-the-works data
- [x] `src/components/home/hero-brand.tsx` — hero wordmark + header-brand toggle
- [x] `src/components/home/sections.tsx` — Hero · Toolkit · Route · Path · Mentor · InTheWorks · Closing
- [x] `src/app/home/page.tsx` — new order; inline script also pre-sets `data-hero-brand`
- [x] `src/app/page.tsx` → `redirect("/home")`; root metadata description updated
- [x] header `data-brand` + CSS fade; wordmark ratio fixes (header, login); neural-field glow softened
- [x] e2e: heading in 00/00b/00c; landing spec rewritten; `/` redirect tests
- [x] Docs

## Retro
- **Shipped:** the whole landing, the header-brand fade, the `/` redirect, e2e cover for all three.
- **Slipped:** nothing. One bug caught only by e2e: `IntersectionObserver` rejects `rem` in
  `rootMargin` and the whole page fell to Next's error boundary — convert to px.
- **Next loop must know:** the mono facts on the toolkit cards are static strings in
  `src/content/home.ts`; update them when lesson/question/card counts change. `MentorGrid` seats are
  shorter below `sm` (`min-h-[200px]`) so one mentor + three seats doesn't stack into empty space.
- Reveal system unchanged; the wordmark deliberately sits outside `<Reveal>` so it is the LCP element.
