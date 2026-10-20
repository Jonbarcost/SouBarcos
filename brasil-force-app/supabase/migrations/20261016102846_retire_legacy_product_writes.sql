begin;
-- The owner retired SouBarcos. Preserve rows and reads; close its public write API.
-- A fresh Brasil Force database does not contain this legacy table.
do $$
begin
 if to_regclass('public.products') is not null then
  execute 'drop policy if exists "Permitir inserção de produtos" on public.products';
  execute 'drop policy if exists "Permitir remoção de produtos" on public.products';
  execute 'revoke insert, update, delete, truncate, references, trigger on public.products from public, anon, authenticated';
 end if;
end;
$$;
commit;
