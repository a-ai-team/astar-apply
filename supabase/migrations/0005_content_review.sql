-- 0005_content_review — Loop 04 content generation: mentor review queue + Batches run log.
-- Idempotent. Applied with `npm run db:migrate`. Staff-only RLS; service_role gets explicit grants
-- (route handlers / scripts use the service-role client after verifyStaff()).
--   content_reviews(target_type lesson|question, target_id, reviewer_id, decision, comment)
--   generation_runs(kind lessons|questions|industry, batch_id, params, status, counts, cost_usd)
--   lessons.review_note / questions.review_note — the latest "regenerate with note" text.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'content_reviews_target_type') then
    create type public.content_reviews_target_type as enum ('lesson', 'question');
  end if;
  if not exists (select 1 from pg_type where typname = 'content_reviews_decision') then
    create type public.content_reviews_decision as enum ('approved', 'changes_requested', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'generation_runs_kind') then
    create type public.generation_runs_kind as enum ('lessons', 'questions', 'industry');
  end if;
  if not exists (select 1 from pg_type where typname = 'generation_runs_status') then
    -- dry_run: estimate only · submitted: batch created · in_progress: polling · ended: batch ended,
    -- not yet collected · collected: results parsed into content/ · failed · canceled
    create type public.generation_runs_status as enum ('dry_run', 'submitted', 'in_progress', 'ended', 'collected', 'failed', 'canceled');
  end if;
end $$;

create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  target_type public.content_reviews_target_type not null,
  target_id uuid not null,
  reviewer_id uuid references public.profiles (id) on delete set null,
  decision public.content_reviews_decision not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.generation_runs (
  id uuid primary key default gen_random_uuid(),
  kind public.generation_runs_kind not null,
  batch_id text,                                      -- Anthropic Message Batch id (null for dry runs / sync)
  params jsonb not null default '{}'::jsonb,          -- { model, prompt_version, topics, slugs, custom_ids, estimate }
  status public.generation_runs_status not null default 'submitted',
  requested integer not null default 0,
  succeeded integer not null default 0,
  failed integer not null default 0,
  cost_usd numeric(10, 4) not null default 0,         -- estimate at submit, actual (from usage) after collect
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.lessons add column if not exists review_note text;
alter table public.questions add column if not exists review_note text;

alter table public.content_reviews enable row level security;
alter table public.generation_runs enable row level security;

create index if not exists content_reviews_target on public.content_reviews (target_type, target_id, created_at desc);
create index if not exists generation_runs_created on public.generation_runs (created_at desc);
create index if not exists generation_runs_batch on public.generation_runs (batch_id);

-- RLS: staff only (students never see reviews or runs) --------------------------------------
drop policy if exists "content_reviews: staff all" on public.content_reviews;
create policy "content_reviews: staff all" on public.content_reviews for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "generation_runs: staff all" on public.generation_runs;
create policy "generation_runs: staff all" on public.generation_runs for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Grants ------------------------------------------------------------------------------------
grant select, insert, update, delete on table public.content_reviews, public.generation_runs to authenticated;
grant all on table public.content_reviews, public.generation_runs to service_role;
grant usage on type public.content_reviews_target_type, public.content_reviews_decision, public.generation_runs_kind, public.generation_runs_status
  to service_role, authenticated, anon;
