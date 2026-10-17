# Publicação Brasil Force — 15/10/2026 (São Paulo)

Projeto Vercel reutilizado: sou-barcos, prj_zhDl1iJuhJHAeB4FRNE09EG0B2FF, equipe VERS. Substituição expressamente autorizada pelo usuário.

Deploy: dpl_GqRwZC3gkM9ryqYZ3HsF9yjHVaoU. Estado confirmado READY, destino production, commit de aplicação 502ff2bf6838eb47114bd507b9d16363720e3b1b. Build remoto: aproximadamente 38 segundos segundo os timestamps.

Endereço: https://sou-barcos.vercel.app
Deploy: https://sou-barcos-2eoqh2amb-vers2.vercel.app

Framework alterado de Express para Next.js; npm ci / npm run build / Node 24. Variáveis de Supabase publicáveis e SITE_URL configuradas no ambiente Vercel. Cadastro, OAuth e logística mantidos desativados. Nenhuma credencial administrativa do Supabase enviada.

Build local limpo e 26 testes aprovados. Cache local Turbopack estava corrompido; foi movido para diretório temporário e a compilação limpa passou.

Verificação HTTP pública: /, /catalogo e /api/health retornaram 200; páginas identificadas como Brasil Force. Health retornou authenticationConfigured=true e commerceEnabled=false.

Limites: verificação autenticada do link e leitura dos logs remotos retornaram 403/404. READY confirma o build e a atribuição de aliases, não homologa autenticação/pagamentos/frete nem garante teste visual. Proteção Vercel existente foi preservada.

Código enviado diretamente pela API. Repositório GitHub antigo não foi substituído nesta etapa: não disparar deploy do código antigo do SouBarcos. A integração contínua precisa apontar para o código Brasil Force antes de novos pushes.

Permanecem pendentes: autenticação/e-mails/callbacks de ponta a ponta, revisão das políticas antigas de products, fluxo de pedidos/pagamentos, conta Melhor Envio e homologação. Não é lançamento comercial.

## Atualização: triagem de vendedores

Deploy dpl_8woTKqY55qYJVXKpiMG4VNoFgnpx confirmado READY em 16/10/2026 UTC, código f57a9dc. Ver docs/SELLER-REVIEW.md para escopo e testes atuais.
