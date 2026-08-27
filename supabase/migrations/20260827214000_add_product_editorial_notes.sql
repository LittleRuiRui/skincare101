create table if not exists public.product_editorial_notes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  formula_id uuid references public.product_formulas(id) on delete set null,
  market text not null default 'global',
  locale text not null default 'en-SG',
  marketing_positioning text,
  formula_reality text,
  recommendation_summary text,
  best_for text[] not null default '{}',
  not_ideal_for text[] not null default '{}',
  caveats text[] not null default '{}',
  evidence_level text not null default 'editorial' check (evidence_level in ('editorial','formula_supported','official_claim_supported')),
  source_url text,
  analysis_version text not null default 'editorial-v1',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, market, locale)
);

create index if not exists product_editorial_notes_product_id_idx on public.product_editorial_notes(product_id);
create index if not exists product_editorial_notes_formula_id_idx on public.product_editorial_notes(formula_id);

alter table public.product_editorial_notes enable row level security;

drop policy if exists "Public can read product editorial notes" on public.product_editorial_notes;
create policy "Public can read product editorial notes"
on public.product_editorial_notes for select
to anon, authenticated
using (true);

grant select on public.product_editorial_notes to anon, authenticated;
