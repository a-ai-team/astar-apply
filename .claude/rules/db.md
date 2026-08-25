---
paths:
  - "supabase/**"
  - "scripts/db/**"
  - "scripts/seed/**"
  - "src/lib/supabase/**"
---

# Database rules (Supabase project `astarapply`, ref `nvigkfmrxtxvylbhfcwa`)

- No Docker locally: migrations apply straight to the linked remote project with
  `npm run db:migrate` (`supabase db push --linked`). It is the only environment — be careful.
- One migration per loop: `supabase/migrations/NNNN_<slug>.sql`, numbered per
  `docs/loops/CONTRACTS.md`. Idempotent SQL only (`create table if not exists`,
  `create or replace function`, `do $$ … if not exists` for enums/policies).
- **Enable RLS in the same migration that creates a table.** Role checks use
  `auth.jwt()->>'role'` via `is_admin()`, `is_mentor()`, `is_staff()`. Students never get a
  direct policy on `corpus_chunks`; route handlers use the service-role client after verifying
  the session.
- Conventions: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default
  now()`, `updated_at` via `set_updated_at()` trigger, enums named `<table>_<column>`, slugs
  `text unique` kebab-case, vectors always `vector(1024)`.
- Seeds are idempotent upserts on natural keys and must be re-runnable; they are the proof a
  schema works. Fixture content is original and headed "PLACEHOLDER — synthetic".
- Never `supabase db reset`, `drop table`, or delete rows in bulk. Schema changes go through a
  new migration, never by editing an applied one.
- Clients: `src/lib/supabase/server.ts` (cookies, RSC/actions), `client.ts` (browser),
  `admin.ts` (service role, server-only). Auth truth is `src/lib/dal.ts` `verifySession()`.
