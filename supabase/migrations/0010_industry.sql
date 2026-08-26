-- 0010_industry — Loop 09 industry / group modules. Idempotent. Applied with `npm run db:migrate`.
-- Adds `topics.group_family` (coverage | product | other), inserts the 18 industry `topics` rows
-- (kind = 'industry'; the seed refines titles/summaries and adds the subtopics), and the
-- `industry_modules` view (security invoker → students see approved counts only). The
-- `key_metrics` lesson block already exists in the Lesson JSON contract (0004 / lesson-schema.ts).

alter table public.topics add column if not exists group_family text
  check (group_family in ('coverage', 'product', 'other'));

create index if not exists topics_kind_family on public.topics (kind, group_family);

-- 18 modules from docs/research/400q-taxonomy.md § Industry (labels + counts only, never text).
-- Ordinals 100+ keep them after the generalist topics. `on conflict` keeps re-runs idempotent and
-- never touches a title/summary the seed or an admin has since edited.
insert into public.topics (slug, title, kind, ordinal, level, is_free, summary, source_section, group_family, status) values
  ('consumer-retail',          'Consumer & Retail',                        'industry', 100, 'advanced', false, '', 'Industry – Consumer/Retail',                              'coverage', 'approved'),
  ('dcm-levfin',               'DCM & Leveraged Finance',                  'industry', 101, 'advanced', false, '', 'Industry – DCM & LevFin',                                 'product',  'approved'),
  ('distressed-restructuring', 'Distressed & Restructuring',               'industry', 102, 'advanced', false, '', 'Industry – Distressed & Restructuring',                   'product',  'approved'),
  ('ecm',                      'Equity Capital Markets',                   'industry', 103, 'advanced', false, '', 'Industry – ECM',                                          'product',  'approved'),
  ('fig',                      'Financial Institutions (FIG)',             'industry', 104, 'advanced', false, '', 'Industry – FIG',                                          'coverage', 'approved'),
  ('fsg',                      'Financial Sponsors Group',                 'industry', 105, 'advanced', false, '', 'Industry – FSG',                                          'coverage', 'approved'),
  ('healthcare-biotech',       'Healthcare & Biotech',                     'industry', 106, 'advanced', false, '', 'Industry – Healthcare & Biotech',                         'coverage', 'approved'),
  ('industrials',              'Industrials',                              'industry', 107, 'advanced', false, '', 'Industry – Industrials',                                  'coverage', 'approved'),
  ('metals-mining',            'Metals & Mining',                          'industry', 108, 'advanced', false, '', 'Industry – Metals & Mining',                              'coverage', 'approved'),
  ('oil-gas',                  'Oil & Gas',                                'industry', 109, 'advanced', false, '', 'Industry – Oil & Gas',                                    'coverage', 'approved'),
  ('power-utilities',          'Power & Utilities',                        'industry', 110, 'advanced', false, '', 'Industry – Power & Utilities',                            'coverage', 'approved'),
  ('secondaries',              'Private Capital Advisory (Secondaries)',   'industry', 111, 'advanced', false, '', 'Industry – Private Capital Advisory (Secondaries)',       'other',    'approved'),
  ('private-companies',        'Private Companies',                        'industry', 112, 'advanced', false, '', 'Industry – Private Companies',                            'other',    'approved'),
  ('project-finance',          'Project Finance & Infrastructure',         'industry', 113, 'advanced', false, '', 'Industry – Project Finance & Infra',                       'product',  'approved'),
  ('real-estate',              'Real Estate',                              'industry', 114, 'advanced', false, '', 'Industry – Real Estate',                                  'coverage', 'approved'),
  ('reits',                    'REITs',                                    'industry', 115, 'advanced', false, '', 'Industry – REITs',                                        'coverage', 'approved'),
  ('renewables',               'Renewables',                               'industry', 116, 'advanced', false, '', 'Industry – Renewables',                                   'coverage', 'approved'),
  ('tmt',                      'Technology, Media & Telecoms',             'industry', 117, 'advanced', false, '', 'Industry – TMT',                                          'coverage', 'approved')
on conflict (slug) do update set kind = excluded.kind, group_family = excluded.group_family;

-- One row per industry module with its content counts. Security invoker: the caller's RLS applies,
-- so a student sees approved lessons/questions only while staff/service_role see everything.
create or replace view public.industry_modules
with (security_invoker = true) as
select
  t.id            as topic_id,
  t.slug,
  t.title,
  t.summary,
  t.group_family,
  t.ordinal,
  t.is_free,
  t.status,
  (select count(*) from public.subtopics s where s.topic_id = t.id)                                   as subtopic_count,
  (select count(*) from public.lessons l join public.subtopics s on s.id = l.subtopic_id
     where s.topic_id = t.id and l.status = 'approved')                                                as lesson_count,
  (select count(*) from public.questions q where q.topic_id = t.id and q.status = 'approved')          as question_count,
  (select count(*) from public.flashcards f where f.topic_id = t.id and f.status = 'approved')         as flashcard_count
from public.topics t
where t.kind = 'industry';

grant select on public.industry_modules to authenticated;
grant select on public.industry_modules to service_role;
