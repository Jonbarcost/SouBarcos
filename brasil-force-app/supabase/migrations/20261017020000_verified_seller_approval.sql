-- Additive. Never reapply prior migrations; confirm remote history before deployment.
begin;
create function brasil_force_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select brasil_force_private.is_staff() and exists(select 1 from public.bf_accounts where id=auth.uid() and role in ('admin','superadmin'));
$$;
create table public.bf_seller_verification_policies (
 person_type text primary key check(person_type in ('individual','company')),
 version text not null check(char_length(version) between 3 and 80),
 required_checks text[] not null check(cardinality(required_checks) between 3 and 8 and required_checks @> array['identity','commercial','policy'] and required_checks <@ array['identity','fiscal','commercial','policy','activity_credentials']),
 evidence_valid_days integer not null default 30 check(evidence_valid_days between 1 and 90),
 enabled boolean not null default false
);
-- No enabled policy is seeded. Operator must establish a lawful private evidence process first.
create table public.bf_seller_verifications (
 id uuid primary key default gen_random_uuid(),
 application_id uuid not null references public.bf_seller_applications(id),
 application_revision integer not null check(application_revision>=0),
 policy_version text not null,
 checks text[] not null,
 evidence_reference text not null check(evidence_reference ~ '^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$'),
 verified_by uuid not null references public.bf_accounts(id),
 verified_at timestamptz not null default now(),
 expires_at timestamptz not null
);
create index bf_seller_verifications_application_idx on public.bf_seller_verifications(application_id,application_revision,expires_at);
create index bf_seller_verifications_actor_idx on public.bf_seller_verifications(verified_by);
alter table public.bf_seller_verification_policies enable row level security;
alter table public.bf_seller_verifications enable row level security;
revoke all on public.bf_seller_verification_policies,public.bf_seller_verifications from public,anon,authenticated;
grant select on public.bf_seller_verification_policies,public.bf_seller_verifications to authenticated;
create policy bf_verification_policy_read on public.bf_seller_verification_policies for select to authenticated using(brasil_force_private.is_staff());
create policy bf_verification_admin_read on public.bf_seller_verifications for select to authenticated using(brasil_force_private.is_admin());
create trigger audit_seller_verification after insert on public.bf_seller_verifications for each row execute function brasil_force_private.record_audit();

create function brasil_force_private.verify_seller(p_id uuid,p_revision integer,p_policy_version text,p_checks text[],p_reference text) returns void language plpgsql security definer set search_path='' as $$
declare app public.bf_seller_applications; policy public.bf_seller_verification_policies;
begin
 if not brasil_force_private.is_admin() then raise exception 'Admin MFA required' using errcode='42501';end if;
 select * into app from public.bf_seller_applications where id=p_id for update;
 if not found or app.user_id=auth.uid() then raise exception 'Application not available' using errcode='42501';end if;
 if p_revision is distinct from app.revision then raise exception 'Revision conflict' using errcode='40001';end if;
 if app.status<>'in_review' then raise exception 'Invalid transition' using errcode='22023';end if;
 select * into policy from public.bf_seller_verification_policies where person_type=app.person_type and enabled for share;
 if not found or policy.version is distinct from p_policy_version then raise exception 'Verification policy unavailable' using errcode='22023';end if;
 if p_checks is null or not(p_checks @> policy.required_checks and p_checks <@ policy.required_checks) or array_position(p_checks,null) is not null then raise exception 'Required checks missing' using errcode='22023';end if;
 if p_reference is null or p_reference !~ '^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$' then raise exception 'Invalid evidence reference' using errcode='22023';end if;
 insert into public.bf_seller_verifications(application_id,application_revision,policy_version,checks,evidence_reference,verified_by,expires_at)
 values(app.id,app.revision,policy.version,p_checks,p_reference,auth.uid(),now()+make_interval(days=>policy.evidence_valid_days));
end;
$$;
create function public.bf_verify_seller(p_id uuid,p_revision integer,p_policy_version text,p_checks text[],p_reference text) returns void language sql security invoker set search_path='' as $$select brasil_force_private.verify_seller(p_id,p_revision,p_policy_version,p_checks,p_reference)$$;

-- Preserve public RPC signature and all previous decisions.
create or replace function brasil_force_private.review_seller(p_id uuid,p_decision text,p_reason text,p_revision integer) returns void
language plpgsql security definer set search_path='' as $$
declare app public.bf_seller_applications; account public.bf_accounts; policy public.bf_seller_verification_policies;
begin
 if not brasil_force_private.is_staff() then raise exception 'Staff MFA required' using errcode='42501';end if;
 if p_decision is null or p_decision not in ('in_review','changes_requested','rejected','approved') then raise exception 'Invalid decision' using errcode='22023';end if;
 if p_reason is null or char_length(trim(p_reason)) not between 10 and 1500 then raise exception 'Invalid reason' using errcode='22023';end if;
 select * into app from public.bf_seller_applications where id=p_id for update;
 if not found or app.user_id=auth.uid() then raise exception 'Application not available' using errcode='42501';end if;
 if p_revision is distinct from app.revision then raise exception 'Revision conflict' using errcode='40001';end if;
 if app.status not in ('pending','in_review') or (app.status='in_review' and p_decision='in_review') or (p_decision='approved' and app.status<>'in_review') then raise exception 'Invalid transition' using errcode='22023';end if;
 if p_decision='approved' then
  if not brasil_force_private.is_admin() then raise exception 'Admin MFA required' using errcode='42501';end if;
  select * into account from public.bf_accounts where id=app.user_id for update;
  if not found or account.status<>'active' or account.role not in ('buyer','seller','store') or not exists(select 1 from auth.users where id=app.user_id and email_confirmed_at is not null) then raise exception 'Applicant not eligible' using errcode='42501';end if;
  select * into policy from public.bf_seller_verification_policies where person_type=app.person_type and enabled for share;
  if not found or not exists(select 1 from public.bf_seller_verifications v where v.application_id=app.id and v.application_revision=app.revision and v.policy_version=policy.version and v.checks @> policy.required_checks and v.expires_at>now() and v.verified_by<>app.user_id) then raise exception 'Verification required' using errcode='22023';end if;
  update public.bf_accounts set role=case when app.person_type='company' then 'store'::public.bf_account_role else 'seller'::public.bf_account_role end where id=app.user_id;
 end if;
 update public.bf_seller_applications set status=p_decision,revision=revision+1,updated_at=now() where id=app.id;
 insert into public.bf_seller_review_events(application_id,actor_id,from_status,to_status,reason,revision)
 values(app.id,auth.uid(),app.status,p_decision,trim(p_reason),app.revision+1);
end;
$$;
revoke all on function brasil_force_private.is_admin(),brasil_force_private.verify_seller(uuid,integer,text,text[],text),public.bf_verify_seller(uuid,integer,text,text[],text) from public,anon,authenticated;
grant execute on function brasil_force_private.is_admin(),brasil_force_private.verify_seller(uuid,integer,text,text[],text),public.bf_verify_seller(uuid,integer,text,text[],text) to authenticated;
commit;
-- Rollback: deploy previous application and disable policies, retaining evidence and audit.
-- Do not drop tables or reverse approved roles automatically. Review each account explicitly.
