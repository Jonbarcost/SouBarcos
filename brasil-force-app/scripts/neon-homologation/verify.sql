-- Execute all statements on ONE connection/transaction. Only synthetic fixtures.
-- Inner subtransaction rolls back every fixture; sequences may advance.
CREATE TEMP TABLE homologation_session_marker(id integer);
CREATE FUNCTION pg_temp.expect_failure(statement text,pattern text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN
  EXECUTE statement;
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM ~ pattern THEN RETURN; END IF;
  RAISE;
 END;
 RAISE EXCEPTION 'Expected rejection: %',statement;
END $$;
CREATE FUNCTION pg_temp.check(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Failed: %',label; END IF; END $$;
CREATE FUNCTION pg_temp.run_homologation() RETURNS text[] LANGUAGE plpgsql AS $tests$
DECLARE
 results text[] := '{}';
 admin uuid := '00000000-0000-4000-8000-000000000013';
 other_admin uuid := '00000000-0000-4000-8000-000000000015';
 sid uuid; mid uuid; duplicate uuid; u record;
BEGIN
 IF current_database()<>'brasil_force_test' OR current_user<>'brasil_force_test_owner' THEN RAISE EXCEPTION 'Wrong target'; END IF;
 IF EXISTS(SELECT 1 FROM auth.users) OR EXISTS(SELECT 1 FROM public.bf_supplier_prospects) OR EXISTS(SELECT 1 FROM public.bf_zoho_connection) THEN RAISE EXCEPTION 'Tests require empty isolated database'; END IF;
 BEGIN
  INSERT INTO auth.users(id) SELECT ('00000000-0000-4000-8000-0000000000'||n)::uuid FROM generate_series(11,15) n;
  INSERT INTO auth.sessions SELECT ('1'||substr(id::text,2))::uuid,id FROM auth.users;
  INSERT INTO public.bf_accounts(id,role,status,accepted_terms_version)
  SELECT id,(CASE right(id::text,2) WHEN '13' THEN 'admin' WHEN '14' THEN 'moderator' WHEN '15' THEN 'superadmin' ELSE 'buyer' END)::public.bf_account_role,'active','2026-10-15' FROM auth.users;
  SET LOCAL ROLE anon;
  PERFORM pg_temp.expect_failure($q$select public.bf_supplier_create('Teste','Camping',null,null,null)$q$,'permission denied');
  RESET ROLE;
  results:=array_append(results,'anonymous RPC denied');
  FOR u IN SELECT * FROM (VALUES ('11','aal2'),('14','aal2'),('13','aal1')) AS v(suffix,aal) LOOP
   PERFORM set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-0000000000'||u.suffix,'session_id','10000000-0000-4000-8000-0000000000'||u.suffix,'aal',u.aal,'user_metadata',jsonb_build_object('role','superadmin'))::text,true);
   SET LOCAL ROLE authenticated;
   PERFORM pg_temp.expect_failure($q$select public.bf_supplier_create('Teste','Camping',null,null,null)$q$,'Forbidden');
   RESET ROLE;
  END LOOP;
  results:=array_append(results,'buyer forged metadata, moderator and AAL1 denied');
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin,'session_id','10000000-0000-4000-8000-000000000013','aal','aal2')::text,true);
  UPDATE public.bf_accounts SET status='suspended' WHERE id=admin;
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.expect_failure($q$select public.bf_zoho_nonce(repeat('a',64),false)$q$,'Forbidden');
  RESET ROLE;
  UPDATE public.bf_accounts SET status='active' WHERE id=admin;
  DELETE FROM auth.sessions WHERE user_id=admin;
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.expect_failure($q$select public.bf_zoho_nonce(repeat('a',64),false)$q$,'Forbidden');
  RESET ROLE;
  INSERT INTO auth.sessions VALUES('10000000-0000-4000-8000-000000000013',admin);
  results:=array_append(results,'suspended account and revoked session denied');
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.check(current_user='authenticated' AND NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user),'real non-bypass role');
  PERFORM pg_temp.check(public.bf_zoho_nonce(repeat('a',64),false),'nonce create');
  RESET ROLE;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_admin,'session_id','10000000-0000-4000-8000-000000000015','aal','aal2')::text,true);
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.check(brasil_force_private.is_admin(),'superadmin allowed');
  PERFORM pg_temp.check(NOT public.bf_zoho_nonce(repeat('a',64),true),'different admin cannot consume');
  RESET ROLE;
  INSERT INTO auth.sessions VALUES('20000000-0000-4000-8000-000000000013',admin);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin,'session_id','20000000-0000-4000-8000-000000000013','aal','aal2')::text,true);
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.check(NOT public.bf_zoho_nonce(repeat('a',64),true),'different live session cannot consume');
  RESET ROLE;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',admin,'session_id','10000000-0000-4000-8000-000000000013','aal','aal2')::text,true);
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.check(public.bf_zoho_nonce(repeat('a',64),true),'consume once');
  PERFORM pg_temp.check(NOT public.bf_zoho_nonce(repeat('a',64),true),'replay denied');
  PERFORM public.bf_zoho_nonce(repeat('b',64),false);
  RESET ROLE;
  UPDATE public.bf_zoho_states SET expires_at=now()-interval '1 second';
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.check(NOT public.bf_zoho_nonce(repeat('b',64),true),'expired nonce denied');
  results:=array_append(results,'OAuth user/session binding, single use and expiry');
  sid:=public.bf_supplier_create('Fornecedor sintético','Camping','supplier@example.invalid',null,null);
  PERFORM pg_temp.expect_failure(format('update public.bf_supplier_prospects set opt_out=true where id=%L',sid),'permission denied');
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_change(%L,0,''activated'','''')',sid),'Consent');
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_change(%L,0,''consent_recorded'',null)',sid),'Evidence');
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_change(%L,null,''consent_recorded'',''Referência de teste'')',sid),'Stale');
  PERFORM public.bf_supplier_change(sid,0,'consent_recorded','Referência TEST: consentimento sintético');
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_change(%L,0,''activated'','''')',sid),'Stale');
  PERFORM public.bf_supplier_change(sid,1,'activated','');
  PERFORM pg_temp.check((SELECT promotion_eligible AND trial_ends_at=(SELECT activated_at+interval '720 hours' FROM public.bf_supplier_prospects WHERE id=sid) FROM public.bf_supplier_eligibility WHERE id=sid),'720 hour trial');
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_change(%L,2,''activated'','''')',sid),'Consent');
  PERFORM pg_temp.check((SELECT count(*)=3 FROM public.bf_supplier_events WHERE supplier_id=sid),'atomic history');
  RESET ROLE;
  UPDATE public.bf_supplier_prospects SET consent_at=now()-interval '32 days',activated_at=now()-interval '31 days' WHERE id=sid;
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.check((SELECT NOT promotion_eligible FROM public.bf_supplier_eligibility WHERE id=sid),'trial expired');
  results:=array_append(results,'consent, revision, audit, no restart and 30-day expiry');
  mid:=public.bf_supplier_draft(sid,'Teste','Não enviar: teste transacional');
  PERFORM pg_temp.expect_failure(format('update public.bf_supplier_mail set body=''changed'' where id=%L',mid),'permission denied');
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_mail_action(%L,''claim'')',mid),'Invalid');
  PERFORM public.bf_supplier_mail_action(mid,'approve');
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_mail_action(%L,''claim'')',mid),'disconnected');
  -- Dummy ciphertext, no real token and no provider call. Crypto tested separately.
  PERFORM public.bf_zoho_save('v1.synthetic.not-a-token','us','123');
  PERFORM public.bf_supplier_mail_action(mid,'claim');
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_mail_action(%L,''claim'')',mid),'Invalid');
  PERFORM public.bf_supplier_mail_finish(mid,null);
  PERFORM pg_temp.check((SELECT status='uncertain' FROM public.bf_supplier_mail WHERE id=mid),'uncertain delivery');
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_mail_action(%L,''claim'')',mid),'Invalid');
  results:=array_append(results,'approval required, immutable draft, claim once, uncertain not retried');
  mid:=public.bf_supplier_draft(sid,'Teste expirado','Não enviar');
  PERFORM public.bf_supplier_mail_action(mid,'approve');
  RESET ROLE;
  UPDATE public.bf_supplier_mail SET approved_at=now()-interval '25 hours' WHERE id=mid;
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_mail_action(%L,''claim'')',mid),'Invalid');
  results:=array_append(results,'24-hour approval expiry');
  PERFORM public.bf_supplier_change(sid,2,'opted_out','Solicitação sintética');
  PERFORM pg_temp.check((SELECT status='cancelled' FROM public.bf_supplier_mail WHERE id=mid),'opt-out cancellation');
  duplicate:=public.bf_supplier_create('Duplicado','Camping','SUPPLIER@example.invalid',null,null);
  PERFORM pg_temp.expect_failure(format('select public.bf_supplier_draft(%L,''Teste'',''Mensagem'')',duplicate),'suppressed');
  results:=array_append(results,'opt-out cancels pending mail and suppresses duplicate addresses');
  FOR i IN 1..60 LOOP PERFORM pg_temp.check(public.bf_zoho_read_quota(),'read quota within limit'); END LOOP;
  PERFORM pg_temp.check(NOT public.bf_zoho_read_quota(),'read quota exhausted');
  results:=array_append(results,'60/hour database read quota');
  RESET ROLE;
  PERFORM set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000011","session_id":"10000000-0000-4000-8000-000000000011","aal":"aal2"}',true);
  SET LOCAL ROLE authenticated;
  PERFORM pg_temp.check((SELECT count(*)=0 FROM public.bf_supplier_prospects),'buyer RLS prospects');
  PERFORM pg_temp.check((SELECT count(*)=0 FROM public.bf_supplier_events),'buyer RLS events');
  PERFORM pg_temp.check((SELECT count(*)=0 FROM public.bf_supplier_mail),'buyer RLS outbox');
  PERFORM pg_temp.check((SELECT count(*)=0 FROM public.bf_zoho_connection),'buyer RLS connection');
  PERFORM pg_temp.expect_failure('select * from public.bf_zoho_states','permission denied');
  RESET ROLE;
  results:=array_append(results,'RLS hides all administrative data from buyer');
  RAISE EXCEPTION USING ERRCODE='Z0001',MESSAGE='rollback synthetic fixtures';
 EXCEPTION WHEN SQLSTATE 'Z0001' THEN NULL;
 END;
 RETURN results;
END $tests$;
SELECT pg_temp.run_homologation() AS passed_groups;
