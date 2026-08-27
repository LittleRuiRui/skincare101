alter table public.products
  add column if not exists brand_local_name text,
  add column if not exists brand_english_name text,
  add column if not exists product_local_name text,
  add column if not exists product_english_name text,
  add column if not exists source_locale text not null default 'en-SG';

alter table public.products
  add constraint products_source_locale_format_check
  check (source_locale ~ '^[a-z]{2}(-[A-Z]{2})?$') not valid;

drop view if exists public.approved_product_catalog_summary;
drop view if exists public.approved_product_catalog;

create view public.approved_product_catalog
with (security_invoker = true)
as
select p.id, p.brand, p.name,
  p.brand_local_name, p.brand_english_name,
  p.product_local_name, p.product_english_name, p.source_locale,
  p.category, p.market,
  coalesce(f.source_url, p.source_url) as source_url,
  p.catalog_origin, p.source_product_code, p.popularity_score, p.popularity_rank,
  p.popularity_basis, p.popularity_sources, p.popularity_tier,
  p.asia_availability_status,
  f.id as formula_id, f.ingredient_names, f.ingredient_list_type,
  f.data_completeness, f.verified_at, f.formula_dna,
  f.formula_analysis_version, f.formula_analyzed_at,
  f.source_last_modified_at, f.quality_flags
from public.products p
join public.product_formulas f on f.product_id = p.id and f.is_current
where p.archived_at is null;

create view public.approved_product_catalog_summary
with (security_invoker = true)
as
select p.id, p.brand, p.name,
  p.brand_local_name, p.brand_english_name,
  p.product_local_name, p.product_english_name, p.source_locale,
  p.category,
  coalesce(f.source_url, p.source_url) as source_url,
  f.ingredient_names[1:15] as ingredient_names,
  f.ingredient_list_type, f.data_completeness,
  p.popularity_sources, p.popularity_tier,
  p.asia_availability_status
from public.products p
join public.product_formulas f on f.product_id = p.id and f.is_current
where p.archived_at is null;

grant select on public.approved_product_catalog to anon, authenticated;
grant select on public.approved_product_catalog_summary to anon, authenticated;
