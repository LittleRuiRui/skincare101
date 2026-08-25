-- A signed-in user's latest questionnaire snapshot.
-- Answers are private by default and protected with owner-only RLS policies.

create table public.skin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  skin_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(skin_answers) = 'object'),
  profile_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(profile_answers) = 'object'),
  selected_symptoms text[] not null default '{}',
  symptom_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(symptom_answers) = 'object'),
  multi_select_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(multi_select_answers) = 'object'),
  red_flag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index skin_profiles_user_id_idx on public.skin_profiles(user_id);

alter table public.skin_profiles enable row level security;

create policy skin_profiles_owner_read
  on public.skin_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy skin_profiles_owner_insert
  on public.skin_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy skin_profiles_owner_update
  on public.skin_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy skin_profiles_owner_delete
  on public.skin_profiles for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.skin_profiles from anon, authenticated;
grant select, insert, update, delete on public.skin_profiles to authenticated;
grant all on public.skin_profiles to service_role;
