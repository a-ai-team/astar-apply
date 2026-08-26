// `npm run db:check` — confirms the Loop 01–08 schema is live on the linked project: tables, HNSW
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
  'path_items', (select count(*) from public.learning_path_items i join public.learning_paths p on p.id = i.path_id where p.slug = 'default-10-week'),
  'review_tables', (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('content_reviews','generation_runs')),
  'review_rls', (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity and relname in ('content_reviews','generation_runs')),
  'review_policies', (select count(*) from pg_policies where schemaname = 'public' and tablename in ('content_reviews','generation_runs')),
  'review_note_cols', (select count(*) from information_schema.columns where table_schema = 'public' and column_name = 'review_note' and table_name in ('lessons','questions')),
  'practice_tables', (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('flashcards','reviews','card_state','attempts','lesson_progress')),
  'practice_rls', (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity and relname in ('flashcards','reviews','card_state','attempts','lesson_progress')),
  'practice_policies', (select count(*) from pg_policies where schemaname = 'public' and tablename in ('flashcards','reviews','card_state','attempts','lesson_progress')),
  'practice_views', (select count(*) from information_schema.views where table_schema = 'public' and table_name in ('user_stats','user_activity_days')),
  'search_content', (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname = 'search_content'),
  'tsv_cols', (select count(*) from information_schema.columns where table_schema = 'public' and column_name = 'tsv' and table_name in ('lessons','questions')),
  'content_chunks', (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'content_chunks'),
  'content_chunks_rls', (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity and relname = 'content_chunks'),
  'content_chunks_hnsw', (select count(*) from pg_indexes where schemaname = 'public' and indexname = 'content_chunks_embedding_hnsw' and indexdef ilike '%hnsw%'),
  'content_fns', (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname in ('match_content_chunks','search_content_fts')),
  'thread_context', (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'chat_threads' and column_name = 'context'),
  'approved_content_chunks', (select count(*) from public.content_chunks where status = 'approved'),
  'interview_tables', (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('interviews','interview_turns')),
  'interview_rls', (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity and relname in ('interviews','interview_turns')),
  'interview_policies', (select count(*) from pg_policies where schemaname = 'public' and tablename in ('interviews','interview_turns')),
  'attempts_interview_fk', (select count(*) from pg_constraint where conname = 'attempts_interview_id_fkey'),
  'firm_tables', (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('firms','firm_questions','firm_question_reports','pulse_digests')),
  'firm_rls', (select count(*) from pg_class where relnamespace = 'public'::regnamespace and relrowsecurity and relname in ('firms','firm_questions','firm_question_reports','pulse_digests')),
  'firm_policies', (select count(*) from pg_policies where schemaname = 'public' and tablename in ('firms','firm_questions','firm_question_reports','pulse_digests')),
  'turn_firm_question', (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'interview_turns' and column_name = 'firm_question_id'),
  'turn_one_question', (select count(*) from pg_constraint where conname = 'interview_turns_one_question')
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
    ["Loop 04: content_reviews + generation_runs exist", r.review_tables === 2],
    ["Loop 04: RLS enabled on both", r.review_rls === 2],
    ["Loop 04: staff policies on both", Number(r.review_policies) >= 2],
    ["Loop 04: review_note on lessons + questions", r.review_note_cols === 2],
    ["Loop 05: flashcards/reviews/card_state/attempts/lesson_progress exist", r.practice_tables === 5],
    ["Loop 05: RLS enabled on all five", r.practice_rls === 5],
    ["Loop 05: own + staff policies on all five", Number(r.practice_policies) >= 10],
    ["Loop 05: user_stats + user_activity_days views", r.practice_views === 2],
    ["Loop 05: search_content() exists", r.search_content === 1],
    ["Loop 05: tsv on lessons + questions", r.tsv_cols === 2],
    ["Loop 06: content_chunks exists", r.content_chunks === 1],
    ["Loop 06: RLS enabled on content_chunks", r.content_chunks_rls === 1],
    ["Loop 06: HNSW index on content_chunks.embedding", r.content_chunks_hnsw === 1],
    ["Loop 06: match_content_chunks + search_content_fts", r.content_fns === 2],
    ["Loop 06: chat_threads.context", r.thread_context === 1],
    ["Loop 06: ≥ 1 approved content chunk (run `npm run content:index`)", Number(r.approved_content_chunks) >= 1],
    ["Loop 07: interviews + interview_turns exist", r.interview_tables === 2],
    ["Loop 07: RLS enabled on both", r.interview_rls === 2],
    ["Loop 07: own + staff-read policies (4)", r.interview_policies === 4],
    ["Loop 07: attempts.interview_id FK → interviews", r.attempts_interview_fk === 1],
    ["Loop 08: firms/firm_questions/firm_question_reports/pulse_digests exist", r.firm_tables === 4],
    ["Loop 08: RLS enabled on all four", r.firm_rls === 4],
    ["Loop 08: read-approved/own + staff policies (9)", Number(r.firm_policies) >= 9],
    ["Loop 08: interview_turns.firm_question_id", r.turn_firm_question === 1],
    ["Loop 08: interview_turns one-question check", r.turn_one_question === 1],
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
