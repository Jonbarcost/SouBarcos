begin;
alter table public.bf_seller_applications add column revision integer not null default 0 check(revision >= 0);
alter table public.bf_seller_applications add column updated_at timestamptz not null default now();
create table public.bf_seller_review_events (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.bf_seller_applications(id),
 actor_id uuid not null references public.bf_accounts(id),
 from_status text not null,
 to_status text not null,
 reason text not null check(char_length(reason) between 10 and 1500),
 revision integer not null,
 created_at timestamptz not null default now(),
 unique(application_id,revision)
);
create index bf_review_events_actor_idx on public.bf_seller_review_events(actor_id);
alter table public.bf_seller_review_events enable row level security;
revoke all on public.bf_seller_review_events from public,anon,authenticated;
grant select on public.bf_seller_review_events to authenticated;
create policy bf_review_history on public.bf_seller_review_events for select to authenticated using (
 brasil_force_private.active_session() and (
 brasil_force_private.is_staff() or exists(select 1 from public.bf_seller_applications a where a.id=application_id and a.user_id=auth.uid())
 ));

-- Atomic authorization + row lock + compare revision + event. No direct update grants.
create function brasil_force_private.review_seller(p_id uuid,p_decision text,p_reason text,p_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare app public.bf_seller_applications;
begin
 if not brasil_force_private.is_staff() then raise exception 'Staff MFA required' using errcode='42501'; end if;
 if p_decision is null or p_decision not in ('in_review','changes_requested','rejected') then raise exception 'Invalid decision' using errcode='22023'; end if;
 if p_reason is null or char_length(trim(p_reason)) not between 10 and 1500 then raise exception 'Invalid reason' using errcode='22023'; end if;
 select * into app from public.bf_seller_applications where id=p_id for update;
 if not found or app.user_id=auth.uid() then raise exception 'Application not available' using errcode='42501'; end if;
 if p_revision is distinct from app.revision then raise exception 'Revision conflict' using errcode='40001'; end if;
 if app.status not in ('pending','in_review') or (app.status='in_review' and p_decision='in_review') then raise exception 'Invalid transition' using errcode='22023'; end if;
 update public.bf_seller_applications set status=p_decision,revision=revision+1,updated_at=now() where id=app.id;
 insert into public.bf_seller_review_events(application_id,actor_id,from_status,to_status,reason,revision)
 values(app.id,auth.uid(),app.status,p_decision,trim(p_reason),app.revision+1);
end;
$$;
create function brasil_force_private.resubmit_seller(p_id uuid,p_name text,p_person_type text,p_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare app public.bf_seller_applications;
begin
 if not brasil_force_private.active_session() then raise exception 'Active session required' using errcode='42501'; end if;
 if p_name is null or char_length(trim(p_name)) not between 2 and 100 or p_person_type is null or p_person_type not in ('individual','company') then raise exception 'Invalid details' using errcode='22023'; end if;
 select * into app from public.bf_seller_applications where id=p_id for update;
 if not found or app.user_id<>auth.uid() then raise exception 'Application not available' using errcode='42501'; end if;
 if p_revision is distinct from app.revision then raise exception 'Revision conflict' using errcode='40001'; end if;
 if app.status<>'changes_requested' then raise exception 'Corrections not requested' using errcode='22023'; end if;
 update public.bf_seller_applications set display_name=trim(p_name),person_type=p_person_type,status='pending',revision=revision+1,updated_at=now() where id=app.id;
 insert into public.bf_seller_review_events(application_id,actor_id,from_status,to_status,reason,revision)
 values(app.id,auth.uid(),app.status,'pending','Dados corrigidos e reenviados pelo solicitante.',app.revision+1);
end;
$$;
create function public.bf_review_seller(p_id uuid,p_decision text,p_reason text,p_revision integer) returns void language sql security invoker set search_path='' as $$select brasil_force_private.review_seller(p_id,p_decision,p_reason,p_revision)$$;
create function public.bf_resubmit_seller(p_id uuid,p_name text,p_person_type text,p_revision integer) returns void language sql security invoker set search_path='' as $$select brasil_force_private.resubmit_seller(p_id,p_name,p_person_type,p_revision)$$;
revoke all on function brasil_force_private.review_seller(uuid,text,text,integer),brasil_force_private.resubmit_seller(uuid,text,text,integer),public.bf_review_seller(uuid,text,text,integer),public.bf_resubmit_seller(uuid,text,text,integer) from public,anon,authenticated;
grant execute on function brasil_force_private.review_seller(uuid,text,text,integer),brasil_force_private.resubmit_seller(uuid,text,text,integer),public.bf_review_seller(uuid,text,text,integer),public.bf_resubmit_seller(uuid,text,text,integer) to authenticated;
commit;
