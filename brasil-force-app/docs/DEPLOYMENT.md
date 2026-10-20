# Homologação e implantação

## Estado confirmado

Projeto Vercel sou-barcos, prj_zhDl1iJuhJHAeB4FRNE09EG0B2FF; aplicação em brasil-force-app/. Domínio oficial informado: https://brasilforce.com.br/. Supabase compartilhado rrymtjzsekmjplyuoqef nunca recebe fixtures.

A atualização incorporada em e91a236 confirma o preview https://sou-barcos-atp4w7f6o-vers2.vercel.app/, dpl_711nCmWZgN8XSigNKHoZwgsqBfsB, commit 13c431a, READY. Também confirma as duas migrações remotas; versões em DATABASE.md. Essa informação foi fornecida pela operação anterior, não equivale a uma revalidação autenticada desta sessão nem a E2E remoto aprovado.

## Operação Primeiro Vendedor

A homologação executável usa Supabase Docker local e Next dev na interface de loopback. Cadastro, confirmação, MFA, aprovação, painel, anúncio, moderação e catálogo foram automatizados localmente. Tipos, build e HTTP de produção são verificados separadamente. O navegador local usa modo development porque a política SITE_URL de produção exige HTTPS.

Preview automático desta entrega foi criado e falhou; detalhes/ID abaixo. Diagnóstico e novo preview válido dependem de acesso Vercel autenticado. Não existe banco remoto isolado disponível para esse preview; o Docker local não deve ser exposto à internet. Não apontar fixtures nem política TEST-ONLY ao Supabase compartilhado para contornar o impedimento.

Para concluir remotamente: provisionar uma branch/projeto de homologação com isolamento demonstrável por via autorizada, configurar URL/chave/callbacks exatos somente no escopo Preview e criar deployment da branch com rootDirectory=brasil-force-app por deployment, preservando configuração global/legado. Reexecutar E2E e inspecionar headers, runtime e APIs, registrando deployment/commit. Sem ambiente remoto isolado, manter testes autenticados remotos pendentes.

## Produção

Nenhuma promoção, DNS, pagamento real ou política documental real ativada. Não executar vercel --prod. Antes de promoção futura, identificar produção atual e ID de rollback, verificar migrações já aplicadas, variáveis/callbacks e aceite comercial. Rollback Vercel não desfaz SQL. READY não comprova operação comercial.

## Resultado do preview automático — commit 2a9fb79

O push acionou a integração Git/Vercel, criando dpl_24wZUVBVL6u89T1zNDvXxsficeho (GitHub deployment 7134262361), URL https://sou-barcos-gzk0qajke-vers2.vercel.app/. GitHub registrou **failure**, sem aplicação disponível para homologação. A API Vercel respondeu HTTP 403 sem credencial autenticada; a requisição à URL foi recusada pelo proxy de rede (túnel 403). Portanto não foram verificados páginas, headers nem runtime desse deployment.

A metadata pública da integração informa rootDirectory=null; não há logs de build suficientes para atribuir a causa da falha. O build Next local e o CI verify passaram. Próxima ação: disponibilizar VERCEL_TOKEN de forma segura nas configurações, liberar o host do preview (incluído no rascunho), inspecionar os logs desse ID e criar um preview com rootDirectory=brasil-force-app por deployment, preservando o legado. Não mudar configuração global para contornar a falta de acesso. Ainda será necessário banco remoto isolado para E2E remoto com fixtures.
