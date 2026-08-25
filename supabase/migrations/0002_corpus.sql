-- 0002_corpus — Loop 01 Mentor corpus ingestion. Idempotent. Applied with `npm run db:migrate`.
-- corpus_sources (uploads) + corpus_chunks (retrieval units, pgvector + tsvector), private
-- Storage bucket `corpus`, staff-only RLS, and the two retrieval functions Loop 02 will call.
-- Reuses set_updated_at() and is_admin/is_mentor/is_staff() from 0001.

create extension if not exists vector with schema extensions;

-- Enums -----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum ('draft', 'generated', 'in_review', 'approved', 'rejected', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'corpus_sources_kind') then
    create type public.corpus_sources_kind as enum ('photo', 'pdf', 'text', 'qa', 'voice');
  end if;
  if not exists (select 1 from pg_type where typname = 'corpus_chunks_kind') then
    create type public.corpus_chunks_kind as enum ('note', 'slide', 'qa', 'paragraph', 'formula', 'table');
  end if;
end $$;

-- Tables ----------------------------------------------------------------------------
create table if not exists public.corpus_sources (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.mentors (id) on delete set null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  kind public.corpus_sources_kind not null,
  title text not null,
  storage_path text,                       -- object key in bucket `corpus` (null for text/qa)
  mime text,
  bytes integer,
  page_count integer,
  raw_text text,                           -- pasted text / Q&A / pdfjs text hint
  extraction jsonb,                        -- CorpusExtraction (src/lib/corpus/extract.ts)
  extraction_model text,
  extraction_confidence real,
  extraction_error text,
  status public.content_status not null default 'draft',
  topic_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.corpus_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.corpus_sources (id) on delete cascade,
  mentor_id uuid references public.mentors (id) on delete set null,
  kind public.corpus_chunks_kind not null,
  ordinal integer not null default 0,
  text text not null,
  question text,
  answer text,
  page_ref integer,
  region jsonb,
  topic_tags text[] not null default '{}',
  entities jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1024),
  embedding_model text,
  tsv tsvector generated always as (
    to_tsvector('english', coalesce(question, '') || ' ' || coalesce(text, ''))
  ) stored,
  status public.content_status not null default 'draft',
  token_count integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, ordinal)
);

alter table public.corpus_sources enable row level security;
alter table public.corpus_chunks enable row level security;

-- Indexes ---------------------------------------------------------------------------
create index if not exists corpus_chunks_embedding_hnsw on public.corpus_chunks
  using hnsw (embedding extensions.vector_cosine_ops);
create index if not exists corpus_chunks_tsv_gin on public.corpus_chunks using gin (tsv);
create index if not exists corpus_chunks_topic_tags_gin on public.corpus_chunks using gin (topic_tags);
create index if not exists corpus_chunks_status_mentor on public.corpus_chunks (status, mentor_id);
create index if not exists corpus_sources_status_mentor on public.corpus_sources (status, mentor_id);

-- updated_at triggers (function from 0001) ------------------------------------------
drop trigger if exists corpus_sources_set_updated_at on public.corpus_sources;
create trigger corpus_sources_set_updated_at before update on public.corpus_sources
  for each row execute function public.set_updated_at();
drop trigger if exists corpus_chunks_set_updated_at on public.corpus_chunks;
create trigger corpus_chunks_set_updated_at before update on public.corpus_chunks
  for each row execute function public.set_updated_at();

-- RLS: staff only. Students never get a policy here — Loop 02 route handlers use the
-- service-role client after verifying the session.
drop policy if exists "corpus_sources: staff all" on public.corpus_sources;
create policy "corpus_sources: staff all" on public.corpus_sources
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists "corpus_chunks: staff all" on public.corpus_chunks;
create policy "corpus_chunks: staff all" on public.corpus_chunks
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Grants ----------------------------------------------------------------------------
grant select, insert, update, delete on table public.corpus_sources, public.corpus_chunks to authenticated;
grant all on table public.corpus_sources, public.corpus_chunks to service_role;
grant usage on type public.content_status, public.corpus_sources_kind, public.corpus_chunks_kind
  to service_role, authenticated, anon;

-- Storage: private bucket `corpus`; staff read/write via RLS, uploads use signed upload URLs.
insert into storage.buckets (id, name, public, file_size_limit)
values ('corpus', 'corpus', false, 52428800)
on conflict (id) do update set public = false;

drop policy if exists "corpus bucket: staff read" on storage.objects;
create policy "corpus bucket: staff read" on storage.objects
  for select to authenticated using (bucket_id = 'corpus' and public.is_staff());
drop policy if exists "corpus bucket: staff write" on storage.objects;
create policy "corpus bucket: staff write" on storage.objects
  for insert to authenticated with check (bucket_id = 'corpus' and public.is_staff());
drop policy if exists "corpus bucket: staff update" on storage.objects;
create policy "corpus bucket: staff update" on storage.objects
  for update to authenticated using (bucket_id = 'corpus' and public.is_staff());
drop policy if exists "corpus bucket: staff delete" on storage.objects;
create policy "corpus bucket: staff delete" on storage.objects
  for delete to authenticated using (bucket_id = 'corpus' and public.is_staff());

-- Retrieval functions (Loop 02 calls these via rpc with the service-role client) --------
-- match_corpus_chunks: cosine kNN over approved (or given status) chunks, optional kind filter.
create or replace function public.match_corpus_chunks(
  query_embedding extensions.vector(1024),
  n integer default 8,
  p_status public.content_status default 'approved',
  kinds public.corpus_chunks_kind[] default null
) returns table (
  id uuid, source_id uuid, mentor_id uuid, kind public.corpus_chunks_kind, ordinal integer,
  text text, question text, answer text, page_ref integer, topic_tags text[], entities jsonb,
  similarity real
)
language sql stable
set search_path = public, extensions
as $$
  select c.id, c.source_id, c.mentor_id, c.kind, c.ordinal, c.text, c.question, c.answer,
         c.page_ref, c.topic_tags, c.entities,
         (1 - (c.embedding <=> query_embedding))::real as similarity
  from public.corpus_chunks c
  where c.embedding is not null
    and (p_status is null or c.status = p_status)
    and (kinds is null or c.kind = any (kinds))
  order by c.embedding <=> query_embedding
  limit greatest(n, 1)
$$;

-- search_corpus_fts: websearch-style full-text search over approved chunks, ranked.
create or replace function public.search_corpus_fts(
  q text,
  n integer default 8,
  p_status public.content_status default 'approved'
) returns table (
  id uuid, source_id uuid, mentor_id uuid, kind public.corpus_chunks_kind, ordinal integer,
  text text, question text, answer text, page_ref integer, topic_tags text[], entities jsonb,
  rank real
)
language sql stable
set search_path = public
as $$
  select c.id, c.source_id, c.mentor_id, c.kind, c.ordinal, c.text, c.question, c.answer,
         c.page_ref, c.topic_tags, c.entities,
         ts_rank_cd(c.tsv, websearch_to_tsquery('english', q))::real as rank
  from public.corpus_chunks c
  where (p_status is null or c.status = p_status)
    and c.tsv @@ websearch_to_tsquery('english', q)
  order by rank desc
  limit greatest(n, 1)
$$;

grant execute on function public.match_corpus_chunks(extensions.vector, integer, public.content_status, public.corpus_chunks_kind[])
  to service_role, authenticated;
grant execute on function public.search_corpus_fts(text, integer, public.content_status)
  to service_role, authenticated;
