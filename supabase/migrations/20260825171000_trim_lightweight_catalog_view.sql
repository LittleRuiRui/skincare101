drop view if exists public.approved_product_catalog_summary;

create view public.approved_product_catalog_summary
with (security_invoker = true)
as
select p.id, p.brand, p.name, p.category,
  coalesce(f.source_url, p.source_url) as source_url,
  f.ingredient_names[1:15] as ingredient_names,
  f.ingredient_list_type, f.data_completeness,
  p.popularity_sources, p.popularity_tier,
  p.asia_availability_status
from public.products p
join public.product_formulas f on f.product_id = p.id and f.is_current
where p.archived_at is null;

grant select on public.approved_product_catalog_summary to anon, authenticated;
