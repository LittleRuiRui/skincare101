alter table public.product_formulas
  add column if not exists formula_dna jsonb not null default '{}'::jsonb,
  add column if not exists formula_analysis_version text,
  add column if not exists formula_analyzed_at timestamptz;

alter table public.product_formulas
  add constraint product_formulas_formula_dna_object_check
  check (jsonb_typeof(formula_dna) = 'object');

create or replace view public.approved_product_catalog
with (security_invoker = true)
as
select p.id, p.brand, p.name, p.category, p.market,
  coalesce(f.source_url, p.source_url) as source_url,
  f.id as formula_id, f.ingredient_names, f.ingredient_list_type,
  f.data_completeness, f.verified_at,
  f.formula_dna, f.formula_analysis_version, f.formula_analyzed_at
from public.products p
join public.product_formulas f on f.product_id = p.id and f.is_current
where p.archived_at is null;

grant select on public.approved_product_catalog to anon, authenticated;
