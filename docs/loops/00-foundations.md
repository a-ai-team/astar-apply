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
- [ ] Fresh clone + `.env.local` → `npm run dev` → sign up → `/home` renders shell.
- [ ] Non-admin hitting `/admin` is redirected.
- [ ] `npm run lint && npm run typecheck && npm run build` green in CI.
- [ ] `docs/PRIVATE_AREA.md` updated to describe the two gates.

## Tasks
- [ ] Add Supabase deps, `src/lib/supabase/{server,client,admin}.ts`
- [ ] Migration `supabase/migrations/0001_init.sql` + `npm run db:migrate`
- [ ] Auth routes/actions, session refresh in `proxy.ts`, role gate for `/admin`
- [ ] App shell + UI primitives + tokens
- [ ] `/admin/users` read-only table
- [ ] CI workflow + `typecheck` script
- [ ] Docs: update `PRIVATE_AREA.md`, `CONTRIBUTING.md` (local Supabase), `.env.example`

## Retro
_(fill at end of loop)_
