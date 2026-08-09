create or replace function public.reject_product_submission(p_submission_id uuid, p_reason text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'reviewer' then
    raise exception 'Reviewer access required';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'A clear rejection reason is required';
  end if;

  update public.product_submissions
  set status = 'rejected', reviewer_id = (select auth.uid()),
      rejection_reason = trim(p_reason), reviewed_at = now(), updated_at = now()
  where id = p_submission_id and status in ('pending', 'reviewing');

  if not found then raise exception 'Pending submission not found'; end if;

  insert into public.review_events (submission_id, reviewer_id, action, public_message)
  values (p_submission_id, (select auth.uid()), 'rejected', trim(p_reason));
end;
$$;

revoke all on function public.reject_product_submission(uuid, text) from public, anon;
grant execute on function public.reject_product_submission(uuid, text) to authenticated, service_role;
