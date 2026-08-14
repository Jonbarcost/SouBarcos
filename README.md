# SouBarcos API

API de cadastro e comparativo de preços do SouBarcos.

## Configuração (uma vez só)

1. Crie uma conta gratuita em supabase.com, crie um novo projeto.
2. No projeto, vá em "SQL Editor" e rode o conteúdo do arquivo `supabase-setup.sql`.
3. Em "Project Settings > API", copie a "Project URL" e a chave "anon public" — são o `SUPABASE_URL` e `SUPABASE_KEY`.

## Rodando localmente

1. `npm install`
2. Copie `.env.example` para `.env` e preencha com seus dados reais (Supabase + a senha de admin que você escolher).
3. `npm start`

## Publicando no Render (gratuito)

1. Crie uma conta em render.com e conecte ao GitHub.
2. Novo "Web Service" apontando para este repositório/pasta.
3. Build command: `npm install`
4. Start command: `npm start`
5. Em "Environment", adicione: `SUPABASE_URL`, `SUPABASE_KEY`, `ADMIN_PASSWORD`.
6. Depois do deploy, copie a URL pública (ex: `https://soubarcos-api.onrender.com`).
7. Cole essa URL no `index.html` (constante `API_URL`) e no campo "Endereço da API" da página `/admin.html`.

## Como usar no dia a dia

- Acesse `admin.html` no seu site.
- Cole o endereço da API e a senha de administrador (fica salvo só no seu navegador).
- Cole o título, preço e link do produto (com a tag `soubarcos-20`) e clique em "Adicionar produto".
- O produto aparece automaticamente na página pública, sem precisar mexer em código.
