-- 0008_interviews — Loop 07 AI mock interviews: drills (≤ 5 Qs, one topic) and timed full mocks
-- (≤ 15 Qs stratified across the technical topics), each turn graded by Opus 5 against the model
-- answer + key points with a fixed rubric; a focus-area report at the end.
-- Idempotent. Applied with `npm run db:migrate`. See docs/loops/07-mock-interviews.md + CONTRACTS.md.
--   interviews       one row per drill/mock session (question order fixed at start, server-side clock)
--   interview_turns  one row per question shown; answer, transcript metrics, grade (jsonb), score /10
--   attempts         gains the FK to interviews (column reserved in 0006) + index
-- RLS: students read/write their own rows (ownership is re-checked in server actions too);
-- staff read all; service_role explicit grants.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'interviews_mode') then
    create type public.interviews_mode as enum ('drill', 'mock');
  end if;
  if not exists (select 1 from pg_type where typname = 'interviews_status') then
    create type public.interviews_status as enum ('in_progress', 'completed', 'abandoned');
  end if;
end $$;

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode public.interviews_mode not null,
  topic_id uuid references public.topics (id) on delete set null,      -- drills only; null for mocks
  question_ids uuid[] not null default '{}',                             -- order of play, fixed at start
  seconds_per_question integer not null default 90 check (seconds_per_question between 15 and 600),
  status public.interviews_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  overall_score numeric(4, 1),                                           -- mean of turn scores, 0–10
  report jsonb,                                                          -- { summary_md, focus_areas[{topic, subtopic, reason, lesson_slug, deck}] }
  prompt_version text,                                                   -- report prompt id.vN
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_turns (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews (id) on delete cascade,
  ordinal integer not null check (ordinal >= 0),
  question_id uuid not null references public.questions (id) on delete cascade,
  attempt_id uuid references public.attempts (id) on delete set null,    -- the attempts row written with this turn
  shown_at timestamptz,                                                  -- server clock: when the question was served
  answered_at timestamptz,
  answer_text text,
  transcript_meta jsonb,                                                 -- { wpm, filler_count, fillers[], duration_s, late? }
  score numeric(4, 1) check (score is null or (score >= 0 and score <= 10)),
  grade jsonb,                                                           -- { hit[], missed[], structure 0–3, accuracy 0–4, depth 0–3, feedback_md, mentor_tip_md }
  prompt_version text,                                                   -- grader prompt id.vN (or "fixture")
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (interview_id, ordinal)
);

-- attempts.interview_id was reserved in 0006 without a FK.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'attempts_interview_id_fkey') then
    alter table public.attempts add constraint attempts_interview_id_fkey
      foreign key (interview_id) references public.interviews (id) on delete set null;
  end if;
end $$;
create index if not exists attempts_interview on public.attempts (interview_id);

alter table public.interviews enable row level security;
alter table public.interview_turns enable row level security;

create index if not exists interviews_user_time on public.interviews (user_id, started_at desc);
create index if not exists interview_turns_interview on public.interview_turns (interview_id, ordinal);
create index if not exists interview_turns_question on public.interview_turns (question_id);

drop trigger if exists interviews_set_updated_at on public.interviews;
create trigger interviews_set_updated_at before update on public.interviews for each row execute function public.set_updated_at();

-- RLS ---------------------------------------------------------------------------------------------
drop policy if exists "interviews: own" on public.interviews;
create policy "interviews: own" on public.interviews for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "interviews: staff read" on public.interviews;
create policy "interviews: staff read" on public.interviews for select to authenticated using (public.is_staff());

-- Turns are owned through their interview.
drop policy if exists "interview_turns: own" on public.interview_turns;
create policy "interview_turns: own" on public.interview_turns for all to authenticated
  using (exists (select 1 from public.interviews i where i.id = interview_id and i.user_id = auth.uid()))
  with check (exists (select 1 from public.interviews i where i.id = interview_id and i.user_id = auth.uid()));
drop policy if exists "interview_turns: staff read" on public.interview_turns;
create policy "interview_turns: staff read" on public.interview_turns for select to authenticated using (public.is_staff());

-- Grants -------------------------------------------------------------------------------------------
grant select, insert, update, delete on table public.interviews, public.interview_turns to authenticated;
grant all on table public.interviews, public.interview_turns to service_role;
grant usage on type public.interviews_mode, public.interviews_status to service_role, authenticated, anon;
