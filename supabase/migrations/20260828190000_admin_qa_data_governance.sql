-- Admin console + catalog governance. Mirrors the production rules applied on 2026-08-28.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','reviewer')),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users" on public.admin_users for select to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

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
drop policy if exists "brand profiles public read" on public.brand_profiles;
create policy "brand profiles public read" on public.brand_profiles for select using (true);
drop policy if exists "admins manage brand profiles" on public.brand_profiles;
create policy "admins manage brand profiles" on public.brand_profiles for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));

create or replace function public.is_admin() returns boolean language sql stable security invoker set search_path=public as $$
 select exists(select 1 from public.admin_users where user_id=auth.uid())
$$;
revoke all on function public.is_admin() from public,anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.normalize_product_canonical_key(p_brand text,p_brand_en text,p_name text,p_local text,p_en text,p_market text)
returns text language sql immutable set search_path=public as $$
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
revoke all on function public.govern_product_write() from public,anon,authenticated;
drop trigger if exists products_govern_write on public.products;
create trigger products_govern_write before insert or update of brand,brand_english_name,name,product_local_name,product_english_name,market,source_url,category on public.products for each row execute function public.govern_product_write();

insert into public.brand_profiles(brand_key,brand_name,brand_local_name,status)
select distinct lower(regexp_replace(coalesce(brand_english_name,brand),'[^a-zA-Z0-9一-龥]+','','g')),coalesce(brand_english_name,brand),brand_local_name,'pending'
from public.products where archived_at is null
on conflict (brand_key) do nothing;

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

create or replace view public.admin_brand_gaps with (security_invoker=true) as
select bp.*, (select count(*) from public.products p where lower(regexp_replace(coalesce(p.brand_english_name,p.brand),'[^a-zA-Z0-9一-龥]+','','g'))=bp.brand_key and p.archived_at is null) product_count
from public.brand_profiles bp
where public.is_admin() and (bp.status<>'verified' or bp.country_region is null or bp.segment is null or (bp.description_zh is null and bp.description_en is null))
order by product_count desc,brand_name;

create or replace view public.admin_qa_summary with (security_invoker=true) as
select
 (select count(*) from public.products where archived_at is null) total_products,
 (select count(*) from public.brand_profiles) total_brands,
 (select count(*) from public.brand_profiles where status<>'verified') brands_needing_profile,
 (select count(*) from public.products where archived_at is null and coalesce(product_english_name,'')='') missing_english_name,
 (select count(*) from public.products where archived_at is null and coalesce(product_local_name,'')='') missing_local_name,
 (select count(*) from public.products where archived_at is null and coalesce(source_url,'')='') missing_source,
 (select count(*) from public.admin_duplicate_candidates) duplicate_groups,
 (select count(*) from public.product_data_reports where coalesce(status,'open') not in ('resolved','closed')) open_reports,
 (select count(*) from public.missing_product_searches) missing_searches,
 (select count(*) from public.product_experiences) user_experiences
where public.is_admin();

grant select on public.admin_duplicate_candidates,public.admin_formula_version_conflicts,public.admin_product_write_gaps,public.admin_brand_gaps,public.admin_qa_summary to authenticated;

drop policy if exists "admins read all data reports" on public.product_data_reports;
create policy "admins read all data reports" on public.product_data_reports for select to authenticated using (public.is_admin());
drop policy if exists "admins update data reports" on public.product_data_reports;
create policy "admins update data reports" on public.product_data_reports for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins read all experiences" on public.product_experiences;
create policy "admins read all experiences" on public.product_experiences for select to authenticated using (public.is_admin());
