create index products_created_by_idx on public.products(created_by);
create index product_formulas_created_by_idx on public.product_formulas(created_by);

drop policy products_reviewer_insert on public.products;
drop policy products_reviewer_update on public.products;
create policy products_reviewer_insert on public.products for insert to authenticated
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');
create policy products_reviewer_update on public.products for update to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer')
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');

drop policy product_formulas_reviewer_insert on public.product_formulas;
drop policy product_formulas_reviewer_update on public.product_formulas;
create policy product_formulas_reviewer_insert on public.product_formulas for insert to authenticated
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');
create policy product_formulas_reviewer_update on public.product_formulas for update to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer')
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');

drop policy ingredients_reviewer_insert on public.ingredients;
drop policy ingredients_reviewer_update on public.ingredients;
create policy ingredients_reviewer_insert on public.ingredients for insert to authenticated
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');
create policy ingredients_reviewer_update on public.ingredients for update to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer')
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');

drop policy formula_ingredients_reviewer_insert on public.formula_ingredients;
drop policy formula_ingredients_reviewer_update on public.formula_ingredients;
create policy formula_ingredients_reviewer_insert on public.formula_ingredients for insert to authenticated
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');
create policy formula_ingredients_reviewer_update on public.formula_ingredients for update to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer')
  with check (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');

drop policy submissions_owner_read on public.product_submissions;
drop policy submissions_reviewer_read on public.product_submissions;
create policy submissions_owner_or_reviewer_read on public.product_submissions for select to authenticated
  using (
    (select auth.uid()) = user_id
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer'
  );

drop policy submissions_owner_update_draft on public.product_submissions;
drop policy submissions_reviewer_update on public.product_submissions;
create policy submissions_owner_or_reviewer_update on public.product_submissions for update to authenticated
  using (
    ((select auth.uid()) = user_id and status = 'draft')
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer'
  )
  with check (
    (
      (select auth.uid()) = user_id and status in ('draft', 'pending')
      and reviewer_id is null and rejection_reason is null
    )
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer'
  );

drop policy submission_images_owner_read on public.submission_images;
drop policy submission_images_reviewer_read on public.submission_images;
create policy submission_images_owner_or_reviewer_read on public.submission_images for select to authenticated
  using (
    (select auth.uid()) = user_id
    or coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer'
  );

drop policy review_events_reviewer_read on public.review_events;
drop policy review_events_reviewer_insert on public.review_events;
create policy review_events_reviewer_read on public.review_events for select to authenticated
  using (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer');
create policy review_events_reviewer_insert on public.review_events for insert to authenticated
  with check (
    (select auth.uid()) = reviewer_id
    and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer'
  );

drop policy product_submission_files_reviewer_read on storage.objects;
create policy product_submission_files_reviewer_read on storage.objects for select to authenticated
  using (
    bucket_id = 'product-submissions'
    and coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'reviewer'
  );
