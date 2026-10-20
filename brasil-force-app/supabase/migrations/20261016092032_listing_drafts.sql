begin;
alter table public.bf_listings
 add column revision integer not null default 0 check(revision>=0),
 add column brand text not null default '' check(char_length(brand)<=100),
 add column model text not null default '' check(char_length(model)<=100),
 add column weight_grams integer check(weight_grams between 1 and 1000000),
 add column length_cm numeric(7,2) check(length_cm>0 and length_cm<=1000),
 add column width_cm numeric(7,2) check(width_cm>0 and width_cm<=1000),
 add column height_cm numeric(7,2) check(height_cm>0 and height_cm<=1000),
 add column dispatch_business_days integer not null default 3 check(dispatch_business_days between 0 and 30);
create function brasil_force_private.can_sell() returns boolean language sql stable security definer set search_path='' as $$
 select brasil_force_private.active_session() and brasil_force_private.seller_active(auth.uid()) and exists(select 1 from public.bf_seller_applications where user_id=auth.uid() and status='approved');
$$;
create function brasil_force_private.save_listing(p_id uuid,p_revision integer,p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare item public.bf_listings; new_status public.bf_listing_status;
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
 insert into public.bf_listings(id,seller_id,title,description,category_slug,condition,price_cents,stock,brand,model,weight_grams,length_cm,width_cm,height_cm,dispatch_business_days,status,classification,revision)
 values(p_id,auth.uid(),trim(p_data->>'title'),trim(p_data->>'description'),p_data->>'category_slug',p_data->>'condition',(p_data->>'price_cents')::bigint,(p_data->>'stock')::integer,coalesce(trim(p_data->>'brand'),''),coalesce(trim(p_data->>'model'),''),(p_data->>'weight_grams')::integer,(p_data->>'length_cm')::numeric,(p_data->>'width_cm')::numeric,(p_data->>'height_cm')::numeric,(p_data->>'dispatch_business_days')::integer,new_status,'additional_review',p_revision+1)
 on conflict(id) do update set title=excluded.title,description=excluded.description,category_slug=excluded.category_slug,condition=excluded.condition,price_cents=excluded.price_cents,stock=excluded.stock,brand=excluded.brand,model=excluded.model,weight_grams=excluded.weight_grams,length_cm=excluded.length_cm,width_cm=excluded.width_cm,height_cm=excluded.height_cm,dispatch_business_days=excluded.dispatch_business_days,status=excluded.status,classification=excluded.classification,revision=excluded.revision;
 return p_id;
end;
$$;
create function brasil_force_private.transition_listing(p_id uuid,p_revision integer,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare item public.bf_listings;next_status public.bf_listing_status;
begin
 if not brasil_force_private.can_sell() then raise exception 'Approved seller required' using errcode='42501';end if;
 if p_action is null or p_action not in ('submit','pause') then raise exception 'Invalid action' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into item from public.bf_listings where id=p_id for update;
 if not found or item.seller_id<>auth.uid() then raise exception 'Listing not available' using errcode='42501';end if;
 if p_revision is distinct from item.revision then raise exception 'Revision conflict' using errcode='40001';end if;
 if p_action='submit' then
  if item.status not in ('draft','changes_requested','paused') then raise exception 'Invalid transition' using errcode='22023';end if;
  if item.category_slug='servicos' or item.stock<1 or item.weight_grams is null or item.length_cm is null or item.width_cm is null or item.height_cm is null
   or not exists(select 1 from public.bf_categories where slug=item.category_slug and active) then raise exception 'Incomplete shipping details' using errcode='22023';end if;
  next_status='pending';
 else
  if item.status not in ('approved','pending','in_review') then raise exception 'Invalid transition' using errcode='22023';end if;
  next_status='paused';
 end if;
 update public.bf_listings set status=next_status,revision=revision+1 where id=p_id;
end;
$$;
create function public.bf_save_listing(p_id uuid,p_revision integer,p_data jsonb) returns uuid language sql security invoker set search_path='' as $$ select brasil_force_private.save_listing(p_id,p_revision,p_data) $$;
create function public.bf_transition_listing(p_id uuid,p_revision integer,p_action text) returns void language sql security invoker set search_path='' as $$ select brasil_force_private.transition_listing(p_id,p_revision,p_action) $$;
revoke all on function brasil_force_private.can_sell(),brasil_force_private.save_listing(uuid,integer,jsonb),brasil_force_private.transition_listing(uuid,integer,text),public.bf_save_listing(uuid,integer,jsonb),public.bf_transition_listing(uuid,integer,text) from public,anon,authenticated;
grant execute on function brasil_force_private.can_sell(),brasil_force_private.save_listing(uuid,integer,jsonb),brasil_force_private.transition_listing(uuid,integer,text),public.bf_save_listing(uuid,integer,jsonb),public.bf_transition_listing(uuid,integer,text) to authenticated;
commit;
