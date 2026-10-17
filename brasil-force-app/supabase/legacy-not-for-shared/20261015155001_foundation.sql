begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
create type public.account_role as enum ('buyer','seller','store','moderator','admin','superadmin');
create type public.account_status as enum ('active','suspended');
create type public.listing_status as enum ('draft','pending','in_review','changes_requested','approved','rejected','paused','sold','removed');
create type public.product_classification as enum ('free','additional_review','controlled','prohibited');
create table public.accounts (
 id uuid primary key references auth.users(id) on delete cascade,
 role public.account_role not null default 'buyer',
 status public.account_status not null default 'active',
 created_at timestamptz not null default now()
);
create table public.profiles (
 id uuid primary key references public.accounts(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 80),
 institution text check (institution in ('Exército Brasileiro','Marinha do Brasil','Força Aérea Brasileira','Polícia Militar','Polícia Civil','Polícia Federal','Polícia Rodoviária Federal','Corpo de Bombeiros Militar','Guarda Municipal','Veterano ou reserva','Colecionador','Entusiasta ou civil','Outras instituições')),
 updated_at timestamptz not null default now()
);
create table public.institution_verifications (
 user_id uuid primary key references public.accounts(id) on delete cascade,
 institution text not null,
 verified_at timestamptz not null,
 verified_by uuid not null references public.accounts(id)
);
-- No CPF/CNPJ or address is put in profiles. Collect only after KYC and retention design is approved.
create table public.seller_applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references public.accounts(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 100),
 person_type text not null check(person_type in ('individual','company')),
 status text not null default 'pending' check(status in ('pending','in_review','changes_requested','approved','rejected')),
 policy_version text not null check(policy_version = '2026-10-15'),
 created_at timestamptz not null default now()
);
create table public.categories (
 slug text primary key,
 name text not null,
 active boolean not null default true
);
insert into public.categories(slug,name) values ('vestuario','Vestuário'),('campo','Equipamentos de campo'),('acessorios','Acessórios'),('colecionismo','Colecionismo'),('outdoor','Outdoor e aventura'),('servicos','Serviços');
create table public.listings (
 id uuid primary key default gen_random_uuid(),
 seller_id uuid not null references public.accounts(id),
 category_slug text not null references public.categories(slug),
 title text not null check(char_length(title) between 5 and 160),
 description text not null check(char_length(description) between 20 and 10000),
 condition text not null check(condition in ('new','like_new','used')),
 price_cents bigint not null check(price_cents > 0 and price_cents <= 100000000),
 stock integer not null default 0 check(stock >= 0),
 status public.listing_status not null default 'draft',
 classification public.product_classification not null default 'additional_review',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint only_free_approved check (status <> 'approved' or classification='free')
);
create index listings_catalog_idx on public.listings(category_slug,created_at desc) where status='approved' and classification='free';
create index listings_seller_idx on public.listings(seller_id);
create index seller_applications_queue_idx on public.seller_applications(status,created_at);
create table public.audit_events (
 id bigint generated always as identity primary key,
 actor_id uuid,
 entity text not null,
 entity_id text not null,
 action text not null,
 created_at timestamptz not null default now()
);
-- Definer helpers are intentionally in a NON-exposed schema, fixed search_path, no mutable JWT role claims.
create function private.active_session() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null
 and exists(select 1 from public.accounts a where a.id=auth.uid() and a.status='active')
 and exists(select 1 from auth.sessions s where s.user_id=auth.uid() and s.id::text=auth.jwt()->>'session_id');
$$;
create function private.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select private.active_session() and coalesce(auth.jwt()->>'aal','aal1')='aal2'
 and exists(select 1 from public.accounts a where a.id=auth.uid() and a.role in ('moderator','admin','superadmin'));
$$;
create function private.seller_active(seller uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.accounts where id=seller and role in ('seller','store') and status='active');
$$;
create function private.new_user() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 insert into public.accounts(id) values(new.id);
 insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'),80),''),'Novo membro'));
 return new;
 end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.new_user();
