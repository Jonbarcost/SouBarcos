# Operação Primeiro Vendedor — 17/10/2026 UTC

## Escopo e estado

Repositório Jonbarcost/SouBarcos, branch codex/brasilforce-production-audit, aplicação brasil-force-app. HEAD inicial sincronizado por fast-forward: e91a236; sete commits de outros agentes incorporados posteriormente por fast-forward até 0f128b5. Legado da raiz e repositório auxiliar Brasil-Force preservados. Esta operação comprova o ciclo local com serviços reais isolados; não constitui liberação de vendas nem homologação remota completa.

## Arquitetura e prova de isolamento

Supabase CLI 2.121.0 inicia o projeto local bf-first-seller em Docker: PostgreSQL 17, Auth, Kong/Data API, Storage e Mailpit. Portas fixas: API 55321, banco 55322, e-mail 55324. Next dev usa loopback 3200; nenhum desses serviços é exposto como preview público. CLI usa imagens slim oficiais verificadas por digest, sem ignorar TLS/checksums ou health checks.

Antes de qualquer fixture, o loader valida o arquivo config.toml; projeto e URLs exatos; chaves retornadas pela CLI; labels de projeto/workdir e portas Docker; IP do servidor conectado; ausência de contas fora do domínio reservado bf-e2e.invalid e anúncios fora do marcador TESTE. O ID compartilhado rrymtjzsekmjplyuoqef é recusado. Não basta uma variável de ambiente. Runtimes são marcados privadamente e atores guardam id/client/runtime em WeakMap; substituir campos públicos não redireciona os helpers.

A configuração não faz link remoto. Migrações versionadas são executadas pela CLI somente na base local nova. O banco compartilhado já recebeu verified_seller_approval (20261017030036) e listing_moderation (20261017030041) por operação anterior confirmada em e91a236. Os timestamps locais diferem: não reaplicar remotamente. Nenhuma migração foi alterada nesta entrega.

Fixtures não são um seed de produção. test:first-seller verifica isolamento, executa testes e descarta o stack comprovado. Falhas antes da prova param somente recursos com ownership do checkout e preservam backup. Recursos preexistentes não comprovados não são adquiridos. A CLI filha é encerrada antes do cleanup em falha de startup. O workflow tem cleanup always() adicional; runner efêmero não deve conservar volumes após o job.

## Política e identidades

Somente no banco local: política TEST-ONLY-v1 para individual (identity/commercial/policy) e company (inclui fiscal). Isso testa requisitos configuráveis, sem declarar obrigações legais reais. Referências opacas TEST-ONLY-* substituem evidências; nenhum documento pessoal é utilizado. Política real continua sem ativação por esta operação. Antes de ativá-la, validar com profissionais os requisitos de identidade, empresa/responsável, atividade, fiscalidade e credenciamento aplicáveis, além de finalidade, retenção, acesso auditado e exclusão.

Storage privado: upload segue bloqueado e a suíte confirma isso com PDF fictício; listagem própria e negação de acesso de terceiro são exercitadas no serviço real. Scanner, retenção e processo de acesso documental não foram implementados. Nunca guardar documentos ou referências privadas em logs/auditoria pública.

Identidades aleatórias usam exclusivamente bf-e2e.invalid e senhas efêmeras. Buyer principal nasce pelo formulário público e confirma e-mail no Mailpit. Admin/moderator são provisionados pela API Admin local, com papel atribuído por SQL controlado após isolamento, nunca user_metadata. MFA usa enroll/challenge/verify TOTP no Auth real e confirmação novamente na interface. Segredos TOTP, senhas, tokens, cookies e links de confirmação ficam em memória, sem artefatos publicados.

## Jornada e transições

Conta criada → confirmação de e-mail → perfil buyer → solicitação pending → admin AAL2 inicia in_review → registra evidência da revisão/política → approved → papel seller (individual) ou store (company) na mesma transação → painel comercial → primeiro rascunho → pending → moderator AAL2 in_review → approved/free → catálogo anônimo.

Vendedor: pending → in_review → approved / changes_requested / rejected; correção volta a pending com nova revisão. Rejeição é terminal. Aprovação exige admin/superadmin AAL2, conta ativa elegível, e-mail confirmado, evidência válida, política habilitada e revisão atual; autoaprovação é negada.

