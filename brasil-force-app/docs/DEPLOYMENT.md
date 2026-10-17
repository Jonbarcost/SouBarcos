# Homologação e implantação

## Estado confirmado

Projeto Vercel sou-barcos, prj_zhDl1iJuhJHAeB4FRNE09EG0B2FF; aplicação em brasil-force-app/. Domínio oficial informado: https://brasilforce.com.br/. Supabase compartilhado rrymtjzsekmjplyuoqef nunca recebe fixtures.

A atualização incorporada em e91a236 confirma o preview https://sou-barcos-atp4w7f6o-vers2.vercel.app/, dpl_711nCmWZgN8XSigNKHoZwgsqBfsB, commit 13c431a, READY. Também confirma as duas migrações remotas; versões em DATABASE.md. Essa informação foi fornecida pela operação anterior, não equivale a uma revalidação autenticada desta sessão nem a E2E remoto aprovado.

## Operação Primeiro Vendedor

A homologação executável usa Supabase Docker local e Next dev na interface de loopback. Cadastro, confirmação, MFA, aprovação, painel, anúncio, moderação e catálogo foram automatizados localmente. Tipos, build e HTTP de produção são verificados separadamente. O navegador local usa modo development porque a política SITE_URL de produção exige HTTPS.

Novo preview da entrega: pendente de acesso Vercel autenticado. Não existe banco remoto isolado disponível para esse preview; o Docker local não deve ser exposto à internet. Não apontar fixtures nem política TEST-ONLY ao Supabase compartilhado para contornar o impedimento.

Para concluir remotamente: provisionar uma branch/projeto de homologação com isolamento demonstrável por via autorizada, configurar URL/chave/callbacks exatos somente no escopo Preview e criar deployment da branch com rootDirectory=brasil-force-app por deployment, preservando configuração global/legado. Reexecutar E2E e inspecionar headers, runtime e APIs, registrando deployment/commit. Sem ambiente remoto isolado, manter testes autenticados remotos pendentes.

## Produção

Nenhuma promoção, DNS, pagamento real ou política documental real ativada. Não executar vercel --prod. Antes de promoção futura, identificar produção atual e ID de rollback, verificar migrações já aplicadas, variáveis/callbacks e aceite comercial. Rollback Vercel não desfaz SQL. READY não comprova operação comercial.
