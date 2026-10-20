begin;
create table public.bf_listing_review_events (
 id uuid primary key default gen_random_uuid(),
 listing_id uuid not null references public.bf_listings(id),
 actor_id uuid not null references public.bf_accounts(id),
 from_status public.bf_listing_status not null,
 to_status public.bf_listing_status not null,
 classification public.bf_product_classification not null,
 reason text not null check(char_length(reason) between 10 and 1500),
 revision integer not null,
 created_at timestamptz not null default now(),
 unique(listing_id,revision)
);
create table public.bf_listing_review_notes (
 id uuid primary key references public.bf_listing_review_events(id),
 note text not null check(char_length(note)<=1500)
);
create index bf_listing_review_actor_idx on public.bf_listing_review_events(actor_id);
create index bf_listing_moderation_queue_idx on public.bf_listings(status,created_at,id);
alter table public.bf_listing_review_events enable row level security;
alter table public.bf_listing_review_notes enable row level security;
revoke all on public.bf_listing_review_events,public.bf_listing_review_notes from public,anon,authenticated;
grant select on public.bf_listing_review_events,public.bf_listing_review_notes to authenticated;
create policy bf_listing_review_read on public.bf_listing_review_events for select to authenticated using(
 brasil_force_private.active_session() and (brasil_force_private.is_staff() or exists(select 1 from public.bf_listings l where l.id=listing_id and l.seller_id=auth.uid()))
);
create policy bf_listing_notes_staff_read on public.bf_listing_review_notes for select to authenticated using(brasil_force_private.is_staff());

-- Preserve explicit removal even when a staff decision changes classification.
create or replace function brasil_force_private.requeue_listing() returns trigger language plpgsql set search_path='' as $$
begin
 if old.status='approved' and new.status='approved' and (new.title,new.description,new.category_slug,new.condition,new.price_cents,new.classification) is distinct from (old.title,old.description,old.category_slug,old.condition,old.price_cents,old.classification) then new.status='pending';end if;
 new.updated_at=now();return new;
end;
$$;
create function brasil_force_private.review_listing(p_id uuid,p_revision integer,p_decision text,p_classification text,p_reason text,p_internal_note text) returns void language plpgsql security definer set search_path='' as $$
declare item public.bf_listings; event_id uuid:=gen_random_uuid();
begin
 if not brasil_force_private.is_staff() then raise exception 'Staff MFA required' using errcode='42501';end if;
 if p_decision is null or p_decision not in ('in_review','changes_requested','rejected','approved','removed') or p_classification is null or p_classification not in ('free','additional_review','controlled','prohibited') then raise exception 'Invalid decision' using errcode='22023';end if;
 if p_reason is null or char_length(trim(p_reason)) not between 10 and 1500 or p_internal_note is null or char_length(p_internal_note)>1500 then raise exception 'Invalid reason' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into item from public.bf_listings where id=p_id for update;
 if not found or item.seller_id=auth.uid() then raise exception 'Listing not available' using errcode='42501';end if;
 if p_revision is distinct from item.revision then raise exception 'Revision conflict' using errcode='40001';end if;
 if not ((item.status='pending' and p_decision in ('in_review','changes_requested','rejected')) or (item.status='in_review' and p_decision in ('approved','changes_requested','rejected')) or (item.status='approved' and p_decision='removed')) then raise exception 'Invalid transition' using errcode='22023';end if;
 if p_decision='approved' then
  if item.classification in ('controlled','prohibited') then raise exception 'Restricted classification' using errcode='22023';end if;
  if p_classification<>'free' then raise exception 'Only ordinary products' using errcode='22023';end if;
  -- Lock account/application so revocation and approval cannot race across transactions.
  perform 1 from public.bf_seller_applications where user_id=item.seller_id and status='approved' for share;
  if not found then raise exception 'Approved seller required' using errcode='42501';end if;
  perform 1 from public.bf_accounts where id=item.seller_id and status='active' and role in ('seller','store') for share;
  if not found then raise exception 'Approved seller required' using errcode='42501';end if;
  if item.stock<1 or item.category_slug='servicos' or item.weight_grams is null or item.length_cm is null or item.width_cm is null or item.height_cm is null or not exists(select 1 from public.bf_categories where slug=item.category_slug and active) then raise exception 'Incomplete listing' using errcode='22023';end if;
 end if;
 if item.classification in ('controlled','prohibited') and p_classification not in ('controlled','prohibited') then raise exception 'Restricted classification' using errcode='22023';end if;
 update public.bf_listings set status=p_decision::public.bf_listing_status,classification=p_classification::public.bf_product_classification,revision=revision+1 where id=item.id;
 insert into public.bf_listing_review_events(id,listing_id,actor_id,from_status,to_status,classification,reason,revision)
 values(event_id,item.id,auth.uid(),item.status,p_decision::public.bf_listing_status,p_classification::public.bf_product_classification,trim(p_reason),item.revision+1);
 if char_length(trim(p_internal_note))>0 then insert into public.bf_listing_review_notes(id,note) values(event_id,trim(p_internal_note));end if;
