# Private area — two gates

The public site (`/`) is a "Coming soon" page. The real app lives under `/home` (students) and
`/admin` (staff). Both sit behind **two gates**, checked in `src/proxy.ts` on every request:

| Gate | What | Where it's checked | How to pass |
|---|---|---|---|
| 1. Access key | Shared team key → `astar_access` cookie (30 days, httpOnly) | `src/proxy.ts` → `/unlock` | Ask James or Tesleem for `PRIVATE_ACCESS_KEY`. Removed at public launch (Loop 10). |
| 2. Account | Supabase Auth session (magic link). `/admin` additionally needs role `admin` or `mentor`. | `src/proxy.ts` (cookie/JWT only) **and** `src/lib/dal.ts` in every layout, page, action and route handler | Sign in at `/login` |

## Flow
1. `/home/*` or `/admin/*` without the key cookie → `302 /unlock?next=…`. Correct key → cookie set → back.
2. `src/proxy.ts` then calls `updateSession()` (`src/lib/supabase/proxy.ts`): refreshes the Supabase
   session, writes any rotated cookies, validates the JWT with `getClaims()`.
3. No user → `302 /login?next=…`. `/admin` and role not staff → `302 /home`. Signed-in visitor to
   `/login` → `/home`.
4. Server Actions bypass the proxy matcher, so every action/page/route also calls
   `verifySession()` / `verifyStaff()` / `verifyAdmin()` from `src/lib/dal.ts` (the DAL is the source
   of auth truth; the proxy is only an optimistic cookie check).

## Sign-in
- `/login` → `sendMagicLink` server action → `supabase.auth.signInWithOtp({ emailRedirectTo:
  <origin>/auth/callback?next=… })`. Sign-up and sign-in are the same thing; a Postgres trigger
  (`handle_new_user`) creates the `profiles` row.
- `/auth/callback` exchanges the PKCE `?code=` for a session. `/auth/confirm?token_hash=&type=`
  verifies a token hash directly (used by e2e and by custom email templates).
- Sign out: `signOut` action (form in the top bar).
- TODO(james): Google OAuth — configure a GCP consent screen + client in Supabase → Auth →
  Providers, then add `signInWithOAuth` in `src/app/auth/actions.ts`.

## Roles
`profiles.role` (`student | mentor | admin`, default `student`). A Postgres **custom access token
hook** (`public.custom_access_token_hook`, migration 0001) copies it into the JWT as the
**`user_role`** claim (not `role` — Supabase reserves that for the Postgres role). RLS helpers
`is_admin() / is_mentor() / is_staff()` read the claim. A role change takes effect on the user's
next token refresh (≤ 1 h) or next sign-in.

Change a role: Supabase → Table editor → `profiles` → `role` (an admin UI comes later).

## Config that lives in Supabase (not in git)
- Auth hook: Authentication → Hooks → Customize Access Token → `public.custom_access_token_hook`
  (enabled by `supabase config push` from `supabase/config.toml`).
- Redirect allow-list: `http://localhost:3000/**`, `http://localhost:3100/**`,
  `https://*.vercel.app/**` (`additional_redirect_urls` in `supabase/config.toml`).
- TODO(james): run `supabase config push` once — the overnight run's first push applied local
  defaults (site_url `127.0.0.1:3000`, email confirmations off, OTP length 6); `config.toml` now
  holds the intended values but a second push was blocked by the agent's permission classifier.

## Env vars
See `.env.example`. `PRIVATE_ACCESS_KEY` must be set locally and in Vercel; if unset, gate 1
blocks everything (Playwright supplies a throwaway key to its own server when it's missing).
