-- 0001_init — Loop 00 Foundations. Idempotent. Applied with `npm run db:migrate`.
-- profiles (1:1 auth.users) + mentors, roles mirrored into the JWT as `user_role`, RLS.

create extension if not exists pgcrypto;

-- Enums -----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'profiles_role') then
    create type public.profiles_role as enum ('student', 'mentor', 'admin');
  end if;
end $$;

-- Tables ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role public.profiles_role not null default 'student',
  university text,
  year_of_study smallint check (year_of_study between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentors (
  id uuid primary key references public.profiles (id) on delete cascade,
  headline text,
  bio text,
  photo_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.mentors enable row level security;

-- updated_at trigger -----------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists mentors_set_updated_at on public.mentors;
create trigger mentors_set_updated_at before update on public.mentors
  for each row execute function public.set_updated_at();

-- Auto-create a profile for every new auth user ---------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers (read the JWT, never the table, so they are cheap inside policies) -----
-- The claim is `user_role`, NOT `role`: Supabase uses `role` for the Postgres role
-- (`authenticated`/`anon`) and overwriting it breaks every PostgREST request.
create or replace function public.current_role_claim() returns text
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'user_role', 'student')
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$ select public.current_role_claim() = 'admin' $$;

create or replace function public.is_mentor() returns boolean
language sql stable as $$ select public.current_role_claim() = 'mentor' $$;

create or replace function public.is_staff() returns boolean
language sql stable as $$ select public.current_role_claim() in ('admin', 'mentor') $$;

-- Custom access token hook: copies profiles.role into the JWT as `user_role`.
-- Must be enabled in Supabase → Authentication → Hooks (or via the Management API) —
-- see docs/PRIVATE_AREA.md. Requires the grants below for supabase_auth_admin.
create or replace function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  claims jsonb;
  user_role public.profiles_role;
begin
  select role into user_role from public.profiles where id = (event ->> 'user_id')::uuid;
  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(user_role::text, 'student')));
  return jsonb_set(event, '{claims}', claims);
end $$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on table public.profiles to supabase_auth_admin;

drop policy if exists "auth admin reads profiles for token hook" on public.profiles;
create policy "auth admin reads profiles for token hook" on public.profiles
  as permissive for select to supabase_auth_admin using (true);

-- RLS: profiles -----------------------------------------------------------------------
drop policy if exists "profiles: users read own" on public.profiles;
create policy "profiles: users read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "profiles: users update own" on public.profiles;
create policy "profiles: users update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())));

drop policy if exists "profiles: admin all" on public.profiles;
create policy "profiles: admin all" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- RLS: mentors ------------------------------------------------------------------------
drop policy if exists "mentors: public read when is_public" on public.mentors;
create policy "mentors: public read when is_public" on public.mentors
  for select to anon, authenticated using (is_public);

drop policy if exists "mentors: mentor reads/updates own" on public.mentors;
create policy "mentors: mentor reads/updates own" on public.mentors
  for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "mentors: admin all" on public.mentors;
create policy "mentors: admin all" on public.mentors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Grants (PostgREST roles) ------------------------------------------------------------
grant select, update on table public.profiles to authenticated;
grant select on table public.mentors to anon;
grant select, insert, update on table public.mentors to authenticated;

-- service_role (admin client, seeds, e2e) — default privileges did not cover these tables.
grant all on table public.profiles, public.mentors to service_role;
grant usage on type public.profiles_role to service_role, authenticated, anon;
