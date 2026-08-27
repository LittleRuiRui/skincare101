create table if not exists public.product_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  product_key text not null check (char_length(product_key) between 1 and 160),
  skin_type text not null check (char_length(skin_type) between 1 and 80),
  sensitivity text not null check (char_length(sensitivity) between 1 and 80),
  concerns text[] not null default '{}',
  reaction text not null check (reaction in ('better', 'neutral', 'irritated')),
  texture text not null check (texture in ('love', 'okay', 'dislike')),
  repurchase text not null check (repurchase in ('yes', 'maybe', 'no')),
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_key)
);

alter table public.product_experiences enable row level security;

revoke all on table public.product_experiences from anon, authenticated;
grant select (id, product_key, skin_type, sensitivity, concerns, reaction, texture, repurchase, note, created_at, updated_at) on table public.product_experiences to anon, authenticated;
grant insert, update on table public.product_experiences to authenticated;

create policy "Public can read anonymous product experiences"
on public.product_experiences for select
to anon, authenticated
using (true);

create policy "Users can submit their own product experiences"
on public.product_experiences for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own product experiences"
on public.product_experiences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists product_experiences_product_updated_idx
on public.product_experiences (product_key, updated_at desc);
