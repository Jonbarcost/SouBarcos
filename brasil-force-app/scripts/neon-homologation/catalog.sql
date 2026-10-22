-- Read-only evidence; run against the explicit homologation target only.
WITH target_tables AS (
 SELECT c.oid,n.nspname,c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE (n.nspname='public' AND c.relname IN ('bf_supplier_prospects','bf_supplier_events','bf_supplier_mail','bf_zoho_states','bf_zoho_connection'))
 OR (n.nspname='brasil_force_private' AND c.relname='zoho_read_usage')
), rpc AS (
 SELECT p.*,n.nspname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname IN ('public','brasil_force_private') AND p.proname IN
 ('bf_zoho_nonce','bf_zoho_save','bf_zoho_disconnect','bf_supplier_create','bf_supplier_change','bf_supplier_draft','bf_supplier_mail_action','bf_supplier_mail_finish','bf_zoho_read_quota')
)
SELECT jsonb_build_object(
 'database',current_database(),
 'tables',(SELECT count(*) FROM target_tables),
 'all_rls',(SELECT bool_and(relrowsecurity) FROM target_tables),
 'no_direct_application_writes',(SELECT bool_and(NOT has_table_privilege('authenticated',oid,'INSERT,UPDATE,DELETE,TRUNCATE') AND NOT has_table_privilege('anon',oid,'INSERT,UPDATE,DELETE,TRUNCATE')) FROM target_tables),
 'rpc_count',(SELECT count(*) FROM rpc),
 'rpc_permissions',(SELECT bool_and(NOT has_function_privilege('anon',oid,'EXECUTE') AND has_function_privilege('authenticated',oid,'EXECUTE')) FROM rpc),
 'definer_private_invoker_public',(SELECT bool_and(prosecdef=(nspname='brasil_force_private')) FROM rpc),
 'fixed_search_paths',(SELECT bool_and(proconfig @> ARRAY['search_path=""']) FROM rpc),
 'invoker_view',(SELECT reloptions @> ARRAY['security_invoker=true'] FROM pg_class WHERE oid='public.bf_supplier_eligibility'::regclass),
 'indexes',(SELECT jsonb_agg(jsonb_build_object('name',ci.relname,'valid',i.indisvalid,'ready',i.indisready) ORDER BY ci.relname) FROM pg_index i JOIN pg_class ci ON ci.oid=i.indexrelid WHERE i.indrelid IN(SELECT oid FROM target_tables)),
 'constraints',(SELECT jsonb_agg(jsonb_build_object('name',conname,'validated',convalidated,'definition',pg_get_constraintdef(oid)) ORDER BY conname) FROM pg_constraint WHERE conrelid IN(SELECT oid FROM target_tables)),
 'policies',(SELECT jsonb_agg(jsonb_build_object('table',tablename,'name',policyname,'command',cmd,'roles',roles,'using',qual,'check',with_check) ORDER BY tablename,policyname) FROM pg_policies WHERE tablename IN(SELECT relname FROM target_tables)),
 'empty_after_tests',NOT EXISTS(SELECT 1 FROM auth.users) AND NOT EXISTS(SELECT 1 FROM auth.sessions) AND NOT EXISTS(SELECT 1 FROM public.bf_accounts) AND NOT EXISTS(SELECT 1 FROM public.bf_audit_events) AND NOT EXISTS(SELECT 1 FROM public.bf_supplier_prospects) AND NOT EXISTS(SELECT 1 FROM public.bf_supplier_events) AND NOT EXISTS(SELECT 1 FROM public.bf_supplier_mail) AND NOT EXISTS(SELECT 1 FROM public.bf_zoho_states) AND NOT EXISTS(SELECT 1 FROM public.bf_zoho_connection) AND NOT EXISTS(SELECT 1 FROM brasil_force_private.zoho_read_usage)
) AS evidence;
