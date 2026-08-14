-- Cole este comando no Supabase: SQL Editor > New query > Run

create table products (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  preco text not null,
  link text not null,
  imagem text,
  loja text default 'Amazon',
  created_at timestamp with time zone default now()
);

-- Permite leitura pública (o site precisa listar os produtos sem login)
alter table products enable row level security;

create policy "Leitura pública dos produtos"
  on products for select
  using (true);
