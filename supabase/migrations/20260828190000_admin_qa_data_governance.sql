-- Production counterpart of the admin/data-governance migrations applied on 2026-08-28.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','reviewer')),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

alter table public.products add column if not exists canonical_key text;
alter table public.products add column if not exists data_status text not null default 'active';
alter table public.products add column if not exists canonical_product_id uuid references public.products(id) on delete set null;

create table if not exists public.brand_profiles (
  brand_key text primary key,
  brand_name text not null,
  brand_local_name text,
  country_region text,
  segment text,
  description_zh text,
  description_en text,
  known_for_zh text,
  known_for_en text,
  best_for_zh text,
  best_for_en text,
  price_tier text,
  source_url text,
  status text not null default 'pending' check(status in ('verified','review','pending')),
  updated_at timestamptz not null default now()
);
alter table public.brand_profiles enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.admin_users where user_id=auth.uid())
$$;

create or replace function public.normalize_product_canonical_key(p_brand text,p_brand_en text,p_name text,p_local text,p_en text,p_market text)
returns text language sql immutable as $$
 select lower(regexp_replace(coalesce(p_brand_en,p_brand,'')||'|'||coalesce(nullif(p_en,''),p_name,nullif(p_local,''),'')||'|'||coalesce(p_market,''),'[^a-zA-Z0-9一-龥]+','','g'))
$$;

create or replace function public.govern_product_write() returns trigger language plpgsql security definer set search_path=public as $$
declare v_existing uuid; v_brand_key text;
begin
 new.canonical_key:=public.normalize_product_canonical_key(new.brand,new.brand_english_name,new.name,new.product_local_name,new.product_english_name,new.market);
 if coalesce(new.source_url,'')='' or coalesce(new.category,'')='' then new.data_status:='review'; end if;
 select id into v_existing from public.products where archived_at is null and id<>new.id and canonical_key=new.canonical_key and coalesce(data_status,'active')<>'duplicate' order by updated_at desc limit 1;
 if v_existing is not null then new.data_status:='duplicate'; new.canonical_product_id:=v_existing; end if;
 v_brand_key:=lower(regexp_replace(coalesce(new.brand_english_name,new.brand),'[^a-zA-Z0-9一-龥]+','','g'));
 insert into public.brand_profiles(brand_key,brand_name,brand_local_name,status) values(v_brand_key,coalesce(new.brand_english_name,new.brand),new.brand_local_name,'pending') on conflict (brand_key) do update set brand_local_name=coalesce(public.brand_profiles.brand_local_name,excluded.brand_local_name),updated_at=now();
 return new;
end$$;

drop trigger if exists products_govern_write on public.products;
create trigger products_govern_write before insert or update of brand,brand_english_name,name,product_local_name,product_english_name,market,source_url,category on public.products for each row execute function public.govern_product_write();

create or replace view public.admin_duplicate_candidates with (security_invoker=true) as
with candidates as (
  select 'canonical:'||canonical_key as canonical_key,count(*)::bigint duplicate_count,array_agg(id order by updated_at desc) product_ids,array_agg(brand||' · '||name order by updated_at desc) labels
  from public.products where archived_at is null and canonical_key is not null and public.is_admin()
  group by canonical_key having count(*)>1
  union all
  select 'local:'||lower(regexp_replace(brand||'|'||product_local_name,'[^a-zA-Z0-9一-龥]+','','g')) as canonical_key,count(*)::bigint duplicate_count,array_agg(id order by updated_at desc) product_ids,array_agg(brand||' · '||coalesce(product_english_name,name) order by updated_at desc) labels
  from public.products where archived_at is null and nullif(product_local_name,'') is not null and public.is_admin()
  group by brand,product_local_name having count(*)>1
)
select * from candidates order by duplicate_count desc,canonical_key;

create or replace view public.admin_formula_version_conflicts with (security_invoker=true) as
select p.id product_id,p.brand,p.name,count(*) filter(where f.is_current) current_formula_count,count(distinct coalesce(f.market,'')) markets,count(*) formula_versions,array_agg(distinct coalesce(f.version_label,'unlabeled')) version_labels
from public.products p join public.product_formulas f on f.product_id=p.id
where public.is_admin()
group by p.id,p.brand,p.name
having count(*) filter(where f.is_current)>1 or count(distinct coalesce(f.market,''))>1 or count(*)>1;

create or replace view public.admin_product_write_gaps with (security_invoker=true) as
select id,brand,name,category,market,product_local_name,product_english_name,source_url,data_status,canonical_key,canonical_product_id
from public.products where public.is_admin() and archived_at is null and (data_status<>'active' or coalesce(source_url,'')='' or coalesce(category,'')='' or canonical_product_id is not null)
order by updated_at desc;
