-- 0006_practice — Loop 05 Practice: question bank attempts, FSRS flashcards, lesson progress.
-- Idempotent. Applied with `npm run db:migrate`. See docs/loops/05-practice.md + CONTRACTS.md.
--   flashcards      one card per approved question (derived by scripts/seed/05-flashcards.ts)
--   reviews         append-only FSRS review log (one row per rating)
--   card_state      current FSRS memory state per (user, card) + our mastery streak
--   attempts        question-bank attempts (self-graded now; ai_score/ai_feedback for Loop 07)
--   lesson_progress "Mark complete" per (user, lesson)
--   user_stats      view: one row per user with totals for the progress dashboard
--   search_content  function: websearch FTS over approved lessons + questions (⌘K palette)
-- RLS: students read/write only their own rows; flashcards readable when approved; staff read all.
-- FSRS maths runs in the app (src/lib/practice/srs.ts, ts-fsrs); the DB only stores state.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'attempts_mode') then
    create type public.attempts_mode as enum ('practice', 'drill', 'mock', 'lesson_your_turn');
  end if;
end $$;

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.questions (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  front text not null,
  back_md text not null,
  status public.content_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  flashcard_id uuid not null references public.flashcards (id) on delete cascade,
  rating smallint not null check (rating between 1 and 4),   -- ts-fsrs Rating: 1 Again · 2 Hard · 3 Good · 4 Easy
  state smallint not null default 0,                          -- ts-fsrs State before the review: 0 New · 1 Learning · 2 Review · 3 Relearning
  due timestamptz not null,
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  elapsed_days integer not null default 0,
  scheduled_days integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  reviewed_at timestamptz not null default now()
);

create table if not exists public.card_state (
  user_id uuid not null references public.profiles (id) on delete cascade,
  flashcard_id uuid not null references public.flashcards (id) on delete cascade,
  due timestamptz not null default now(),
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  state smallint not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  learning_steps integer not null default 0,
  streak integer not null default 0,                          -- consecutive Good/Easy; Again resets to 0
  mastered boolean not null default false,                    -- streak >= 2 (two Good in a row)
  last_review timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, flashcard_id)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  mode public.attempts_mode not null default 'practice',
  self_grade smallint check (self_grade between 1 and 3),     -- 1 missed · 2 partly · 3 nailed it (null when AI-graded only)
  answer_text text,                                           -- optional typed answer (Loop 07 grades it)
  ai_score numeric(4, 1),                                     -- Loop 07: 0–10
  ai_feedback jsonb,                                          -- Loop 07: grader output
  interview_id uuid,                                          -- Loop 07: interviews.id (FK added in 0008)
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.flashcards enable row level security;
alter table public.reviews enable row level security;
alter table public.card_state enable row level security;
alter table public.attempts enable row level security;
alter table public.lesson_progress enable row level security;

create index if not exists flashcards_topic_status on public.flashcards (topic_id, status);
create index if not exists reviews_user_time on public.reviews (user_id, reviewed_at desc);
create index if not exists card_state_user_due on public.card_state (user_id, due);
create index if not exists attempts_user_time on public.attempts (user_id, created_at desc);
create index if not exists attempts_question on public.attempts (question_id);

drop trigger if exists flashcards_set_updated_at on public.flashcards;
create trigger flashcards_set_updated_at before update on public.flashcards for each row execute function public.set_updated_at();
drop trigger if exists card_state_set_updated_at on public.card_state;
create trigger card_state_set_updated_at before update on public.card_state for each row execute function public.set_updated_at();

-- Full-text search columns for ⌘K (approved rows only reach students through RLS) --------------
alter table public.questions add column if not exists tsv tsvector
  generated always as (to_tsvector('english', coalesce(question, '') || ' ' || coalesce(body->>'model_answer_md', ''))) stored;
alter table public.lessons add column if not exists tsv tsvector
  generated always as (to_tsvector('english', coalesce(title, ''))) stored;
create index if not exists questions_tsv_gin on public.questions using gin (tsv);
create index if not exists lessons_tsv_gin on public.lessons using gin (tsv);

