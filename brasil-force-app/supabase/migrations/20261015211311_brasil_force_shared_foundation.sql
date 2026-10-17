begin;
create schema brasil_force_private;
revoke all on schema brasil_force_private from public;
grant usage on schema brasil_force_private to anon, authenticated;
create type public.bf_account_role as enum ('buyer','seller','store','moderator','admin','superadmin');
create type public.bf_account_status as enum ('active','suspended');
create type public.bf_listing_status as enum ('draft','pending','in_review','changes_requested','approved','rejected','paused','sold','removed');
create type public.bf_product_classification as enum ('free','additional_review','controlled','prohibited');
create table public.bf_accounts (
 id uuid primary key references auth.users(id) on delete cascade,
 accepted_terms_version text not null check(accepted_terms_version='2026-10-15'),
 role public.bf_account_role not null default 'buyer',
 status public.bf_account_status not null default 'active',
 created_at timestamptz not null default now()
);
create table public.bf_profiles (
 id uuid primary key references public.bf_accounts(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 80),
 institution text check (institution in ('Exército Brasileiro','Marinha do Brasil','Força Aérea Brasileira','Polícia Militar','Polícia Civil','Polícia Federal','Polícia Rodoviária Federal','Corpo de Bombeiros Militar','Guarda Municipal','Veterano ou reserva','Colecionador','Entusiasta ou civil','Outras instituições')),
 updated_at timestamptz not null default now()
);
create table public.bf_institution_verifications (
 user_id uuid primary key references public.bf_accounts(id) on delete cascade,
 institution text not null,
 verified_at timestamptz not null,
 verified_by uuid not null references public.bf_accounts(id)
);
-- No CPF/CNPJ or address is put in profiles. Collect only after KYC and retention design is approved.
create table public.bf_seller_applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references public.bf_accounts(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 100),
 person_type text not null check(person_type in ('individual','company')),
 status text not null default 'pending' check(status in ('pending','in_review','changes_requested','approved','rejected')),
 policy_version text not null check(policy_version = '2026-10-15'),
 created_at timestamptz not null default now()
);
create table public.bf_categories (
 slug text primary key,
 name text not null,
 active boolean not null default true
);
insert into public.bf_categories(slug,name) values ('vestuario','Vestuário'),('campo','Equipamentos de campo'),('acessorios','Acessórios'),('colecionismo','Colecionismo'),('outdoor','Outdoor e aventura'),('servicos','Serviços');
create table public.bf_listings (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.bf_accounts(id),
 category_slug text not null references public.bf_categories(slug),
 title text not null check(char_length(title) between 5 and 160),
 description text not null check(char_length(description) between 20 and 10000),
 condition text not null check(condition in ('new','like_new','used')),
 price_cents bigint not null check(price_cents > 0 and price_cents <= 100000000),
 stock integer not null default 0 check(stock >= 0),
 status public.bf_listing_status not null default 'draft',
 classification public.bf_product_classification not null default 'additional_review',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint only_free_approved check (status <> 'approved' or classification='free')
);
create index bf_listings_catalog_idx on public.bf_listings(category_slug,created_at desc) where status='approved' and classification='free';
create index bf_listings_seller_idx on public.bf_listings(seller_id);
create index bf_seller_applications_queue_idx on public.bf_seller_applications(status,created_at);
create table public.bf_audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid,
 entity text not null,
 entity_id text not null,
 action text not null,
 created_at timestamptz not null default now()
);
-- Definer helpers are intentionally in a NON-exposed schema, fixed search_path, no mutable JWT role claims.
create function brasil_force_private.active_session() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null
 and exists(select 1 from public.bf_accounts a where a.id=auth.uid() and a.status='active')
 and exists(select 1 from auth.sessions s where s.user_id=auth.uid() and s.id::text=auth.jwt()->>'session_id');
$$;
create function brasil_force_private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select brasil_force_private.active_session() and coalesce(auth.jwt()->>'aal','aal1')='aal2'
 and exists(select 1 from public.bf_accounts a where a.id=auth.uid() and a.role in ('moderator','admin','superadmin'));
$$;
create function brasil_force_private.seller_active(seller uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.bf_accounts where id=seller and role in ('seller','store') and status='active');
$$;
create function brasil_force_private.record_audit() returns trigger language plpgsql security definer set search_path='' as $$
 declare row_id text;
 begin
 if TG_OP='DELETE' then row_id=old.id::text; else row_id=new.id::text; end if;
 insert into public.bf_audit_events(actor_id,entity,entity_id,action) values(auth.uid(),TG_TABLE_NAME,row_id,TG_OP);
 if TG_OP='DELETE' then return old; end if; return new;
 end;
$$;
create function brasil_force_private.mark_profile_changed() returns trigger language plpgsql set search_path='' as $$
 begin new.updated_at=now();return new;end;
$$;
create trigger profile_changed before update on public.bf_profiles for each row execute function brasil_force_private.mark_profile_changed();
create function brasil_force_private.requeue_listing() returns trigger language plpgsql set search_path='' as $$
 begin
 if old.status='approved' and (new.title,new.description,new.category_slug,new.condition,new.price_cents,new.classification) is distinct from (old.title,old.description,old.category_slug,old.condition,old.price_cents,old.classification) then new.status='pending'; end if;
 new.updated_at=now();return new;
 end;
