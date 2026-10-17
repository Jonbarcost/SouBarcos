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
