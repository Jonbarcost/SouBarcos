begin;
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

-- Hardening the unapplied PR foundation: all CRM writes are atomic audited RPCs.
revoke insert,update on public.bf_supplier_prospects from authenticated;
revoke insert on public.bf_supplier_events from authenticated;
drop policy bf_supplier_admin_select on public.bf_supplier_prospects;
drop policy bf_supplier_events_admin_select on public.bf_supplier_events;
create policy bf_supplier_admin_read on public.bf_supplier_prospects for select to authenticated using(brasil_force_private.is_admin());
create policy bf_supplier_events_admin_read on public.bf_supplier_events for select to authenticated using(brasil_force_private.is_admin());
alter table public.bf_supplier_prospects add column consent_reference text;
alter table public.bf_supplier_prospects add column consent_scope text;
alter table public.bf_supplier_prospects add column revision integer not null default 0;
create table public.bf_zoho_states (
 state_hash text primary key check(state_hash ~ '^[a-f0-9]{64}$'),
 user_id uuid not null references auth.users(id),
 session_id text not null,
 expires_at timestamptz not null
);
create table public.bf_zoho_connection (
 id text primary key check(id='corporate'),
 ciphertext text not null check(ciphertext like 'v1.%' and length(ciphertext)<20000),
 region text not null check(region in ('us','eu','in','au')),
 account_id text not null check(account_id ~ '^[0-9]{1,30}$'),
 mailbox text not null check(mailbox='contato@brasilforce.com.br'),
 connected_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
create table public.bf_supplier_mail (
 id uuid primary key default gen_random_uuid(),supplier_id uuid not null references public.bf_supplier_prospects(id),
 recipient text not null,subject text not null check(length(subject) between 1 and 200 and subject !~ E'[\\r\\n]'),
 body text not null check(length(body) between 1 and 10000),
 status text not null default 'draft' check(status in ('draft','approved','sending','sent','uncertain','cancelled')),
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
 approved_by uuid references auth.users(id),approved_at timestamptz,
 claimed_by uuid references auth.users(id),claimed_at timestamptz,provider_message_id text
);
create index bf_supplier_mail_supplier on public.bf_supplier_mail(supplier_id,created_at desc);
alter table public.bf_zoho_states enable row level security;
alter table public.bf_zoho_connection enable row level security;
alter table public.bf_supplier_mail enable row level security;
revoke all on public.bf_zoho_states,public.bf_zoho_connection,public.bf_supplier_mail from anon,authenticated;
grant select on public.bf_zoho_connection,public.bf_supplier_mail to authenticated;
create policy bf_zoho_connection_read on public.bf_zoho_connection for select to authenticated using(brasil_force_private.is_admin());
create policy bf_supplier_mail_read on public.bf_supplier_mail for select to authenticated using(brasil_force_private.is_admin());

create function brasil_force_private.bf_zoho_nonce(p_hash text,p_consume boolean default false) returns boolean language plpgsql security definer set search_path='' as $$
declare used text;
begin
 if not brasil_force_private.is_admin() then raise exception 'Forbidden'; end if;
 if p_consume then
 delete from public.bf_zoho_states where state_hash=p_hash and user_id=auth.uid() and session_id=auth.jwt()->>'session_id' and expires_at>now() returning state_hash into used;
 return used is not null;
 end if;
 perform 1 from public.bf_accounts where id=auth.uid() for update;
 delete from public.bf_zoho_states where expires_at<now();
 if (select count(*) from public.bf_zoho_states where user_id=auth.uid())>=5 then raise exception 'Authorization rate limit';end if;
 insert into public.bf_zoho_states values(p_hash,auth.uid(),auth.jwt()->>'session_id',now()+interval '10 minutes');
 return true;
end $$;
create function public.bf_zoho_nonce(p_hash text,p_consume boolean default false) returns boolean language sql security invoker set search_path='' as $$ select brasil_force_private.bf_zoho_nonce(p_hash,p_consume) $$;
revoke all on function brasil_force_private.bf_zoho_nonce(text,boolean) from public,anon,authenticated;
grant execute on function brasil_force_private.bf_zoho_nonce(text,boolean) to authenticated;

create function brasil_force_private.bf_zoho_save(p_ciphertext text,p_region text,p_account text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not brasil_force_private.is_admin() then raise exception 'Forbidden';end if;
 insert into public.bf_zoho_connection(id,ciphertext,region,account_id,mailbox,connected_by) values('corporate',p_ciphertext,p_region,p_account,'contato@brasilforce.com.br',auth.uid())
 on conflict(id) do update set ciphertext=excluded.ciphertext,region=excluded.region,account_id=excluded.account_id,connected_by=auth.uid(),updated_at=now();
 insert into public.bf_audit_events(actor_id,entity,entity_id,action) values(auth.uid(),'zoho','corporate','credentials_saved');
end $$;
create function public.bf_zoho_save(p_ciphertext text,p_region text,p_account text) returns void language sql security invoker set search_path='' as $$ select brasil_force_private.bf_zoho_save(p_ciphertext,p_region,p_account) $$;
revoke all on function brasil_force_private.bf_zoho_save(text,text,text) from public,anon,authenticated;
grant execute on function brasil_force_private.bf_zoho_save(text,text,text) to authenticated;

create function brasil_force_private.bf_zoho_disconnect() returns void language plpgsql security definer set search_path='' as $$
begin
 if not brasil_force_private.is_admin() then raise exception 'Forbidden';end if;
 delete from public.bf_zoho_connection;
 delete from public.bf_zoho_states;
 update public.bf_supplier_mail set status='cancelled' where status in ('draft','approved');
 insert into public.bf_audit_events(actor_id,entity,entity_id,action) values(auth.uid(),'zoho','corporate','disconnected');
end $$;
create function public.bf_zoho_disconnect() returns void language sql security invoker set search_path='' as $$ select brasil_force_private.bf_zoho_disconnect() $$;
revoke all on function brasil_force_private.bf_zoho_disconnect() from public,anon,authenticated;
grant execute on function brasil_force_private.bf_zoho_disconnect() to authenticated;

create function brasil_force_private.bf_supplier_create(p_name text,p_category text,p_email text,p_website text,p_source text) returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if not brasil_force_private.is_admin() then raise exception 'Forbidden';end if;
 if p_email is not null and (length(p_email)>254 or p_email !~ '^[^[:space:]@,;]+@[^[:space:]@,;]+\.[^[:space:]@,;]+$') then raise exception 'Invalid email';end if;
 if (p_website is not null and (p_website !~ '^https://' or length(p_website)>1000)) or (p_source is not null and (p_source !~ '^https://' or length(p_source)>1000)) then raise exception 'Invalid URL';end if;
 insert into public.bf_supplier_prospects(company_name,category,contact_email,website,source_url,created_by) values(p_name,p_category,lower(p_email),p_website,p_source,auth.uid()) returning id into sid;
 insert into public.bf_supplier_events(supplier_id,actor_id,event_type) values(sid,auth.uid(),'created');return sid;
end $$;
create function public.bf_supplier_create(p_name text,p_category text,p_email text,p_website text,p_source text) returns uuid language sql security invoker set search_path='' as $$ select brasil_force_private.bf_supplier_create(p_name,p_category,p_email,p_website,p_source) $$;
revoke all on function brasil_force_private.bf_supplier_create(text,text,text,text,text) from public,anon,authenticated;
grant execute on function brasil_force_private.bf_supplier_create(text,text,text,text,text) to authenticated;

create function brasil_force_private.bf_supplier_change(p_id uuid,p_revision integer,p_action text,p_details text default '') returns void language plpgsql security definer set search_path='' as $$
declare s public.bf_supplier_prospects; event text;
begin
 if not brasil_force_private.is_admin() then raise exception 'Forbidden';end if;
 select * into s from public.bf_supplier_prospects where id=p_id for update;
 if not found or s.revision is distinct from p_revision then raise exception 'Stale supplier';end if;
 if length(p_details)>2000 then raise exception 'Details too long';end if;
 if p_action in ('cancelled','opted_out') then
 update public.bf_supplier_prospects set stage='cancelled',cancelled_at=now(),opt_out=(opt_out or p_action='opted_out') where id=p_id;
 update public.bf_supplier_mail set status='cancelled' where supplier_id=p_id and status in ('draft','approved');event:=p_action;
 elsif p_action='note_added' or p_action='contact_logged' then
 if coalesce(length(trim(p_details)),0)<3 then raise exception 'Details required';end if;event:=p_action;
 else
 if s.opt_out or s.cancelled_at is not null or s.stage in ('declined','expired') then raise exception 'Supplier blocked';end if;
 if p_action='consent_recorded' then
 if s.activated_at is not null or coalesce(length(trim(p_details)),0)<10 then raise exception 'Evidence and scope required';end if;
 update public.bf_supplier_prospects set consent_at=now(),consent_reference=p_details,consent_scope='Divulgação gratuita por 30 dias; sem renovação ou cobrança automática',stage='consented' where id=p_id;event:=p_action;
 elsif p_action='activated' then
 if s.stage<>'consented' or s.consent_at is null or s.activated_at is not null then raise exception 'Consent required';end if;
 update public.bf_supplier_prospects set activated_at=now(),stage='catalog_active' where id=p_id;event:=p_action;
 elsif p_action in ('identified','contact_pending','contacted','interested','declined') then
 if s.consent_at is not null or s.activated_at is not null then raise exception 'Use consent workflow';end if;
 update public.bf_supplier_prospects set stage=p_action where id=p_id;event:='stage_changed';
 else raise exception 'Invalid action';end if;
 end if;
 update public.bf_supplier_prospects set revision=revision+1,updated_at=now() where id=p_id;
 insert into public.bf_supplier_events(supplier_id,actor_id,event_type,details) values(p_id,auth.uid(),event,p_action||': '||p_details);
end $$;
create function public.bf_supplier_change(p_id uuid,p_revision integer,p_action text,p_details text default '') returns void language sql security invoker set search_path='' as $$ select brasil_force_private.bf_supplier_change(p_id,p_revision,p_action,p_details) $$;
revoke all on function brasil_force_private.bf_supplier_change(uuid,integer,text,text) from public,anon,authenticated;
grant execute on function brasil_force_private.bf_supplier_change(uuid,integer,text,text) to authenticated;

-- Read-through eligibility: expiry cannot depend on a cron task. This does NOT publish listings.
create view public.bf_supplier_eligibility with(security_invoker=true) as
 select id,activated_at+interval '720 hours' as trial_ends_at,
 (stage='catalog_active' and not opt_out and cancelled_at is null and consent_at<=activated_at and activated_at<=now() and activated_at+interval '720 hours'>now()) as promotion_eligible
 from public.bf_supplier_prospects;
grant select on public.bf_supplier_eligibility to authenticated;
create function brasil_force_private.bf_supplier_draft(p_supplier uuid,p_subject text,p_body text) returns uuid language plpgsql security definer set search_path='' as $$
declare s public.bf_supplier_prospects; mid uuid;
begin
 if not brasil_force_private.is_admin() then raise exception 'Forbidden';end if;
 select * into s from public.bf_supplier_prospects where id=p_supplier for update;
 if not found or s.contact_email is null or s.opt_out or s.stage in ('declined','cancelled','expired') then raise exception 'Contact blocked';end if;
 if exists(select 1 from public.bf_supplier_prospects where lower(contact_email)=lower(s.contact_email) and (opt_out or stage in ('declined','cancelled'))) then raise exception 'Address suppressed';end if;
 if (select count(*) from public.bf_supplier_mail where created_by=auth.uid() and created_at>now()-interval '1 day')>=50 then raise exception 'Draft limit';end if;
 insert into public.bf_supplier_mail(supplier_id,recipient,subject,body,created_by) values(p_supplier,s.contact_email,p_subject,p_body,auth.uid()) returning id into mid;
 insert into public.bf_supplier_events(supplier_id,actor_id,event_type,details) values(p_supplier,auth.uid(),'note_added','Rascunho criado: '||mid);return mid;
end $$;
create function public.bf_supplier_draft(p_supplier uuid,p_subject text,p_body text) returns uuid language sql security invoker set search_path='' as $$ select brasil_force_private.bf_supplier_draft(p_supplier,p_subject,p_body) $$;
revoke all on function brasil_force_private.bf_supplier_draft(uuid,text,text) from public,anon,authenticated;
grant execute on function brasil_force_private.bf_supplier_draft(uuid,text,text) to authenticated;

create function brasil_force_private.bf_supplier_mail_action(p_id uuid,p_action text) returns setof public.bf_supplier_mail language plpgsql security definer set search_path='' as $$
declare m public.bf_supplier_mail; s public.bf_supplier_prospects;
begin
 if not brasil_force_private.is_admin() then raise exception 'Forbidden';end if;
 -- Shared lock serializes send claims and daily quota checks.
 perform 1 from public.bf_zoho_connection where id='corporate' for update;
 select * into m from public.bf_supplier_mail where id=p_id for update;
 if not found then raise exception 'Draft missing';end if;
 select * into s from public.bf_supplier_prospects where id=m.supplier_id for update;
 if p_action='cancel' and m.status in ('draft','approved') then
 update public.bf_supplier_mail set status='cancelled' where id=p_id;
 else
 if s.opt_out or s.stage in ('declined','cancelled','expired') or s.contact_email is distinct from m.recipient or exists(select 1 from public.bf_supplier_prospects where lower(contact_email)=lower(m.recipient) and (opt_out or stage in ('declined','cancelled'))) then raise exception 'Contact blocked';end if;
 if p_action='approve' and m.status='draft' then
 update public.bf_supplier_mail set status='approved',approved_by=auth.uid(),approved_at=now() where id=p_id;
 elsif p_action='claim' and m.status='approved' and m.approved_at>now()-interval '24 hours' then
 if not exists(select 1 from public.bf_zoho_connection) then raise exception 'Mailbox disconnected';end if;
 if (select count(*) from public.bf_supplier_mail where claimed_at>now()-interval '1 day')>=20 then raise exception 'Daily send limit';end if;
 update public.bf_supplier_mail set status='sending',claimed_by=auth.uid(),claimed_at=now() where id=p_id;
 else raise exception 'Invalid mail transition';end if;
 end if;
 insert into public.bf_supplier_events(supplier_id,actor_id,event_type,details) values(m.supplier_id,auth.uid(),'contact_logged','E-mail '||p_id||': '||p_action);
 return query select * from public.bf_supplier_mail where id=p_id;
end $$;
create function public.bf_supplier_mail_action(p_id uuid,p_action text) returns setof public.bf_supplier_mail language sql security invoker set search_path='' as $$ select * from brasil_force_private.bf_supplier_mail_action(p_id,p_action) $$;
revoke all on function brasil_force_private.bf_supplier_mail_action(uuid,text) from public,anon,authenticated;
grant execute on function brasil_force_private.bf_supplier_mail_action(uuid,text) to authenticated;

create function brasil_force_private.bf_supplier_mail_finish(p_id uuid,p_message text default null) returns void language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if not brasil_force_private.is_admin() then raise exception 'Forbidden';end if;
 if p_message is not null and p_message !~ '^[0-9]{1,30}$' then raise exception 'Invalid provider ID';end if;
 update public.bf_supplier_mail set status=case when p_message is null then 'uncertain' else 'sent' end,provider_message_id=p_message where id=p_id and status='sending' and claimed_by=auth.uid() returning supplier_id into sid;
 if sid is null then raise exception 'Claim missing';end if;
 insert into public.bf_supplier_events(supplier_id,actor_id,event_type,details) values(sid,auth.uid(),'contact_logged',case when p_message is null then 'Envio incerto: conferir no Zoho antes de novo rascunho' else 'Envio aceito pelo Zoho' end);
end $$;
create function public.bf_supplier_mail_finish(p_id uuid,p_message text default null) returns void language sql security invoker set search_path='' as $$ select brasil_force_private.bf_supplier_mail_finish(p_id,p_message) $$;
revoke all on function brasil_force_private.bf_supplier_mail_finish(uuid,text) from public,anon,authenticated;
grant execute on function brasil_force_private.bf_supplier_mail_finish(uuid,text) to authenticated;

-- Every public RPC denies anonymous execution; underlying role and live session checked per call.
revoke all on function public.bf_zoho_nonce(text,boolean),public.bf_zoho_save(text,text,text),public.bf_zoho_disconnect(),public.bf_supplier_create(text,text,text,text,text),public.bf_supplier_change(uuid,integer,text,text),public.bf_supplier_draft(uuid,text,text),public.bf_supplier_mail_action(uuid,text),public.bf_supplier_mail_finish(uuid,text) from public,anon;
grant execute on function public.bf_zoho_nonce(text,boolean),public.bf_zoho_save(text,text,text),public.bf_zoho_disconnect(),public.bf_supplier_create(text,text,text,text,text),public.bf_supplier_change(uuid,integer,text,text),public.bf_supplier_draft(uuid,text,text),public.bf_supplier_mail_action(uuid,text),public.bf_supplier_mail_finish(uuid,text) to authenticated;
create table brasil_force_private.zoho_read_usage(user_id uuid primary key references auth.users(id),window_start timestamptz not null,counter integer not null);
alter table brasil_force_private.zoho_read_usage enable row level security;
revoke all on brasil_force_private.zoho_read_usage from public,anon,authenticated;
create function brasil_force_private.bf_zoho_read_quota() returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if not brasil_force_private.is_admin() then raise exception 'Forbidden';end if;
 insert into brasil_force_private.zoho_read_usage values(auth.uid(),date_trunc('hour',now()),1)
 on conflict(user_id) do update set counter=case when zoho_read_usage.window_start=date_trunc('hour',now()) then zoho_read_usage.counter+1 else 1 end,window_start=date_trunc('hour',now()) returning counter into n;
 return n<=60;
end $$;
create function public.bf_zoho_read_quota() returns boolean language sql security invoker set search_path='' as $$ select brasil_force_private.bf_zoho_read_quota() $$;
revoke all on function brasil_force_private.bf_zoho_read_quota() from public,anon,authenticated;
grant execute on function brasil_force_private.bf_zoho_read_quota() to authenticated;

revoke all on function public.bf_zoho_read_quota() from public,anon;
grant execute on function public.bf_zoho_read_quota() to authenticated;

commit;
