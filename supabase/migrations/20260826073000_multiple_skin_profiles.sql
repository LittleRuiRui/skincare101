-- Allow each account to keep multiple named skin profiles and select one active profile.
alter table public.skin_profiles
  add column name text not null default '我的肤质档案'
    check (char_length(name) between 1 and 40),
  add column is_active boolean not null default false;

alter table public.skin_profiles
  drop constraint if exists skin_profiles_user_id_key;

update public.skin_profiles set is_active = true;

create unique index skin_profiles_one_active_per_user_idx
  on public.skin_profiles (user_id)
  where is_active;

create index skin_profiles_user_updated_idx
  on public.skin_profiles (user_id, updated_at desc);

