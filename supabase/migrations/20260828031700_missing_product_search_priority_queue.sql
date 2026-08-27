alter table public.search_events
  add column if not exists visitor_id uuid;

create index if not exists search_events_zero_results_idx
  on public.search_events (created_at desc, normalized_query)
  where result_count = 0 and selected_product_id is null;

create index if not exists search_events_visitor_idx
  on public.search_events (visitor_id, created_at desc)
  where visitor_id is not null;

create or replace view public.missing_product_searches
with (security_invoker = true)
as
with zeroes as (
  select id, query, normalized_query, visitor_id, locale, source, created_at
  from public.search_events
  where result_count = 0
    and selected_product_id is null
    and created_at >= now() - interval '30 days'
), agg as (
  select
    normalized_query,
    count(*) filter (where created_at >= now() - interval '24 hours')::int as searches_24h,
    count(*) filter (where created_at >= now() - interval '7 days')::int as searches_7d,
    count(*)::int as searches_30d,
    count(distinct visitor_id) filter (where visitor_id is not null and created_at >= now() - interval '7 days')::int as visitors_7d,
    count(distinct visitor_id) filter (where visitor_id is not null)::int as visitors_30d,
    max(created_at) as last_searched_at
  from zeroes
  group by normalized_query
), latest as (
  select distinct on (normalized_query)
    normalized_query,
    query as latest_query,
    locale,
    source
  from zeroes
  order by normalized_query, created_at desc
)
select
  a.normalized_query,
  l.latest_query,
  a.searches_24h,
  a.searches_7d,
  a.searches_30d,
  a.visitors_7d,
  a.visitors_30d,
  a.last_searched_at,
  l.locale,
  l.source,
  round((a.searches_7d * 3 + a.searches_30d + a.visitors_7d * 5)::numeric, 0) as priority_score
from agg a
join latest l using (normalized_query)
order by priority_score desc, a.last_searched_at desc;

revoke all on public.missing_product_searches from anon, authenticated;

create or replace function public.queue_missing_product_search_alerts(
  p_min_searches_7d integer default 3,
  p_min_visitors_7d integer default 2,
  p_repeat_after interval default interval '7 days'
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  r record;
  queued_count integer := 0;
begin
  for r in
    select *
    from public.missing_product_searches
    where searches_7d >= p_min_searches_7d
      and (visitors_7d >= p_min_visitors_7d or searches_7d >= greatest(p_min_searches_7d + 2, 5))
  loop
    if not exists (
      select 1
      from public.admin_notification_queue q
      where q.event_type = 'missing_product_search'
        and q.payload->>'normalized_query' = r.normalized_query
        and q.created_at >= now() - p_repeat_after
        and q.status in ('pending','sent')
    ) then
      insert into public.admin_notification_queue(event_type, entity_type, payload)
      values (
        'missing_product_search',
        'search_query',
        jsonb_build_object(
          'normalized_query', r.normalized_query,
          'query', r.latest_query,
          'searches_24h', r.searches_24h,
          'searches_7d', r.searches_7d,
          'searches_30d', r.searches_30d,
          'visitors_7d', r.visitors_7d,
          'visitors_30d', r.visitors_30d,
          'priority_score', r.priority_score,
          'last_searched_at', r.last_searched_at,
          'locale', r.locale,
          'source', r.source
        )
      );
      queued_count := queued_count + 1;
    end if;
  end loop;
  return queued_count;
end;
$$;

revoke all on function public.queue_missing_product_search_alerts(integer,integer,interval) from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid)
from cron.job
where jobname = 'queue-missing-product-search-alerts';

select cron.schedule(
  'queue-missing-product-search-alerts',
  '17 * * * *',
  $$select public.queue_missing_product_search_alerts();$$
);
