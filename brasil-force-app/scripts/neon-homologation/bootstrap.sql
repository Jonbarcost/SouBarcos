-- TEST ONLY. Repairs the inspected empty Neon stubs, not a Supabase migration.
-- Run once using Execute (not Analyze). Entire bootstrap is atomic.
DO $bootstrap$
BEGIN
 IF current_database()<>'brasil_force_test' OR current_user<>'brasil_force_test_owner' THEN
  RAISE EXCEPTION 'Wrong homologation database or owner';
 END IF;
 IF EXISTS(SELECT 1 FROM auth.users) OR EXISTS(SELECT 1 FROM public.bf_accounts)
 OR EXISTS(SELECT 1 FROM public.bf_audit_events) OR to_regclass('public.bf_zoho_states') IS NOT NULL THEN
  RAISE EXCEPTION 'Bootstrap requires the inspected empty baseline; do not reapply';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname IN ('anon','authenticated') AND (rolsuper OR rolbypassrls OR rolcanlogin)) THEN
  RAISE EXCEPTION 'Unsafe simulated application role';
 END IF;
 -- PG17 CREATEROLE membership defaults SET FALSE; test owner must assume restricted roles.
 GRANT anon,authenticated TO brasil_force_test_owner WITH SET TRUE;
 CREATE TYPE public.bf_account_role AS ENUM ('buyer','seller','store','moderator','admin','superadmin');
 CREATE TYPE public.bf_account_status AS ENUM ('active','suspended');
 ALTER TABLE auth.users ADD COLUMN email_confirmed_at timestamptz DEFAULT now();
 CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE);
 ALTER TABLE public.bf_accounts
  ALTER COLUMN role TYPE public.bf_account_role USING role::public.bf_account_role,
  ALTER COLUMN role SET DEFAULT 'buyer',
  ALTER COLUMN status TYPE public.bf_account_status USING status::public.bf_account_status,
  ALTER COLUMN status SET DEFAULT 'active',
  ADD COLUMN accepted_terms_version text NOT NULL CHECK(accepted_terms_version='2026-10-15'),
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD CONSTRAINT bf_accounts_user_fk FOREIGN KEY(id) REFERENCES auth.users(id) ON DELETE CASCADE;
 ALTER TABLE public.bf_audit_events
  ALTER COLUMN entity SET NOT NULL, ALTER COLUMN entity_id SET NOT NULL, ALTER COLUMN action SET NOT NULL,
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
 CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}'::jsonb)
 $$;
 CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(auth.jwt()->>'sub','')::uuid
 $$;
 CREATE OR REPLACE FUNCTION brasil_force_private.active_session() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT auth.uid() IS NOT NULL
  AND EXISTS(SELECT 1 FROM public.bf_accounts a WHERE a.id=auth.uid() AND a.status='active')
  AND EXISTS(SELECT 1 FROM auth.sessions s WHERE s.user_id=auth.uid() AND s.id::text=auth.jwt()->>'session_id')
 $$;
 CREATE OR REPLACE FUNCTION brasil_force_private.is_staff() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT brasil_force_private.active_session() AND coalesce(auth.jwt()->>'aal','aal1')='aal2'
  AND EXISTS(SELECT 1 FROM public.bf_accounts a WHERE a.id=auth.uid() AND a.role IN ('moderator','admin','superadmin'))
 $$;
 CREATE OR REPLACE FUNCTION brasil_force_private.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT brasil_force_private.is_staff() AND EXISTS(SELECT 1 FROM public.bf_accounts WHERE id=auth.uid() AND role IN ('admin','superadmin'))
 $$;
 REVOKE ALL ON SCHEMA auth,brasil_force_private FROM PUBLIC;
 GRANT USAGE ON SCHEMA auth,public,brasil_force_private TO anon,authenticated;
 REVOKE ALL ON auth.users,auth.sessions,public.bf_accounts,public.bf_audit_events FROM PUBLIC,anon,authenticated;
 REVOKE ALL ON ALL FUNCTIONS IN SCHEMA auth,brasil_force_private FROM PUBLIC,anon,authenticated;
 GRANT EXECUTE ON FUNCTION auth.uid(),auth.jwt(),brasil_force_private.active_session(),brasil_force_private.is_staff(),brasil_force_private.is_admin() TO anon,authenticated;
 ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
 ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.bf_accounts ENABLE ROW LEVEL SECURITY;
 ALTER TABLE public.bf_audit_events ENABLE ROW LEVEL SECURITY;
 GRANT SELECT ON public.bf_accounts,public.bf_audit_events TO authenticated;
 CREATE POLICY own_account ON public.bf_accounts FOR SELECT TO authenticated
 USING((id=auth.uid() AND brasil_force_private.active_session()) OR brasil_force_private.is_staff());
 CREATE POLICY staff_audit ON public.bf_audit_events FOR SELECT TO authenticated USING(brasil_force_private.is_staff());
END $bootstrap$;
