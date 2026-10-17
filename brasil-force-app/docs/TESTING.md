# Testes — Operação Primeiro Vendedor

Data: 17/10/2026 UTC. Node 24.19.0; Supabase CLI 2.121.0; PostgreSQL 17 local Docker. Lockfile atualizado somente com @playwright/test 1.64.1 e pg 8.23.1 como dependências de desenvolvimento; versões do app preservadas.

| Comando                                                   | Resultado observado                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| npm ci --cache /workspace/.npm-cache --no-audit --no-fund | Instalação congelada, 100 pacotes, exit 0                                                        |
| npm run check antes da sincronização final                | 79/79 testes, zero falhas/skips/cancelamentos; tipos e build exit 0                              |
| npm run test:integration                                  | 16/16 contra Auth/Storage/Data API/PostgreSQL reais locais                                       |
| npm run test:first-seller em base nova                    | 16/16 integração + 2/2 E2E, exit 0; stack descartado                                             |
| Chromium desktop 1440×1000                                | Jornada integral passou; Tab/Enter, confirmação e MFA reais                                      |
| Chromium mobile 390×844                                   | Jornada integral passou, sem overflow ou erro JS                                                 |
| npm run test:http                                         | Páginas/headers, nove rotas privadas, gates, método e detalhes indisponíveis passaram            |
| npm run env:check com gates fechados                      | Exit 0; IA, cadastro e frete aparecem como desativados/pendentes, sem alegar prontidão comercial |
| npm run test:local:cleanup após descarte                  | Exit 0; nenhum container do stack ativo                                                          |

Sincronização adicional por fast-forward incorporou os sete commits e91a236..0f128b5 de outros agentes. Reexecução concluída sobre esse HEAD consolidado: npm run check passou com **80/80**, zero falhas/skips/cancelamentos, tipos/build exit 0; test:http passou; test:first-seller passou com **16/16 + 2/2**, exit 0 e descarte confirmado. Cleanup posterior exit 0; nenhum container ativo. Os resultados anteriores são preservados como histórico.

## Cobertura e limites atuais

A suíte rápida inclui testes existentes PGlite e nove novos casos de guardas, lifecycle, TOTP RFC6238 e CSP. PGlite continua rápido, mas não é evidência de múltiplas conexões. A integração usa 16 casos reais com sessão AAL1/AAL2, JWT inválido/expirado, sessão revogada, metadata e grants, política desabilitada, autoaprovação, evidência vencida, revisão antiga, seller/store, RLS, Storage e moderação completa. Seis desses casos comprovam disputas/rollback/quota em PostgreSQL por conexões independentes, observando dois PIDs de backend bloqueados quando necessário.

E2E não faz mock de Auth nem força cookies/claims AAL2: cria conta pela UI, lê confirmação no Mailpit, autentica, solicita vendedor e executa MFA, aprovação e moderação na UI. Somente provisionamento de papéis privilegiados e política fictícia usam helpers controlados no banco local. Screenshots finais públicos de ambos viewports foram inspecionados. Sem trace, vídeo, QR, cookies ou dados pessoais nos artifacts.

Correção de produto: CSP bloqueava Auth local em development; agora inclui somente origin loopback configurado/validado, com teste que mantém production/test restritos. Correções de harness: navegação pós-callback, locators, option disabled, snapshot de estatísticas dos waiters PostgreSQL, vínculo privado de atores e limpeza parcial/cancelamento. Uma verificação de tipos identificou callbacks opcionais nas dependências injetadas do teste de lifecycle; tipos corrigidos e check reexecutado. Nenhuma regra de backend foi removida para fazer teste passar.

Os primeiros pulls encontraram registry inacessível e falta de disco com imagem completa/VFS. Solução suportada: registry oficial e imagens slim com digest; proxy removido somente do comando exato de health loopback nas imagens afetadas. Nenhum checksum/TLS/health ignorado.

Não comprovado: E2E em preview remoto com banco isolado, recuperação de senha, documentos reais/processo de evidências, modelo/respostas reais do gateway, frete/pagamento sandbox ou comércio real. Não foram inseridas fixtures no Supabase compartilhado. Ver [FIRST-SELLER-OPERATION.md](FIRST-SELLER-OPERATION.md).

---

# Histórico da consolidação anterior (16/10/2026)

O conteúdo abaixo registra o estado daquela execução. As limitações locais de Auth/Storage/concorrência foram superadas pela operação acima; limitações remotas/comerciais permanecem quando explicitadas.

# Verificações da consolidação operacional