$$;
create trigger listing_changed before update on public.bf_listings for each row execute function brasil_force_private.requeue_listing();
create trigger audit_account after insert or update or delete on public.bf_accounts for each row execute function brasil_force_private.record_audit();
create trigger audit_application after insert or update or delete on public.bf_seller_applications for each row execute function brasil_force_private.record_audit();
create trigger audit_listing after insert or update or delete on public.bf_listings for each row execute function brasil_force_private.record_audit();

create function brasil_force_private.join_marketplace(display_name text, terms_version text) returns void
language plpgsql security definer set search_path='' as $$
declare member_id uuid := auth.uid();
begin
 if member_id is null or not exists(select 1 from auth.sessions where user_id=member_id and id::text=auth.jwt()->>'session_id')
 or not exists(select 1 from auth.users where id=member_id and email_confirmed_at is not null) then
   raise exception 'Verified active session required' using errcode='42501';
 end if;
 if display_name is null or char_length(trim(display_name)) not between 2 and 80 or terms_version is distinct from '2026-10-15' then
   raise exception 'Invalid membership details' using errcode='22023';
 end if;
 insert into public.bf_accounts(id,accepted_terms_version) values(member_id,terms_version) on conflict(id) do nothing;
 insert into public.bf_profiles(id,display_name) values(member_id,trim(display_name)) on conflict(id) do nothing;
end;
$$;
create function public.bf_join(display_name text, terms_version text) returns void
language sql security invoker set search_path='' as $$
 select brasil_force_private.join_marketplace(display_name,terms_version);
$$;
revoke all on function public.bf_join(text,text) from public,anon,authenticated;
grant execute on function public.bf_join(text,text) to authenticated;

revoke all on all functions in schema brasil_force_private from public,anon,authenticated;
grant execute on function brasil_force_private.join_marketplace(text,text) to authenticated;
grant execute on function brasil_force_private.active_session(),brasil_force_private.is_staff() to authenticated;
grant execute on function brasil_force_private.seller_active(uuid) to anon,authenticated;
-- No user-facing role mutation, approval or finance RPC exists in phase 1.
alter table public.bf_accounts enable row level security;
alter table public.bf_profiles enable row level security;
alter table public.bf_institution_verifications enable row level security;
alter table public.bf_seller_applications enable row level security;
alter table public.bf_categories enable row level security;
alter table public.bf_listings enable row level security;
alter table public.bf_audit_events enable row level security;
revoke all on public.bf_accounts,public.bf_profiles,public.bf_institution_verifications,public.bf_seller_applications,public.bf_categories,public.bf_listings,public.bf_audit_events from public,anon,authenticated;
grant select on public.bf_accounts,public.bf_profiles,public.bf_institution_verifications,public.bf_seller_applications,public.bf_audit_events to authenticated;
grant update(display_name,institution) on public.bf_profiles to authenticated;
grant insert(user_id,display_name,person_type,status,policy_version) on public.bf_seller_applications to authenticated;
grant select on public.bf_categories,public.bf_listings to anon,authenticated;
create policy own_account on public.bf_accounts for select to authenticated using ((id=auth.uid() and brasil_force_private.active_session()) or brasil_force_private.is_staff());
create policy own_profile on public.bf_profiles for select to authenticated using (id=auth.uid() and brasil_force_private.active_session());
create policy update_own_profile on public.bf_profiles for update to authenticated using (id=auth.uid() and brasil_force_private.active_session()) with check (id=auth.uid() and brasil_force_private.active_session());
create policy own_verification on public.bf_institution_verifications for select to authenticated using ((user_id=auth.uid() and brasil_force_private.active_session()) or brasil_force_private.is_staff());
create policy own_application on public.bf_seller_applications for select to authenticated using ((user_id=auth.uid() and brasil_force_private.active_session()) or brasil_force_private.is_staff());
create policy request_seller on public.bf_seller_applications for insert to authenticated with check (user_id=auth.uid() and brasil_force_private.active_session() and status='pending');
create policy active_categories on public.bf_categories for select to anon,authenticated using(active);
create policy published_listings on public.bf_listings for select to anon,authenticated using(status='approved' and classification='free' and brasil_force_private.seller_active(seller_id) and exists(select 1 from public.bf_categories where slug=category_slug and active));
create policy own_listings on public.bf_listings for select to authenticated using((seller_id=auth.uid() and brasil_force_private.active_session()) or brasil_force_private.is_staff());
create policy staff_audit on public.bf_audit_events for select to authenticated using(brasil_force_private.is_staff());
-- Private documents: no anonymous read, no overwrite, no moderator read until document review workflow exists.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('bf-seller-documents','bf-seller-documents',false,5242880,array['image/jpeg','image/png','application/pdf']);
create policy bf_own_document_read on storage.objects for select to authenticated using(bucket_id='bf-seller-documents' and (storage.foldername(name))[1]=auth.uid()::text and brasil_force_private.active_session());
-- Upload intentionally disabled pending malware scanning, retention, and KYC review (phase 2).
commit;
