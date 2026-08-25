alter table public.products
  add column if not exists catalog_origin text not null default 'manual',
  add column if not exists source_product_code text,
  add column if not exists popularity_score bigint,
  add column if not exists popularity_rank integer,
  add column if not exists popularity_basis text,
  add column if not exists popularity_sources text[] not null default '{}',
  add column if not exists popularity_tier text,
  add column if not exists asia_availability_status text not null default 'unverified';

alter table public.product_formulas
  add column if not exists source_last_modified_at timestamptz,
  add column if not exists quality_flags text[] not null default '{}';

create unique index if not exists products_source_product_code_active_idx
  on public.products(source_product_code)
  where source_product_code is not null and archived_at is null;

create index if not exists products_category_active_idx
  on public.products(category)
  where archived_at is null;

drop view if exists public.approved_product_catalog;
create view public.approved_product_catalog
with (security_invoker = true)
as
select p.id, p.brand, p.name, p.category, p.market,
  coalesce(f.source_url, p.source_url) as source_url,
  p.catalog_origin, p.source_product_code, p.popularity_score, p.popularity_rank,
  p.popularity_basis, p.popularity_sources, p.popularity_tier,
  p.asia_availability_status,
  f.id as formula_id, f.ingredient_names, f.ingredient_list_type,
  f.data_completeness, f.verified_at,
  f.formula_dna, f.formula_analysis_version, f.formula_analyzed_at,
  f.source_last_modified_at, f.quality_flags
from public.products p
join public.product_formulas f on f.product_id = p.id and f.is_current
where p.archived_at is null;

grant select on public.approved_product_catalog to anon, authenticated;
