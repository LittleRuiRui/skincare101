alter table public.product_formulas
  add column if not exists version_label text,
  add column if not exists version_status text not null default 'current'
    check (version_status in ('current','previous','historical','unverified')),
  add column if not exists reformulated_from uuid references public.product_formulas(id) on delete set null;

create table if not exists public.product_data_reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  formula_id uuid references public.product_formulas(id) on delete set null,
  reporter_user_id uuid references auth.users(id) on delete set null,
  reporter_email text,
  report_type text not null check (report_type in ('wrong_ingredients','wrong_name','wrong_market','wrong_product','outdated_formula','broken_source','other')),
  message text,
  page_url text,
  status text not null default 'new' check (status in ('new','reviewing','resolved','rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists idx_product_data_reports_status_created on public.product_data_reports(status,created_at desc);
create index if not exists idx_product_data_reports_product on public.product_data_reports(product_id,created_at desc);
alter table public.product_data_reports enable row level security;
create policy "Anyone can submit product data reports" on public.product_data_reports for insert to anon, authenticated with check (reporter_user_id is null or reporter_user_id = auth.uid());
create policy "Users can view own product data reports" on public.product_data_reports for select to authenticated using (reporter_user_id = auth.uid());

create table if not exists public.admin_notification_queue (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','sent','failed','dismissed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  error_message text
);
create index if not exists idx_admin_notification_queue_pending on public.admin_notification_queue(status,created_at) where status='pending';
alter table public.admin_notification_queue enable row level security;

create or replace function public.queue_product_data_report_notification()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.admin_notification_queue(event_type,entity_type,entity_id,payload)
  values ('product_data_report_created','product_data_report',new.id,
    jsonb_build_object('product_id',new.product_id,'formula_id',new.formula_id,'report_type',new.report_type,'reporter_email',new.reporter_email,'message',new.message,'page_url',new.page_url));
  return new;
end;
$$;
create trigger trg_queue_product_data_report_notification
after insert on public.product_data_reports for each row execute function public.queue_product_data_report_notification();