-- RLS ---------------------------------------------------------------------------------------------
drop policy if exists "flashcards: read approved" on public.flashcards;
create policy "flashcards: read approved" on public.flashcards for select to authenticated using (status = 'approved');
drop policy if exists "flashcards: staff all" on public.flashcards;
create policy "flashcards: staff all" on public.flashcards for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "reviews: own" on public.reviews;
create policy "reviews: own" on public.reviews for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "reviews: staff read" on public.reviews;
create policy "reviews: staff read" on public.reviews for select to authenticated using (public.is_staff());

drop policy if exists "card_state: own" on public.card_state;
create policy "card_state: own" on public.card_state for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "card_state: staff read" on public.card_state;
create policy "card_state: staff read" on public.card_state for select to authenticated using (public.is_staff());

drop policy if exists "attempts: own" on public.attempts;
create policy "attempts: own" on public.attempts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "attempts: staff read" on public.attempts;
create policy "attempts: staff read" on public.attempts for select to authenticated using (public.is_staff());

drop policy if exists "lesson_progress: own" on public.lesson_progress;
create policy "lesson_progress: own" on public.lesson_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "lesson_progress: staff read" on public.lesson_progress;
create policy "lesson_progress: staff read" on public.lesson_progress for select to authenticated using (public.is_staff());

-- Views (security_invoker: the caller's RLS applies, so a student only sees their own row) --------
create or replace view public.user_activity_days with (security_invoker = true) as
  select user_id, (created_at at time zone 'utc')::date as day from public.attempts
  union
  select user_id, (reviewed_at at time zone 'utc')::date as day from public.reviews
  union
  select user_id, (completed_at at time zone 'utc')::date as day from public.lesson_progress;

create or replace view public.user_stats with (security_invoker = true) as
  select p.id as user_id,
         (select count(*) from public.attempts a where a.user_id = p.id)::integer as attempts_total,
         (select count(distinct a.question_id) from public.attempts a where a.user_id = p.id)::integer as questions_attempted,
         (select count(*) from public.reviews r where r.user_id = p.id)::integer as reviews_total,
         (select count(*) from public.card_state c where c.user_id = p.id and c.mastered)::integer as cards_mastered,
         (select count(*) from public.card_state c where c.user_id = p.id and c.due <= now())::integer as cards_due,
         (select count(*) from public.lesson_progress l where l.user_id = p.id)::integer as lessons_completed,
         (select max(d.day) from public.user_activity_days d where d.user_id = p.id) as last_active_day
  from public.profiles p;

-- search_content: websearch FTS over approved lessons + questions, ranked. Security invoker →
-- RLS keeps non-approved rows out for students; the status filter is belt and braces.
create or replace function public.search_content(q text, n integer default 10)
returns table (kind text, id uuid, slug text, title text, topic_slug text, difficulty smallint, rank real)
language sql stable
as $$
  select * from (
    select 'question'::text as kind, x.id, x.slug, x.question as title, t.slug as topic_slug, x.difficulty,
           ts_rank_cd(x.tsv, websearch_to_tsquery('english', q))::real as rank
    from public.questions x join public.topics t on t.id = x.topic_id
    where x.status = 'approved' and x.tsv @@ websearch_to_tsquery('english', q)
    union all
    select 'lesson'::text, l.id, l.slug, l.title, t.slug, null::smallint,
           ts_rank_cd(l.tsv, websearch_to_tsquery('english', q))::real
    from public.lessons l join public.subtopics s on s.id = l.subtopic_id join public.topics t on t.id = s.topic_id
    where l.status = 'approved' and l.tsv @@ websearch_to_tsquery('english', q)
  ) r
  order by r.rank desc, r.title
  limit greatest(1, least(n, 50));
$$;

-- Grants -------------------------------------------------------------------------------------------
grant select, insert, update, delete on table public.flashcards, public.reviews, public.card_state, public.attempts, public.lesson_progress to authenticated;
grant all on table public.flashcards, public.reviews, public.card_state, public.attempts, public.lesson_progress to service_role;
grant select on public.user_stats, public.user_activity_days to authenticated, service_role;
grant usage on type public.attempts_mode to service_role, authenticated, anon;
grant execute on function public.search_content(text, integer) to authenticated, service_role;
