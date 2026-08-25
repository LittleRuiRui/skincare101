drop policy if exists product_sources_reviewer_insert on public.product_sources;
drop policy if exists product_sources_reviewer_update on public.product_sources;

create policy product_sources_reviewer_insert
  on public.product_sources for insert to authenticated
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');

create policy product_sources_reviewer_update
  on public.product_sources for update to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer')
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');
