-- Brasil Force supplier prospecting CRM; migration is not applied automatically.
create table if not exists public.bf_supplier_prospects (
 id uuid primary key default gen_random_uuid(),
 company_name text not null check (char_length(company_name) between 2 and 180),
 category text not null check (char_length(category) between 2 and 100),
 website text,
 contact_email text,
 contact_name text,
 source_url text,
 notes text,
 stage text not null default 'identified' check (stage in ('identified','contact_pending','contacted','interested','consented','catalog_active','declined','cancelled','expired')),
 opt_out boolean not null default false,
 consent_at timestamptz,
 activated_at timestamptz,
 cancelled_at timestamptz,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint consent_before_activation check (activated_at is null or (consent_at is not null and consent_at <= activated_at)),
 constraint activation_only_active check (activated_at is null or stage in ('catalog_active','cancelled','expired'))
);
create index if not exists bf_supplier_prospects_stage_idx on public.bf_supplier_prospects(stage,created_at desc);
create table if not exists public.bf_supplier_events (
 id bigint generated always as identity primary key,
 supplier_id uuid not null references public.bf_supplier_prospects(id) on delete cascade,
 actor_id uuid not null references auth.users(id),
 event_type text not null check (event_type in ('created','stage_changed','note_added','contact_logged','consent_recorded','activated','cancelled','opted_out')),
 details text,
 created_at timestamptz not null default now()
);
create index if not exists bf_supplier_events_supplier_idx on public.bf_supplier_events(supplier_id,created_at desc);
alter table public.bf_supplier_prospects enable row level security;
alter table public.bf_supplier_events enable row level security;
revoke all on public.bf_supplier_prospects from anon, authenticated;
revoke all on public.bf_supplier_events from anon, authenticated;
grant select,insert,update on public.bf_supplier_prospects to authenticated;
grant select,insert on public.bf_supplier_events to authenticated;
grant usage,select on sequence public.bf_supplier_events_id_seq to authenticated;
create policy bf_supplier_admin_select on public.bf_supplier_prospects for select to authenticated
using (exists(select 1 from public.bf_accounts a where a.id=auth.uid() and a.role in ('admin','superadmin') and a.status='active') and (auth.jwt()->>'aal')='aal2');
create policy bf_supplier_admin_insert on public.bf_supplier_prospects for insert to authenticated
with check (created_by=auth.uid() and exists(select 1 from public.bf_accounts a where a.id=auth.uid() and a.role in ('admin','superadmin') and a.status='active') and (auth.jwt()->>'aal')='aal2');
create policy bf_supplier_admin_update on public.bf_supplier_prospects for update to authenticated
using (exists(select 1 from public.bf_accounts a where a.id=auth.uid() and a.role in ('admin','superadmin') and a.status='active') and (auth.jwt()->>'aal')='aal2')
with check (exists(select 1 from public.bf_accounts a where a.id=auth.uid() and a.role in ('admin','superadmin') and a.status='active') and (auth.jwt()->>'aal')='aal2');
create policy bf_supplier_events_admin_select on public.bf_supplier_events for select to authenticated
using (exists(select 1 from public.bf_accounts a where a.id=auth.uid() and a.role in ('admin','superadmin') and a.status='active') and (auth.jwt()->>'aal')='aal2');
create policy bf_supplier_events_admin_insert on public.bf_supplier_events for insert to authenticated
with check (actor_id=auth.uid() and exists(select 1 from public.bf_accounts a where a.id=auth.uid() and a.role in ('admin','superadmin') and a.status='active') and (auth.jwt()->>'aal')='aal2');