end;
$$;
create function public.bf_review_listing(p_id uuid,p_revision integer,p_decision text,p_classification text,p_reason text,p_internal_note text) returns void language sql security invoker set search_path='' as $$select brasil_force_private.review_listing(p_id,p_revision,p_decision,p_classification,p_reason,p_internal_note)$$;
revoke all on function brasil_force_private.review_listing(uuid,integer,text,text,text,text),public.bf_review_listing(uuid,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function brasil_force_private.review_listing(uuid,integer,text,text,text,text),public.bf_review_listing(uuid,integer,text,text,text,text) to authenticated;

-- The anonymous policy must not need SELECT privileges on private seller applications.
create function brasil_force_private.published_seller(seller uuid) returns boolean language sql stable security definer set search_path='' as $$
 select brasil_force_private.seller_active(seller) and exists(select 1 from public.bf_seller_applications where user_id=seller and status='approved');
$$;
revoke all on function brasil_force_private.published_seller(uuid) from public,anon,authenticated;
grant execute on function brasil_force_private.published_seller(uuid) to anon,authenticated;
drop policy published_listings on public.bf_listings;
create policy published_listings on public.bf_listings for select to anon,authenticated using(
 status='approved' and classification='free' and stock>0 and weight_grams is not null and length_cm is not null and width_cm is not null and height_cm is not null and category_slug<>'servicos'
 and brasil_force_private.published_seller(seller_id) and exists(select 1 from public.bf_categories where slug=category_slug and active)
);

-- Apply publication filters even to owners/staff who can read private base rows.
create view public.bf_public_listings with (security_invoker=true) as
 select id,title,description,category_slug,condition,price_cents,stock,brand,model,created_at
 from public.bf_listings
 where status='approved' and classification='free' and stock>0
 and weight_grams is not null and length_cm is not null and width_cm is not null and height_cm is not null
 and category_slug<>'servicos' and brasil_force_private.published_seller(seller_id)
 and exists(select 1 from public.bf_categories where slug=category_slug and active);
revoke all on public.bf_public_listings from public,anon,authenticated;
grant select on public.bf_public_listings to anon,authenticated;

-- Keep moderation restrictions when a seller corrects or pauses a listing.
create or replace function brasil_force_private.save_listing(p_id uuid,p_revision integer,p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare item public.bf_listings; new_status public.bf_listing_status; new_classification public.bf_product_classification;
begin
 if not brasil_force_private.can_sell() then raise exception 'Approved seller required' using errcode='42501';end if;
 if p_id is null or p_revision is null or p_revision<0 or p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Invalid listing fields' using errcode='22023';end if;
 if exists(select 1 from jsonb_object_keys(p_data) k where k not in ('title','description','category_slug','condition','price_cents','stock','brand','model','weight_grams','length_cm','width_cm','height_cm','dispatch_business_days')) then raise exception 'Invalid listing fields' using errcode='22023';end if;
 if coalesce(char_length(trim(p_data->>'title')),0) not between 5 and 160 or coalesce(char_length(trim(p_data->>'description')),0) not between 20 and 10000
 or coalesce(p_data->>'condition','') not in ('new','like_new','used') or not exists(select 1 from public.bf_categories where slug=p_data->>'category_slug' and active)
 or not coalesce((p_data->>'price_cents')~'^[0-9]+$',false) or not coalesce((p_data->>'stock')~'^[0-9]+$',false)
 or not coalesce((p_data->>'weight_grams')~'^[0-9]+$',false) or not coalesce((p_data->>'dispatch_business_days')~'^[0-9]+$',false)
 or p_data->>'length_cm' is null or p_data->>'width_cm' is null or p_data->>'height_cm' is null then raise exception 'Invalid listing fields' using errcode='22023';end if;
 -- Serializes duplicate creates as well as updates for this UUID.
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into item from public.bf_listings where id=p_id for update;
 if found then
  if item.seller_id<>auth.uid() then raise exception 'Listing not available' using errcode='42501';end if;
  if item.revision<>p_revision then raise exception 'Revision conflict' using errcode='40001';end if;
  if item.status not in ('draft','changes_requested','paused','approved') then raise exception 'Listing not editable' using errcode='22023';end if;
  new_status=case when item.status='approved' then 'pending'::public.bf_listing_status else 'draft'::public.bf_listing_status end;
 else
  if p_revision<>0 then raise exception 'Revision conflict' using errcode='40001';end if;
  new_status='draft';
 end if;
 new_classification=case when item.classification in ('controlled','prohibited') then item.classification else 'additional_review'::public.bf_product_classification end;
 insert into public.bf_listings(id,seller_id,title,description,category_slug,condition,price_cents,stock,brand,model,weight_grams,length_cm,width_cm,height_cm,dispatch_business_days,status,classification,revision)
 values(p_id,auth.uid(),trim(p_data->>'title'),trim(p_data->>'description'),p_data->>'category_slug',p_data->>'condition',(p_data->>'price_cents')::bigint,(p_data->>'stock')::integer,coalesce(trim(p_data->>'brand'),''),coalesce(trim(p_data->>'model'),''),(p_data->>'weight_grams')::integer,(p_data->>'length_cm')::numeric,(p_data->>'width_cm')::numeric,(p_data->>'height_cm')::numeric,(p_data->>'dispatch_business_days')::integer,new_status,new_classification,p_revision+1)
 on conflict(id) do update set title=excluded.title,description=excluded.description,category_slug=excluded.category_slug,condition=excluded.condition,price_cents=excluded.price_cents,stock=excluded.stock,brand=excluded.brand,model=excluded.model,weight_grams=excluded.weight_grams,length_cm=excluded.length_cm,width_cm=excluded.width_cm,height_cm=excluded.height_cm,dispatch_business_days=excluded.dispatch_business_days,status=excluded.status,classification=excluded.classification,revision=excluded.revision;
 return p_id;
end;
$$;
commit;
-- Rollback: restore previous application, revoke EXECUTE on the new review RPCs.
-- Retain history/notes and stricter RLS. Do not delete decisions or reopen rejected products.
