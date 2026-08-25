-- Track formula provenance separately from the canonical product and formula.
-- Product sizes are variants, not distinct products; formula versions may be distinct.
create table public.product_sources (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  source_type text not null check (source_type in (
    'brand_official', 'authorized_retailer', 'retailer', 'open_data'
  )),
  source_name text not null check (char_length(trim(source_name)) between 1 and 120),
  region text not null default 'GLOBAL' check (char_length(region) <= 20),
  source_url text not null check (source_url ~ '^https://'),
  external_product_id text,
  formula_version text,
  is_primary boolean not null default false,
  formula_observed boolean not null default false,
  availability_observed boolean not null default false,
  last_checked_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, source_url)
);

create index product_sources_product_id_idx on public.product_sources(product_id);
create index product_sources_source_name_idx on public.product_sources(lower(source_name));

alter table public.product_sources enable row level security;

create policy product_sources_public_read
  on public.product_sources for select to anon, authenticated using (true);
create policy product_sources_reviewer_insert
  on public.product_sources for insert to authenticated
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');
create policy product_sources_reviewer_update
  on public.product_sources for update to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');

grant select on public.product_sources to anon, authenticated;