Data de referência: 16/10/2026 (America/Sao_Paulo). Node 24.19.0, dependências fixadas no package-lock; nenhum upgrade do stack.

## Comandos e resultados

| Comando                                                                 | Resultado observado                        | Passaram / falharam                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| git fetch; git pull --ff-only origin codex/brasilforce-production-audit | Branch sincronizada com baseline 03f6744   | Sem conflito                                                                       |
| npm ci --cache /workspace/.npm-cache --no-audit --no-fund               | Instalação concluída, lockfile inalterado  | 83 pacotes no baseline                                                             |
| npm run check (baseline)                                                | Tipos, testes e build concluídos           | 47 / 0                                                                             |
| npm run check (consolidação)                                            | Tipos, testes ampliados e build concluídos | 70 / 0                                                                             |
| npm run typecheck; npm test (execução final)                            | Concluído, exit 0                          | 70 / 0 (zero skipped/cancelled)                                                    |
| npm run build após inclusão do ícone da marca                           | Concluído                                  | Sem erro                                                                           |
| npm run test:http atualizado                                            | Concluído, exit 0                          | Páginas públicas, nove rotas privadas, gates, método e dois detalhes indisponíveis |
| npm run env:check com SITE_URL local e gates fechados                   | Validação estática concluída               | Não comprova prontidão comercial                                                   |

## Diagnóstico e correções durante a execução

- Os testes de funcionalidades novas foram executados antes da implementação e falharam pela ausência dos módulos/RPCs ou decisões suportadas. As novas implementações fizeram esses cenários passar.
- Teste reproduziu perda de controlled/prohibited ao salvar correção; save_listing passou a preservar a classificação. Nova execução passou.
- Primeira regressão completa: 67/68; o teste antigo esperava publicar fixture sem estoque/embalagem/aprovação do vendedor. A fixture passou a demonstrar invisibilidade sem requisitos e visibilidade com todos os requisitos, mantendo os bloqueios de privacidade. Nova execução: 69/69, depois 70/70 com validação de configuração IA.
- TypeScript identificou incompatibilidade entre ProcessEnv e configuração do adaptador; Route Handler passou somente os três campos necessários. Nova execução sem erro.
- Smoke de detalhe inicialmente exigiu status 404 literal; Next.js 16 documenta HTTP 200 após início de streaming. O runner agora exige marcador NEXT_HTTP_ERROR_FALLBACK;404, conteúdo da tela não encontrada e ausência de dados de produto. Não aceita HTTP 200 genérico como sucesso.
- Browser identificou favicon.ico ausente. O app agora declara icon.svg reutilizando o símbolo existente da marca. Não substitui a imagem hero.webp original.

## Cobertura automatizada

58 testes após IA; 70 na consolidação. Incluem regras de autorização, RLS e transações SQL em PGlite; quotas de 5/min e 60/dia, identidades, sessão revogada/suspensa, erro de RPC; serviço IA e transporte gateway controlado; aprovação verificada, política/revisão/expiração, papel e rascunho; moderação, notas privadas, classe restrita preservada, retirada do catálogo e projeção pública também para dono/equipe.

Promise.all em um PGlite é execução no mesmo motor/conexão; **não comprova concorrência PostgreSQL multi-instância**. Testes gateway com transporte controlado não são chamadas reais ao modelo. Não há fixtures em produção.

## QA de interface

Browser plugin não disponível; Playwright Core foi instalado fora do repositório em /workspace/qa-tools, usando Chromium existente. Sem alteração nas dependências da aplicação. Fluxo: /assistente → sugestão → campo preenchido → envio real à API desativada → mensagem de falha e histórico; depois /admin/anuncios → redirecionamento para login sem dados da fila.

Viewports: desktop 1440×1000 e celular 390×844. Evidência em /tmp/brasil-force-qa/result.json e assistant-1440.png / assistant-390.png. Resultado final: ambos passaram; identidade, conteúdo, ausência de overlay/erro de execução, interação e ausência de overflow confirmados. Capturas foram inspecionadas. O 503 do assistente desligado é esperado. Não foi exercitado sucesso de IA nem painel administrativo autenticado por falta de acesso remoto.

## Não executado / não comprovado

Supabase Auth/Storage reais; auditoria SQL remota; aplicação das novas migrações; múltiplas conexões PostgreSQL; documentos reais; chamada paga ao gateway; usuários/fornecedores/anúncios reais; frete sandbox; pagamento; preview novo Vercel; QA autenticado de aprovação/moderação. Nenhum deles deve ser chamado aprovado com base nos testes locais.
