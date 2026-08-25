// `npm run db:check` — confirms the Loop 01 + 02 + 03 schema is live on the linked project: tables, HNSW
// index, RLS, retrieval functions, storage bucket. Uses the Supabase CLI (`supabase db query
// --linked`) because catalog tables are not reachable through PostgREST. Exit 1 on any miss.
import { execFileSync } from "node:child_process";

const SQL = `
select json_build_object(
  'tables', (select array_agg(table_name::text order by table_name) from information_schema.tables
             where table_schema = 'public' and table_name in ('corpus_sources','corpus_chunks')),
  'rls',    (select array_agg(relname::text order by relname) from pg_class
             where relnamespace = 'public'::regnamespace and relrowsecurity
               and relname in ('corpus_sources','corpus_chunks')),
  'hnsw',   (select count(*) from pg_indexes where schemaname = 'public'
             and indexname = 'corpus_chunks_embedding_hnsw' and indexdef ilike '%hnsw%'),
  'gin',    (select count(*) from pg_indexes where schemaname = 'public'
             and indexname in ('corpus_chunks_tsv_gin','corpus_chunks_topic_tags_gin')),
  'functions', (select array_agg(proname::text order by proname) from pg_proc
             where pronamespace = 'public'::regnamespace
               and proname in ('match_corpus_chunks','search_corpus_fts','is_staff','set_updated_at')),
  'policies', (select count(*) from pg_policies where schemaname = 'public'
             and tablename in ('corpus_sources','corpus_chunks')),
  'storage_policies', (select count(*) from pg_policies where schemaname = 'storage'
             and tablename = 'objects' and policyname like 'corpus bucket%'),
  'bucket', (select count(*) from storage.buckets where id = 'corpus' and public = false),
  'vector_dim', (select atttypmod from pg_attribute
             where attrelid = 'public.corpus_chunks'::regclass and attname = 'embedding'),
  'chat_tables', (select count(*) from information_schema.tables where table_schema = 'public'
             and table_name in ('chat_threads','chat_messages','chat_feedback','usage_daily')),
  'chat_rls', (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity
             and relname in ('chat_threads','chat_messages','chat_feedback','usage_daily')),
  'increment_usage', (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname = 'increment_usage'),
  'tech_tables', (select count(*) from information_schema.tables where table_schema = 'public'
             and table_name in ('topics','subtopics','lessons','questions','learning_paths','learning_path_items')),
  'tech_rls', (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity
             and relname in ('topics','subtopics','lessons','questions','learning_paths','learning_path_items')),
  'tech_policies', (select count(*) from pg_policies where schemaname = 'public'
             and tablename in ('topics','subtopics','lessons','questions','learning_paths','learning_path_items')),
  'topics', (select count(*) from public.topics where status = 'approved'),
  'subtopics', (select count(*) from public.subtopics where status = 'approved'),
  'approved_lessons', (select count(*) from public.lessons where status = 'approved'),
  'approved_questions', (select count(*) from public.questions where status = 'approved'),
  'path_items', (select count(*) from public.learning_path_items i join public.learning_paths p on p.id = i.path_id where p.slug = 'default-10-week')
) as report;
`;

function main() {
  const out = execFileSync("supabase", ["db", "query", "--linked", "--output", "json", SQL], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  // Output is `{ boundary, rows: [...] }`, sometimes preceded by a log line ("Initialising login role...").
  const json = out.slice(out.indexOf("{"));
  const parsed = JSON.parse(json) as { rows: { report: Record<string, unknown> }[] };
  const r = parsed.rows[0].report;
  const checks: [string, boolean][] = [
    ["tables corpus_sources + corpus_chunks", (r.tables as string[] | null)?.length === 2],
    ["RLS enabled on both", (r.rls as string[] | null)?.length === 2],
    ["HNSW index on embedding", r.hnsw === 1],
    ["GIN indexes on tsv + topic_tags", r.gin === 2],
    ["functions match_corpus_chunks/search_corpus_fts/is_staff/set_updated_at", (r.functions as string[] | null)?.length === 4],
    ["staff policies on both tables", Number(r.policies) >= 2],
    ["storage policies on bucket corpus", Number(r.storage_policies) >= 4],
    ["private bucket corpus exists", r.bucket === 1],
    ["embedding is vector(1024)", r.vector_dim === 1024],
    ["Loop 02: chat_threads/chat_messages/chat_feedback/usage_daily exist", r.chat_tables === 4],
    ["Loop 02: RLS enabled on all four chat tables", r.chat_rls === 4],
    ["Loop 02: increment_usage() exists", r.increment_usage === 1],
    ["Loop 03: six curriculum tables exist", r.tech_tables === 6],
    ["Loop 03: RLS enabled on all six", r.tech_rls === 6],
    ["Loop 03: read-approved + staff policies on all six", Number(r.tech_policies) >= 12],
    ["Loop 03: 9 approved topics", r.topics === 9],
    ["Loop 03: ≥ 40 approved subtopics", Number(r.subtopics) >= 40],
    ["Loop 03: ≥ 2 approved lessons", Number(r.approved_lessons) >= 2],
    ["Loop 03: ≥ 6 approved questions", Number(r.approved_questions) >= 6],
    ["Loop 03: default-10-week path has 50 items", r.path_items === 50],
  ];
  let ok = true;
  for (const [label, pass] of checks) {
    console.log(`${pass ? "ok  " : "FAIL"} ${label}`);
    if (!pass) ok = false;
  }
  if (!ok) {
    console.error(JSON.stringify(r));
    process.exit(1);
  }
}
main();
