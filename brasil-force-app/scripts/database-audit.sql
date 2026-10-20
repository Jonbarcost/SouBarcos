-- READ ONLY. Execute only through an authorized connection to rrymtjzsekmjplyuoqef.
-- No auth.users rows, documents, tokens or customer data are exported.
begin read only;
select current_database(), current_setting('server_version') as server_version;
select version,name from supabase_migrations.schema_migrations order by version;
select tablename,rowsecurity from pg_tables where schemaname='public' and tablename like 'bf_%' order by tablename;
select table_name,column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and table_name like 'bf_%' order by table_name,ordinal_position;
select tablename,indexname,indexdef from pg_indexes where schemaname='public' and tablename like 'bf_%' order by tablename,indexname;
select c.relname,con.conname,pg_get_constraintdef(con.oid) as definition from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'bf_%';
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where (schemaname='public' and tablename like 'bf_%') or (schemaname='storage' and policyname like 'bf_%') order by schemaname,tablename,policyname;
select table_name,grantee,privilege_type from information_schema.table_privileges where table_schema='public' and table_name like 'bf_%' and grantee in ('anon','authenticated','PUBLIC') order by table_name,grantee;
select table_name,column_name,grantee,privilege_type from information_schema.column_privileges where table_schema='public' and table_name like 'bf_%' and grantee in ('anon','authenticated','PUBLIC') order by table_name,column_name,grantee;
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),p.prosecdef,p.proconfig,p.proacl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='brasil_force_private' or (n.nspname='public' and p.proname like 'bf_%') order by n.nspname,p.proname;
select event_object_table,trigger_name,event_manipulation,action_statement from information_schema.triggers where event_object_schema='public' and event_object_table like 'bf_%';
select id,public,file_size_limit,allowed_mime_types from storage.buckets where id='bf-seller-documents';
select status,count(*) from public.bf_seller_applications group by status;
select status,classification,count(*) from public.bf_listings group by status,classification;
rollback;
