-- 0007_chat_technicals — Loop 06 Chatbot ↔ Technicals fusion. Idempotent. Applied with `npm run db:migrate`.
--   content_chunks        retrieval units derived from approved lessons (one per block) and questions
--                         (one per question); rebuilt by scripts/content/index-content.ts and by the
--                         approve action for a single item. Students never read this table directly:
--                         the chat route verifies the session, then queries with the service-role client.
--   chat_threads.context  { lesson_id?, question_id?, attempt_id? } — where "Ask Mentor" was pressed.
--   match_content_chunks  cosine kNN over approved content chunks (mirrors match_corpus_chunks)
--   search_content_fts    OR-able FTS over content chunks, ranked (mirrors search_corpus_fts)
-- RLS: staff read/write; service_role explicit grants. No student policy (by design).

do $$ begin
  if not exists (select 1 from pg_type where typname = 'content_chunks_kind') then
    create type public.content_chunks_kind as enum ('lesson_block', 'question');
  end if;
end $$;

create table if not exists public.content_chunks (
  id uuid primary key default gen_random_uuid(),
  kind public.content_chunks_kind not null,
  lesson_id uuid references public.lessons (id) on delete cascade,
  question_id uuid references public.questions (id) on delete cascade,
  block_index integer,                                   -- lesson blocks: index into body.blocks (anchor #block-<n>)
  block_type text,                                       -- lesson blocks: the block's `type`
  topic_id uuid references public.topics (id) on delete set null,
  subtopic_id uuid references public.subtopics (id) on delete set null,
  title text not null,                                   -- "Technicals › EqV/EV › The bridge › The trap"
  slug text not null,                                    -- lesson or question slug (deep link)
  topic_slug text not null,
  text text not null,
  token_count integer not null default 0,
  embedding extensions.vector(1024),
  embedding_model text,
  tsv tsvector generated always as (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(text, ''))) stored,
  status public.content_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'lesson_block' and lesson_id is not null and block_index is not null) or (kind = 'question' and question_id is not null))
);

alter table public.content_chunks enable row level security;

create unique index if not exists content_chunks_lesson_block on public.content_chunks (lesson_id, block_index) where kind = 'lesson_block';
create unique index if not exists content_chunks_question on public.content_chunks (question_id) where kind = 'question';
create index if not exists content_chunks_tsv_gin on public.content_chunks using gin (tsv);
create index if not exists content_chunks_status_kind on public.content_chunks (status, kind);
create index if not exists content_chunks_embedding_hnsw on public.content_chunks using hnsw (embedding extensions.vector_cosine_ops);

drop trigger if exists content_chunks_set_updated_at on public.content_chunks;
create trigger content_chunks_set_updated_at before update on public.content_chunks
  for each row execute function public.set_updated_at();

alter table public.chat_threads add column if not exists context jsonb;

-- RLS: staff only. Students reach chunks only through the chat route (service role). -----------
drop policy if exists "content_chunks: staff all" on public.content_chunks;
create policy "content_chunks: staff all" on public.content_chunks
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- match_content_chunks: cosine kNN over approved content chunks.
create or replace function public.match_content_chunks(
  query_embedding extensions.vector(1024),
  n integer default 8,
  p_status public.content_status default 'approved',
  kinds public.content_chunks_kind[] default null
) returns table (
  id uuid, kind public.content_chunks_kind, lesson_id uuid, question_id uuid, block_index integer, block_type text,
  topic_id uuid, subtopic_id uuid, title text, slug text, topic_slug text, text text, similarity real
)
language sql stable
set search_path = public, extensions
as $$
  select c.id, c.kind, c.lesson_id, c.question_id, c.block_index, c.block_type, c.topic_id, c.subtopic_id,
         c.title, c.slug, c.topic_slug, c.text,
         (1 - (c.embedding <=> query_embedding))::real as similarity
  from public.content_chunks c
  where c.embedding is not null
    and (p_status is null or c.status = p_status)
    and (kinds is null or c.kind = any (kinds))
  order by c.embedding <=> query_embedding
  limit greatest(n, 1)
$$;

-- search_content_fts: websearch-style FTS over content chunks (title ∥ text), ranked.
create or replace function public.search_content_fts(
  q text,
  n integer default 8,
  p_status public.content_status default 'approved'
) returns table (
  id uuid, kind public.content_chunks_kind, lesson_id uuid, question_id uuid, block_index integer, block_type text,
  topic_id uuid, subtopic_id uuid, title text, slug text, topic_slug text, text text, rank real
)
language sql stable
set search_path = public, extensions
as $$
  select c.id, c.kind, c.lesson_id, c.question_id, c.block_index, c.block_type, c.topic_id, c.subtopic_id,
         c.title, c.slug, c.topic_slug, c.text,
         ts_rank_cd(c.tsv, websearch_to_tsquery('english', q))::real as rank
  from public.content_chunks c
  where (p_status is null or c.status = p_status)
    and c.tsv @@ websearch_to_tsquery('english', q)
  order by rank desc
  limit greatest(n, 1)
$$;

-- Grants -------------------------------------------------------------------------------------------
grant select, insert, update, delete on table public.content_chunks to authenticated;
grant all on table public.content_chunks to service_role;
grant usage on type public.content_chunks_kind to service_role, authenticated, anon;
grant execute on function public.match_content_chunks(extensions.vector, integer, public.content_status, public.content_chunks_kind[]) to service_role;
grant execute on function public.search_content_fts(text, integer, public.content_status) to service_role;
