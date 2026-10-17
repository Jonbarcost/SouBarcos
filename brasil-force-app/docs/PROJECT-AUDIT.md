# Auditoria operacional — 16/10/2026 (America/Sao_Paulo)

## Escopo e evidência atual

Repositório canônico Jonbarcost/SouBarcos; branch codex/brasilforce-production-audit; aplicação brasil-force-app. Baseline remoto confirmado: 03f674442a5b6e7bb9ec1a453283206794a7365a. Fetch/pull sem divergências. Legado Express/static e repositório auxiliar Brasil-Force preservados. Nenhum produto, fornecedor ou pedido foi inserido remotamente.

Baseline executado: npm ci, tipos, 47 testes e build aprovados. Novos testes cobrem o serviço de IA, quota SQL, aprovação verificada e moderação. Consulte TESTING.md para resultado final e limitações.

## Implementado localmente

- IA: corpo limitado por bytes reais; validação de origem e JSON; sessão confirmada, conta ativa e quota SQL obrigatória; contexto mínimo; gateway estruturado e respostas factuais montadas pelo backend; erros sanitizados e métricas sem conteúdo pessoal.
- Vendedores: política de verificação por modalidade; atestados administrativos com referência opaca à evidência externa; aprovação AAL2/admin, revisão atual, validade e papel comercial alterados na mesma transação do histórico.
- Anúncios: fila/detalhe de moderação, decisões e notas internas segregadas, revisão otimista, bloqueio de autoaprovação e classificação restrita preservada em correções. Projeção pública exige vendedor aprovado/ativo, categoria ativa, produto comum, estoque e embalagem.
- Banco: duas migrações aditivas novas; **testadas em memória, não aplicadas ao Supabase**.

## Riscos e bloqueios observados

| Item | Evidência / consequência | Próxima ação |
| --- | --- | --- |
| Supabase remoto | Sem credenciais ou ferramenta autenticada nesta sessão; estrutura/migrações remotas não foram conferidas | Executar scripts/database-audit.sql por conexão autorizada ao projeto existente; comparar versões antes de aplicar somente as novas migrações |
| GitHub API | gh api repos/Jonbarcost/SouBarcos/pulls/1 retornou Forbidden | Habilitar destino/API e acesso para atualizar PR; Git HTTPS tem autorização separada |
| Gateway | Lista pública de modelos e documentação Vercel retornaram HTTP 403; sem token/modelo/orçamento aprovado disponível | Validar catálogo atual, credencial OIDC/key e teto de gastos antes de habilitar BF_AI_ENABLED |
| Verificação documental | Não há processo externo de evidências/retenção configurado | Configurar política após definir processo privado e acesso auditado; nenhuma política habilitada é criada pela migração |
| Preview | Sem acesso Vercel autenticado para consultar/criar deployment | Configurar acesso; manter rootDirectory por deployment para preservar legado; aplicar/verificar migrações antes dos testes autenticados |
| Comércio | Carrinho, reserva transacional, pedido e PSP/split/webhook não implementados | Etapa comercial separada; sem pagamentos reais |

O identificador de projeto autorizado continua sendo rrymtjzsekmjplyuoqef. Nenhum outro projeto/banco remoto foi criado. PGlite é apenas o executor PostgreSQL em memória dos testes.

## Decisões de segurança

Não abrir uploads sem scanner, retenção e processo de revisão. Atestado administrativo não é uma validação automática de documento. Não habilitar política para demonstrar aprovação. Não repetir migrações históricas com timestamps divergentes. Não promover produção nem alterar DNS. READY histórico não comprova o estado atual.