create function private.record_audit() returns trigger language plpgsql security definer set search_path='' as $$
 declare row_id text;
 begin
 if TG_OP='DELETE' then row_id=old.id::text; else row_id=new.id::text; end if;
 insert into public.audit_events(actor_id,entity,entity_id,action) values(auth.uid(),TG_TABLE_NAME,row_id,TG_OP);
 if TG_OP='DELETE' then return old; end if; return new;
 end;
$$;
create function private.mark_profile_changed() returns trigger language plpgsql set search_path='' as $$
 begin new.updated_at=now();return new;end;
$$;
create trigger profile_changed before update on public.profiles for each row execute function private.mark_profile_changed();
create function private.requeue_listing() returns trigger language plpgsql set search_path='' as $$
 begin
 if old.status='approved' and (new.title,new.description,new.category_slug,new.condition,new.price_cents,new.classification) is distinct from (old.title,old.description,old.category_slug,old.condition,old.price_cents,old.classification) then new.status='pending'; end if;
 new.updated_at=now();return new;
 end;
$$;
create trigger listing_changed before update on public.listings for each row execute function private.requeue_listing();
create trigger audit_account after insert or update or delete on public.accounts for each row execute function private.record_audit();
create trigger audit_application after insert or update or delete on public.seller_applications for each row execute function private.record_audit();
create trigger audit_listing after insert or update or delete on public.listings for each row execute function private.record_audit();
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.active_session(),private.is_staff() to authenticated;
grant execute on function private.seller_active(uuid) to anon,authenticated;
-- No user-facing role mutation, approval or finance RPC exists in phase 1.
alter table public.accounts enable row level security;
alter table public.profiles enable row level security;
alter table public.institution_verifications enable row level security;
alter table public.seller_applications enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.audit_events enable row level security;
revoke all on public.accounts,public.profiles,public.institution_verifications,public.seller_applications,public.categories,public.listings,public.audit_events from anon,authenticated;
grant select on public.accounts,public.profiles,public.institution_verifications,public.seller_applications,public.audit_events to authenticated;
grant update(display_name,institution) on public.profiles to authenticated;
grant insert(user_id,display_name,person_type,status,policy_version) on public.seller_applications to authenticated;
grant select on public.categories,public.listings to anon,authenticated;
create policy own_account on public.accounts for select to authenticated using ((id=auth.uid() and private.active_session()) or private.is_staff());
create policy own_profile on public.profiles for select to authenticated using (id=auth.uid() and private.active_session());
create policy update_own_profile on public.profiles for update to authenticated using (id=auth.uid() and private.active_session()) with check (id=auth.uid() and private.active_session());
create policy own_verification on public.institution_verifications for select to authenticated using ((user_id=auth.uid() and private.active_session()) or private.is_staff());
create policy own_application on public.seller_applications for select to authenticated using ((user_id=auth.uid() and private.active_session()) or private.is_staff());
create policy request_seller on public.seller_applications for insert to authenticated with check (user_id=auth.uid() and private.active_session() and status='pending');
create policy active_categories on public.categories for select to anon,authenticated using(active);
create policy published_listings on public.listings for select to anon,authenticated using(status='approved' and classification='free' and private.seller_active(seller_id) and exists(select 1 from public.categories where slug=category_slug and active));
create policy own_listings on public.listings for select to authenticated using((seller_id=auth.uid() and private.active_session()) or private.is_staff());
create policy staff_audit on public.audit_events for select to authenticated using(private.is_staff());
-- Private documents: no anonymous read, no overwrite, no moderator read until document review workflow exists.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('seller-documents','seller-documents',false,5242880,array['image/jpeg','image/png','application/pdf']);
create policy own_document_read on storage.objects for select to authenticated using(bucket_id='seller-documents' and (storage.foldername(name))[1]=auth.uid()::text and private.active_session());
-- Upload intentionally disabled pending malware scanning, retention, and KYC review (phase 2).
commit;
