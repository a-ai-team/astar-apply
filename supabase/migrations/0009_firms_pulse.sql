-- 0009_firms_pulse — Loop 08 firm interview bank + Pulse.
--   firms                 dossier per firm (type, founded, HQ, headcount, divisions, values, process timeline, sources)
--   firm_questions        tagged questions per firm (category/stage/programme/frequency/recency + guidance_md)
--   firm_question_reports student "report a question" submissions, hand-reviewed; approve → promoted to firm_questions
--   pulse_digests         one weekly AI-written market digest (body jsonb), status-gated like content
--   interview_turns       gains firm_question_id so "Practise this" can run a 1-question drill on a firm question
-- Every firm/question/digest row starts `generated` (student-invisible) until staff approve it in admin.
-- Idempotent. Applied with `npm run db:migrate`. See docs/loops/08-firms-pulse.md + CONTRACTS.md.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'firms_type') then
    create type public.firms_type as enum ('bulge_bracket', 'elite_boutique', 'uk_mid', 'buy_side', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'firm_questions_category') then
    create type public.firm_questions_category as enum ('motivation', 'behavioural', 'commercial', 'about_you', 'technical');
  end if;
  if not exists (select 1 from pg_type where typname = 'firm_questions_stage') then
    create type public.firm_questions_stage as enum ('hirevue', 'interview', 'ac');
  end if;
  if not exists (select 1 from pg_type where typname = 'firm_questions_programme') then
    create type public.firm_questions_programme as enum ('spring', 'summer', 'graduate', 'offcycle');
  end if;
  if not exists (select 1 from pg_type where typname = 'firm_questions_frequency') then
    create type public.firm_questions_frequency as enum ('very_common', 'common', 'occasional');
  end if;
  if not exists (select 1 from pg_type where typname = 'firm_question_reports_status') then
    create type public.firm_question_reports_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type public.firms_type not null default 'other',
  founded integer,
  hq text,
  headcount text,                               -- free text ("~45,000 (2024)") — never a fabricated exact number
  scale_note text,                              -- AUM / revenue / "largest by…" as stated on the firm's own pages, else null
  divisions text[] not null default '{}',
  values text[] not null default '{}',
  process jsonb not null default '[]',          -- [{ stage, when, notes }]
  sources jsonb not null default '[]',          -- [{ title, url }] — the firm's own careers pages only
  status public.content_status not null default 'generated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.firm_questions (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete cascade,
  category public.firm_questions_category not null,
  division text,                                -- null = any division
  question text not null,
  stage public.firm_questions_stage not null,
  programme public.firm_questions_programme not null,
  frequency public.firm_questions_frequency not null default 'common',
  recency_year integer check (recency_year is null or recency_year between 2015 and 2100),   -- null = no real provenance
  guidance_md text not null default '',         -- "what a strong answer covers" — guidance, not a script
  sources jsonb not null default '[]',          -- [{ title, url }] or []
  status public.content_status not null default 'generated',
  reported_by uuid references public.profiles (id) on delete set null,   -- set when promoted from a report
  generated_by text,                            -- prompt id.vN or "fixture:<file>"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, question)
);

create table if not exists public.firm_question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  firm_id uuid not null references public.firms (id) on delete cascade,
  programme public.firm_questions_programme not null,
  stage public.firm_questions_stage not null,
  division text,
  asked_at date,                                -- when the student was asked it (month precision is fine)
  context text,                                 -- free text: round, format, interviewer seniority…
  question text not null,
  status public.firm_question_reports_status not null default 'pending',
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  promoted_question_id uuid references public.firm_questions (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.pulse_digests (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,              -- Monday
  status public.content_status not null default 'generated',
  body jsonb not null,                          -- { stories[{ headline, take_md, talking_points[3], anchors[], practice_qs[{q,a}], sources[{title,url}] }] }
  model text,
  prompt_version text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- interview_turns: a turn is either a curriculum question or a firm question.
alter table public.interview_turns add column if not exists firm_question_id uuid references public.firm_questions (id) on delete cascade;
alter table public.interview_turns alter column question_id drop not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'interview_turns_one_question') then
    alter table public.interview_turns add constraint interview_turns_one_question
      check ((question_id is not null)::int + (firm_question_id is not null)::int = 1);
  end if;
end $$;
create index if not exists interview_turns_firm_question on public.interview_turns (firm_question_id);

create index if not exists firm_questions_firm on public.firm_questions (firm_id, status);
create index if not exists firm_question_reports_user_day on public.firm_question_reports (user_id, created_at desc);
create index if not exists firm_question_reports_status on public.firm_question_reports (status, created_at desc);

alter table public.firms enable row level security;
alter table public.firm_questions enable row level security;
alter table public.firm_question_reports enable row level security;
alter table public.pulse_digests enable row level security;

drop trigger if exists firms_set_updated_at on public.firms;
create trigger firms_set_updated_at before update on public.firms for each row execute function public.set_updated_at();
drop trigger if exists firm_questions_set_updated_at on public.firm_questions;
create trigger firm_questions_set_updated_at before update on public.firm_questions for each row execute function public.set_updated_at();
drop trigger if exists pulse_digests_set_updated_at on public.pulse_digests;
create trigger pulse_digests_set_updated_at before update on public.pulse_digests for each row execute function public.set_updated_at();

-- RLS ---------------------------------------------------------------------------------------------
drop policy if exists "firms: read approved" on public.firms;
create policy "firms: read approved" on public.firms for select to authenticated using (status = 'approved');
drop policy if exists "firms: staff all" on public.firms;
create policy "firms: staff all" on public.firms for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "firm_questions: read approved" on public.firm_questions;
create policy "firm_questions: read approved" on public.firm_questions for select to authenticated
  using (status = 'approved' and exists (select 1 from public.firms f where f.id = firm_id and f.status = 'approved'));
drop policy if exists "firm_questions: staff all" on public.firm_questions;
create policy "firm_questions: staff all" on public.firm_questions for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "firm_question_reports: own insert" on public.firm_question_reports;
create policy "firm_question_reports: own insert" on public.firm_question_reports for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "firm_question_reports: own read" on public.firm_question_reports;
create policy "firm_question_reports: own read" on public.firm_question_reports for select to authenticated using (user_id = auth.uid());
drop policy if exists "firm_question_reports: staff all" on public.firm_question_reports;
create policy "firm_question_reports: staff all" on public.firm_question_reports for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "pulse_digests: read approved" on public.pulse_digests;
create policy "pulse_digests: read approved" on public.pulse_digests for select to authenticated using (status = 'approved');
drop policy if exists "pulse_digests: staff all" on public.pulse_digests;
create policy "pulse_digests: staff all" on public.pulse_digests for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Grants -------------------------------------------------------------------------------------------
grant select on table public.firms, public.firm_questions, public.pulse_digests to authenticated;
grant select, insert on table public.firm_question_reports to authenticated;
grant all on table public.firms, public.firm_questions, public.firm_question_reports, public.pulse_digests to service_role;
grant usage on type public.firms_type, public.firm_questions_category, public.firm_questions_stage, public.firm_questions_programme,
  public.firm_questions_frequency, public.firm_question_reports_status to service_role, authenticated, anon;