Anúncio: draft → pending; pending → in_review / changes_requested / rejected; in_review → approved / changes_requested / rejected; approved → removed. Correção reenvia à análise. Edição de aprovado retira publicação. Controlled/prohibited não viram free por conveniência. Notas internas têm tabela/RLS separadas; decisões e justificativas permanecem no histórico.

Produto fictício: TESTE — Mochila outdoor 30 litros — NÃO COMERCIALIZÁVEL; categoria campo, novo, R$149,90, estoque 3, 500g, 30×20×10cm, postagem 2 dias. Começa additional_review e só o moderador concede free. Nenhuma foto é exigida: uploads de imagens e comprovação de procedência continuam lacunas para operação comercial.

## Matriz de evidências

| Funcionalidade              | Evidência executável                                                                        | Limite                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Cadastro/confirmação/perfil | UI + Mailpit + Auth real local                                                              | Entrega SMTP externa não testada                                  |
| AAL1/AAL2 e papéis          | UI TOTP + RPC/Data API; moderator não aprova vendedor                                       | Recuperação de conta não coberta                                  |
| Claims e sessão             | JWT adulterado, expirado e sessão revogada negados; metadata/UPDATE não elevam papel        | Expiração usa token local assinado com exp passado, não espera 1h |
| Política/evidência/revisão  | Habilitada/desabilitada, ausente/vencida, requisitos fiscais, revisão antiga, autoaprovação | Referências fictícias, sem processo documental real               |
| Aprovação e capacidade      | Seller/store, painel e primeiro rascunho                                                    | Nenhuma conta real promovida                                      |
| Persistência e atributos    | UI + leitura Data API do mesmo registro                                                     | Sem upload de foto                                                |
| Moderação/catálogo          | Correção/reenvio/aprovação/remoção/restrições + UI anônima                                  | Sem compra ou reserva de estoque                                  |
| Privacidade RLS/Storage     | Dono/terceiro/anônimo, draft e notas, upload e URL alheia negados                           | Nenhum documento pessoal                                          |
| Concorrência                | PIDs distintos aguardando locks; uma revisão vence, outra conflita                          | PostgreSQL Docker local                                           |
| Atomicidade                 | Falha de INSERT de auditoria e backend terminado antes de commit                            | Falha injetada somente no schema de teste local                   |
| Quota                       | 8 RPCs paralelas admitem exatamente 5                                                       | Não é chamada ao modelo nem teto global de gasto                  |
| Navegador                   | Chromium 1440×1000 e 390×844, Tab/Enter, sem overflow/erro JS                               | Emulação mobile, não aparelho físico                              |
| CI                          | Job isolado, sem secrets, artefato público restrito e cleanup                               | Resultado remoto deve ser consultado no commit enviado            |
| Vercel                      | Preview anterior 13c431a informado READY                                                    | Novo preview/E2E remoto pendentes                                 |

## Reprodução

Pré-requisitos: Node 24.19.0, npm conforme ambiente, Docker saudável e espaço para imagens (recomenda-se 20GB livres antes do primeiro pull), acesso aos registries oficiais e Chromium. Não executar suites simultâneas nas mesmas portas.

```bash
cd brasil-force-app
npm ci
# Se Chromium não estiver instalado:
npx playwright install --with-deps chromium
npm run test:first-seller
```

O comando único faz start → prova → integração → E2E desktop/mobile → stop/discard. Para diagnóstico, usar test:local:start, test:integration, test:e2e e test:local:stop. test:local:cleanup para parada com backup quando o stack não chegou à prova. Não definir URLs remotas como override. Nunca usar db reset --linked ou db push no ambiente compartilhado.

Separadamente, com gates desligados e SITE_URL=http://localhost:3100: npm run check, npm run test:http e npm run env:check. O teste E2E usa dev para Auth HTTP local; o build e smoke HTTP validam o comportamento de produção com gates fechados.

## Resultados e correções

Baseline sincronizado: npm ci e npm run check, 70 testes aprovados. Integração ampliada: 16/16, zero skipped/cancelled. Jornadas desktop e mobile passaram individualmente. Execução integral em base nova: 16/16 + 2/2 E2E, com descarte confirmado. Regressão anterior à sincronização adicional: 79/79, tipos/build/HTTP passaram. Reexecução após sincronização final até 0f128b5: **80/80 testes rápidos, 16/16 integração, 2/2 E2E**, tipos/build/HTTP exit 0, zero falhas/skips/cancelamentos e nenhum container restante. Logs resumidos em TESTING.md.

