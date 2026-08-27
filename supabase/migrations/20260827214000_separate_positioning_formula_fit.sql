-- Separate what a brand says, what the formula plausibly does, and user-specific fit.
-- Product-level interpretation is precomputed once; personal fit remains computed per user.

alter table public.products
  add column if not exists marketing_positioning text,
  add column if not exists intended_skin_types text[] not null default '{}'::text[],
  add column if not exists intended_concerns text[] not null default '{}'::text[],
  add column if not exists intended_use_context text[] not null default '{}'::text[];

alter table public.product_formulas
  add column if not exists formula_function_summary text,
  add column if not exists primary_formula_functions text[] not null default '{}'::text[],
  add column if not exists secondary_formula_functions text[] not null default '{}'::text[],
  add column if not exists formula_best_for text[] not null default '{}'::text[],
  add column if not exists formula_also_works_for text[] not null default '{}'::text[],
  add column if not exists formula_less_ideal_for text[] not null default '{}'::text[],
  add column if not exists formula_caveats text[] not null default '{}'::text[],
  add column if not exists formula_verdict text,
  add column if not exists interpretation_version text,
  add column if not exists interpreted_at timestamptz;

comment on column public.products.marketing_positioning is
  'Concise factual summary of the brand/product marketed target and intended use; not an ingredient efficacy judgment.';
comment on column public.product_formulas.formula_function_summary is
  'Evidence-bounded interpretation of what the verified formula plausibly does, independent of brand positioning.';
comment on column public.product_formulas.formula_verdict is
  'Short reusable editorial verdict precomputed from verified formula evidence; not personalized to a user.';

create or replace view public.approved_product_catalog
with (security_invoker = true)
as
select p.id, p.brand, p.name, p.category, p.market,
  p.brand_local_name, p.brand_english_name, p.product_local_name, p.product_english_name, p.source_locale,
  p.marketing_positioning, p.intended_skin_types, p.intended_concerns, p.intended_use_context,
  coalesce(f.source_url, p.source_url) as source_url,
  f.id as formula_id, f.ingredient_names, f.ingredient_list_type,
  f.data_completeness, f.verified_at,
  f.formula_dna, f.formula_analysis_version, f.formula_analyzed_at,
  f.formula_function_summary, f.primary_formula_functions, f.secondary_formula_functions,
  f.formula_best_for, f.formula_also_works_for, f.formula_less_ideal_for,
  f.formula_caveats, f.formula_verdict, f.interpretation_version, f.interpreted_at
from public.products p
join public.product_formulas f on f.product_id = p.id and f.is_current
where p.archived_at is null;

drop view if exists public.approved_product_catalog_summary;
create view public.approved_product_catalog_summary
with (security_invoker = true)
as
select p.id, p.brand, p.name, p.category,
  p.brand_local_name, p.brand_english_name, p.product_local_name, p.product_english_name, p.source_locale,
  p.marketing_positioning, p.intended_skin_types, p.intended_concerns, p.intended_use_context,
  coalesce(f.source_url, p.source_url) as source_url,
  f.ingredient_names[1:15] as ingredient_names,
  f.ingredient_list_type, f.data_completeness,
  f.formula_function_summary, f.formula_best_for, f.formula_also_works_for,
  f.formula_less_ideal_for, f.formula_caveats, f.formula_verdict,
  p.popularity_sources, p.popularity_tier,
  p.asia_availability_status
from public.products p
join public.product_formulas f on f.product_id = p.id and f.is_current
where p.archived_at is null;

grant select on public.approved_product_catalog to anon, authenticated;
grant select on public.approved_product_catalog_summary to anon, authenticated;
