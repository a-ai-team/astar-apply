-- 0004_technicals — Loop 03 Technicals taxonomy & content model. Idempotent. Applied with
-- `npm run db:migrate`. topics → subtopics → lessons, questions, learning_paths(+items).
-- RLS: authenticated read `approved` (topics/subtopics: `status = 'approved'`); staff read/write all.
-- Reuses content_status (0002), set_updated_at() + is_staff() (0001). Validation of the JSON
-- bodies lives in the app (zod: src/lib/content/{lesson,question}-schema.ts), not the DB.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'topics_kind') then
    create type public.topics_kind as enum ('core', 'foundation', 'fit', 'industry');
  end if;
  if not exists (select 1 from pg_type where typname = 'subtopics_kind') then
    create type public.subtopics_kind as enum ('concept', 'calculation', 'mixed');
  end if;
  if not exists (select 1 from pg_type where typname = 'questions_kind') then
    create type public.questions_kind as enum ('concept', 'calculation');
  end if;
end $$;

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  kind public.topics_kind not null default 'core',
  ordinal integer not null default 0,
  level text not null default 'core',                 -- free-text difficulty label ("foundation" | "core" | "advanced")
  is_free boolean not null default false,
  summary text not null default '',
  source_section text,                                -- 400Q section *label* only, never text
  status public.content_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete cascade,
  slug text not null,
  title text not null,
  ordinal integer not null default 0,
  kind public.subtopics_kind not null default 'mixed',
  source_section text,
  target_questions integer not null default 0,        -- Loop 04 question-writer target (≈ proportional to 400Q counts)
  status public.content_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, slug)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  subtopic_id uuid not null references public.subtopics (id) on delete cascade,
  slug text not null unique,
  title text not null,
  ordinal integer not null default 0,
  -- docs/loops/CONTRACTS.md § Lesson JSON: { version, reading_minutes, blocks: [...] }
  body jsonb not null default '{"version":1,"reading_minutes":8,"blocks":[]}'::jsonb,
  body_version integer not null default 1,
  reading_minutes integer not null default 8,
  status public.content_status not null default 'draft',
  generated_by text,                                  -- 'human' | model id
  prompt_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  topic_id uuid not null references public.topics (id) on delete cascade,
  subtopic_id uuid references public.subtopics (id) on delete set null,
  kind public.questions_kind not null default 'concept',
  difficulty smallint not null default 1 check (difficulty between 1 and 4),
  question text not null,
  -- docs/loops/CONTRACTS.md § Question JSON (model_answer_md, key_points, follow_ups, …)
  body jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  source_topic text,                                  -- 400Q section label ONLY
  tags text[] not null default '{}',
  generated_by text,
  prompt_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  weeks integer not null default 10,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_path_items (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  week integer not null check (week >= 1),
  day integer not null check (day between 1 and 7),
  lesson_id uuid references public.lessons (id) on delete set null,
  question_set jsonb not null default '[]'::jsonb,    -- question slugs for the day's drill
  label text not null default '',
  created_at timestamptz not null default now(),
  unique (path_id, week, day)
);

alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_path_items enable row level security;

create index if not exists subtopics_topic_ordinal on public.subtopics (topic_id, ordinal);
create index if not exists lessons_subtopic_ordinal on public.lessons (subtopic_id, ordinal);
create index if not exists lessons_status on public.lessons (status);
create index if not exists questions_topic_status on public.questions (topic_id, status);
create index if not exists questions_subtopic on public.questions (subtopic_id);
create index if not exists questions_tags_gin on public.questions using gin (tags);
create index if not exists learning_path_items_path_week on public.learning_path_items (path_id, week, day);

drop trigger if exists topics_set_updated_at on public.topics;
create trigger topics_set_updated_at before update on public.topics for each row execute function public.set_updated_at();
drop trigger if exists subtopics_set_updated_at on public.subtopics;
create trigger subtopics_set_updated_at before update on public.subtopics for each row execute function public.set_updated_at();
drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at before update on public.lessons for each row execute function public.set_updated_at();
drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at before update on public.questions for each row execute function public.set_updated_at();
drop trigger if exists learning_paths_set_updated_at on public.learning_paths;
create trigger learning_paths_set_updated_at before update on public.learning_paths for each row execute function public.set_updated_at();

-- RLS ------------------------------------------------------------------------------
-- Students (authenticated) read approved rows only; staff read + write everything.
drop policy if exists "topics: read approved" on public.topics;
create policy "topics: read approved" on public.topics for select to authenticated using (status = 'approved');
drop policy if exists "topics: staff all" on public.topics;
create policy "topics: staff all" on public.topics for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "subtopics: read approved" on public.subtopics;
create policy "subtopics: read approved" on public.subtopics for select to authenticated using (status = 'approved');
drop policy if exists "subtopics: staff all" on public.subtopics;
create policy "subtopics: staff all" on public.subtopics for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "lessons: read approved" on public.lessons;
create policy "lessons: read approved" on public.lessons for select to authenticated using (status = 'approved');
drop policy if exists "lessons: staff all" on public.lessons;
create policy "lessons: staff all" on public.lessons for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "questions: read approved" on public.questions;
create policy "questions: read approved" on public.questions for select to authenticated using (status = 'approved');
drop policy if exists "questions: staff all" on public.questions;
create policy "questions: staff all" on public.questions for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "learning_paths: read" on public.learning_paths;
create policy "learning_paths: read" on public.learning_paths for select to authenticated using (true);
drop policy if exists "learning_paths: staff all" on public.learning_paths;
create policy "learning_paths: staff all" on public.learning_paths for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "learning_path_items: read" on public.learning_path_items;
create policy "learning_path_items: read" on public.learning_path_items for select to authenticated using (true);
drop policy if exists "learning_path_items: staff all" on public.learning_path_items;
create policy "learning_path_items: staff all" on public.learning_path_items for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Grants ----------------------------------------------------------------------------
grant select, insert, update, delete on table
  public.topics, public.subtopics, public.lessons, public.questions, public.learning_paths, public.learning_path_items
  to authenticated;
grant all on table
  public.topics, public.subtopics, public.lessons, public.questions, public.learning_paths, public.learning_path_items
  to service_role;
grant usage on type public.topics_kind, public.subtopics_kind, public.questions_kind to service_role, authenticated, anon;