Falhas iniciais de ambiente: registry ECR inacessível e imagem PostgreSQL completa excedeu disco com driver VFS. Corrigido com registry suportado e imagens slim oficiais. O wget BusyBox das imagens slim ignorava exclusão de proxy na health probe; helper preserva o comando de saúde e remove proxy somente para os argumentos exatos da URL loopback interna. Não ignora readiness nem altera TLS.

Falha de produto encontrada pelo browser: CSP bloqueava Auth local no MFA. Corrigido connect-src apenas em development para origin loopback validado; teste assegura que production/test não recebe HTTP local. Falhas de harness corrigidas: locators exatos em labels contendo texto adicional, espera de navegação após callback de confirmação, asserção nativa de option disabled e snapshots de estatísticas PostgreSQL. Não se removeu controle do backend para passar testes.

Revisão independente identificou duas falhas do harness (binding mutável de atores e cleanup de startup parcial), corrigidas com testes de regressão; acrescentado cleanup always() no CI para cancelamento.

## Artefatos, commits e rollback

Capturas públicas sanitizadas: test-results/first-seller/browser/**/public-test-product.png, ignoradas pelo Git e coletadas pelo CI por três dias. Trace/vídeo/captura automática estão desligados. Não coletar error-context ou dumps de ambiente em artifacts. Logs de testes registram nomes/contagens/resultado; não incluir credenciais.

Commits desta operação: 99bceac (infraestrutura e integração), 860569b (E2E/CSP), 2dcb0b9 (CI) e o commit documental deste relatório. Commits anteriores preservados, sem force/merge main. O PR existente é #1. Nenhum arquivo comercial do legado foi modificado.

Rollback local: parar a suíte e usar test:local:stop somente após a prova. Em falha de prova, cleanup preserva backup e requer investigação; nunca apagar volume desconhecido. Rollback do código pode reverter os commits da operação por novo commit; não há nova migração de produção a desfazer. Manter controles de publicação e trilha de auditoria existentes.

## Pendências concretas e próxima fase

1. Criar/verificar novo preview quando houver acesso Vercel autenticado. Testes remotos com fixtures exigem banco remoto isolado demonstrável; não expor Docker nem usar o compartilhado. Preview antigo READY não homologa esta entrega.
2. Configurar processo real de evidência e requisitos aprovados profissionalmente antes de habilitar política documental real.
3. Validar modelo/credencial/orçamento e respostas reais do Vercel AI Gateway. Esta operação testa quota concorrente, sem chamada paga ao modelo.
4. Próxima fase comercial: desenho de reserva de estoque transacional, carrinho/pedidos, frete sandbox, PSP/split/webhooks idempotentes e conciliação. Manter pagamentos reais e produção fechados; catálogo aprovado não implica checkout disponível.

Não houve fixtures, política fictícia ou alterações SQL no Supabase remoto; nenhuma promoção Vercel, DNS, domínio de produção ou pagamento real foi alterado.

## Aceite local e itens externos

- [x] Isolamento comprovado e migrações somente na base de teste nesta operação.
- [x] Cadastro, confirmação e MFA reais locais.
- [x] Política de teste/evidência válida; ausência, expiração, autoaprovação e papéis indevidos bloqueados.
- [x] Aprovação seller/store, painel, rascunho persistido e envio para moderação.
- [x] Aprovação comum e catálogo isolado; classes restritas, notas e dados de terceiros protegidos.
- [x] Auditoria e rollback, concorrência PostgreSQL com conexões independentes.
- [x] 80 testes rápidos, 16 integrações e 2 E2E; tipos/build/HTTP aprovados.
- [x] Nenhuma fixture/política fictícia no remoto; produção e domínio intocados.
- [x] Código, CI e relatório versionados na branch autorizada.
- [ ] Novo preview desta entrega compilado/verificado e jornada autenticada remota em banco isolado.

O ciclo **local isolado** foi comprovado. O aceite total que inclui novo preview continua pendente; isso não autoriza abertura comercial.
