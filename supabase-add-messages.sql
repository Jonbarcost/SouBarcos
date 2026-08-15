-- Rode este comando no Supabase (SQL Editor > New query > Run)

create table messages (
  id uuid primary key default gen_random_uuid(),
  nome text,
  email text,
  categoria text not null default 'Suporte',
  mensagem text not null,
  atendida boolean default false,
  created_at timestamp with time zone default now()
);

alter table messages enable row level security;

-- Qualquer visitante pode enviar uma mensagem (formulário público)
create policy "Envio público de mensagens"
  on messages for insert
  with check (true);
