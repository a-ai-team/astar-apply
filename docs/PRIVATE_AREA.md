# Private area

The public site (`/`) is a "Coming soon" page. The real site is being built at `/home`,
which is gated behind a shared access key so only the team can see it.

## How it works
- `src/proxy.ts` runs on every `/home/*` request. If the `astar_access` cookie doesn't hold
  the expected token, it redirects to `/unlock`.
- `/unlock` is a password form. On the right key it sets a 30-day httpOnly cookie and
  redirects back.
- The key lives in the `PRIVATE_ACCESS_KEY` env var (`.env.local` locally; Vercel env vars
  in production). If it's unset, `/home` is inaccessible.
- Both `/unlock` and `/home` are `noindex`.

## Access
Ask James or Tesleem for the key. To rotate it, change the env var in Vercel and redeploy —
existing cookies stop working immediately.
