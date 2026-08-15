-- Rode este comando adicional no Supabase (SQL Editor > New query > Run)
-- Adiciona a coluna de descrição na tabela que já existe

alter table products add column if not exists descricao text;
