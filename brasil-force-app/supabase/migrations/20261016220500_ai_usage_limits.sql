-- New, isolated, fail-closed AI request quota. Not an authorization for restricted merchandise.
begin;

create table if not exists public.bf_ai_usage_limits (
  actor_id uuid not null references public.bf_accounts(id) on delete cascade,
  window_kind text not null check (window_kind in ('minute', 'day')),
  window_start timestamptz not null,
  requests integer not null default 0 check (requests >= 0),
  primary key (actor_id, window_kind, window_start)
);

alter table public.bf_ai_usage_limits enable row level security;
revoke all on public.bf_ai_usage_limits from public, anon, authenticated;

create function brasil_force_private.consume_ai_quota()
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_minute timestamptz := date_bin('1 minute', now(), '2000-01-01 00:00:00+00'::timestamptz);
  v_day timestamptz := date_bin('1 day', now(), '2000-01-01 00:00:00+00'::timestamptz);
  v_count integer;
begin
  if v_uid is null or not brasil_force_private.active_session()
    or not exists (select 1 from auth.users u where u.id = v_uid and u.email_confirmed_at is not null)
  then return false; end if;

  -- Serialize concurrent requests from the same user, including across serverless instances.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 97453));

  select requests into v_count from public.bf_ai_usage_limits
  where actor_id = v_uid and window_kind = 'minute' and window_start = v_minute;
  if coalesce(v_count, 0) >= 5 then return false; end if;

  select requests into v_count from public.bf_ai_usage_limits
  where actor_id = v_uid and window_kind = 'day' and window_start = v_day;
  if coalesce(v_count, 0) >= 60 then return false; end if;

  insert into public.bf_ai_usage_limits(actor_id, window_kind, window_start, requests)
    values(v_uid, 'minute', v_minute, 1), (v_uid, 'day', v_day, 1)
  on conflict (actor_id, window_kind, window_start)
    do update set requests = public.bf_ai_usage_limits.requests + 1;

  return true;
end;
$$;

create function public.bf_ai_consume_quota()
returns boolean language sql volatile security invoker set search_path = ''
as $$ select brasil_force_private.consume_ai_quota(); $$;

revoke all on function public.bf_ai_consume_quota() from public, anon, authenticated;
revoke all on function brasil_force_private.consume_ai_quota() from public, anon, authenticated;
grant execute on function public.bf_ai_consume_quota() to authenticated;
grant execute on function brasil_force_private.consume_ai_quota() to authenticated;

commit;

-- No permanent public grants on quota rows. Reversal (when no callers remain):
-- drop function public.bf_ai_consume_quota();
-- drop function brasil_force_private.consume_ai_quota();
-- drop table public.bf_ai_usage_limits;
