# Loop 00 — Foundations

**Goal:** everything later loops assume exists: accounts, roles, database, app shell, admin area,
CI. Ship nothing user-facing beyond a working sign-in and an empty dashboard.

**Out of scope:** any chat, any content, payments, public landing changes.

## Research done
- Next 16 App Router: `src/proxy.ts` is the middleware replacement (already used for the key
  gate) — extend it, don't add `middleware.ts`. Route handlers in `src/app/api/*/route.ts`.
  Read `01-getting-started/16-proxy.md`, `02-guides/authentication.md`, `07-mutating-data.md`
  (server actions) before coding.
- Supabase + Next App Router: use `@supabase/ssr` with a server client (cookies) and a browser
  client; refresh session in `proxy.ts`. Verify against current Supabase docs at build time.
- Roles: store in `profiles.role` (enum `student|mentor|admin`), mirrored into JWT via a Postgres
  hook so RLS policies can check `auth.jwt()->>'role'`.

## User stories
- As a student I can sign up with email magic link or Google and land on `/home`.
- As James/Tesleem I am an `admin`/`mentor` and can open `/admin`.
- As a developer I can run `npm run db:migrate` locally against a Supabase branch.

## Data model (migration `0001_init.sql`)
```
profiles(id uuid pk = auth.users.id, display_name, role, university, year_of_study, created_at)
mentors(id uuid pk = profiles.id, bio, headline, photo_url, is_public)
```
RLS: users read/update own profile; mentors public-readable when `is_public`; admin all.

## Routes / screens
- `/login` (magic link + Google), `/auth/callback` route handler, `/logout` action.
- `/home` → app shell: left nav (Mentor, Technicals, Practice, Interviews — greyed until built),
  top bar with avatar. Keeps existing key gate *and* requires session.
- `/admin` → nav stub + "Users" table (read-only) — role-gated in `proxy.ts`.
- `src/components/ui/*` — Button, Input, Card, Badge, Dialog, Tabs (hand-rolled on Tailwind 4, no
  shadcn install to keep deps small; revisit if velocity suffers).

## Design system
Dark-first (matches current `/home`), A* wordmark, Geist. Tokens in `globals.css`:
`--bg`, `--surface`, `--border`, `--fg`, `--muted`, `--accent` (A* brand colour from `logo.png`).

## CI
`.github/workflows/ci.yml`: `npm ci`, `npm run lint`, `npm run typecheck`, `npm run build`. Add
`typecheck` script. Vercel preview already per-PR.

## Env vars (add to `.env.example`)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
(server only), `SUPABASE_DB_URL` (migrations only).

## Risks
- Supabase project needs creating by a human (James) — **Decision needed #1**. Until then, build
  against a local `supabase start` stack.
- Google OAuth needs a GCP consent screen; magic link works day one.

## Acceptance checks
- [x] Fresh clone + `.env.local` → `npm run dev` → sign up → `/home` renders shell. _(Verified: `next dev` serves `/` 200, `/home` → `/unlock`; Playwright signs in via magic-link token and asserts the shell. The real email delivery path was not exercised — no inbox in the run.)_
- [x] Non-admin hitting `/admin` is redirected. _(Playwright `e2e/00-foundations.spec.ts` — student → `/home`; admin reaches `/admin/users`.)_
- [x] `npm run lint && npm run typecheck && npm run build` green in CI. _(Green locally + `test:unit` 3/3 + `test:e2e` 4/4; `.github/workflows/ci.yml` added — first CI run is this PR.)_
- [x] `docs/PRIVATE_AREA.md` updated to describe the two gates.

## Tasks
- [x] Add Supabase deps, `src/lib/supabase/{server,client,admin}.ts`
- [x] Migration `supabase/migrations/0001_init.sql` + `npm run db:migrate`
- [x] Auth routes/actions, session refresh in `proxy.ts`, role gate for `/admin`
- [x] App shell + UI primitives + tokens
- [x] `/admin/users` read-only table
- [x] CI workflow + `typecheck` script
- [x] Docs: update `PRIVATE_AREA.md`, `CONTRIBUTING.md` (local Supabase), `.env.example`

## Blocked
- `supabase config push` (to restore remote auth defaults after the first push applied local
  ones) — blocked by the agent permission classifier after the first run. Not a build failure;
  one-command fix for James, recorded in `supabase/config.toml` and `docs/PRIVATE_AREA.md`.
- `PRIVATE_ACCESS_KEY` was not in `.env.local` despite the run brief; Playwright now defaults a
  throwaway key for its own server. Local `npm run dev` needs it set by hand.

## Retro
- **Shipped:** `@supabase/ssr` clients (`server/client/admin/proxy`), `src/lib/dal.ts`
  (`verifySession/verifyStaff/verifyAdmin`), migration `0001_init` (profiles, mentors, RLS,
  `set_updated_at`, `handle_new_user` trigger, `is_admin/is_mentor/is_staff`, custom access token
  hook — applied to the remote project and the hook enabled), magic-link `/login`,
  `/auth/callback` (PKCE) + `/auth/confirm` (token hash), sign-out, two-gate `src/proxy.ts`, app
  shell (side nav w/ greyed Mentor/Technicals/Practice/Interviews, top bar avatar/role/sign-out),
  UI primitives (Button, Input, Card, Badge, Dialog, Tabs) on tokens `--bg --surface --border --fg
  --muted --accent`, `/admin` + read-only `/admin/users`, CI workflow, `typecheck/test:unit/
  test:e2e/db:migrate/seed` scripts, `scripts/seed/00-users.ts`, `e2e/helpers/auth.ts`, 1 vitest
  file (3 tests), 1 Playwright spec (4 tests), docs.
- **Slipped:** Google OAuth (not configured — `TODO(james)` in `src/app/auth/actions.ts`); real
  email magic-link delivery untested (no inbox); remote auth config needs one `supabase config
  push` by James.
- **Decisions taken by default:** JWT claim is `user_role` not `role` (Supabase reserves `role`
  for the Postgres role — CONTRACTS.md edited); `is_*()` helpers + `set_updated_at()` ship in 0001
  rather than 0002; `/admin` is open to `mentor` as well as `admin` (staff); e2e signs in via
  `hashed_token` → our `/auth/confirm` instead of visiting `action_link` (a fresh browser can't
  complete Supabase's verify redirect); `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` accepted as alias of
  `ANON_KEY`; explicit `grant … to service_role` added (default privileges did not cover new
  tables); no `supabase start` — CONTRIBUTING documents the linked-remote workflow instead.
- **Loop 01 must know:** (1) use `verifyStaff()` from `src/lib/dal.ts` in every admin page/action/
  route and `createAdminClient()` only after it; RLS helpers already exist — 0002 must *not*
  recreate `set_updated_at()` differently (`create or replace` is fine) and should `grant` new
  tables to `service_role` explicitly. (2) `npm run seed -- 00` must have run before
  `test:e2e`; sign in with `signInAs(page, "e2e-mentor@astar.test", "/admin/corpus")` after
  `unlockPrivateArea(page, baseURL)`. Migration applied via `npm run db:migrate`; ad-hoc SQL via
  `supabase db query --linked "…"` (no psql on this machine).
