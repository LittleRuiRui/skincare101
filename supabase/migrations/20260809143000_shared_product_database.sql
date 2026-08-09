-- Shared skincare product database, submission workflow, and private image storage.
-- Designed for Supabase Postgres 17 with explicit Data API grants and RLS.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (char_length(trim(brand)) between 1 and 120),
  name text not null check (char_length(trim(name)) between 1 and 180),
  category text not null default '其他' check (char_length(category) <= 80),
  market text not null default 'global' check (char_length(market) <= 40),
  source_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index products_identity_active_idx
  on public.products (lower(brand), lower(name), market)
  where archived_at is null;

create table public.product_formulas (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  market text not null default 'global' check (char_length(market) <= 40),
  raw_ingredients text not null,
  ingredient_names text[] not null default '{}',
  ingredient_list_type text not null default 'partial'
    check (ingredient_list_type in ('full', 'partial')),
  data_completeness smallint not null default 0
    check (data_completeness between 0 and 100),
  source_url text,
  verified_at date,
  is_current boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_formulas_product_id_idx on public.product_formulas(product_id);
create unique index product_formulas_current_idx
  on public.product_formulas(product_id, market)
  where is_current;

create table public.ingredients (
  id bigint generated always as identity primary key,
  inci_name text not null check (char_length(trim(inci_name)) between 1 and 240),
  normalized_name text not null unique,
  aliases text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.formula_ingredients (
  formula_id uuid not null references public.product_formulas(id) on delete cascade,
  position smallint not null check (position > 0),
  ingredient_id bigint not null references public.ingredients(id) on delete restrict,
  raw_name text not null,
  primary key (formula_id, position)
);

create index formula_ingredients_ingredient_id_idx
  on public.formula_ingredients(ingredient_id);

create table public.product_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  brand text not null check (char_length(trim(brand)) between 1 and 120),
  product_name text not null check (char_length(trim(product_name)) between 1 and 180),
  category text not null default '其他' check (char_length(category) <= 80),
  market text not null default 'global' check (char_length(market) <= 40),
  raw_ingredients text not null default '',
  parsed_ingredients jsonb not null default '[]'::jsonb check (jsonb_typeof(parsed_ingredients) = 'array'),
  unknown_ingredients jsonb not null default '[]'::jsonb check (jsonb_typeof(unknown_ingredients) = 'array'),
  data_completeness smallint not null default 0 check (data_completeness between 0 and 100),
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'reviewing', 'approved', 'rejected')),
  reviewer_id uuid references auth.users(id) on delete set null,
  rejection_reason text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_submissions_user_id_idx on public.product_submissions(user_id);
create index product_submissions_reviewer_id_idx on public.product_submissions(reviewer_id);
create index product_submissions_pending_idx on public.product_submissions(created_at)
  where status in ('pending', 'reviewing');

create table public.submission_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.product_submissions(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('front', 'ingredients', 'other')),
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index submission_images_submission_id_idx on public.submission_images(submission_id);
create index submission_images_user_id_idx on public.submission_images(user_id);

create table public.review_events (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.product_submissions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('reviewing', 'approved', 'rejected', 'returned')),
  public_message text,
  internal_notes text,
  created_at timestamptz not null default now()
);

create index review_events_submission_id_idx on public.review_events(submission_id);
create index review_events_reviewer_id_idx on public.review_events(reviewer_id);

create or replace view public.approved_product_catalog
with (security_invoker = true)
as
select p.id, p.brand, p.name, p.category, p.market,
  coalesce(f.source_url, p.source_url) as source_url,
  f.id as formula_id, f.ingredient_names, f.ingredient_list_type,
  f.data_completeness, f.verified_at
from public.products p
join public.product_formulas f on f.product_id = p.id and f.is_current
where p.archived_at is null;

alter table public.products enable row level security;
alter table public.product_formulas enable row level security;
alter table public.ingredients enable row level security;
alter table public.formula_ingredients enable row level security;
alter table public.product_submissions enable row level security;
alter table public.submission_images enable row level security;
alter table public.review_events enable row level security;

create policy products_public_read on public.products for select to anon, authenticated
  using (archived_at is null);
create policy products_reviewer_insert on public.products for insert to authenticated
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');
create policy products_reviewer_update on public.products for update to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');

create policy product_formulas_public_read on public.product_formulas for select to anon, authenticated
  using (is_current);
create policy product_formulas_reviewer_insert on public.product_formulas for insert to authenticated
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');
create policy product_formulas_reviewer_update on public.product_formulas for update to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');

create policy ingredients_public_read on public.ingredients for select to anon, authenticated using (true);
create policy ingredients_reviewer_insert on public.ingredients for insert to authenticated
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');
create policy ingredients_reviewer_update on public.ingredients for update to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');

create policy formula_ingredients_public_read on public.formula_ingredients for select to anon, authenticated using (true);
create policy formula_ingredients_reviewer_insert on public.formula_ingredients for insert to authenticated
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');
create policy formula_ingredients_reviewer_update on public.formula_ingredients for update to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');

create policy submissions_owner_read on public.product_submissions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy submissions_reviewer_read on public.product_submissions for select to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');
create policy submissions_owner_insert on public.product_submissions for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'draft');
create policy submissions_owner_update_draft on public.product_submissions for update to authenticated
  using ((select auth.uid()) = user_id and status = 'draft')
  with check ((select auth.uid()) = user_id and status in ('draft', 'pending')
    and reviewer_id is null and rejection_reason is null);
