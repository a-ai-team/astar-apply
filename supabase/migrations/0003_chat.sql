-- 0003_chat — Loop 02 Mentor chatbot v1. Idempotent. Applied with `npm run db:migrate`.
-- chat_threads / chat_messages / chat_feedback / usage_daily + increment_usage() (daily cap).
-- RLS: users see their own rows; staff read feedback (+ the messages behind it) for /admin/feedback.
-- Reuses set_updated_at() and is_staff() from 0001.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'chat_messages_role') then
    create type public.chat_messages_role as enum ('user', 'assistant');
  end if;
end $$;

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id uuid references public.mentors (id) on delete set null,
  title text not null default 'New thread',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  role public.chat_messages_role not null,
  -- { text, citations: [...], rung, model, usage } — docs/loops/CONTRACTS.md § Chat message
  content jsonb not null default '{}'::jsonb,
  -- { queries, intent, candidates, reranked } (assistant rows only)
  retrieval jsonb,
  prompt_version text,
  model text,
  usage jsonb,
  latency_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create table if not exists public.usage_daily (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default current_date,
  messages integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_feedback enable row level security;
alter table public.usage_daily enable row level security;

create index if not exists chat_threads_user_last on public.chat_threads (user_id, last_message_at desc);
create index if not exists chat_messages_thread_created on public.chat_messages (thread_id, created_at);
create index if not exists chat_feedback_vote_created on public.chat_feedback (vote, created_at desc);

drop trigger if exists chat_threads_set_updated_at on public.chat_threads;
create trigger chat_threads_set_updated_at before update on public.chat_threads
  for each row execute function public.set_updated_at();
drop trigger if exists chat_feedback_set_updated_at on public.chat_feedback;
create trigger chat_feedback_set_updated_at before update on public.chat_feedback
  for each row execute function public.set_updated_at();
drop trigger if exists usage_daily_set_updated_at on public.usage_daily;
create trigger usage_daily_set_updated_at before update on public.usage_daily
  for each row execute function public.set_updated_at();

-- RLS ------------------------------------------------------------------------------
drop policy if exists "chat_threads: own" on public.chat_threads;
create policy "chat_threads: own" on public.chat_threads
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "chat_messages: own thread" on public.chat_messages;
create policy "chat_messages: own thread" on public.chat_messages
  for select to authenticated
  using (exists (select 1 from public.chat_threads t where t.id = thread_id and t.user_id = auth.uid()));
drop policy if exists "chat_messages: staff read" on public.chat_messages;
create policy "chat_messages: staff read" on public.chat_messages
  for select to authenticated using (public.is_staff());

drop policy if exists "chat_feedback: own" on public.chat_feedback;
create policy "chat_feedback: own" on public.chat_feedback
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "chat_feedback: staff read" on public.chat_feedback;
create policy "chat_feedback: staff read" on public.chat_feedback
  for select to authenticated using (public.is_staff());

drop policy if exists "usage_daily: own read" on public.usage_daily;
create policy "usage_daily: own read" on public.usage_daily
  for select to authenticated using (user_id = auth.uid());

-- increment_usage: atomically bumps today's counters and returns the new message count, so the
-- route handler can compare it with CHAT_DAILY_CAP (`> cap` → 429 and the message is rolled back
-- by decrement). Called with the service-role client after verifySession().
create or replace function public.increment_usage(
  p_user_id uuid,
  p_messages integer default 1,
  p_input_tokens bigint default 0,
  p_output_tokens bigint default 0
) returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.usage_daily as u (user_id, day, messages, input_tokens, output_tokens)
  values (p_user_id, current_date, p_messages, p_input_tokens, p_output_tokens)
  on conflict (user_id, day) do update
    set messages = u.messages + excluded.messages,
        input_tokens = u.input_tokens + excluded.input_tokens,
        output_tokens = u.output_tokens + excluded.output_tokens
  returning messages;
$$;

-- Grants ----------------------------------------------------------------------------
grant select, insert, update, delete on table public.chat_threads, public.chat_messages, public.chat_feedback to authenticated;
grant select on table public.usage_daily to authenticated;
grant all on table public.chat_threads, public.chat_messages, public.chat_feedback, public.usage_daily to service_role;
grant usage on type public.chat_messages_role to service_role, authenticated, anon;
grant execute on function public.increment_usage(uuid, integer, bigint, bigint) to service_role;
