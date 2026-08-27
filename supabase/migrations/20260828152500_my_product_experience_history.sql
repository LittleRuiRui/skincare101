create or replace function public.load_my_product_experiences()
returns table (
  id uuid,
  product_key text,
  brand text,
  product_name text,
  skin_type text,
  sensitivity text,
  concerns text[],
  reaction text,
  texture text,
  repurchase text,
  note text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    pe.id,
    pe.product_key,
    coalesce(p.brand, 'Skincare101') as brand,
    coalesce(p.name, pe.product_key) as product_name,
    pe.skin_type,
    pe.sensitivity,
    pe.concerns,
    pe.reaction,
    pe.texture,
    pe.repurchase,
    pe.note,
    pe.created_at,
    pe.updated_at
  from public.product_experiences pe
  left join public.approved_product_catalog p
    on ('shared-' || p.id::text) = pe.product_key
  where pe.user_id = (select auth.uid())
  order by pe.updated_at desc;
$$;

revoke all on function public.load_my_product_experiences() from public;
grant execute on function public.load_my_product_experiences() to authenticated;

comment on function public.load_my_product_experiences() is
  'Returns only the signed-in user product feedback history, including product display names, for My Account.';
