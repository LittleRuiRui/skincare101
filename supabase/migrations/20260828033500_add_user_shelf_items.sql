create table if not exists public.user_shelf_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  periods text[] not null default '{}',
  opened_at date null,
  pao_months integer null check (pao_months is null or (pao_months between 1 and 60)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);
create index if not exists user_shelf_items_user_id_idx on public.user_shelf_items(user_id);
alter table public.user_shelf_items enable row level security;
revoke all on table public.user_shelf_items from anon, authenticated;
grant select, insert, update, delete on table public.user_shelf_items to authenticated;
drop policy if exists "Users can read own shelf" on public.user_shelf_items;
create policy "Users can read own shelf" on public.user_shelf_items for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can insert own shelf" on public.user_shelf_items;
create policy "Users can insert own shelf" on public.user_shelf_items for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update own shelf" on public.user_shelf_items;
create policy "Users can update own shelf" on public.user_shelf_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete own shelf" on public.user_shelf_items;
create policy "Users can delete own shelf" on public.user_shelf_items for delete to authenticated using ((select auth.uid()) = user_id);
