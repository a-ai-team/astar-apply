-- 0011_billing — Loop 10 launch: plans, subscriptions, entitlements, playbook progress, demo-chat
-- usage. Idempotent. Applied with `npm run db:migrate` (NOT applied by the Loop 10 run: Postgres is
-- unreachable from the agent sandbox — see docs/loops/10-launch.md § Blocked). Every code path
-- degrades when these tables are absent: users are `free`, plans come from PLANS in
-- src/lib/billing/plans.ts, playbook progress falls back to localStorage, the demo cap is in-memory.

-- plans: the three tiers. Public read. Prices in GBP per month; stripe_price_id is filled by
-- `scripts/billing/sync-stripe.ts` once STRIPE_SECRET_KEY exists.
create table if not exists public.plans (
  id text primary key check (id in ('free', 'core', 'ai')),
  name text not null,
  monthly_gbp numeric(6, 2) not null default 0,
  stripe_price_id text,
  features jsonb not null default '[]'::jsonb,
  ordinal int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at before update on public.plans for each row execute function public.set_updated_at();
alter table public.plans enable row level security;
drop policy if exists "plans: public read" on public.plans;
create policy "plans: public read" on public.plans for select to anon, authenticated using (true);

-- Default rows; the seed (`npm run seed -- 10`) keeps them in sync with PLANS. TODO(james): confirm
-- prices £0 / £4.99 / £9.99 (Loop 10 default, copied from the financefluency shape).
insert into public.plans (id, name, monthly_gbp, ordinal, features) values
  ('free', 'Free', 0,    0, '["lessons_free","bank_free","flashcards_free","firm_browse","pulse","playbook","mentor_chat"]'::jsonb),
  ('core', 'Core', 4.99, 1, '["lessons_free","bank_free","flashcards_free","firm_browse","pulse","playbook","mentor_chat","lessons_all","bank_full","flashcards_all","ai_drills","ai_mocks"]'::jsonb),
  ('ai',   'AI',   9.99, 2, '["lessons_free","bank_free","flashcards_free","firm_browse","pulse","playbook","mentor_chat","lessons_all","bank_full","flashcards_all","ai_drills","ai_mocks","srs_analytics","detailed_feedback","firm_practice","fit_grading"]'::jsonb)
on conflict (id) do nothing;

-- subscriptions: one per user, mirrored from Stripe by the webhook (service role only).
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan_id text not null references public.plans (id) default 'free',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_customer on public.subscriptions (stripe_customer_id);
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions: own read" on public.subscriptions;
create policy "subscriptions: own read" on public.subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists "subscriptions: staff read" on public.subscriptions;
create policy "subscriptions: staff read" on public.subscriptions for select to authenticated using (public.is_staff());

-- entitlements: what a user can do right now (plan + resolved feature list). Written only by the
-- webhook / stub checkout via the service role; read by `getEntitlement()`.
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_id text not null references public.plans (id) default 'free',
  features jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now()
);
alter table public.entitlements enable row level security;
drop policy if exists "entitlements: own read" on public.entitlements;
create policy "entitlements: own read" on public.entitlements for select to authenticated using (user_id = auth.uid());
drop policy if exists "entitlements: staff read" on public.entitlements;
create policy "entitlements: staff read" on public.entitlements for select to authenticated using (public.is_staff());

-- playbook_progress: Non-Target playbook checklist ticks (own rows).
create table if not exists public.playbook_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_key text not null,
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_key)
);
drop trigger if exists playbook_progress_set_updated_at on public.playbook_progress;
create trigger playbook_progress_set_updated_at before update on public.playbook_progress for each row execute function public.set_updated_at();
alter table public.playbook_progress enable row level security;
drop policy if exists "playbook_progress: own" on public.playbook_progress;
create policy "playbook_progress: own" on public.playbook_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- demo_usage: unauthenticated landing-page demo chat, capped per hashed IP per UTC day. Service
-- role only (no policies → RLS denies anon/authenticated).
create table if not exists public.demo_usage (
  ip_hash text not null,
  day date not null default (now() at time zone 'utc')::date,
  count int not null default 0,
  primary key (ip_hash, day)
);
alter table public.demo_usage enable row level security;

-- Atomic bump; returns the new count. Service role only.
create or replace function public.increment_demo_usage(p_ip_hash text, p_day date)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.demo_usage (ip_hash, day, count) values (p_ip_hash, p_day, 1)
  on conflict (ip_hash, day) do update set count = public.demo_usage.count + 1
  returning count into n;
  return n;
end $$;
revoke all on function public.increment_demo_usage(text, date) from public;
grant execute on function public.increment_demo_usage(text, date) to service_role;