create policy submissions_reviewer_update on public.product_submissions for update to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer')
  with check (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');

create policy submission_images_owner_read on public.submission_images for select to authenticated
  using ((select auth.uid()) = user_id);
create policy submission_images_reviewer_read on public.submission_images for select to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');
create policy submission_images_owner_insert on public.submission_images for insert to authenticated
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.product_submissions s
    where s.id = submission_id and s.user_id = (select auth.uid()) and s.status = 'draft'));
create policy submission_images_owner_delete on public.submission_images for delete to authenticated
  using ((select auth.uid()) = user_id and exists (
    select 1 from public.product_submissions s
    where s.id = submission_id and s.user_id = (select auth.uid()) and s.status = 'draft'));

create policy review_events_reviewer_read on public.review_events for select to authenticated
  using (coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');
create policy review_events_reviewer_insert on public.review_events for insert to authenticated
  with check ((select auth.uid()) = reviewer_id
    and coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-submissions', 'product-submissions', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy product_submission_files_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'product-submissions' and owner_id = (select auth.uid()::text));
create policy product_submission_files_reviewer_read on storage.objects for select to authenticated
  using (bucket_id = 'product-submissions'
    and coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'reviewer');
create policy product_submission_files_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-submissions'
    and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy product_submission_files_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'product-submissions' and owner_id = (select auth.uid()::text))
  with check (bucket_id = 'product-submissions' and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy product_submission_files_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-submissions' and owner_id = (select auth.uid()::text));

create or replace function public.approve_product_submission(p_submission_id uuid, p_source_url text default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_submission public.product_submissions%rowtype;
  v_product_id uuid;
  v_formula_id uuid;
  v_ingredient_names text[];
  v_name text;
  v_ingredient_id bigint;
  v_position smallint := 0;
begin
  if coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'reviewer' then
    raise exception 'Reviewer access required';
  end if;

  select * into v_submission from public.product_submissions
  where id = p_submission_id and status in ('pending', 'reviewing') for update;
  if not found then raise exception 'Pending submission not found'; end if;

  select array_agg(value order by ordinality) into v_ingredient_names
  from jsonb_array_elements_text(v_submission.parsed_ingredients) with ordinality;
  if coalesce(array_length(v_ingredient_names, 1), 0) = 0 then
    raise exception 'Submission has no normalized ingredients';
  end if;

  select id into v_product_id from public.products
  where lower(brand) = lower(v_submission.brand)
    and lower(name) = lower(v_submission.product_name)
    and market = v_submission.market and archived_at is null limit 1;

  if v_product_id is null then
    insert into public.products (brand, name, category, market, source_url, created_by)
    values (trim(v_submission.brand), trim(v_submission.product_name), v_submission.category,
      v_submission.market, p_source_url, (select auth.uid())) returning id into v_product_id;
  else
    update public.products set category = v_submission.category,
      source_url = coalesce(p_source_url, source_url), updated_at = now()
    where id = v_product_id;
  end if;

  update public.product_formulas set is_current = false, updated_at = now()
  where product_id = v_product_id and market = v_submission.market and is_current;

  insert into public.product_formulas (
    product_id, market, raw_ingredients, ingredient_names, ingredient_list_type,
    data_completeness, source_url, verified_at, created_by
  ) values (
    v_product_id, v_submission.market, v_submission.raw_ingredients, v_ingredient_names,
    case when v_submission.data_completeness >= 85 then 'full' else 'partial' end,
    v_submission.data_completeness, p_source_url, current_date, (select auth.uid())
  ) returning id into v_formula_id;

  for v_name in select value from jsonb_array_elements_text(v_submission.parsed_ingredients)
  loop
    v_position := v_position + 1;
    insert into public.ingredients (inci_name, normalized_name)
    values (v_name, lower(regexp_replace(v_name, '[^[:alnum:]]+', '', 'g')))
    on conflict (normalized_name) do update set updated_at = now()
    returning id into v_ingredient_id;
    insert into public.formula_ingredients (formula_id, position, ingredient_id, raw_name)
    values (v_formula_id, v_position, v_ingredient_id, v_name);
  end loop;

  update public.product_submissions set status = 'approved', reviewer_id = (select auth.uid()),
    reviewed_at = now(), updated_at = now() where id = p_submission_id;
  insert into public.review_events (submission_id, reviewer_id, action, public_message)
  values (p_submission_id, (select auth.uid()), 'approved', '投稿已审核并加入共享产品数据库。');
  return v_product_id;
end;
$$;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.products, public.product_formulas, public.ingredients,
  public.formula_ingredients, public.approved_product_catalog to anon, authenticated;
grant select, insert, update on public.product_submissions to authenticated;
grant select, insert, delete on public.submission_images to authenticated;
grant select, insert on public.review_events to authenticated;
grant insert, update on public.products, public.product_formulas,
  public.ingredients, public.formula_ingredients to authenticated;
grant usage, select on sequence public.ingredients_id_seq, public.review_events_id_seq to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke all on function public.approve_product_submission(uuid, text) from public, anon;
grant execute on function public.approve_product_submission(uuid, text) to authenticated, service_role;
