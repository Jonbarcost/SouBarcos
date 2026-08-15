-- Rode este comando adicional no Supabase (SQL Editor > New query > Run)

alter table products add column if not exists categoria text default 'Geral';
