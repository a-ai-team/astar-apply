# Private area — one door

The public site (`/`) is a "Coming soon" page. The real app lives under `/home` (students) and
`/admin` (staff). **Entering the team key is the only thing needed to get in.** User accounts
(magic-link sign-in, per-person roles) come later; the code for them is kept but unlinked.

| Step | What | Where | How to pass |
|---|---|---|---|
| 1. Team key | Shared key → `astar_access` cookie (30 days, httpOnly) | `src/proxy.ts` → `/unlock` | Ask James or Tesleem for `PRIVATE_ACCESS_KEY`. |
| 2. Team session | Supabase Auth session for one shared **admin** user (`TEAM_USER_EMAIL`, display name "A* team"), established automatically behind the key | `src/lib/team-session.ts`, called from the `unlock` action and `/auth/team` | Nothing — happens on unlock. |

Why keep Supabase at all? Everything downstream (`verifySession()`, RLS, the `user_role` JWT
claim, `/admin` staff checks) is built on a Supabase session, and user accounts will reuse it
unchanged. The team session just makes "the key" satisfy it.

## Flow
1. `/home/*` or `/admin/*` without the key cookie → `302 /unlock?next=…`.
2. Correct key (`src/app/unlock/actions.ts`) → access cookie set → `establishTeamSession()`:
   service role ensures the team user exists (`email_confirm: true`) with `profiles.role = 'admin'`,
   `auth.admin.generateLink({ type: "magiclink" })` → `hashed_token` → cookie client
   `auth.verifyOtp({ type: "magiclink", token_hash })`, which writes the session cookies → redirect
   to `next`. No email is ever sent. (Same mechanism `e2e/helpers/auth.ts` uses.)
3. On every later request `src/proxy.ts` calls `updateSession()` (`src/lib/supabase/proxy.ts`):
   refreshes the Supabase session, writes rotated cookies, validates the JWT with `getClaims()`.
4. Valid key cookie but no user (session expired / cookies cleared) → `302 /auth/team?next=…`
   (`src/app/auth/team/route.ts`) → re-checks the key cookie → `establishTeamSession()` → back to
   `next`. Invalid key cookie there → `/unlock`. `/admin` and role not staff → `302 /home` (the team
   user is admin, so it passes).
5. Server Actions bypass the proxy matcher, so every action/page/route also calls
   `verifySession()` / `verifyStaff()` / `verifyAdmin()` from `src/lib/dal.ts` (the DAL is the source
   of auth truth; the proxy is only an optimistic cookie check). `verifySession()` redirects to
   `/auth/team` when the session is missing.
6. "Sign out" (top bar) clears the Supabase session **and** the access cookie → `/unlock`.

## Rotating the key
Change `PRIVATE_ACCESS_KEY` in `.env.local` and Vercel and redeploy. The access cookie is a hash of
the key, so every existing cookie stops matching at once and every browser is sent to `/unlock`.
Supabase sessions that were already issued are only ever re-established after a *valid* key, so
holders of the old key cannot get back in; their cookies simply expire (or sign out of the team
user in Supabase → Authentication → Users to kill them immediately).

## Sign-in (retained for later, unlinked)
- `/login` → `sendMagicLink` server action → `supabase.auth.signInWithOtp({ emailRedirectTo:
  <origin>/auth/callback?next=… })`. Sign-up and sign-in are the same thing; a Postgres trigger
  (`handle_new_user`) creates the `profiles` row. Nothing in the UI links here while the key is
  the only door; e2e specs still use `signInAs` (token-hash route) to test per-role behaviour.
- `/auth/callback` exchanges the PKCE `?code=` for a session. `/auth/confirm?token_hash=&type=`
  verifies a token hash directly (used by e2e and by custom email templates).
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
See `.env.example`. `PRIVATE_ACCESS_KEY` must be set locally and in Vercel; if unset, the door
blocks everything (Playwright supplies a throwaway key to its own server when it's missing).
`TEAM_USER_EMAIL` (default `team@astar-apply.internal`) names the shared user; `npm run seed -- 00`
also creates it. `SUPABASE_SERVICE_ROLE_KEY` is required at runtime now (the unlock action uses it).
